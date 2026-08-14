import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  MembershipRole,
  OpportunityStatus,
  OrderFulfillmentStatus,
  QuoteStatus,
  UserStatus,
} from '@prisma/client';
import type { AuthUser } from '../auth/auth-user.interface';
import { assertManager, resolveSupplierWorkspace } from '../common/workspace.util';
import { PrismaService } from '../prisma/prisma.service';

const TEAM_ROLES = [MembershipRole.SELLER, MembershipRole.SUPPLIER, MembershipRole.ADMIN];

const OPEN_STATUSES: OpportunityStatus[] = [
  OpportunityStatus.NEW,
  OpportunityStatus.UNASSIGNED,
  OpportunityStatus.ASSIGNED,
  OpportunityStatus.IN_RESPONSE,
];

const UNASSIGNED_STATUSES: OpportunityStatus[] = [
  OpportunityStatus.NEW,
  OpportunityStatus.UNASSIGNED,
];

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Empresas del usuario con su rol: alimenta el selector "Trabajando como". */
  async listWorkspaces(user: AuthUser) {
    const memberships = await this.prisma.membership.findMany({
      where: { userId: user.userId },
      include: {
        company: {
          select: { id: true, name: true, type: true, country: true, city: true },
        },
      },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });

    const byCompany = new Map<
      string,
      {
        companyId: string;
        company: (typeof memberships)[number]['company'];
        roles: MembershipRole[];
        isPrimary: boolean;
      }
    >();

    for (const membership of memberships) {
      const current = byCompany.get(membership.companyId);
      if (current) {
        current.roles.push(membership.role);
        current.isPrimary = current.isPrimary || membership.isPrimary;
        continue;
      }

      byCompany.set(membership.companyId, {
        companyId: membership.companyId,
        company: membership.company,
        roles: [membership.role],
        isPrimary: membership.isPrimary,
      });
    }

    return Array.from(byCompany.values()).map((item) => {
      const isSeller = item.roles.includes(MembershipRole.SELLER);
      const isManager =
        item.roles.includes(MembershipRole.ADMIN) ||
        item.roles.includes(MembershipRole.SUPPLIER) ||
        item.roles.includes(MembershipRole.BUYER);

      return {
        ...item,
        isSeller,
        isManager,
        canSell: isSeller || item.roles.includes(MembershipRole.SUPPLIER) || item.company.type !== 'BUYER',
        canBuy: item.roles.includes(MembershipRole.BUYER) || item.company.type !== 'SUPPLIER',
      };
    });
  }

  /** Equipo comercial con carga de trabajo y conversion (solo gerente). */
  async team(user: AuthUser, activeCompanyId?: string) {
    const workspace = assertManager(resolveSupplierWorkspace(user, activeCompanyId));

    const memberships = await this.prisma.membership.findMany({
      where: {
        companyId: workspace.companyId,
        role: { in: TEAM_ROLES },
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, status: true } },
      },
    });

    const sellers = new Map<string, (typeof memberships)[number]['user'] & { roles: MembershipRole[] }>();
    for (const membership of memberships) {
      const current = sellers.get(membership.userId);
      if (current) {
        current.roles.push(membership.role);
        continue;
      }

      sellers.set(membership.userId, { ...membership.user, roles: [membership.role] });
    }

    const assignments = await this.prisma.requestAssignment.findMany({
      where: { supplierCompanyId: workspace.companyId },
      select: { sellerUserId: true, status: true },
    });

    const quotes = await this.prisma.quote.findMany({
      where: { supplierCompanyId: workspace.companyId },
      select: {
        amount: true,
        status: true,
        request: {
          select: {
            assignments: {
              where: { supplierCompanyId: workspace.companyId },
              select: { sellerUserId: true },
            },
          },
        },
      },
    });

    return Array.from(sellers.values()).map((seller) => {
      const own = assignments.filter((assignment) => assignment.sellerUserId === seller.id);
      const ownQuotes = quotes.filter(
        (quote) => quote.request.assignments[0]?.sellerUserId === seller.id,
      );
      const assigned = own.length;
      const quotedStatuses: OpportunityStatus[] = [
        OpportunityStatus.QUOTED,
        OpportunityStatus.NEGOTIATING,
        OpportunityStatus.WON,
        OpportunityStatus.LOST,
      ];
      const quoted = own.filter((assignment) => quotedStatuses.includes(assignment.status)).length;
      const won = own.filter((assignment) => assignment.status === OpportunityStatus.WON).length;

      return {
        id: seller.id,
        name: `${seller.firstName} ${seller.lastName}`.trim(),
        email: seller.email,
        status: seller.status,
        roles: seller.roles,
        isManager: seller.roles.some(
          (role) => role === MembershipRole.ADMIN || role === MembershipRole.SUPPLIER,
        ),
        assigned,
        pending: own.filter((assignment) => OPEN_STATUSES.includes(assignment.status)).length,
        quoted,
        won,
        conversionRate: quoted > 0 ? Math.round((won / quoted) * 100) : 0,
        quotedAmount: ownQuotes
          .filter((quote) => quote.status !== QuoteStatus.DRAFT)
          .reduce((total, quote) => total + (quote.amount ?? 0), 0),
        wonAmount: ownQuotes
          .filter((quote) => quote.status === QuoteStatus.AWARDED)
          .reduce((total, quote) => total + (quote.amount ?? 0), 0),
      };
    });
  }

  /**
   * Habilita a un vendedor que se registro pidiendo sumarse a la empresa.
   * Hasta que el gerente lo aprueba queda como INVITED.
   */
  async approveTeamMember(user: AuthUser, memberUserId: string, activeCompanyId?: string) {
    const workspace = assertManager(resolveSupplierWorkspace(user, activeCompanyId));

    const membership = await this.prisma.membership.findFirst({
      where: { userId: memberUserId, companyId: workspace.companyId },
      select: { id: true },
    });

    if (!membership) {
      throw new NotFoundException('Ese usuario no pertenece a tu empresa.');
    }

    await this.prisma.user.update({
      where: { id: memberUserId },
      data: { status: UserStatus.ACTIVE },
    });

    return { userId: memberUserId, status: UserStatus.ACTIVE };
  }

  /** Quita a un vendedor del equipo (no borra el usuario ni su historial). */
  async removeTeamMember(user: AuthUser, memberUserId: string, activeCompanyId?: string) {
    const workspace = assertManager(resolveSupplierWorkspace(user, activeCompanyId));

    if (memberUserId === user.userId) {
      throw new ForbiddenException('No podes quitarte a vos mismo del equipo.');
    }

    const memberships = await this.prisma.membership.findMany({
      where: { userId: memberUserId, companyId: workspace.companyId },
      select: { id: true, role: true },
    });

    if (memberships.length === 0) {
      throw new NotFoundException('Ese usuario no pertenece a tu empresa.');
    }

    await this.prisma.$transaction([
      // Las oportunidades vuelven a la bandeja sin asignar.
      this.prisma.requestAssignment.updateMany({
        where: { supplierCompanyId: workspace.companyId, sellerUserId: memberUserId },
        data: { sellerUserId: null, status: OpportunityStatus.UNASSIGNED, assignedAt: null },
      }),
      this.prisma.membership.deleteMany({
        where: { userId: memberUserId, companyId: workspace.companyId },
      }),
    ]);

    return { userId: memberUserId, removed: true };
  }

  /** Metricas del panel. El vendedor ve solo su cartera. */
  async metrics(user: AuthUser, activeCompanyId?: string) {
    const workspace = resolveSupplierWorkspace(user, activeCompanyId);
    const scope = workspace.isManager ? {} : { sellerUserId: user.userId };

    const assignments = await this.prisma.requestAssignment.findMany({
      where: { supplierCompanyId: workspace.companyId, ...scope },
      select: { status: true, sellerUserId: true, requestId: true },
    });

    const requestIds = assignments.map((assignment) => assignment.requestId);
    const quotes = await this.prisma.quote.findMany({
      where: {
        supplierCompanyId: workspace.companyId,
        ...(workspace.isManager ? {} : { requestId: { in: requestIds } }),
      },
      select: { amount: true, status: true },
    });

    const submitted = quotes.filter((quote) => quote.status !== QuoteStatus.DRAFT);
    const awarded = quotes.filter((quote) => quote.status === QuoteStatus.AWARDED);

    return {
      companyId: workspace.companyId,
      scope: workspace.isManager ? ('company' as const) : ('seller' as const),
      received: assignments.length,
      unassigned: assignments.filter(
        (assignment) =>
          !assignment.sellerUserId &&
          UNASSIGNED_STATUSES.includes(assignment.status),
      ).length,
      assigned: assignments.filter((assignment) => Boolean(assignment.sellerUserId)).length,
      inResponse: assignments.filter(
        (assignment) => assignment.status === OpportunityStatus.IN_RESPONSE,
      ).length,
      quoted: assignments.filter((assignment) => assignment.status === OpportunityStatus.QUOTED)
        .length,
      negotiating: assignments.filter(
        (assignment) => assignment.status === OpportunityStatus.NEGOTIATING,
      ).length,
      won: assignments.filter((assignment) => assignment.status === OpportunityStatus.WON).length,
      lost: assignments.filter((assignment) => assignment.status === OpportunityStatus.LOST).length,
      quotesSent: submitted.length,
      quotesAwarded: awarded.length,
      quotedAmount: submitted.reduce((total, quote) => total + (quote.amount ?? 0), 0),
      soldAmount: awarded.reduce((total, quote) => total + (quote.amount ?? 0), 0),
    };
  }

  /** Historial comercial: clientes de la empresa proveedora (base del CRM). */
  async customers(user: AuthUser, activeCompanyId?: string) {
    const workspace = resolveSupplierWorkspace(user, activeCompanyId);

    const quotes = await this.prisma.quote.findMany({
      where: {
        supplierCompanyId: workspace.companyId,
        ...(workspace.isManager
          ? {}
          : {
              request: {
                assignments: {
                  some: {
                    supplierCompanyId: workspace.companyId,
                    sellerUserId: user.userId,
                  },
                },
              },
            }),
      },
      include: {
        request: {
          include: {
            buyerCompany: true,
            order: true,
            assignments: {
              where: { supplierCompanyId: workspace.companyId },
              include: {
                seller: { select: { id: true, firstName: true, lastName: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const byBuyer = new Map<string, ReturnType<typeof this.emptyCustomer>>();

    for (const quote of quotes) {
      const buyer = quote.request.buyerCompany;
      if (!buyer) {
        continue;
      }

      const entry = byBuyer.get(buyer.id) ?? this.emptyCustomer(buyer);
      const assignment = quote.request.assignments[0];
      const isWon = quote.status === QuoteStatus.AWARDED;

      entry.quotesCount += 1;
      entry.quotedAmount += quote.amount ?? 0;
      entry.requestIds.add(quote.requestId);

      if (isWon) {
        entry.ordersCount += 1;
        entry.purchasedAmount += quote.amount ?? 0;
        entry.purchasedUnits += quote.request.quantityRequested ?? 0;

        const orderDate = quote.request.order?.issuedAt ?? quote.updatedAt;
        if (!entry.lastPurchaseAt || orderDate > entry.lastPurchaseAt) {
          entry.lastPurchaseAt = orderDate;
          entry.lastProduct = quote.request.productName ?? quote.request.title;
        }
      }

      if (!entry.lastQuoteAt || quote.createdAt > entry.lastQuoteAt) {
        entry.lastQuoteAt = quote.createdAt;
        entry.lastQuotedProduct = quote.request.productName ?? quote.request.title;
      }

      if (assignment?.seller && !entry.sellers.some((item) => item.id === assignment.seller!.id)) {
        entry.sellers.push({
          id: assignment.seller.id,
          name: `${assignment.seller.firstName} ${assignment.seller.lastName}`.trim(),
        });
      }

      byBuyer.set(buyer.id, entry);
    }

    return Array.from(byBuyer.values())
      .map((entry) => ({
        ...entry,
        requestsCount: entry.requestIds.size,
        requestIds: undefined,
        daysSinceLastPurchase: entry.lastPurchaseAt
          ? Math.floor((Date.now() - entry.lastPurchaseAt.getTime()) / 86400000)
          : null,
        daysSinceLastQuote: entry.lastQuoteAt
          ? Math.floor((Date.now() - entry.lastQuoteAt.getTime()) / 86400000)
          : null,
      }))
      .sort((left, right) => right.purchasedAmount - left.purchasedAmount);
  }

  private emptyCustomer(buyer: { id: string; name: string; country: string; city: string | null }) {
    return {
      companyId: buyer.id,
      name: buyer.name,
      location: [buyer.city, buyer.country].filter(Boolean).join(', '),
      quotesCount: 0,
      ordersCount: 0,
      quotedAmount: 0,
      purchasedAmount: 0,
      purchasedUnits: 0,
      lastPurchaseAt: null as Date | null,
      lastQuoteAt: null as Date | null,
      lastProduct: null as string | null,
      lastQuotedProduct: null as string | null,
      sellers: [] as { id: string; name: string }[],
      requestIds: new Set<string>(),
    };
  }

  /** Ficha completa de un cliente: solicitudes, cotizaciones y pedidos. */
  async customerDetail(user: AuthUser, buyerCompanyId: string, activeCompanyId?: string) {
    const workspace = resolveSupplierWorkspace(user, activeCompanyId);

    const buyer = await this.prisma.company.findUnique({
      where: { id: buyerCompanyId },
      select: { id: true, name: true, country: true, city: true, type: true },
    });

    if (!buyer) {
      throw new NotFoundException('Cliente no encontrado.');
    }

    const quotes = await this.prisma.quote.findMany({
      where: {
        supplierCompanyId: workspace.companyId,
        request: { buyerCompanyId },
      },
      include: {
        request: {
          include: {
            order: true,
            assignments: {
              where: { supplierCompanyId: workspace.companyId },
              include: { seller: { select: { id: true, firstName: true, lastName: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!workspace.isManager) {
      const ownsSomething = quotes.some(
        (quote) => quote.request.assignments[0]?.sellerUserId === user.userId,
      );

      if (!ownsSomething) {
        throw new ForbiddenException('Este cliente no esta en tu cartera.');
      }
    }

    return {
      company: buyer,
      quotes: quotes.map((quote) => ({
        id: quote.id,
        amount: quote.amount,
        currency: quote.currency,
        status: quote.status,
        createdAt: quote.createdAt,
        requestId: quote.requestId,
        requestTitle: quote.request.productName ?? quote.request.title,
        category: quote.request.category,
        quantity: quote.request.quantityRequested,
        order: quote.request.order,
        seller: quote.request.assignments[0]?.seller
          ? {
              id: quote.request.assignments[0].seller!.id,
              name: `${quote.request.assignments[0].seller!.firstName} ${quote.request.assignments[0].seller!.lastName}`.trim(),
            }
          : null,
      })),
    };
  }

  /**
   * Base para las automatizaciones comerciales: detecta recompras probables y
   * cotizaciones sin cierre. Por ahora se calcula on demand; mas adelante lo
   * puede consumir un job que dispare avisos.
   */
  async opportunities(user: AuthUser, activeCompanyId?: string) {
    const workspace = resolveSupplierWorkspace(user, activeCompanyId);
    const customers = await this.customers(user, activeCompanyId);

    const repurchase = customers
      .filter(
        (customer) =>
          customer.ordersCount > 0 &&
          typeof customer.daysSinceLastPurchase === 'number' &&
          customer.daysSinceLastPurchase >= 45,
      )
      .map((customer) => ({
        type: 'REPURCHASE' as const,
        companyId: customer.companyId,
        companyName: customer.name,
        product: customer.lastProduct,
        days: customer.daysSinceLastPurchase,
        units: customer.purchasedUnits,
        amount: customer.purchasedAmount,
        seller: customer.sellers[0] ?? null,
      }));

    const followUp = customers
      .filter(
        (customer) =>
          customer.ordersCount === 0 &&
          typeof customer.daysSinceLastQuote === 'number' &&
          customer.daysSinceLastQuote >= 15,
      )
      .map((customer) => ({
        type: 'FOLLOW_UP' as const,
        companyId: customer.companyId,
        companyName: customer.name,
        product: customer.lastQuotedProduct,
        days: customer.daysSinceLastQuote,
        units: 0,
        amount: customer.quotedAmount,
        seller: customer.sellers[0] ?? null,
      }));

    const deliveries = await this.prisma.quote.findMany({
      where: {
        supplierCompanyId: workspace.companyId,
        status: QuoteStatus.AWARDED,
        request: {
          order: { fulfillmentStatus: OrderFulfillmentStatus.DELIVERED },
        },
      },
      include: {
        request: { include: { buyerCompany: true, order: true } },
      },
      take: 10,
      orderBy: { updatedAt: 'desc' },
    });

    const afterSales = deliveries.map((quote) => ({
      type: 'AFTER_SALES' as const,
      companyId: quote.request.buyerCompanyId,
      companyName: quote.request.buyerCompany?.name ?? 'Cliente',
      product: quote.request.productName ?? quote.request.title,
      days: Math.floor((Date.now() - new Date(quote.updatedAt).getTime()) / 86400000),
      units: quote.request.quantityRequested ?? 0,
      amount: quote.amount ?? 0,
      seller: null,
    }));

    return [...repurchase, ...followUp, ...afterSales].sort(
      (left, right) => (right.days ?? 0) - (left.days ?? 0),
    );
  }
}
