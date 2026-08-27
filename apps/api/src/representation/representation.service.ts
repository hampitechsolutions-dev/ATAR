import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CompanyType,
  MembershipRole,
  NotificationType,
  RepresentationDirection,
  RepresentationStatus,
  UserStatus,
} from '@prisma/client';
import type { AuthUser } from '../auth/auth-user.interface';
import { assertManager, resolveSupplierWorkspace } from '../common/workspace.util';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRepresentationInvitationDto } from './dto/create-representation-invitation.dto';
import { CreateRepresentationRequestDto } from './dto/create-representation-request.dto';

/** Roles que mandan dentro de una empresa proveedora. */
const MANAGER_ROLES = [MembershipRole.SUPPLIER, MembershipRole.ADMIN];

/** Roles de quien es dueno o administra una empresa: la cuenta ES la empresa. */
const COMPANY_OWNER_ROLES: MembershipRole[] = [
  MembershipRole.SUPPLIER,
  MembershipRole.BUYER,
  MembershipRole.ADMIN,
];

const COMPANY_SELECT = {
  id: true,
  name: true,
  type: true,
  country: true,
  city: true,
} as const;

const USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
} as const;

const REQUEST_INCLUDE = {
  company: { select: COMPANY_SELECT },
  seller: { select: USER_SELECT },
  createdBy: { select: USER_SELECT },
} as const;

type RepresentationRecord = {
  id: string;
  companyId: string;
  sellerUserId: string;
  direction: RepresentationDirection;
  status: RepresentationStatus;
  message: string | null;
  createdAt: Date;
  respondedAt: Date | null;
  company: { id: string; name: string; type: CompanyType; country: string; city: string | null };
  seller: { id: string; firstName: string; lastName: string; email: string };
  createdBy: { id: string; firstName: string; lastName: string; email: string };
};

/**
 * Vinculo entre un vendedor y una empresa proveedora.
 *
 * Los dos lados pueden empezarlo: el vendedor se ofrece a representar a una
 * empresa, o la empresa lo invita a su equipo. En ambos casos queda PENDING
 * hasta que responde la contraparte; al aceptar se crea la membresia SELLER y
 * recien ahi el vendedor ve el workspace de esa empresa.
 */
@Injectable()
export class RepresentationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /* ---------------------------------------------------------------- lecturas */

  /** Bandeja del vendedor: invitaciones recibidas y pedidos que mando. */
  async sellerInbox(user: AuthUser) {
    const requests = await this.prisma.representationRequest.findMany({
      where: { sellerUserId: user.userId },
      include: REQUEST_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });

    return this.groupInbox(requests, RepresentationDirection.COMPANY_TO_SELLER);
  }

  /** Bandeja de la empresa: pedidos de vendedores e invitaciones enviadas. */
  async companyInbox(user: AuthUser, activeCompanyId?: string) {
    const workspace = assertManager(resolveSupplierWorkspace(user, activeCompanyId));

    const requests = await this.prisma.representationRequest.findMany({
      where: { companyId: workspace.companyId },
      include: REQUEST_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });

    return this.groupInbox(requests, RepresentationDirection.SELLER_TO_COMPANY);
  }

  /**
   * Proveedoras que el vendedor todavia puede pedir representar: se sacan las
   * que ya representa y las que tienen un pedido en curso.
   */
  async listAvailableCompanies(user: AuthUser, search?: string) {
    const [companies, memberships, pending] = await Promise.all([
      this.prisma.company.findMany({
        where: {
          type: { in: [CompanyType.SUPPLIER, CompanyType.HYBRID] },
          ...(search?.trim()
            ? { name: { contains: search.trim(), mode: 'insensitive' as const } }
            : {}),
        },
        select: COMPANY_SELECT,
        orderBy: { name: 'asc' },
        take: 30,
      }),
      this.prisma.membership.findMany({
        where: { userId: user.userId },
        select: { companyId: true },
      }),
      this.prisma.representationRequest.findMany({
        where: { sellerUserId: user.userId, status: RepresentationStatus.PENDING },
        select: { companyId: true },
      }),
    ]);

    const taken = new Set([
      ...memberships.map((item) => item.companyId),
      ...pending.map((item) => item.companyId),
    ]);

    return companies.filter((company) => !taken.has(company.id));
  }

  /**
   * Vendedores registrados a los que la empresa puede invitar.
   *
   * Solo aparecen usuarios que ya trabajan como vendedores en ATAR; para
   * cualquier otro, el gerente invita escribiendo el email.
   */
  async searchSellers(user: AuthUser, search: string, activeCompanyId?: string) {
    const workspace = assertManager(resolveSupplierWorkspace(user, activeCompanyId));
    const term = search?.trim();

    if (!term || term.length < 2) {
      return [];
    }

    const candidates = await this.prisma.user.findMany({
      where: {
        memberships: { some: { role: MembershipRole.SELLER } },
        OR: [
          { email: { contains: term, mode: 'insensitive' } },
          { firstName: { contains: term, mode: 'insensitive' } },
          { lastName: { contains: term, mode: 'insensitive' } },
        ],
      },
      select: {
        ...USER_SELECT,
        memberships: {
          select: { companyId: true, company: { select: { name: true } } },
        },
        representationRequests: {
          where: { companyId: workspace.companyId, status: RepresentationStatus.PENDING },
          select: { id: true },
        },
      },
      orderBy: { firstName: 'asc' },
      take: 10,
    });

    return candidates
      .filter(
        (candidate) =>
          !candidate.memberships.some((item) => item.companyId === workspace.companyId) &&
          candidate.representationRequests.length === 0,
      )
      .map((candidate) => ({
        id: candidate.id,
        name: `${candidate.firstName} ${candidate.lastName}`.trim(),
        email: candidate.email,
        companies: Array.from(
          new Set(candidate.memberships.map((item) => item.company.name)),
        ),
      }));
  }

  /* ------------------------------------------------------------------ altas */

  /** El vendedor se ofrece a representar a una empresa. */
  async requestRepresentation(user: AuthUser, dto: CreateRepresentationRequestDto) {
    // Representar es del perfil de vendedor. Una proveedora o un comprador no
    // representan a nadie: suman vendedores invitandolos a su equipo.
    if (user.memberships.some((membership) => COMPANY_OWNER_ROLES.includes(membership.role))) {
      throw new ForbiddenException(
        'Tu cuenta administra una empresa. Para sumar vendedores, invitalos desde tu equipo comercial.',
      );
    }

    const company = await this.prisma.company.findUnique({
      where: { id: dto.companyId },
      select: COMPANY_SELECT,
    });

    if (!company) {
      throw new NotFoundException('No encontramos la empresa seleccionada.');
    }

    if (company.type === CompanyType.BUYER) {
      throw new BadRequestException(
        'Esa empresa esta registrada como compradora y no tiene equipo de ventas.',
      );
    }

    await this.assertNotLinked(company.id, user.userId);

    const created = await this.upsertPending({
      companyId: company.id,
      sellerUserId: user.userId,
      direction: RepresentationDirection.SELLER_TO_COMPANY,
      message: dto.message,
      createdByUserId: user.userId,
    });

    const sellerName = this.fullName(created.seller);
    await this.notifications.createForCompany({
      companyId: company.id,
      roles: MANAGER_ROLES,
      type: NotificationType.REPRESENTATION_REQUESTED,
      title: `${sellerName} quiere representar a ${company.name}`,
      detail: created.message ?? `${sellerName} pidio sumarse a tu equipo comercial.`,
      href: '/dashboard/proveedor/equipo',
      metadata: { representationRequestId: created.id },
    });

    return created;
  }

  /** La empresa invita a un vendedor a representarla. */
  async inviteSeller(
    user: AuthUser,
    dto: CreateRepresentationInvitationDto,
    activeCompanyId?: string,
  ) {
    const workspace = assertManager(resolveSupplierWorkspace(user, activeCompanyId));

    const company = await this.prisma.company.findUnique({
      where: { id: workspace.companyId },
      select: COMPANY_SELECT,
    });

    if (!company) {
      throw new NotFoundException('No encontramos tu empresa.');
    }

    const seller = dto.sellerUserId
      ? await this.prisma.user.findUnique({ where: { id: dto.sellerUserId }, select: USER_SELECT })
      : await this.prisma.user.findUnique({
          where: { email: dto.email!.trim().toLowerCase() },
          select: USER_SELECT,
        });

    if (!seller) {
      throw new NotFoundException(
        'Ese vendedor todavia no tiene cuenta en ATAR. Pedile que se registre y volve a invitarlo.',
      );
    }

    if (seller.id === user.userId) {
      throw new BadRequestException('Ya sos parte de esta empresa.');
    }

    await this.assertNotLinked(company.id, seller.id);

    const created = await this.upsertPending({
      companyId: company.id,
      sellerUserId: seller.id,
      direction: RepresentationDirection.COMPANY_TO_SELLER,
      message: dto.message,
      createdByUserId: user.userId,
    });

    // El vendedor todavia no es miembro: se notifica al usuario directamente.
    await this.notifications.createForUsers({
      userIds: [seller.id],
      companyId: company.id,
      type: NotificationType.REPRESENTATION_REQUESTED,
      title: `${company.name} te invita a representarla`,
      detail: created.message ?? 'Revisa la invitacion y decidi si la aceptas.',
      href: '/dashboard/proveedor/empresas',
      metadata: { representationRequestId: created.id },
    });

    return created;
  }

  /* ---------------------------------------------------------------- respuesta */

  async accept(user: AuthUser, requestId: string) {
    const request = await this.loadPending(requestId);
    await this.assertCanRespond(user, request);

    const [updated] = await this.prisma.$transaction([
      this.prisma.representationRequest.update({
        where: { id: request.id },
        data: {
          status: RepresentationStatus.ACCEPTED,
          respondedByUserId: user.userId,
          respondedAt: new Date(),
        },
        include: REQUEST_INCLUDE,
      }),
      // La empresa puede haber sumado al vendedor por otra via mientras tanto.
      this.prisma.membership.upsert({
        where: {
          userId_companyId_role: {
            userId: request.sellerUserId,
            companyId: request.companyId,
            role: MembershipRole.SELLER,
          },
        },
        create: {
          userId: request.sellerUserId,
          companyId: request.companyId,
          role: MembershipRole.SELLER,
          isPrimary: false,
        },
        update: {},
      }),
      // Un vendedor que se habia registrado esperando aprobacion ya esta
      // habilitado: la aceptacion es justamente esa aprobacion.
      this.prisma.user.updateMany({
        where: { id: request.sellerUserId, status: UserStatus.INVITED },
        data: { status: UserStatus.ACTIVE },
      }),
    ]);

    const sellerName = this.fullName(request.seller);

    if (request.direction === RepresentationDirection.SELLER_TO_COMPANY) {
      await this.notifications.createForUsers({
        userIds: [request.sellerUserId],
        companyId: request.companyId,
        type: NotificationType.REPRESENTATION_ACCEPTED,
        title: `Ya representas a ${request.company.name}`,
        detail: 'Cambia de empresa desde el selector para trabajar con ella.',
        href: '/dashboard/proveedor/empresas',
        metadata: { representationRequestId: request.id },
      });
    } else {
      await this.notifications.createForCompany({
        companyId: request.companyId,
        roles: MANAGER_ROLES,
        type: NotificationType.REPRESENTATION_ACCEPTED,
        title: `${sellerName} acepto representar a ${request.company.name}`,
        detail: 'Ya podes asignarle solicitudes.',
        href: '/dashboard/proveedor/equipo',
        metadata: { representationRequestId: request.id },
      });
    }

    return updated;
  }

  async reject(user: AuthUser, requestId: string) {
    const request = await this.loadPending(requestId);
    await this.assertCanRespond(user, request);

    const updated = await this.prisma.representationRequest.update({
      where: { id: request.id },
      data: {
        status: RepresentationStatus.REJECTED,
        respondedByUserId: user.userId,
        respondedAt: new Date(),
      },
      include: REQUEST_INCLUDE,
    });

    const sellerName = this.fullName(request.seller);

    if (request.direction === RepresentationDirection.SELLER_TO_COMPANY) {
      await this.notifications.createForUsers({
        userIds: [request.sellerUserId],
        companyId: request.companyId,
        type: NotificationType.REPRESENTATION_REJECTED,
        title: `${request.company.name} rechazo tu pedido`,
        detail: 'Podes volver a pedirlo mas adelante.',
        href: '/dashboard/proveedor/empresas',
        metadata: { representationRequestId: request.id },
      });
    } else {
      await this.notifications.createForCompany({
        companyId: request.companyId,
        roles: MANAGER_ROLES,
        type: NotificationType.REPRESENTATION_REJECTED,
        title: `${sellerName} rechazo la invitacion`,
        detail: null,
        href: '/dashboard/proveedor/equipo',
        metadata: { representationRequestId: request.id },
      });
    }

    return updated;
  }

  /** Retira un pedido propio antes de que la contraparte responda. */
  async cancel(user: AuthUser, requestId: string) {
    const request = await this.loadPending(requestId);

    const isSellerSide = request.direction === RepresentationDirection.SELLER_TO_COMPANY;
    const allowed = isSellerSide
      ? request.sellerUserId === user.userId
      : await this.isCompanyManager(user, request.companyId);

    if (!allowed) {
      throw new ForbiddenException('Solo quien envio el pedido puede retirarlo.');
    }

    const updated = await this.prisma.representationRequest.update({
      where: { id: request.id },
      data: {
        status: RepresentationStatus.CANCELLED,
        respondedByUserId: user.userId,
        respondedAt: new Date(),
      },
      include: REQUEST_INCLUDE,
    });

    if (!isSellerSide) {
      await this.notifications.createForUsers({
        userIds: [request.sellerUserId],
        companyId: request.companyId,
        type: NotificationType.REPRESENTATION_CANCELLED,
        title: `${request.company.name} retiro la invitacion`,
        detail: null,
        href: '/dashboard/proveedor/empresas',
        metadata: { representationRequestId: request.id },
      });
    }

    return updated;
  }

  /* ----------------------------------------------------------------- helpers */

  private groupInbox(
    requests: RepresentationRecord[],
    incomingDirection: RepresentationDirection,
  ) {
    const pending = requests.filter((item) => item.status === RepresentationStatus.PENDING);

    return {
      // Lo que el usuario tiene que responder.
      incoming: pending.filter((item) => item.direction === incomingDirection),
      // Lo que mando y espera respuesta.
      outgoing: pending.filter((item) => item.direction !== incomingDirection),
      history: requests
        .filter((item) => item.status !== RepresentationStatus.PENDING)
        .slice(0, 20),
    };
  }

  /**
   * Abre el pedido reusando la fila del par (empresa, vendedor).
   *
   * Si ya hubo un intento que termino rechazado o retirado, ese registro vuelve
   * a PENDING con el sentido y el mensaje nuevos. `assertNotLinked` ya
   * descarto que haya uno en curso o una membresia.
   */
  private upsertPending(input: {
    companyId: string;
    sellerUserId: string;
    direction: RepresentationDirection;
    message?: string;
    createdByUserId: string;
  }) {
    const data = {
      direction: input.direction,
      status: RepresentationStatus.PENDING,
      message: input.message?.trim() || null,
      createdByUserId: input.createdByUserId,
      respondedByUserId: null,
      respondedAt: null,
    };

    return this.prisma.representationRequest.upsert({
      where: {
        companyId_sellerUserId: {
          companyId: input.companyId,
          sellerUserId: input.sellerUserId,
        },
      },
      create: {
        companyId: input.companyId,
        sellerUserId: input.sellerUserId,
        ...data,
      },
      update: data,
      include: REQUEST_INCLUDE,
    });
  }

  private async loadPending(requestId: string) {
    const request = await this.prisma.representationRequest.findUnique({
      where: { id: requestId },
      include: REQUEST_INCLUDE,
    });

    if (!request) {
      throw new NotFoundException('No encontramos ese pedido.');
    }

    if (request.status !== RepresentationStatus.PENDING) {
      throw new BadRequestException('Ese pedido ya fue respondido.');
    }

    return request;
  }

  /** Responde la contraparte, nunca quien lo envio. */
  private async assertCanRespond(user: AuthUser, request: RepresentationRecord) {
    if (request.direction === RepresentationDirection.COMPANY_TO_SELLER) {
      if (request.sellerUserId !== user.userId) {
        throw new ForbiddenException('Esta invitacion es para otro vendedor.');
      }

      return;
    }

    if (!(await this.isCompanyManager(user, request.companyId))) {
      throw new ForbiddenException(
        'Solo el administrador o gerente de la empresa puede responder este pedido.',
      );
    }
  }

  private async isCompanyManager(user: AuthUser, companyId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: {
        userId: user.userId,
        companyId,
        role: { in: MANAGER_ROLES },
      },
      select: { id: true },
    });

    return Boolean(membership);
  }

  /** Ni membresia previa ni otro pedido en curso para el mismo par. */
  private async assertNotLinked(companyId: string, sellerUserId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { companyId, userId: sellerUserId },
      select: { id: true },
    });

    if (membership) {
      throw new BadRequestException('Ese vendedor ya forma parte de la empresa.');
    }

    const pending = await this.prisma.representationRequest.findFirst({
      where: { companyId, sellerUserId, status: RepresentationStatus.PENDING },
      select: { id: true },
    });

    if (pending) {
      throw new BadRequestException('Ya hay un pedido pendiente para esta empresa.');
    }
  }

  private fullName(user: { firstName: string; lastName: string }) {
    return `${user.firstName} ${user.lastName}`.trim();
  }
}
