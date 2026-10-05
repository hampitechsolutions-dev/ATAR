import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  BillingPayer,
  BillingRule,
  CommissionStatus,
  CommissionType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { computeCommission } from './billing.util';

@Injectable()
export class BillingService implements OnModuleInit {
  private readonly logger = new Logger(BillingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    // Best-effort: no tumbar el arranque si la DB está caída.
    try {
      await this.ensureDefaults();
    } catch (error) {
      this.logger.warn(
        `No se pudieron asegurar los defaults de billing: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /** Crea la configuración y la regla por defecto (1% al proveedor) si faltan. */
  async ensureDefaults() {
    const activeRules = await this.prisma.billingRule.count({ where: { isActive: true } });
    let defaultRuleId: string | undefined;
    if (activeRules === 0) {
      const rule = await this.prisma.billingRule.create({
        data: {
          version: 1,
          label: 'Success fee 1% (proveedor)',
          payer: BillingPayer.SUPPLIER,
          commissionType: CommissionType.SUCCESS_FEE,
          ratePercent: 1,
          isActive: true,
        },
      });
      defaultRuleId = rule.id;
      this.logger.log(`Regla de comisión por defecto creada (1% proveedor): ${rule.id}`);
    }

    await this.prisma.billingSettings.upsert({
      where: { id: 'default' },
      create: { id: 'default', defaultRuleId },
      update: defaultRuleId ? { defaultRuleId } : {},
    });
  }

  /**
   * Regla vigente para un contexto. Prioriza la más específica (empresa > moneda
   * > global) y, a igual especificidad, la de mayor `effectiveFrom`.
   */
  async getActiveRule(params: {
    payer: BillingPayer;
    currency: string;
    companyId: string;
    at?: Date;
  }): Promise<BillingRule | null> {
    const at = params.at ?? new Date();
    const candidates = await this.prisma.billingRule.findMany({
      where: {
        isActive: true,
        payer: params.payer,
        effectiveFrom: { lte: at },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: at } }],
        AND: [
          { OR: [{ currency: null }, { currency: params.currency }] },
          { OR: [{ scopeCompanyId: null }, { scopeCompanyId: params.companyId }] },
        ],
      },
      orderBy: [{ effectiveFrom: 'desc' }, { version: 'desc' }],
    });

    if (candidates.length === 0) {
      return null;
    }
    const score = (rule: BillingRule) =>
      (rule.scopeCompanyId ? 2 : 0) + (rule.currency ? 1 : 0);
    return candidates.slice().sort((a, b) => score(b) - score(a))[0];
  }

  /**
   * Genera (idempotente) la comisión de una operación cerrada. 1 operación → 0/1
   * comisión principal. Se llama cuando la Request pasa a COMPLETED.
   */
  async generateCommissionForClosedRequest(requestId: string) {
    const settings = await this.prisma.billingSettings.findUnique({ where: { id: 'default' } });
    if (settings && settings.isEnabled === false) {
      return null;
    }

    // Idempotencia: si ya existe la comisión de esta operación, no se recrea.
    const existing = await this.prisma.billingCommission.findUnique({
      where: {
        requestId_commissionType: { requestId, commissionType: CommissionType.SUCCESS_FEE },
      },
    });
    if (existing) {
      return existing;
    }

    const request = await this.prisma.request.findUnique({
      where: { id: requestId },
      include: { awardedQuote: true },
    });
    if (!request?.awardedQuote || typeof request.awardedQuote.amount !== 'number') {
      // Sin cotización adjudicada o sin monto no hay base comisionable.
      return null;
    }

    const currency = request.awardedQuote.currency;
    // El pagador depende de la regla; se resuelve con una regla "candidata" de
    // proveedor para conocer el payer, luego se confirma la empresa.
    const rule = await this.getActiveRule({
      payer: BillingPayer.SUPPLIER,
      currency,
      companyId: request.awardedQuote.supplierCompanyId,
    });
    if (!rule) {
      this.logger.warn(`Sin regla de comisión vigente para la operación ${requestId}; no se genera.`);
      return null;
    }

    const payerCompanyId =
      rule.payer === BillingPayer.SUPPLIER
        ? request.awardedQuote.supplierCompanyId
        : request.buyerCompanyId;

    const base = request.awardedQuote.amount;
    const { commissionAmount, ratePercentSnapshot, fixedAmountSnapshot } = computeCommission(base, rule);

    try {
      return await this.prisma.billingCommission.create({
        data: {
          companyId: payerCompanyId,
          requestId,
          quoteId: request.awardedQuote.id,
          ruleId: rule.id,
          ruleVersion: rule.version,
          commissionType: CommissionType.SUCCESS_FEE,
          payer: rule.payer,
          baseAmount: base,
          ratePercentSnapshot,
          fixedAmountSnapshot,
          commissionAmount,
          currency,
          // La operación ya está cerrada (COMPLETED): la comisión nace confirmada.
          status: CommissionStatus.CONFIRMED,
          confirmedAt: new Date(),
          metadata: { source: 'request.completed' } as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      // Carrera: otra ejecución ya la creó (unique). Se devuelve la existente.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return this.prisma.billingCommission.findUnique({
          where: {
            requestId_commissionType: { requestId, commissionType: CommissionType.SUCCESS_FEE },
          },
        });
      }
      throw error;
    }
  }
}
