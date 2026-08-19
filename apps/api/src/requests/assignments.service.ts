import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MembershipRole,
  NotificationType,
  OpportunityStatus,
  Prisma,
  QuoteStatus,
  RequestStatus,
  UserStatus,
} from '@prisma/client';
import type { AuthUser } from '../auth/auth-user.interface';
import {
  assertManager,
  resolveSupplierWorkspace,
  type Workspace,
} from '../common/workspace.util';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { AssignRequestDto } from './dto/assign-request.dto';
import { InboxQueryDto } from './dto/inbox-query.dto';

const OPEN_REQUEST_STATUSES = [RequestStatus.PUBLISHED, RequestStatus.REVIEWING];

/**
 * Capa comercial del proveedor: bandeja de oportunidades, asignacion a
 * vendedores y metricas del equipo.
 *
 * La solicitud (Request) sigue perteneciendo al comprador. Lo que agrega este
 * servicio es el registro RequestAssignment: el estado de esa solicitud dentro
 * de una empresa proveedora y quien la esta trabajando.
 */
@Injectable()
export class AssignmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /** Solicitudes visibles para la empresa: publicas + privadas donde fue invitada. */
  private async buildVisibleRequestsWhere(supplierCompanyId: string): Promise<Prisma.RequestWhereInput> {
    const company = await this.prisma.company.findUnique({
      where: { id: supplierCompanyId },
      select: { name: true },
    });

    return {
      status: { in: OPEN_REQUEST_STATUSES },
      OR: [
        { privateRequest: false },
        ...(company?.name
          ? [
              {
                privateRequest: true,
                preferredSupplierName: {
                  contains: company.name,
                  mode: 'insensitive' as const,
                },
              },
            ]
          : []),
        // Una solicitud ya cerrada para otros puede seguir siendo visible si
        // esta empresa ya la tenia en su bandeja.
        { assignments: { some: { supplierCompanyId } } },
      ],
    };
  }

  /**
   * Crea las filas de bandeja que falten. Las solicitudes se publican al
   * mercado, asi que la oportunidad de cada proveedora se materializa la
   * primera vez que la empresa abre su bandeja.
   */
  private async ensureAssignments(supplierCompanyId: string, requestIds: string[]) {
    if (requestIds.length === 0) {
      return;
    }

    const existing = await this.prisma.requestAssignment.findMany({
      where: { supplierCompanyId, requestId: { in: requestIds } },
      select: { requestId: true },
    });

    const existingIds = new Set(existing.map((item) => item.requestId));
    const missing = requestIds.filter((requestId) => !existingIds.has(requestId));

    if (missing.length === 0) {
      return;
    }

    await this.prisma.requestAssignment.createMany({
      data: missing.map((requestId) => ({
        requestId,
        supplierCompanyId,
        status: OpportunityStatus.NEW,
      })),
      skipDuplicates: true,
    });
  }

  /** Bandeja comercial de la empresa (gerente ve todo, vendedor solo lo suyo). */
  async inbox(user: AuthUser, query: InboxQueryDto, activeCompanyId?: string) {
    const workspace = resolveSupplierWorkspace(user, activeCompanyId);
    const visibleWhere = await this.buildVisibleRequestsWhere(workspace.companyId);

    const visibleRequests = await this.prisma.request.findMany({
      where: visibleWhere,
      select: { id: true },
    });

    await this.ensureAssignments(
      workspace.companyId,
      visibleRequests.map((request) => request.id),
    );

    const assignments = await this.prisma.requestAssignment.findMany({
      where: {
        supplierCompanyId: workspace.companyId,
        // El vendedor solo ve su propia cartera.
        ...(workspace.isManager ? {} : { sellerUserId: user.userId }),
        ...(query.sellerUserId && workspace.isManager
          ? { sellerUserId: query.sellerUserId }
          : {}),
        ...(query.status ? { status: query.status } : {}),
        request: {
          ...(query.privateOnly ? { privateRequest: true } : {}),
          ...(query.search?.trim()
            ? {
                OR: [
                  { title: { contains: query.search.trim(), mode: 'insensitive' as const } },
                  { productName: { contains: query.search.trim(), mode: 'insensitive' as const } },
                  { description: { contains: query.search.trim(), mode: 'insensitive' as const } },
                  { category: { contains: query.search.trim(), mode: 'insensitive' as const } },
                  {
                    buyerCompany: {
                      name: { contains: query.search.trim(), mode: 'insensitive' as const },
                    },
                  },
                ],
              }
            : {}),
        },
      },
      include: {
        request: {
          include: {
            buyerCompany: true,
            quotes: {
              where: { supplierCompanyId: workspace.companyId },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        seller: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: [{ request: { updatedAt: 'desc' } }],
    });

    return assignments.map((assignment) => this.serializeAssignment(assignment));
  }

  /** Una oportunidad concreta, con permisos ya aplicados. */
  async findOne(user: AuthUser, requestId: string, activeCompanyId?: string) {
    const workspace = resolveSupplierWorkspace(user, activeCompanyId);
    const assignment = await this.getAssignmentOrCreate(workspace, requestId);

    if (!workspace.isManager && assignment.sellerUserId !== user.userId) {
      throw new ForbiddenException('Esta solicitud esta asignada a otro vendedor.');
    }

    return this.serializeAssignment(assignment);
  }

  private async getAssignmentOrCreate(workspace: Workspace, requestId: string) {
    const request = await this.prisma.request.findUnique({
      where: { id: requestId },
      select: { id: true },
    });

    if (!request) {
      throw new NotFoundException('Solicitud no encontrada.');
    }

    const existing = await this.prisma.requestAssignment.findUnique({
      where: {
        requestId_supplierCompanyId: {
          requestId,
          supplierCompanyId: workspace.companyId,
        },
      },
      include: this.assignmentInclude(workspace.companyId),
    });

    if (existing) {
      return existing;
    }

    return this.prisma.requestAssignment.create({
      data: {
        requestId,
        supplierCompanyId: workspace.companyId,
        status: OpportunityStatus.NEW,
      },
      include: this.assignmentInclude(workspace.companyId),
    });
  }

  private assignmentInclude(supplierCompanyId: string) {
    return {
      request: {
        include: {
          buyerCompany: true,
          quotes: {
            where: { supplierCompanyId },
            orderBy: { createdAt: 'desc' as const },
          },
        },
      },
      seller: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    };
  }

  /** Asignar o reasignar la solicitud a un vendedor (solo gerente). */
  async assign(
    user: AuthUser,
    requestId: string,
    dto: AssignRequestDto,
    activeCompanyId?: string,
  ) {
    const workspace = assertManager(resolveSupplierWorkspace(user, activeCompanyId));
    const current = await this.getAssignmentOrCreate(workspace, requestId);
    const sellerUserId = dto.sellerUserId?.trim() || null;

    if (sellerUserId) {
      const membership = await this.prisma.membership.findFirst({
        where: {
          userId: sellerUserId,
          companyId: workspace.companyId,
          role: { in: [MembershipRole.SELLER, MembershipRole.SUPPLIER, MembershipRole.ADMIN] },
        },
        select: { id: true, user: { select: { status: true } } },
      });

      if (!membership) {
        throw new BadRequestException('El vendedor no pertenece a esta empresa.');
      }

      if (membership.user.status !== UserStatus.ACTIVE) {
        throw new BadRequestException(
          'Ese vendedor todavia esta pendiente de aprobacion en tu equipo.',
        );
      }
    }

    const isReassignment = Boolean(current.sellerUserId) && current.sellerUserId !== sellerUserId;
    const nextStatus = this.resolveStatusAfterAssignment(current.status, sellerUserId);

    const assignment = await this.prisma.requestAssignment.update({
      where: { id: current.id },
      data: {
        sellerUserId,
        status: nextStatus,
        assignedAt: sellerUserId ? new Date() : null,
        assignedByUserId: sellerUserId ? user.userId : null,
        notes: dto.notes?.trim() || current.notes,
      },
      include: this.assignmentInclude(workspace.companyId),
    });

    if (sellerUserId && sellerUserId !== user.userId) {
      const productName = assignment.request.productName ?? assignment.request.title;
      await this.notificationsService.createForCompany({
        companyId: workspace.companyId,
        userIds: [sellerUserId],
        type: isReassignment
          ? NotificationType.REQUEST_REASSIGNED
          : NotificationType.REQUEST_ASSIGNED,
        title: isReassignment
          ? 'Te reasignaron una oportunidad'
          : 'Te asignaron una nueva oportunidad',
        detail: `${productName} - Comprador: ${assignment.request.buyerCompany?.name ?? 'Sin informar'}`,
        href: `/dashboard/proveedor/solicitudes/${requestId}`,
        metadata: {
          requestId,
          assignmentId: assignment.id,
          supplierCompanyId: workspace.companyId,
        },
      });
    }

    return this.serializeAssignment(assignment);
  }

  private resolveStatusAfterAssignment(current: OpportunityStatus, sellerUserId: string | null) {
    // Los estados avanzados (cotizada, negociando, ganada, perdida) no se pisan
    // al reasignar: la oportunidad sigue donde estaba en el pipeline.
    const earlyStages: OpportunityStatus[] = [
      OpportunityStatus.NEW,
      OpportunityStatus.UNASSIGNED,
      OpportunityStatus.ASSIGNED,
    ];

    if (!earlyStages.includes(current)) {
      return current;
    }

    return sellerUserId ? OpportunityStatus.ASSIGNED : OpportunityStatus.UNASSIGNED;
  }

  /** Marca la oportunidad como "en respuesta" cuando el vendedor la trabaja. */
  async markInResponse(supplierCompanyId: string, requestId: string, sellerUserId?: string) {
    const assignment = await this.prisma.requestAssignment.findUnique({
      where: {
        requestId_supplierCompanyId: { requestId, supplierCompanyId },
      },
      select: { id: true, status: true },
    });

    if (!assignment) {
      return;
    }

    const upgradable: OpportunityStatus[] = [
      OpportunityStatus.NEW,
      OpportunityStatus.UNASSIGNED,
      OpportunityStatus.ASSIGNED,
    ];

    if (!upgradable.includes(assignment.status)) {
      return;
    }

    await this.prisma.requestAssignment.update({
      where: { id: assignment.id },
      data: {
        status: OpportunityStatus.IN_RESPONSE,
        ...(sellerUserId ? { lastSellerViewAt: new Date() } : {}),
      },
    });
  }

  /**
   * Sincroniza el pipeline con el resto del sistema.
   * Se llama cuando se envia una cotizacion o cuando el comprador adjudica.
   */
  async syncStatusFromQuote(
    supplierCompanyId: string,
    requestId: string,
    quoteStatus: QuoteStatus,
    sellerUserId?: string,
  ) {
    const status =
      quoteStatus === QuoteStatus.AWARDED
        ? OpportunityStatus.WON
        : quoteStatus === QuoteStatus.REJECTED
          ? OpportunityStatus.LOST
          : OpportunityStatus.QUOTED;

    await this.prisma.requestAssignment.upsert({
      where: {
        requestId_supplierCompanyId: { requestId, supplierCompanyId },
      },
      create: {
        requestId,
        supplierCompanyId,
        status,
        sellerUserId: sellerUserId ?? null,
        assignedAt: sellerUserId ? new Date() : null,
      },
      update: {
        status,
        // Si nadie la tenia asignada, queda a nombre de quien la cotizo.
        ...(sellerUserId ? { sellerUserId } : {}),
      },
    });
  }

  /** Marca todas las oportunidades de una solicitud segun el resultado final. */
  async syncStatusesAfterAward(requestId: string, awardedSupplierCompanyId: string) {
    await this.prisma.$transaction([
      this.prisma.requestAssignment.updateMany({
        where: { requestId, supplierCompanyId: awardedSupplierCompanyId },
        data: { status: OpportunityStatus.WON },
      }),
      this.prisma.requestAssignment.updateMany({
        where: {
          requestId,
          supplierCompanyId: { not: awardedSupplierCompanyId },
          status: { notIn: [OpportunityStatus.WON] },
        },
        data: { status: OpportunityStatus.LOST },
      }),
    ]);
  }

  private serializeAssignment(
    assignment: Prisma.RequestAssignmentGetPayload<{
      include: {
        request: { include: { buyerCompany: true; quotes: true } };
        seller: { select: { id: true; firstName: true; lastName: true; email: true } };
      };
    }>,
  ) {
    const quote = assignment.request.quotes?.[0] ?? null;

    return {
      id: assignment.id,
      requestId: assignment.requestId,
      supplierCompanyId: assignment.supplierCompanyId,
      status: assignment.status,
      notes: assignment.notes,
      assignedAt: assignment.assignedAt,
      lastSellerViewAt: assignment.lastSellerViewAt,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
      seller: assignment.seller
        ? {
            id: assignment.seller.id,
            name: `${assignment.seller.firstName} ${assignment.seller.lastName}`.trim(),
            email: assignment.seller.email,
          }
        : null,
      request: assignment.request,
      quote,
    };
  }
}
