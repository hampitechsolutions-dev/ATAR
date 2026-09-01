import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MembershipRole,
  NotificationType,
  QuoteStatus,
  RequestEventType,
  RequestStatus,
} from '@prisma/client';
import { AuthUser } from '../auth/auth-user.interface';
import { resolveCompanyId, resolveOptionalCompanyId } from '../common/workspace.util';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { AssignmentsService } from '../requests/assignments.service';
import { CreateQuoteDto } from './dto/create-quote.dto';

@Injectable()
export class QuotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly assignmentsService: AssignmentsService,
  ) {}

  async create(user: AuthUser, requestId: string, dto: CreateQuoteDto, activeCompanyId?: string) {
    const supplierCompanyId = this.getCompanyIdForRole(user, MembershipRole.SUPPLIER, activeCompanyId);
    const supplierCompanyName = await this.getCompanyNameById(supplierCompanyId);

    const request = await this.prisma.request.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Pedido no encontrado.');
    }

    if (
      request.status !== RequestStatus.PUBLISHED &&
      request.status !== RequestStatus.REVIEWING
    ) {
      throw new BadRequestException('El pedido no admite nuevas cotizaciones en este estado.');
    }

    if (request.privateRequest) {
      if (!this.matchesPreferredSupplier(request.preferredSupplierName, supplierCompanyName)) {
        throw new ForbiddenException('El pedido es privado y no esta habilitado para tu empresa.');
      }
    }

    const existingQuote = await this.prisma.quote.findFirst({
      where: {
        requestId,
        supplierCompanyId,
      },
    });

    // Precio unitario por producto: el total de la cotizacion es la suma de
    // (cantidad pedida del producto x precio unitario ofrecido). Si no vienen
    // items, se usa el amount legacy (una sola cifra total).
    let computedAmount = dto.amount;
    let quoteItemsData: { requestItemId: string; unitPrice: number }[] | null = null;
    if (dto.items && dto.items.length > 0) {
      const requestItems = await this.prisma.requestItem.findMany({
        where: { requestId },
        select: { id: true, quantity: true },
      });
      const byId = new Map(requestItems.map((item) => [item.id, item]));
      let total = 0;
      for (const line of dto.items) {
        const requestItem = byId.get(line.requestItemId);
        if (!requestItem) {
          throw new BadRequestException('Una de las lineas cotizadas no pertenece a esta solicitud.');
        }
        total += line.unitPrice * (requestItem.quantity ?? 0);
      }
      computedAmount = total;
      quoteItemsData = dto.items.map((line) => ({
        requestItemId: line.requestItemId,
        unitPrice: line.unitPrice,
      }));
    }

    if (existingQuote) {
      const [, updatedQuote] = await this.prisma.$transaction([
        this.prisma.request.update({
          where: { id: requestId },
          data: {
            status:
              request.status === RequestStatus.PUBLISHED ? RequestStatus.REVIEWING : request.status,
          },
        }),
        this.prisma.quote.update({
          where: { id: existingQuote.id },
          data: {
            amount: computedAmount,
            currency: dto.currency ?? existingQuote.currency,
            leadTimeDays: dto.leadTimeDays,
            paymentTerms: dto.paymentTerms,
            technicalComment: dto.technicalComment,
            status: QuoteStatus.SUBMITTED,
            // Reemplaza las lineas por las nuevas (si se cotizo por producto).
            ...(quoteItemsData ? { items: { deleteMany: {}, create: quoteItemsData } } : {}),
          },
          include: {
            supplierCompany: true,
            request: true,
            items: { include: { requestItem: true } },
          },
        }),
        this.prisma.requestEvent.create({
          data: {
            requestId,
            type: RequestEventType.QUOTE_UPDATED,
            title: 'Cotizacion actualizada',
            detail: `${supplierCompanyName ?? 'Proveedor'} actualizo su propuesta comercial.`,
            actorRole: MembershipRole.SUPPLIER,
            actorCompanyName: supplierCompanyName ?? undefined,
          },
        }),
      ]);

      await this.notificationsService.createForCompany({
        companyId: request.buyerCompanyId,
        roles: [MembershipRole.BUYER],
        excludeUserId: user.userId,
        type: NotificationType.QUOTE_UPDATED,
        title: 'Cotizacion actualizada',
        detail: `${supplierCompanyName ?? 'Un proveedor'} actualizo su propuesta para ${request.title}.`,
        href: `/dashboard/comprador/cotizaciones/${updatedQuote.id}`,
        metadata: {
          quoteId: updatedQuote.id,
          requestId,
          supplierCompanyId,
        },
      });

      await this.assignmentsService.syncStatusFromQuote(
        supplierCompanyId,
        requestId,
        QuoteStatus.SUBMITTED,
        user.userId,
      );

      return updatedQuote;
    }

    const [, createdQuote] = await this.prisma.$transaction([
      this.prisma.request.update({
        where: { id: requestId },
        data: {
          status:
            request.status === RequestStatus.PUBLISHED ? RequestStatus.REVIEWING : request.status,
        },
      }),
      this.prisma.quote.create({
        data: {
          requestId,
          supplierCompanyId,
          amount: computedAmount,
          currency: dto.currency ?? 'ARS',
          leadTimeDays: dto.leadTimeDays,
          paymentTerms: dto.paymentTerms,
          technicalComment: dto.technicalComment,
          status: QuoteStatus.SUBMITTED,
          ...(quoteItemsData ? { items: { create: quoteItemsData } } : {}),
        },
        include: {
          supplierCompany: true,
          request: true,
          items: { include: { requestItem: true } },
        },
      }),
      this.prisma.requestEvent.create({
        data: {
          requestId,
          type: RequestEventType.QUOTE_SUBMITTED,
          title: 'Nueva cotizacion recibida',
          detail: `${supplierCompanyName ?? 'Proveedor'} envio una propuesta para esta solicitud.`,
          actorRole: MembershipRole.SUPPLIER,
          actorCompanyName: supplierCompanyName ?? undefined,
        },
      }),
    ]);

    await this.notificationsService.createForCompany({
      companyId: request.buyerCompanyId,
      roles: [MembershipRole.BUYER],
      excludeUserId: user.userId,
      type: NotificationType.QUOTE_SUBMITTED,
      title: 'Nueva cotizacion recibida',
      detail: `${supplierCompanyName ?? 'Un proveedor'} envio una propuesta para ${request.title}.`,
      href: `/dashboard/comprador/cotizaciones/${createdQuote.id}`,
      metadata: {
        quoteId: createdQuote.id,
        requestId,
        supplierCompanyId,
      },
    });

    await this.assignmentsService.syncStatusFromQuote(
      supplierCompanyId,
      requestId,
      QuoteStatus.SUBMITTED,
      user.userId,
    );

    return createdQuote;
  }

  async findMine(user: AuthUser, activeCompanyId?: string) {
    const supplierCompanyId = this.getCompanyIdForRole(user, MembershipRole.SUPPLIER, activeCompanyId);

    return this.prisma.quote.findMany({
      where: {
        supplierCompanyId,
      },
      include: {
        request: {
          include: {
            buyerCompany: true,
            order: true,
            items: { orderBy: { position: 'asc' } },
          },
        },
        supplierCompany: true,
        items: { include: { requestItem: true } },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findBuyerMine(user: AuthUser, activeCompanyId?: string) {
    const buyerCompanyId = this.getCompanyIdForRole(user, MembershipRole.BUYER, activeCompanyId);

    return this.prisma.quote.findMany({
      where: {
        request: {
          buyerCompanyId,
        },
      },
      include: {
        request: {
          include: {
            buyerCompany: true,
            order: true,
            items: { orderBy: { position: 'asc' } },
          },
        },
        supplierCompany: true,
        items: { include: { requestItem: true } },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async findOne(user: AuthUser, id: string, activeCompanyId?: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: {
        supplierCompany: true,
        items: { include: { requestItem: true } },
        request: {
          include: {
            buyerCompany: true,
            order: true,
            items: { orderBy: { position: 'asc' } },
          },
        },
      },
    });

    if (!quote) {
      throw new NotFoundException('Cotizacion no encontrada.');
    }

    if (this.isAdmin(user)) {
      return quote;
    }

    const buyerCompanyId = this.getOptionalCompanyId(user, MembershipRole.BUYER, activeCompanyId);
    if (buyerCompanyId && quote.request.buyerCompanyId === buyerCompanyId) {
      return quote;
    }

    const supplierCompanyId = this.getOptionalCompanyId(user, MembershipRole.SUPPLIER, activeCompanyId);
    if (supplierCompanyId && quote.supplierCompanyId === supplierCompanyId) {
      return quote;
    }

    throw new ForbiddenException('No tenes acceso a esta cotizacion.');
  }

  private getCompanyIdForRole(user: AuthUser, role: MembershipRole, activeCompanyId?: string) {
    return resolveCompanyId(user, role, activeCompanyId);
  }

  private async getCompanyNameById(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: {
        name: true,
      },
    });

    return company?.name ?? null;
  }

  private getOptionalCompanyId(user: AuthUser, role: MembershipRole, activeCompanyId?: string) {
    return resolveOptionalCompanyId(user, role, activeCompanyId);
  }

  private matchesPreferredSupplier(
    preferredSupplierName: string | null | undefined,
    supplierCompanyName: string | null,
  ) {
    if (!preferredSupplierName || !supplierCompanyName) {
      return false;
    }

    return preferredSupplierName
      .split('|')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
      .includes(supplierCompanyName.trim().toLowerCase());
  }

  private isAdmin(user: AuthUser) {
    return user.memberships.some((item) => item.role === MembershipRole.ADMIN);
  }
}
