import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import {
  BillingPaymentStatus,
  CommissionStatus,
  Prisma,
  SettlementStatus,
} from '@prisma/client';
import { AuthUser } from '../auth/auth-user.interface';
import { isPlatformAdmin } from '../common/workspace.util';
import { PrismaService } from '../prisma/prisma.service';
import { roundMoney } from './billing.util';

// Estados de liquidación que ya están facturados (emitidos), es decir cuentan
// para los KPIs de cobranza. DRAFT (no emitida) y VOID (anulada) quedan afuera.
const BILLED_STATUSES: SettlementStatus[] = [
  SettlementStatus.ISSUED,
  SettlementStatus.PARTIALLY_PAID,
  SettlementStatus.PAID,
  SettlementStatus.OVERDUE,
];

type CurrencyTotals = {
  currency: string;
  billed: number; // facturado (grandTotal de liquidaciones emitidas)
  collected: number; // cobrado (pagos confirmados)
  pending: number; // saldo pendiente (facturado - cobrado, sin las PAID)
  overdue: number; // saldo pendiente de las vencidas
  settlements: number;
};

@Injectable()
export class BillingReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private assertAdmin(user: AuthUser) {
    if (!isPlatformAdmin(user)) {
      throw new ForbiddenException(
        'Solo un administrador de ATAR puede ver los reportes de facturación.',
      );
    }
  }

  /** KPIs de cobranza agrupados por moneda (facturado / cobrado / pendiente / vencido). */
  async overview(user: AuthUser) {
    this.assertAdmin(user);

    const settlements = await this.prisma.billingSettlement.findMany({
      where: { status: { in: BILLED_STATUSES } },
      include: {
        payments: {
          where: { status: BillingPaymentStatus.CONFIRMED },
          select: { amount: true },
        },
      },
    });

    const byCurrency = new Map<string, CurrencyTotals>();
    for (const settlement of settlements) {
      const entry = byCurrency.get(settlement.currency) ?? {
        currency: settlement.currency,
        billed: 0,
        collected: 0,
        pending: 0,
        overdue: 0,
        settlements: 0,
      };

      const collected = settlement.payments.reduce(
        (sum, payment) => sum + payment.amount,
        0,
      );
      const outstanding = Math.max(0, settlement.grandTotal - collected);

      entry.billed = roundMoney(entry.billed + settlement.grandTotal);
      entry.collected = roundMoney(entry.collected + collected);
      entry.pending = roundMoney(entry.pending + outstanding);
      if (settlement.status === SettlementStatus.OVERDUE) {
        entry.overdue = roundMoney(entry.overdue + outstanding);
      }
      entry.settlements += 1;
      byCurrency.set(settlement.currency, entry);
    }

    // Pagos pendientes de validación (no entran en "cobrado" hasta confirmarse).
    const pendingPayments = await this.prisma.billingPayment.count({
      where: { status: BillingPaymentStatus.PENDING },
    });

    return {
      currencies: [...byCurrency.values()].sort((a, b) =>
        a.currency.localeCompare(b.currency),
      ),
      pendingPaymentsToValidate: pendingPayments,
    };
  }

  /** Listado de liquidaciones para la vista admin (filtros opcionales). */
  async listSettlements(
    user: AuthUser,
    filters: { period?: string; status?: SettlementStatus; companyId?: string },
  ) {
    this.assertAdmin(user);
    const where: Prisma.BillingSettlementWhereInput = {};
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.companyId) {
      where.companyId = filters.companyId;
    }
    if (filters.period) {
      where.period = { code: filters.period };
    }

    return this.prisma.billingSettlement.findMany({
      where,
      include: {
        period: { select: { code: true } },
        company: {
          select: { id: true, name: true, legalName: true, taxId: true },
        },
        payments: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  /**
   * Reconciliación de un período: cruza lo esperado (comisiones), lo liquidado
   * y lo cobrado, y marca descuadres. Sirve para auditar antes de cerrar.
   */
  async reconciliation(user: AuthUser, code: string) {
    this.assertAdmin(user);
    const period = await this.prisma.billingPeriod.findUnique({
      where: { code },
    });
    if (!period) {
      throw new BadRequestException(
        'El período no existe o no fue generado todavía.',
      );
    }

    const commissions = await this.prisma.billingCommission.findMany({
      where: { periodId: period.id },
    });
    const settlements = await this.prisma.billingSettlement.findMany({
      where: { periodId: period.id },
      include: {
        payments: {
          where: { status: BillingPaymentStatus.CONFIRMED },
          select: { amount: true },
        },
      },
    });

    // Comisiones confirmadas del período que quedaron sin liquidar (debería ser 0).
    const confirmedUnsettled = commissions.filter(
      (commission) =>
        commission.status === CommissionStatus.CONFIRMED &&
        !commission.settlementId,
    );

    // Liquidaciones donde grandTotal != comisión + ajustes (descuadre contable).
    const mismatched = settlements
      .map((settlement) => ({
        documentNumber: settlement.documentNumber,
        grandTotal: settlement.grandTotal,
        expected: roundMoney(
          settlement.commissionTotal + settlement.adjustmentsTotal,
        ),
      }))
      .filter((row) => Math.abs(row.grandTotal - row.expected) > 0.009);

    const commissionTotal = roundMoney(
      commissions.reduce((sum, c) => sum + c.commissionAmount, 0),
    );
    const settledTotal = roundMoney(
      settlements.reduce((sum, s) => sum + s.grandTotal, 0),
    );
    const collectedTotal = roundMoney(
      settlements.reduce(
        (sum, s) => sum + s.payments.reduce((acc, p) => acc + p.amount, 0),
        0,
      ),
    );

    return {
      period: code,
      periodStatus: period.status,
      commissionCount: commissions.length,
      settlementCount: settlements.length,
      commissionTotal,
      settledTotal,
      collectedTotal,
      balanced: confirmedUnsettled.length === 0 && mismatched.length === 0,
      issues: {
        confirmedUnsettled: confirmedUnsettled.map((c) => ({
          commissionId: c.id,
          requestId: c.requestId,
          amount: c.commissionAmount,
        })),
        mismatchedSettlements: mismatched,
      },
    };
  }

  /** CSV de liquidaciones (una fila por liquidación). */
  async settlementsCsv(user: AuthUser, period?: string) {
    this.assertAdmin(user);
    const settlements = await this.listSettlements(user, { period });
    const header = [
      'documento',
      'periodo',
      'empresa',
      'cuit',
      'moneda',
      'estado',
      'operaciones',
      'base',
      'comision',
      'ajustes',
      'total',
      'cobrado',
      'saldo',
      'emitida',
      'vencimiento',
    ];
    const rows = settlements.map((settlement) => {
      const collected = settlement.payments
        .filter((payment) => payment.status === BillingPaymentStatus.CONFIRMED)
        .reduce((sum, payment) => sum + payment.amount, 0);
      return [
        settlement.documentNumber,
        settlement.period?.code ?? '',
        settlement.company?.legalName ?? settlement.company?.name ?? '',
        settlement.company?.taxId ?? '',
        settlement.currency,
        settlement.status,
        settlement.operationsCount,
        settlement.baseTotal,
        settlement.commissionTotal,
        settlement.adjustmentsTotal,
        settlement.grandTotal,
        roundMoney(collected),
        roundMoney(Math.max(0, settlement.grandTotal - collected)),
        settlement.issuedAt
          ? settlement.issuedAt.toISOString().slice(0, 10)
          : '',
        settlement.dueAt ? settlement.dueAt.toISOString().slice(0, 10) : '',
      ];
    });
    return toCsv(header, rows);
  }

  /** CSV de comisiones (una fila por operación comisionable). */
  async commissionsCsv(user: AuthUser, period?: string) {
    this.assertAdmin(user);
    const commissions = await this.prisma.billingCommission.findMany({
      where: period ? { period: { code: period } } : {},
      include: {
        company: { select: { name: true } },
        settlement: { select: { documentNumber: true } },
      },
      orderBy: { generatedAt: 'asc' },
    });
    const header = [
      'comisionId',
      'operacionId',
      'empresa',
      'moneda',
      'estado',
      'base',
      'porcentaje',
      'comision',
      'generada',
      'liquidacion',
    ];
    const rows = commissions.map((commission) => [
      commission.id,
      commission.requestId,
      commission.company?.name ?? '',
      commission.currency,
      commission.status,
      commission.baseAmount,
      commission.ratePercentSnapshot ?? '',
      commission.commissionAmount,
      commission.generatedAt.toISOString().slice(0, 10),
      commission.settlement?.documentNumber ?? '',
    ]);
    return toCsv(header, rows);
  }
}

/** Serializa a CSV escapando comillas/comas/saltos de línea. */
function toCsv(header: string[], rows: (string | number)[][]): string {
  const escape = (value: string | number) => {
    const str = String(value ?? '');
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };
  const lines = [header, ...rows].map((row) => row.map(escape).join(','));
  // BOM para que Excel abra UTF-8 correctamente.
  return `\ufeff${lines.join('\r\n')}`;
}
