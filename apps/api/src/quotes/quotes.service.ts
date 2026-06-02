import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MembershipRole,
  QuoteStatus,
  RequestEventType,
  RequestStatus,
} from '@prisma/client';
import { AuthUser } from '../auth/auth-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuoteDto } from './dto/create-quote.dto';

@Injectable()
export class QuotesService {
  constructor(private readonly prisma: PrismaService) {}

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

  private getCompanyIdForRole(user: AuthUser, role: MembershipRole) {
    const membership = user.memberships.find((item) => item.role === role);
    if (!membership) {
      throw new ForbiddenException(`La operacion requiere rol ${role}.`);
    }

    return membership.companyId;
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
}
