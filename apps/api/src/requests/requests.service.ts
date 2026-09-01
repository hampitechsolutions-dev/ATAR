import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MembershipRole,
  NotificationType,
  OrderFulfillmentStatus,
  QuoteStatus,
  RequestEventType,
  RequestStatus,
} from '@prisma/client';
import { AuthUser } from '../auth/auth-user.interface';
import { resolveCompanyId, resolveOptionalCompanyId } from '../common/workspace.util';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { AssignmentsService } from './assignments.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { FulfillmentAction } from './dto/update-fulfillment.dto';
import { ProgressRequestAction } from './dto/progress-request.dto';
import { UpsertOrderDto } from './dto/upsert-order.dto';

@Injectable()
export class RequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly assignmentsService: AssignmentsService,
  ) {}

  async create(user: AuthUser, dto: CreateRequestDto, activeCompanyId?: string) {
    const buyerCompanyId = this.getCompanyIdForRole(user, MembershipRole.BUYER, activeCompanyId);
    const status = dto.status ?? RequestStatus.PUBLISHED;
    const buyerCompanyName = await this.getCompanyNameById(buyerCompanyId);

    if (status !== RequestStatus.DRAFT && status !== RequestStatus.PUBLISHED) {
      throw new BadRequestException(
        'El alta inicial del pedido solo permite estado DRAFT o PUBLISHED.',
      );
    }

    // Multi-producto: si no mandan items, se sintetiza una unica linea con los
    // campos legacy para no romper el wizard actual (una sola solicitud/producto).
    const itemsInput =
      dto.items && dto.items.length > 0
        ? dto.items
        : [
            {
              productName: dto.productName ?? dto.title,
              category: dto.category,
              quantity: dto.quantityRequested,
              specifications: dto.description,
              referenceUnitPrice: dto.referenceUnitPrice,
            },
          ];

    const created = await this.prisma.request.create({
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
        items: {
          create: itemsInput.map((item, index) => ({
            position: index,
            productName: item.productName,
            category: item.category ?? null,
            quantity: item.quantity ?? null,
            unit: 'unit' in item ? (item.unit ?? null) : null,
            specifications: item.specifications ?? null,
            referenceUnitPrice: item.referenceUnitPrice ?? null,
          })),
        },
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

    // Solicitud dirigida: si el comprador eligio proveedores y la publica, se
    // les avisa. Sin proveedores elegidos sigue siendo mercado abierto (pull).
    const targetSupplierCompanyIds = [...new Set(dto.targetSupplierCompanyIds ?? [])];
    if (status === RequestStatus.PUBLISHED && targetSupplierCompanyIds.length > 0) {
      // Best-effort: una notificacion que falle no debe tumbar la creacion de
      // la solicitud (allSettled no rechaza). Push/email se manejan adentro.
      await Promise.allSettled(
        targetSupplierCompanyIds.map((companyId) =>
          this.notificationsService.createForCompany({
            companyId,
            roles: [MembershipRole.SUPPLIER],
            excludeUserId: user.userId,
            type: NotificationType.REQUEST_RECEIVED,
            title: 'Nueva solicitud de cotizacion',
            detail: `${buyerCompanyName ?? 'Un comprador'} te envio la solicitud "${created.title}".`,
            href: `/dashboard/proveedor/solicitudes/${created.id}`,
            metadata: { requestId: created.id },
          }),
        ),
      );
    }

    return created;
  }

  async findMine(user: AuthUser, activeCompanyId?: string) {
    const buyerCompanyId = this.getCompanyIdForRole(user, MembershipRole.BUYER, activeCompanyId);

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

  async findOpen(user: AuthUser, activeCompanyId?: string) {
    const supplierCompanyId = this.getCompanyIdForRole(user, MembershipRole.SUPPLIER, activeCompanyId);
    const supplierCompanyName = await this.getCompanyNameById(supplierCompanyId);

    return this.prisma.request.findMany({
      where: {
        status: {
          in: [RequestStatus.PUBLISHED, RequestStatus.REVIEWING],
        },
        OR: [
          {
            privateRequest: false,
          },
          ...(supplierCompanyName
            ? [
                {
                  privateRequest: true,
                  preferredSupplierName: {
                    contains: supplierCompanyName,
                    mode: 'insensitive' as const,
                  },
                },
              ]
            : []),
        ],
      },
      include: {
        buyerCompany: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async award(user: AuthUser, id: string, quoteId: string, activeCompanyId?: string) {
    const buyerCompanyId = this.getCompanyIdForRole(user, MembershipRole.BUYER, activeCompanyId);
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

    const updatedRequest = await this.prisma.request.findUnique({
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

    // El pipeline comercial de cada proveedora se cierra con el resultado:
    // ganada para la adjudicada, perdida para el resto.
    await this.assignmentsService.syncStatusesAfterAward(id, selectedQuote.supplierCompanyId);

    if (selectedQuote.supplierCompanyId) {
      await this.notificationsService.createForCompany({
        companyId: selectedQuote.supplierCompanyId,
        roles: [MembershipRole.SUPPLIER],
        excludeUserId: user.userId,
        type: NotificationType.QUOTE_AWARDED,
        title: 'Cotizacion adjudicada',
        detail: `${request.title} fue adjudicada a tu empresa.`,
        href: `/dashboard/proveedor/cotizaciones/${selectedQuote.id}`,
        metadata: {
          requestId: id,
          quoteId: selectedQuote.id,
        },
      });
    }

    const rejectedQuotes = request.quotes.filter((quote) => quote.id !== selectedQuote.id);
    await Promise.all(
      rejectedQuotes.map((quote) =>
        this.notificationsService.createForCompany({
          companyId: quote.supplierCompanyId,
          roles: [MembershipRole.SUPPLIER],
          excludeUserId: user.userId,
          type: NotificationType.QUOTE_REJECTED,
          title: 'Cotizacion no adjudicada',
          detail: `La solicitud ${request.title} fue adjudicada a otro proveedor.`,
          href: `/dashboard/proveedor/cotizaciones/${quote.id}`,
          metadata: {
            requestId: id,
            quoteId: quote.id,
          },
        }),
      ),
    );

    return updatedRequest;
  }

  async progress(user: AuthUser, id: string, action: ProgressRequestAction, activeCompanyId?: string) {
    const buyerCompanyId = this.getCompanyIdForRole(user, MembershipRole.BUYER, activeCompanyId);
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

    const updatedRequest = await this.prisma.request.findUnique({
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

    const notificationType =
      action === 'START_NEGOTIATION'
        ? NotificationType.NEGOTIATION_STARTED
        : NotificationType.ORDER_ISSUED;
    const notificationTitle =
      action === 'START_NEGOTIATION' ? 'Negociacion iniciada' : 'Orden emitida';
    const notificationDetail =
      action === 'START_NEGOTIATION'
        ? `${buyerCompanyName ?? 'El comprador'} inicio una negociacion sobre ${request.title}.`
        : `${buyerCompanyName ?? 'El comprador'} emitio la orden comercial para ${request.title}.`;

    if (request.awardedQuote?.supplierCompanyId) {
      await this.notificationsService.createForCompany({
        companyId: request.awardedQuote.supplierCompanyId,
        roles: [MembershipRole.SUPPLIER],
        excludeUserId: user.userId,
        type: notificationType,
        title: notificationTitle,
        detail: notificationDetail,
        href: `/dashboard/proveedor/cotizaciones/${request.awardedQuote.id}`,
        metadata: {
          requestId: id,
          quoteId: request.awardedQuote.id,
        },
      });
    }

    return updatedRequest;
  }

  async upsertOrder(user: AuthUser, id: string, dto: UpsertOrderDto, activeCompanyId?: string) {
    const buyerCompanyId = this.getCompanyIdForRole(user, MembershipRole.BUYER, activeCompanyId);
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

    const updatedRequest = await this.prisma.request.findUnique({
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

    const awardedQuote = await this.prisma.quote.findUnique({
      where: { id: request.awardedQuoteId ?? '' },
      select: {
        id: true,
        supplierCompanyId: true,
      },
    });

    if (awardedQuote?.supplierCompanyId) {
      await this.notificationsService.createForCompany({
        companyId: awardedQuote.supplierCompanyId,
        roles: [MembershipRole.SUPPLIER],
        excludeUserId: user.userId,
        type: NotificationType.ORDER_UPDATED,
        title: 'Orden actualizada',
        detail: `${buyerCompanyName ?? 'El comprador'} actualizo la orden de ${request.title}.`,
        href: `/dashboard/proveedor/cotizaciones/${awardedQuote.id}`,
        metadata: {
          requestId: id,
          quoteId: awardedQuote.id,
        },
      });
    }

    return updatedRequest;
  }

  async updateFulfillment(user: AuthUser, id: string, action: FulfillmentAction, activeCompanyId?: string) {
    const supplierCompanyId = this.getCompanyIdForRole(user, MembershipRole.SUPPLIER, activeCompanyId);
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

    const updatedRequest = await this.prisma.request.findUnique({
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

    await this.notificationsService.createForCompany({
      companyId: request.buyerCompanyId,
      roles: [MembershipRole.BUYER],
      excludeUserId: user.userId,
      type: NotificationType.FULFILLMENT_UPDATED,
      title: transition.title,
      detail: `${supplierCompanyName ?? 'El proveedor adjudicado'} actualizo el estado operativo de ${request.title}.`,
      href: `/dashboard/comprador/solicitudes/${id}`,
      metadata: {
        requestId: id,
        supplierCompanyId,
        fulfillmentStatus: transition.nextStatus,
      },
    });

    return updatedRequest;
  }

  async findOne(user: AuthUser, id: string, activeCompanyId?: string) {
    const request = await this.prisma.request.findUnique({
      where: { id },
      include: {
        items: { orderBy: { position: 'asc' } },
        awardedQuote: {
          include: {
            supplierCompany: true,
            items: true,
          },
        },
        order: true,
        buyerCompany: true,
        quotes: {
          include: {
            supplierCompany: true,
            items: true,
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

    if (this.isAdmin(user) || request.buyerCompanyId === this.getOptionalCompanyId(user, MembershipRole.BUYER, activeCompanyId)) {
      return request;
    }

    const supplierCompanyId = this.getOptionalCompanyId(user, MembershipRole.SUPPLIER, activeCompanyId);
    if (!supplierCompanyId) {
      throw new ForbiddenException('No tenes acceso a este pedido.');
    }

    if (request.privateRequest) {
      const supplierCompanyName = await this.getCompanyNameById(supplierCompanyId);
      if (!this.matchesPreferredSupplier(request.preferredSupplierName, supplierCompanyName)) {
        throw new ForbiddenException('El pedido es privado y no esta disponible para este proveedor.');
      }
    }

    return {
      ...request,
      quotes: request.quotes.filter((quote) => quote.supplierCompanyId === supplierCompanyId),
    };
  }

  async findQuotes(user: AuthUser, id: string, activeCompanyId?: string) {
    const buyerCompanyId = this.getCompanyIdForRole(user, MembershipRole.BUYER, activeCompanyId);

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
        items: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  private getCompanyIdForRole(user: AuthUser, role: MembershipRole, activeCompanyId?: string) {
    return resolveCompanyId(user, role, activeCompanyId);
  }

  private getOptionalCompanyId(user: AuthUser, role: MembershipRole, activeCompanyId?: string) {
    return resolveOptionalCompanyId(user, role, activeCompanyId);
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
