import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CompanyType,
  MembershipRole,
  OrderFulfillmentStatus,
  QuoteStatus,
  RequestEventType,
  RequestStatus,
} from '@prisma/client';
import { AuthUser } from '../auth/auth-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { FulfillmentAction } from './dto/update-fulfillment.dto';
import { ProgressRequestAction } from './dto/progress-request.dto';
import { UpsertOrderDto } from './dto/upsert-order.dto';

@Injectable()
export class RequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: AuthUser, dto: CreateRequestDto) {
    const buyerCompanyId = this.getCompanyIdForRole(user, MembershipRole.BUYER);
    const status = dto.status ?? RequestStatus.PUBLISHED;
    const buyerCompanyName = await this.getCompanyNameById(buyerCompanyId);

    if (status !== RequestStatus.DRAFT && status !== RequestStatus.PUBLISHED) {
      throw new BadRequestException(
        'El alta inicial del pedido solo permite estado DRAFT o PUBLISHED.',
      );
    }

    return this.prisma.request.create({
      data: {
        buyerCompanyId,
        title: dto.title,
        productName: dto.productName,
        description: dto.description,
        category: dto.category,
        quantityRequested: dto.quantityRequested,
        referenceUnitPrice: dto.referenceUnitPrice,
        estimatedTotalCost: dto.estimatedTotalCost,
        preferredSupplierName: dto.preferredSupplierName,
        privateRequest: dto.privateRequest ?? false,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        status,
        events: {
          create: {
            type: RequestEventType.REQUEST_CREATED,
            title:
              status === RequestStatus.DRAFT
                ? 'Solicitud creada en borrador'
                : 'Solicitud publicada',
            detail:
              status === RequestStatus.DRAFT
                ? `La solicitud "${dto.title}" se creo como borrador.`
                : `La solicitud "${dto.title}" se publico para recibir cotizaciones.`,
            actorRole: MembershipRole.BUYER,
            actorCompanyName: buyerCompanyName ?? undefined,
          },
        },
      },
      include: {
        buyerCompany: true,
      },
    });
  }

  async findMine(user: AuthUser) {
    const buyerCompanyId = this.getCompanyIdForRole(user, MembershipRole.BUYER);

    return this.prisma.request.findMany({
      where: {
        buyerCompanyId,
      },
      include: {
        buyerCompany: true,
        awardedQuote: {
          include: {
            supplierCompany: true,
          },
        },
        order: true,
        _count: {
          select: {
            quotes: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOpen(user: AuthUser) {
    this.getCompanyIdForRole(user, MembershipRole.SUPPLIER);

    return this.prisma.request.findMany({
      where: {
        privateRequest: false,
        status: {
          in: [RequestStatus.PUBLISHED, RequestStatus.REVIEWING],
        },
      },
      include: {
        buyerCompany: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async award(user: AuthUser, id: string, quoteId: string) {
    const buyerCompanyId = this.getCompanyIdForRole(user, MembershipRole.BUYER);
    const buyerCompanyName = await this.getCompanyNameById(buyerCompanyId);

    const request = await this.prisma.request.findUnique({
      where: { id },
      include: {
        buyerCompany: true,
        quotes: {
          include: {
            supplierCompany: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Pedido no encontrado.');
    }

    if (request.buyerCompanyId !== buyerCompanyId && !this.isAdmin(user)) {
      throw new ForbiddenException('No tenes acceso para adjudicar este pedido.');
    }

    if (request.status === RequestStatus.AWARDED || request.awardedQuoteId) {
      throw new BadRequestException('Este pedido ya fue adjudicado.');
    }

    const selectedQuote = request.quotes.find((quote) => quote.id === quoteId);
    if (!selectedQuote) {
      throw new BadRequestException('La cotizacion seleccionada no pertenece a este pedido.');
    }

    if (selectedQuote.status !== QuoteStatus.SUBMITTED) {
      throw new BadRequestException('Solo se pueden adjudicar cotizaciones enviadas.');
    }

    await this.prisma.$transaction([
      this.prisma.quote.update({
        where: { id: selectedQuote.id },
        data: {
          status: QuoteStatus.AWARDED,
        },
      }),
      this.prisma.quote.updateMany({
        where: {
          requestId: id,
          id: {
            not: selectedQuote.id,
          },
          status: {
            in: [QuoteStatus.DRAFT, QuoteStatus.SUBMITTED],
          },
        },
        data: {
          status: QuoteStatus.REJECTED,
        },
      }),
      this.prisma.request.update({
        where: { id },
        data: {
          status: RequestStatus.AWARDED,
          awardedQuoteId: selectedQuote.id,
        },
      }),
      this.prisma.requestEvent.create({
        data: {
          requestId: id,
          type: RequestEventType.REQUEST_AWARDED,
          title: 'Solicitud adjudicada',
          detail: `Se adjudico la solicitud a ${selectedQuote.supplierCompany?.name ?? 'un proveedor'} por ${selectedQuote.currency} ${selectedQuote.amount ?? 'a convenir'}.`,
          actorRole: MembershipRole.BUYER,
          actorCompanyName: buyerCompanyName ?? undefined,
        },
      }),
    ]);

    return this.prisma.request.findUnique({
      where: { id },
      include: {
        buyerCompany: true,
        awardedQuote: {
          include: {
            supplierCompany: true,
          },
        },
        order: true,
        quotes: {
          include: {
            supplierCompany: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        events: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  }

  async progress(user: AuthUser, id: string, action: ProgressRequestAction) {
    const buyerCompanyId = this.getCompanyIdForRole(user, MembershipRole.BUYER);
    const buyerCompanyName = await this.getCompanyNameById(buyerCompanyId);

    const request = await this.prisma.request.findUnique({
      where: { id },
      include: {
        awardedQuote: {
          include: {
            supplierCompany: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Pedido no encontrado.');
    }

    if (request.buyerCompanyId !== buyerCompanyId && !this.isAdmin(user)) {
      throw new ForbiddenException('No tenes acceso para actualizar este pedido.');
    }

    if (!request.awardedQuoteId || !request.awardedQuote) {
      throw new BadRequestException('La solicitud debe estar adjudicada antes de avanzar comercialmente.');
    }

    const nextState = this.resolveProgressTransition(request.status, action);
    const eventData = this.buildProgressEvent(action, request.awardedQuote, buyerCompanyName);
    const orderUpsert =
      action === 'ISSUE_ORDER'
        ? this.prisma.purchaseOrder.upsert({
            where: {
              requestId: id,
            },
            create: {
              requestId: id,
              orderNumber: this.generateOrderNumber(id),
              fulfillmentStatus: OrderFulfillmentStatus.ISSUED,
            },
            update: {
              fulfillmentStatus: OrderFulfillmentStatus.ISSUED,
            },
          })
        : null;

    await this.prisma.$transaction([
      this.prisma.request.update({
        where: { id },
        data: {
          status: nextState,
        },
      }),
      this.prisma.requestEvent.create({
        data: {
          requestId: id,
          ...eventData,
          actorRole: MembershipRole.BUYER,
          actorCompanyName: buyerCompanyName ?? undefined,
        },
      }),
      ...(orderUpsert ? [orderUpsert] : []),
    ]);

    return this.prisma.request.findUnique({
      where: { id },
      include: {
        buyerCompany: true,
        awardedQuote: {
          include: {
            supplierCompany: true,
          },
        },
        order: true,
        quotes: {
          include: {
            supplierCompany: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        events: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  }

  async upsertOrder(user: AuthUser, id: string, dto: UpsertOrderDto) {
    const buyerCompanyId = this.getCompanyIdForRole(user, MembershipRole.BUYER);
    const buyerCompanyName = await this.getCompanyNameById(buyerCompanyId);

    const request = await this.prisma.request.findUnique({
      where: { id },
      include: {
        order: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Pedido no encontrado.');
    }

    if (request.buyerCompanyId !== buyerCompanyId && !this.isAdmin(user)) {
      throw new ForbiddenException('No tenes acceso para actualizar la orden de este pedido.');
    }

    if (request.status !== RequestStatus.ORDER_ISSUED) {
      throw new BadRequestException('La orden solo puede editarse cuando la solicitud ya esta emitida.');
    }

    const nextOrderNumber = dto.orderNumber ?? request.order?.orderNumber ?? this.generateOrderNumber(id);

    await this.prisma.$transaction([
      this.prisma.purchaseOrder.upsert({
        where: {
          requestId: id,
        },
        create: {
          requestId: id,
          orderNumber: nextOrderNumber,
          promisedDate: dto.promisedDate ? new Date(dto.promisedDate) : undefined,
          notes: dto.notes,
          fulfillmentStatus: dto.fulfillmentStatus ?? OrderFulfillmentStatus.ISSUED,
        },
        update: {
          orderNumber: nextOrderNumber,
          promisedDate:
            typeof dto.promisedDate === 'string' ? new Date(dto.promisedDate) : request.order?.promisedDate,
          notes: dto.notes ?? request.order?.notes ?? undefined,
          fulfillmentStatus: dto.fulfillmentStatus ?? request.order?.fulfillmentStatus ?? OrderFulfillmentStatus.ISSUED,
        },
      }),
      this.prisma.requestEvent.create({
        data: {
          requestId: id,
          type: RequestEventType.ORDER_UPDATED,
          title: 'Orden actualizada',
          detail: `${buyerCompanyName ?? 'El comprador'} actualizo los datos operativos de la orden.`,
          actorRole: MembershipRole.BUYER,
          actorCompanyName: buyerCompanyName ?? undefined,
        },
      }),
    ]);

    return this.prisma.request.findUnique({
      where: { id },
      include: {
        buyerCompany: true,
        awardedQuote: {
          include: {
            supplierCompany: true,
          },
        },
        order: true,
        quotes: {
          include: {
            supplierCompany: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        events: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  }

  async updateFulfillment(user: AuthUser, id: string, action: FulfillmentAction) {
    const supplierCompanyId = this.getCompanyIdForRole(user, MembershipRole.SUPPLIER);
    const supplierCompanyName = await this.getCompanyNameById(supplierCompanyId);

    const request = await this.prisma.request.findUnique({
      where: { id },
      include: {
        order: true,
        awardedQuote: {
          include: {
            supplierCompany: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Pedido no encontrado.');
    }

    if (!request.order || request.status !== RequestStatus.ORDER_ISSUED) {
      throw new BadRequestException('La solicitud debe tener una orden emitida para actualizar su cumplimiento.');
    }

    if (!request.awardedQuote || request.awardedQuote.supplierCompanyId !== supplierCompanyId) {
      throw new ForbiddenException('Solo el proveedor adjudicado puede actualizar el cumplimiento de esta orden.');
    }

    const transition = this.resolveFulfillmentTransition(request.order.fulfillmentStatus, action);

    await this.prisma.$transaction([
      this.prisma.purchaseOrder.update({
        where: {
          requestId: id,
        },
        data: {
          fulfillmentStatus: transition.nextStatus,
        },
      }),
      this.prisma.requestEvent.create({
        data: {
          requestId: id,
          type: transition.eventType,
          title: transition.title,
          detail: `${supplierCompanyName ?? 'El proveedor adjudicado'} ${transition.detailSuffix}.`,
          actorRole: MembershipRole.SUPPLIER,
          actorCompanyName: supplierCompanyName ?? undefined,
        },
      }),
    ]);

    return this.prisma.request.findUnique({
      where: { id },
      include: {
        buyerCompany: true,
        awardedQuote: {
          include: {
            supplierCompany: true,
          },
        },
        order: true,
        quotes: {
          include: {
            supplierCompany: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        events: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  }

  async findOne(user: AuthUser, id: string) {
    const request = await this.prisma.request.findUnique({
      where: { id },
      include: {
        awardedQuote: {
          include: {
            supplierCompany: true,
          },
        },
        order: true,
        buyerCompany: true,
        quotes: {
          include: {
            supplierCompany: true,
          },
        },
        events: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Pedido no encontrado.');
    }

    if (this.isAdmin(user) || request.buyerCompanyId === this.getOptionalCompanyId(user, MembershipRole.BUYER)) {
      return request;
    }

    const supplierCompanyId = this.getOptionalCompanyId(user, MembershipRole.SUPPLIER);
    if (!supplierCompanyId) {
      throw new ForbiddenException('No tenes acceso a este pedido.');
    }

    if (request.privateRequest) {
      throw new ForbiddenException('El pedido es privado y no esta disponible para este proveedor.');
    }

    return {
      ...request,
      quotes: request.quotes.filter((quote) => quote.supplierCompanyId === supplierCompanyId),
    };
  }

  async findQuotes(user: AuthUser, id: string) {
    const buyerCompanyId = this.getCompanyIdForRole(user, MembershipRole.BUYER);

    const request = await this.prisma.request.findUnique({
      where: { id },
      select: {
        id: true,
        buyerCompanyId: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Pedido no encontrado.');
    }

    if (request.buyerCompanyId !== buyerCompanyId && !this.isAdmin(user)) {
      throw new ForbiddenException('No tenes acceso a las cotizaciones de este pedido.');
    }

    return this.prisma.quote.findMany({
      where: {
        requestId: id,
      },
      include: {
        supplierCompany: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  private getCompanyIdForRole(user: AuthUser, role: MembershipRole) {
    const membership = user.memberships.find((item) => item.role === role);
    if (membership) {
      return membership.companyId;
    }

    // Una empresa HYBRID compra y vende, así que su membresía sirve para
    // cualquier rol aunque tenga otro rol asignado.
    const hybridMembership = user.memberships.find((item) => item.companyType === CompanyType.HYBRID);
    if (hybridMembership) {
      return hybridMembership.companyId;
    }

    throw new ForbiddenException(`La operacion requiere rol ${role}.`);
  }

  private getOptionalCompanyId(user: AuthUser, role: MembershipRole) {
    return user.memberships.find((item) => item.role === role)?.companyId;
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

  private resolveProgressTransition(
    currentStatus: RequestStatus,
    action: ProgressRequestAction,
  ) {
    if (action === 'START_NEGOTIATION') {
      if (currentStatus !== RequestStatus.AWARDED) {
        throw new BadRequestException('Solo podes iniciar negociacion sobre solicitudes adjudicadas.');
      }

      return RequestStatus.NEGOTIATING;
    }

    if (action === 'ISSUE_ORDER') {
      if (
        currentStatus !== RequestStatus.AWARDED &&
        currentStatus !== RequestStatus.NEGOTIATING
      ) {
        throw new BadRequestException(
          'Solo podes emitir la orden sobre solicitudes adjudicadas o en negociacion.',
        );
      }

      return RequestStatus.ORDER_ISSUED;
    }

    throw new BadRequestException('Accion de progreso no soportada.');
  }

  private buildProgressEvent(
    action: ProgressRequestAction,
    awardedQuote: {
      supplierCompany?: {
        name: string;
      } | null;
    } | null,
    actorCompanyName: string | null,
  ) {
    if (action === 'START_NEGOTIATION') {
      return {
        type: RequestEventType.NEGOTIATION_STARTED,
        title: 'Negociacion iniciada',
        detail: `${actorCompanyName ?? 'El comprador'} inicio una instancia de negociacion con ${awardedQuote?.supplierCompany?.name ?? 'el proveedor adjudicado'}.`,
      };
    }

    return {
      type: RequestEventType.ORDER_ISSUED,
      title: 'Orden emitida',
      detail: `${actorCompanyName ?? 'El comprador'} emitio la orden comercial para ${awardedQuote?.supplierCompany?.name ?? 'el proveedor adjudicado'}.`,
    };
  }

  private resolveFulfillmentTransition(
    currentStatus: OrderFulfillmentStatus,
    action: FulfillmentAction,
  ) {
    if (action === 'CONFIRM_ORDER') {
      if (currentStatus !== OrderFulfillmentStatus.ISSUED) {
        throw new BadRequestException('Solo se puede confirmar una orden emitida.');
      }

      return {
        nextStatus: OrderFulfillmentStatus.CONFIRMED,
        eventType: RequestEventType.ORDER_CONFIRMED,
        title: 'Orden confirmada',
        detailSuffix: 'confirmo la orden y su recepcion operativa',
      };
    }

    if (action === 'START_PRODUCTION') {
      if (currentStatus !== OrderFulfillmentStatus.CONFIRMED) {
        throw new BadRequestException('La produccion solo puede iniciarse sobre una orden confirmada.');
      }

      return {
        nextStatus: OrderFulfillmentStatus.IN_PRODUCTION,
        eventType: RequestEventType.PRODUCTION_STARTED,
        title: 'Produccion iniciada',
        detailSuffix: 'inicio la produccion o preparacion del pedido',
      };
    }

    if (action === 'MARK_DISPATCHED') {
      if (currentStatus !== OrderFulfillmentStatus.IN_PRODUCTION) {
        throw new BadRequestException('Solo se puede despachar una orden en produccion.');
      }

      return {
        nextStatus: OrderFulfillmentStatus.DISPATCHED,
        eventType: RequestEventType.ORDER_DISPATCHED,
        title: 'Pedido despachado',
        detailSuffix: 'marco la orden como despachada',
      };
    }

    if (currentStatus !== OrderFulfillmentStatus.DISPATCHED) {
      throw new BadRequestException('Solo se puede marcar como entregada una orden despachada.');
    }

    return {
      nextStatus: OrderFulfillmentStatus.DELIVERED,
      eventType: RequestEventType.ORDER_DELIVERED,
      title: 'Pedido entregado',
      detailSuffix: 'confirmo la entrega del pedido',
    };
  }

  private generateOrderNumber(requestId: string) {
    const compactDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `ATAR-${compactDate}-${requestId.slice(-6).toUpperCase()}`;
  }

  private isAdmin(user: AuthUser) {
    return user.memberships.some((item) => item.role === MembershipRole.ADMIN);
  }
}
