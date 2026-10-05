import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BillingPaymentMethod,
  BillingPaymentStatus,
  CommissionStatus,
  SettlementStatus,
} from '@prisma/client';
import { AuthUser } from '../auth/auth-user.interface';
import { isPlatformAdmin } from '../common/workspace.util';
import { PrismaService } from '../prisma/prisma.service';
import { roundMoney } from './billing.util';
import { ManualTransferProvider } from './payments/payment-provider';

@Injectable()
export class BillingPaymentsService {
  private readonly manualProvider = new ManualTransferProvider();

  constructor(private readonly prisma: PrismaService) {}

  private companyIdsOf(user: AuthUser): string[] {
    return [...new Set(user.memberships.map((m) => m.companyId))];
  }

  private assertAdmin(user: AuthUser) {
    if (!isPlatformAdmin(user)) {
      throw new ForbiddenException('Solo un administrador de ATAR puede validar pagos.');
    }
  }

  // ---------- Empresa (solo lo suyo) ----------

  /** Liquidaciones de las empresas del usuario (ya emitidas; sin borradores). */
  async listMine(user: AuthUser) {
    const companyIds = this.companyIdsOf(user);
    if (companyIds.length === 0) {
      return [];
    }
    return this.prisma.billingSettlement.findMany({
      where: {
        companyId: { in: companyIds },
        status: { not: SettlementStatus.DRAFT },
      },
      include: {
        period: { select: { code: true } },
        payments: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Detalle trazable de una liquidación propia (operación → comisión → total). */
  async getMine(user: AuthUser, settlementId: string) {
    const settlement = await this.prisma.billingSettlement.findUnique({
      where: { id: settlementId },
      include: {
        period: { select: { code: true } },
        company: { select: { id: true, name: true, legalName: true, taxId: true } },
        commissions: {
          include: { request: { select: { id: true, title: true } } },
          orderBy: { generatedAt: 'asc' },
        },
        adjustments: true,
        payments: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!settlement) {
      throw new NotFoundException('Liquidación no encontrada.');
    }
    const allowed = isPlatformAdmin(user) || this.companyIdsOf(user).includes(settlement.companyId);
    if (!allowed) {
      throw new ForbiddenException('No tenés acceso a esta liquidación.');
    }
    if (settlement.status === SettlementStatus.DRAFT && !isPlatformAdmin(user)) {
      throw new ForbiddenException('Esta liquidación todavía no fue emitida.');
    }
    return settlement;
  }

  /**
   * La empresa registra un pago (transferencia manual). Queda PENDING hasta la
   * validación de un administrador de ATAR: nunca se marca pagado por el cliente.
   */
  async registerManualPayment(
    user: AuthUser,
    settlementId: string,
    input: { amount: number; receiptUrl?: string; note?: string },
  ) {
    const settlement = await this.prisma.billingSettlement.findUnique({
      where: { id: settlementId },
      include: { period: { select: { code: true } } },
    });
    if (!settlement) {
      throw new NotFoundException('Liquidación no encontrada.');
    }
    if (!this.companyIdsOf(user).includes(settlement.companyId)) {
      throw new ForbiddenException('No podés pagar una liquidación de otra empresa.');
    }
    const payable: SettlementStatus[] = [
      SettlementStatus.ISSUED,
      SettlementStatus.PARTIALLY_PAID,
      SettlementStatus.OVERDUE,
    ];
    if (!payable.includes(settlement.status)) {
      throw new BadRequestException('Esta liquidación no admite pagos en su estado actual.');
    }
    const amount = roundMoney(input.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('El importe del pago debe ser mayor a 0.');
    }

    const charge = await this.manualProvider.createCharge({
      settlementId,
      periodCode: settlement.period.code,
      companyId: settlement.companyId,
      amount,
      currency: settlement.currency,
    });

    return this.prisma.billingPayment.create({
      data: {
        settlementId,
        method: BillingPaymentMethod.MANUAL_TRANSFER,
        status: BillingPaymentStatus.PENDING,
        amount,
        currency: settlement.currency,
        externalReference: charge.externalReference,
        receiptUrl: input.receiptUrl?.trim() || null,
        registeredByUserId: user.userId,
        metadata: input.note?.trim() ? { note: input.note.trim() } : undefined,
      },
    });
  }

  // ---------- Admin ----------

  /** Pagos a validar (o filtrados por estado). */
  async listPayments(user: AuthUser, status?: BillingPaymentStatus) {
    this.assertAdmin(user);
    return this.prisma.billingPayment.findMany({
      where: status ? { status } : {},
      include: {
        settlement: {
          select: { id: true, documentNumber: true, companyId: true, grandTotal: true, currency: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** El admin confirma el pago (fuente server-side). Recalcula el estado. */
  async confirmPayment(user: AuthUser, paymentId: string) {
    this.assertAdmin(user);
    const payment = await this.prisma.billingPayment.findUnique({ where: { id: paymentId } });
    if (!payment) {
      throw new NotFoundException('Pago no encontrado.');
    }
    if (payment.status === BillingPaymentStatus.CONFIRMED) {
      return payment; // idempotente
    }
    if (payment.status === BillingPaymentStatus.REJECTED) {
      throw new BadRequestException('El pago fue rechazado; no se puede confirmar.');
    }

    const now = new Date();
    const confirmed = await this.prisma.billingPayment.update({
      where: { id: paymentId },
      data: {
        status: BillingPaymentStatus.CONFIRMED,
        confirmedByUserId: user.userId,
        confirmedAt: now,
        paidAt: payment.paidAt ?? now,
      },
    });

    await this.recomputeSettlementPaymentStatus(payment.settlementId, user.userId);
    await this.audit(user, 'BILLING_PAYMENT_CONFIRM', 'BillingPayment', paymentId, {
      settlementId: payment.settlementId,
      amount: payment.amount,
    });
    return confirmed;
  }

  /** El admin rechaza un pago pendiente. */
  async rejectPayment(user: AuthUser, paymentId: string, reason: string) {
    this.assertAdmin(user);
    const payment = await this.prisma.billingPayment.findUnique({ where: { id: paymentId } });
    if (!payment) {
      throw new NotFoundException('Pago no encontrado.');
    }
    if (payment.status !== BillingPaymentStatus.PENDING) {
      throw new BadRequestException('Solo se pueden rechazar pagos pendientes.');
    }
    const rejected = await this.prisma.billingPayment.update({
      where: { id: paymentId },
      data: {
        status: BillingPaymentStatus.REJECTED,
        rejectedAt: new Date(),
        metadata: { ...(typeof payment.metadata === 'object' && payment.metadata ? payment.metadata : {}), rejectReason: reason },
      },
    });
    await this.audit(user, 'BILLING_PAYMENT_REJECT', 'BillingPayment', paymentId, { reason });
    return rejected;
  }

  /**
   * Recalcula el estado de cobro de una liquidación a partir de los pagos
   * CONFIRMED: PAID si cubre el total, PARTIALLY_PAID si hay algo, y marca las
   * comisiones como PAID cuando queda saldada.
   */
  private async recomputeSettlementPaymentStatus(settlementId: string, actorUserId: string) {
    const settlement = await this.prisma.billingSettlement.findUnique({ where: { id: settlementId } });
    if (!settlement) {
      return;
    }
    const payments = await this.prisma.billingPayment.findMany({
      where: { settlementId, status: BillingPaymentStatus.CONFIRMED },
      select: { amount: true },
    });
    const paid = roundMoney(payments.reduce((s, p) => s + p.amount, 0));
    const fullyPaid = paid + 0.001 >= settlement.grandTotal && settlement.grandTotal > 0;

    const nextStatus = fullyPaid
      ? SettlementStatus.PAID
      : paid > 0
        ? SettlementStatus.PARTIALLY_PAID
        : settlement.status;

    await this.prisma.billingSettlement.update({
      where: { id: settlementId },
      data: {
        status: nextStatus,
        paidAt: fullyPaid ? (settlement.paidAt ?? new Date()) : settlement.paidAt,
      },
    });

    if (fullyPaid) {
      await this.prisma.billingCommission.updateMany({
        where: { settlementId, status: CommissionStatus.INVOICED },
        data: { status: CommissionStatus.PAID, paidAt: new Date() },
      });
      // Rollup del período: si todas sus liquidaciones están pagadas, pasa a PAID.
      const settlementsLeft = await this.prisma.billingSettlement.count({
        where: { periodId: settlement.periodId, status: { not: SettlementStatus.PAID } },
      });
      if (settlementsLeft === 0) {
        await this.prisma.billingPeriod.update({
          where: { id: settlement.periodId },
          data: { status: 'PAID' },
        });
      }
    }

    await this.audit(
      { userId: actorUserId } as AuthUser,
      'BILLING_SETTLEMENT_PAYMENT_RECOMPUTE',
      'BillingSettlement',
      settlementId,
      { paid, grandTotal: settlement.grandTotal, status: nextStatus },
    );
  }

  private async audit(
    user: AuthUser,
    action: string,
    entity: string,
    entityId: string,
    extra?: Record<string, unknown>,
  ) {
    await this.prisma.billingAuditLog.create({
      data: {
        actorUserId: user.userId ?? null,
        action,
        entity,
        entityId,
        newValue: (extra ?? {}) as object,
      },
    });
  }
}
