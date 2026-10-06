import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CommissionStatus } from '@prisma/client';
import { AuthUser } from '../auth/auth-user.interface';
import { roundMoney } from '../billing/billing.util';
import { isPlatformAdmin } from '../common/workspace.util';
import { PrismaService } from '../prisma/prisma.service';

type CompanyAggregate = {
  companyId: string;
  name: string;
  legalName: string | null;
  taxId: string | null;
  operationsCount: number;
  salesVolume: number; // suma de baseAmount (monto de las ventas)
  commissionTotal: number; // comisión generada para ATAR
  currency: string; // código, o 'MIXED' si hay varias monedas
};

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  private assertAdmin(user: AuthUser) {
    if (!isPlatformAdmin(user)) {
      throw new ForbiddenException('Solo un administrador de ATAR puede acceder a esta sección.');
    }
  }

  /** Comisiones que "cuentan" para los rankings (todas menos las anuladas). */
  private get rankableWhere() {
    return { status: { not: CommissionStatus.VOID } };
  }

  private trackCurrency(current: string | null, next: string): string {
    if (current === null) {
      return next;
    }
    return current === next ? current : 'MIXED';
  }

  /** Ranking de empresas proveedoras por comisión generada (de mayor a menor). */
  async supplierRanking(user: AuthUser) {
    this.assertAdmin(user);
    const commissions = await this.prisma.billingCommission.findMany({
      where: this.rankableWhere,
      include: { company: { select: { id: true, name: true, legalName: true, taxId: true } } },
    });

    const byCompany = new Map<string, CompanyAggregate & { _currency: string | null }>();
    for (const commission of commissions) {
      const entry =
        byCompany.get(commission.companyId) ??
        {
          companyId: commission.companyId,
          name: commission.company.name,
          legalName: commission.company.legalName,
          taxId: commission.company.taxId,
          operationsCount: 0,
          salesVolume: 0,
          commissionTotal: 0,
          currency: 'ARS',
          _currency: null,
        };
      entry.operationsCount += 1;
      entry.salesVolume = roundMoney(entry.salesVolume + commission.baseAmount);
      entry.commissionTotal = roundMoney(entry.commissionTotal + commission.commissionAmount);
      entry._currency = this.trackCurrency(entry._currency, commission.currency);
      byCompany.set(commission.companyId, entry);
    }

    return [...byCompany.values()]
      .map(({ _currency, ...rest }) => ({ ...rest, currency: _currency ?? 'ARS' }))
      .sort((a, b) => b.commissionTotal - a.commissionTotal);
  }

  /** Ranking de empresas compradoras por volumen de compra (de mayor a menor). */
  async buyerRanking(user: AuthUser) {
    this.assertAdmin(user);
    const commissions = await this.prisma.billingCommission.findMany({
      where: this.rankableWhere,
      include: {
        request: {
          select: {
            buyerCompany: { select: { id: true, name: true, legalName: true, taxId: true } },
          },
        },
      },
    });

    const byCompany = new Map<string, CompanyAggregate & { _currency: string | null }>();
    for (const commission of commissions) {
      const buyer = commission.request.buyerCompany;
      const entry =
        byCompany.get(buyer.id) ??
        {
          companyId: buyer.id,
          name: buyer.name,
          legalName: buyer.legalName,
          taxId: buyer.taxId,
          operationsCount: 0,
          salesVolume: 0,
          commissionTotal: 0,
          currency: 'ARS',
          _currency: null,
        };
      entry.operationsCount += 1;
      entry.salesVolume = roundMoney(entry.salesVolume + commission.baseAmount);
      entry.commissionTotal = roundMoney(entry.commissionTotal + commission.commissionAmount);
      entry._currency = this.trackCurrency(entry._currency, commission.currency);
      byCompany.set(buyer.id, entry);
    }

    return [...byCompany.values()]
      .map(({ _currency, ...rest }) => ({ ...rest, currency: _currency ?? 'ARS' }))
      .sort((a, b) => b.salesVolume - a.salesVolume);
  }

  /** Detalle de una proveedora: datos + sus transacciones (operaciones cerradas). */
  async supplierDetail(user: AuthUser, companyId: string) {
    this.assertAdmin(user);
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true, legalName: true, taxId: true, city: true, country: true },
    });
    if (!company) {
      throw new NotFoundException('Empresa no encontrada.');
    }

    const commissions = await this.prisma.billingCommission.findMany({
      where: { companyId, ...this.rankableWhere },
      include: {
        request: {
          select: {
            id: true,
            title: true,
            buyerCompany: { select: { id: true, name: true } },
            items: { select: { productName: true }, orderBy: { position: 'asc' } },
          },
        },
        quote: { select: { amount: true } },
        settlement: { select: { documentNumber: true } },
      },
      orderBy: { generatedAt: 'desc' },
    });

    const transactions = commissions.map((commission) => ({
      requestId: commission.requestId,
      title: commission.request.title,
      counterpartyName: commission.request.buyerCompany.name,
      products: commission.request.items.map((item) => item.productName),
      saleAmount: commission.quote.amount ?? commission.baseAmount,
      commissionAmount: commission.commissionAmount,
      currency: commission.currency,
      commissionStatus: commission.status,
      settlementNumber: commission.settlement?.documentNumber ?? null,
      date: commission.generatedAt,
    }));

    return {
      company,
      totals: {
        operationsCount: transactions.length,
        salesVolume: roundMoney(transactions.reduce((sum, t) => sum + t.saleAmount, 0)),
        commissionTotal: roundMoney(transactions.reduce((sum, t) => sum + t.commissionAmount, 0)),
      },
      transactions,
    };
  }

  /** Detalle de una compradora: datos + sus operaciones (con qué proveedor). */
  async buyerDetail(user: AuthUser, companyId: string) {
    this.assertAdmin(user);
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true, legalName: true, taxId: true, city: true, country: true },
    });
    if (!company) {
      throw new NotFoundException('Empresa no encontrada.');
    }

    const commissions = await this.prisma.billingCommission.findMany({
      where: { request: { buyerCompanyId: companyId }, ...this.rankableWhere },
      include: {
        company: { select: { id: true, name: true } }, // proveedor (payer)
        request: {
          select: {
            id: true,
            title: true,
            items: { select: { productName: true }, orderBy: { position: 'asc' } },
          },
        },
        quote: { select: { amount: true } },
      },
      orderBy: { generatedAt: 'desc' },
    });

    const transactions = commissions.map((commission) => ({
      requestId: commission.requestId,
      title: commission.request.title,
      counterpartyName: commission.company.name, // el proveedor
      products: commission.request.items.map((item) => item.productName),
      saleAmount: commission.quote.amount ?? commission.baseAmount,
      commissionAmount: commission.commissionAmount,
      currency: commission.currency,
      commissionStatus: commission.status,
      date: commission.generatedAt,
    }));

    return {
      company,
      totals: {
        operationsCount: transactions.length,
        salesVolume: roundMoney(transactions.reduce((sum, t) => sum + t.saleAmount, 0)),
        commissionTotal: roundMoney(transactions.reduce((sum, t) => sum + t.commissionAmount, 0)),
      },
      transactions,
    };
  }
}
