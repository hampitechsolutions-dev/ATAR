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
  QuoteStatus,
  RequestEventType,
  RequestStatus,
} from '@prisma/client';
import { AuthUser } from '../auth/auth-user.interface';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuoteDto } from './dto/create-quote.dto';

@Injectable()
export class QuotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(user: AuthUser, requestId: string, dto: CreateQuoteDto) {
    const supplierCompanyId = this.getCompanyIdForRole(user, MembershipRole.SUPPLIER);
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
      throw new ForbiddenException('El pedido es privado y no admite cotizacion abierta.');
    }

    const existingQuote = await this.prisma.quote.findFirst({
      where: {
        requestId,
        supplierCompanyId,
      },
    });

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
            amount: dto.amount,
            currency: dto.currency ?? existingQuote.currency,
            leadTimeDays: dto.leadTimeDays,
            paymentTerms: dto.paymentTerms,
            technicalComment: dto.technicalComment,
            status: QuoteStatus.SUBMITTED,
          },
          include: {
            supplierCompany: true,
            request: true,
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
          amount: dto.amount,
          currency: dto.currency ?? 'ARS',
          leadTimeDays: dto.leadTimeDays,
          paymentTerms: dto.paymentTerms,
          technicalComment: dto.technicalComment,
          status: QuoteStatus.SUBMITTED,
        },
        include: {
          supplierCompany: true,
          request: true,
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

    return createdQuote;
  }

  async findMine(user: AuthUser) {
    const supplierCompanyId = this.getCompanyIdForRole(user, MembershipRole.SUPPLIER);

    return this.prisma.quote.findMany({
      where: {
        supplierCompanyId,
      },
      include: {
        request: {
          include: {
            buyerCompany: true,
            order: true,
          },
        },
        supplierCompany: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findBuyerMine(user: AuthUser) {
    const buyerCompanyId = this.getCompanyIdForRole(user, MembershipRole.BUYER);

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
          },
        },
        supplierCompany: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async findOne(user: AuthUser, id: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: {
        supplierCompany: true,
        request: {
          include: {
            buyerCompany: true,
            order: true,
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

    const buyerCompanyId = this.getOptionalCompanyId(user, MembershipRole.BUYER);
    if (buyerCompanyId && quote.request.buyerCompanyId === buyerCompanyId) {
      return quote;
    }

    const supplierCompanyId = this.getOptionalCompanyId(user, MembershipRole.SUPPLIER);
    if (supplierCompanyId && quote.supplierCompanyId === supplierCompanyId) {
      return quote;
    }

    throw new ForbiddenException('No tenes acceso a esta cotizacion.');
  }

  private getCompanyIdForRole(user: AuthUser, role: MembershipRole) {
    const membership = user.memberships.find((item) => item.role === role);
    if (membership) {
      return membership.companyId;
    }

    // Una empresa HYBRID compra y vende: su membresía sirve para cualquier rol.
    const hybridMembership = user.memberships.find((item) => item.companyType === CompanyType.HYBRID);
    if (hybridMembership) {
      return hybridMembership.companyId;
    }

    throw new ForbiddenException(`La operacion requiere rol ${role}.`);
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

  private getOptionalCompanyId(user: AuthUser, role: MembershipRole) {
    return user.memberships.find((item) => item.role === role)?.companyId;
  }

  private isAdmin(user: AuthUser) {
    return user.memberships.some((item) => item.role === MembershipRole.ADMIN);
  }
}
