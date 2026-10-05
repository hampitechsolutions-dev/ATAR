import { BadRequestException, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import {
  BillingPeriodStatus,
  CommissionStatus,
  SettlementStatus,
} from '@prisma/client';
import { AuthUser } from '../auth/auth-user.interface';
import { isPlatformAdmin } from '../common/workspace.util';
import { PrismaService } from '../prisma/prisma.service';
import { roundMoney } from './billing.util';

type PeriodWindow = { startsAt: Date; endsAt: Date; dueAt: Date };

@Injectable()
export class BillingSettlementsService {
  private readonly logger = new Logger(BillingSettlementsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private assertAdmin(user: AuthUser) {
    if (!isPlatformAdmin(user)) {
      throw new ForbiddenException('Solo un administrador de ATAR puede operar la facturación.');
    }
  }

  /** "2026-09" -> ventana del mes + fecha de vencimiento (fin de mes + dueDays). */
  private async periodWindow(code: string): Promise<PeriodWindow> {
    const match = /^(\d{4})-(\d{2})$/.exec(code);
    if (!match) {
      throw new BadRequestException('El período debe tener formato YYYY-MM (ej. 2026-09).');
    }
    const year = Number(match[1]);
    const month = Number(match[2]);
    if (month < 1 || month > 12) {
      throw new BadRequestException('Mes inválido en el período.');
    }
    const settings = await this.prisma.billingSettings.findUnique({ where: { id: 'default' } });
    const dueDays = settings?.dueDays ?? 15;

    const startsAt = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const endsAt = new Date(Date.UTC(year, month, 1, 0, 0, 0)); // exclusivo
    const dueAt = new Date(endsAt.getTime() + dueDays * 24 * 60 * 60 * 1000);
    return { startsAt, endsAt, dueAt };
  }

  private async writeAudit(
    user: AuthUser,
    action: string,
    entity: string,
    entityId: string,
    extra?: Record<string, unknown>,
  ) {
    await this.prisma.billingAuditLog.create({
      data: {
        actorUserId: user.userId,
        action,
        entity,
        entityId,
        newValue: (extra ?? {}) as object,
      },
    });
  }

  /** Comisiones comisionables del período (cerradas en el mes, confirmadas, sin liquidar). */
  private async closableCommissions(window: PeriodWindow) {
    return this.prisma.billingCommission.findMany({
      where: {
        status: CommissionStatus.CONFIRMED,
        settlementId: null,
        generatedAt: { gte: window.startsAt, lt: window.endsAt },
      },
      include: { company: { select: { id: true, name: true } } },
      orderBy: { generatedAt: 'asc' },
    });
  }

  /**
   * Vista previa: qué va a cobrar ATAR en el período, agrupado por empresa+moneda.
   * No persiste nada.
   */
  async preview(user: AuthUser, code: string) {
    this.assertAdmin(user);
    const window = await this.periodWindow(code);
    const commissions = await this.closableCommissions(window);

    const groups = new Map<
      string,
      {
        companyId: string;
        companyName: string;
        currency: string;
        payer: string;
        operationsCount: number;
        baseTotal: number;
        commissionTotal: number;
        commissions: { requestId: string; generatedAt: Date; baseAmount: number; commissionAmount: number }[];
      }
    >();

    for (const c of commissions) {
      const key = `${c.companyId}__${c.currency}`;
      const group =
        groups.get(key) ??
        {
          companyId: c.companyId,
          companyName: c.company.name,
          currency: c.currency,
          payer: c.payer,
          operationsCount: 0,
          baseTotal: 0,
          commissionTotal: 0,
          commissions: [],
        };
      group.operationsCount += 1;
      group.baseTotal = roundMoney(group.baseTotal + c.baseAmount);
      group.commissionTotal = roundMoney(group.commissionTotal + c.commissionAmount);
      group.commissions.push({
        requestId: c.requestId,
        generatedAt: c.generatedAt,
        baseAmount: c.baseAmount,
        commissionAmount: c.commissionAmount,
      });
      groups.set(key, group);
    }

    return {
      period: code,
      window,
      settlements: [...groups.values()],
      totalCommission: roundMoney(
        [...groups.values()].reduce((sum, g) => sum + g.commissionTotal, 0),
      ),
    };
  }

  /**
   * Genera (idempotente) las liquidaciones del período. Re-ejecutar no duplica:
   * las comisiones ya liquidadas no vuelven a entrar y las liquidaciones se
   * identifican por (período, empresa, moneda).
   */
  async generate(user: AuthUser, code: string) {
    this.assertAdmin(user);
    const window = await this.periodWindow(code);

    const period = await this.prisma.billingPeriod.upsert({
      where: { code },
      create: {
        code,
        startsAt: window.startsAt,
        endsAt: window.endsAt,
        dueAt: window.dueAt,
        status: BillingPeriodStatus.PROCESSING,
      },
      update: { status: BillingPeriodStatus.PROCESSING, dueAt: window.dueAt },
    });

    const commissions = await this.closableCommissions(window);

    // Agrupar por empresa + moneda.
    const groups = new Map<string, typeof commissions>();
    for (const c of commissions) {
      const key = `${c.companyId}__${c.currency}`;
      groups.set(key, [...(groups.get(key) ?? []), c]);
    }

    let seq = await this.prisma.billingSettlement.count({ where: { periodId: period.id } });
    const createdOrUpdated: string[] = [];
    let skipped = 0;

    for (const group of groups.values()) {
      const first = group[0];
      const existing = await this.prisma.billingSettlement.findUnique({
        where: {
          periodId_companyId_currency: {
            periodId: period.id,
            companyId: first.companyId,
            currency: first.currency,
          },
        },
      });

      if (existing && existing.status !== SettlementStatus.DRAFT) {
        // Ya emitida/pagada: no se le agregan comisiones nuevas (requeriría ajuste).
        this.logger.warn(
          `Liquidación ${existing.documentNumber} ya ${existing.status}; ${group.length} comisión(es) nueva(s) quedan sin liquidar.`,
        );
        skipped += group.length;
        continue;
      }

      const commissionIds = group.map((c) => c.id);

      await this.prisma.$transaction(async (tx) => {
        let settlementId = existing?.id;
        let documentNumber = existing?.documentNumber;
        if (!settlementId) {
          seq += 1;
          documentNumber = `ATAR-${code}-${String(seq).padStart(6, '0')}`;
          const created = await tx.billingSettlement.create({
            data: {
              periodId: period.id,
              companyId: first.companyId,
              currency: first.currency,
              payer: first.payer,
              status: SettlementStatus.DRAFT,
              dueAt: window.dueAt,
              documentNumber,
            },
          });
          settlementId = created.id;
        }

        // Vincular comisiones a la liquidación y marcarlas INVOICED.
        await tx.billingCommission.updateMany({
          where: { id: { in: commissionIds } },
          data: {
            settlementId,
            periodId: period.id,
            status: CommissionStatus.INVOICED,
          },
        });

        // Recalcular totales desde TODAS las comisiones de la liquidación.
        const all = await tx.billingCommission.findMany({ where: { settlementId } });
        const adjustments = await tx.billingAdjustment.findMany({ where: { settlementId } });
        const baseTotal = roundMoney(all.reduce((s, c) => s + c.baseAmount, 0));
        const commissionTotal = roundMoney(all.reduce((s, c) => s + c.commissionAmount, 0));
        const adjustmentsTotal = roundMoney(adjustments.reduce((s, a) => s + a.amount, 0));
        await tx.billingSettlement.update({
          where: { id: settlementId },
          data: {
            operationsCount: all.length,
            baseTotal,
            commissionTotal,
            adjustmentsTotal,
            grandTotal: roundMoney(commissionTotal + adjustmentsTotal),
          },
        });

        createdOrUpdated.push(documentNumber!);
      });
    }

    await this.prisma.billingPeriod.update({
      where: { id: period.id },
      data: { status: BillingPeriodStatus.GENERATED, generatedAt: new Date() },
    });

    await this.writeAudit(user, 'BILLING_GENERATE', 'BillingPeriod', period.id, {
      code,
      settlements: createdOrUpdated.length,
      commissions: commissions.length,
      skipped,
    });

    return {
      period: code,
      settlements: createdOrUpdated,
      settlementsCount: createdOrUpdated.length,
      commissionsProcessed: commissions.length,
      skipped,
    };
  }

  /** Emite las liquidaciones DRAFT del período (las vuelve visibles/cobrables). */
  async issue(user: AuthUser, code: string) {
    this.assertAdmin(user);
    const period = await this.prisma.billingPeriod.findUnique({ where: { code } });
    if (!period) {
      throw new BadRequestException('El período no existe o no fue generado todavía.');
    }

    const now = new Date();
    const result = await this.prisma.billingSettlement.updateMany({
      where: { periodId: period.id, status: SettlementStatus.DRAFT },
      data: { status: SettlementStatus.ISSUED, issuedAt: now, dueAt: period.dueAt },
    });

    await this.prisma.billingPeriod.update({
      where: { id: period.id },
      data: { status: BillingPeriodStatus.ISSUED },
    });

    await this.writeAudit(user, 'BILLING_ISSUE', 'BillingPeriod', period.id, {
      code,
      issued: result.count,
    });

    return { period: code, issued: result.count };
  }
}
