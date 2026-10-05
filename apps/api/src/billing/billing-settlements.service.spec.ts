import { ForbiddenException } from '@nestjs/common';
import { MembershipRole, SettlementStatus } from '@prisma/client';
import type { AuthUser } from '../auth/auth-user.interface';
import { BillingSettlementsService } from './billing-settlements.service';

function makePrismaMock() {
  return {
    billingSettings: {
      findUnique: jest.fn().mockResolvedValue({ id: 'default', dueDays: 15 }),
    },
    billingCommission: { findMany: jest.fn().mockResolvedValue([]) },
    billingSettlement: {
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({}),
    },
    billingAuditLog: { create: jest.fn().mockResolvedValue({}) },
  };
}

function makeUser(role: MembershipRole, companyId = 'c1'): AuthUser {
  return {
    userId: 'u1',
    email: 'u@test.com',
    memberships: [
      { id: 'm0', companyId, role, companyType: 'SUPPLIER', isPrimary: true },
    ],
  } as unknown as AuthUser;
}

const admin = makeUser(MembershipRole.ADMIN, 'atar');
const supplier = makeUser(MembershipRole.SUPPLIER);

function makeService() {
  const prisma = makePrismaMock();
  const notifications = { createForCompany: jest.fn().mockResolvedValue([]) };
  const service = new BillingSettlementsService(
    prisma as never,
    notifications as never,
  );
  return { service, prisma, notifications };
}

function commission(over: Record<string, unknown> = {}) {
  return {
    id: 'cm',
    requestId: 'r1',
    companyId: 'c1',
    currency: 'ARS',
    payer: 'SUPPLIER',
    baseAmount: 10000,
    commissionAmount: 100,
    generatedAt: new Date('2026-09-10T00:00:00Z'),
    company: { id: 'c1', name: 'Proveedora SA' },
    ...over,
  };
}

describe('BillingSettlementsService — seguridad', () => {
  it('preview exige admin de plataforma', async () => {
    const { service } = makeService();
    await expect(service.preview(supplier, '2026-09')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('runDueReminders exige admin de plataforma', async () => {
    const { service } = makeService();
    await expect(service.runDueReminders(supplier)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});

describe('BillingSettlementsService — preview', () => {
  it('agrupa comisiones por empresa+moneda y suma los totales', async () => {
    const { service, prisma } = makeService();
    prisma.billingCommission.findMany.mockResolvedValueOnce([
      commission({
        id: 'cm1',
        requestId: 'r1',
        commissionAmount: 100,
        baseAmount: 10000,
      }),
      commission({
        id: 'cm2',
        requestId: 'r2',
        commissionAmount: 50,
        baseAmount: 5000,
      }),
      commission({
        id: 'cm3',
        requestId: 'r3',
        currency: 'USD',
        commissionAmount: 7,
        baseAmount: 700,
      }),
    ]);

    const result = await service.preview(admin, '2026-09');

    // ARS agrupadas (2 operaciones) + USD aparte => 2 grupos
    expect(result.settlements).toHaveLength(2);
    const ars = result.settlements.find((group) => group.currency === 'ARS');
    expect(ars?.operationsCount).toBe(2);
    expect(ars?.commissionTotal).toBe(150);
    expect(ars?.baseTotal).toBe(15000);
    expect(result.totalCommission).toBe(157);
  });

  it('sin comisiones comisionables devuelve lista vacía', async () => {
    const { service, prisma } = makeService();
    prisma.billingCommission.findMany.mockResolvedValueOnce([]);
    const result = await service.preview(admin, '2026-09');
    expect(result.settlements).toHaveLength(0);
    expect(result.totalCommission).toBe(0);
  });

  it('rechaza un código de período mal formado', async () => {
    const { service } = makeService();
    await expect(service.preview(admin, 'septiembre')).rejects.toBeTruthy();
  });
});

describe('BillingSettlementsService — recordatorios de vencimiento (idempotentes)', () => {
  const now = Date.now();
  const daysFromNow = (days: number) =>
    new Date(now + days * 24 * 60 * 60 * 1000);

  it('avisa una vez por vencida y por vencer; ignora las ya avisadas', async () => {
    const { service, prisma, notifications } = makeService();
    prisma.billingSettlement.findMany.mockResolvedValueOnce([
      // vencida y todavía sin avisar => notifica OVERDUE + marca OVERDUE
      {
        id: 'sVencida',
        companyId: 'c1',
        currency: 'ARS',
        grandTotal: 100,
        documentNumber: 'DOC1',
        status: SettlementStatus.ISSUED,
        dueAt: daysFromNow(-5),
        overdueNotifiedAt: null,
        dueSoonNotifiedAt: null,
      },
      // vencida pero ya avisada => no vuelve a notificar
      {
        id: 'sVencidaAvisada',
        companyId: 'c1',
        currency: 'ARS',
        grandTotal: 100,
        documentNumber: 'DOC2',
        status: SettlementStatus.OVERDUE,
        dueAt: daysFromNow(-20),
        overdueNotifiedAt: daysFromNow(-19),
        dueSoonNotifiedAt: null,
      },
      // por vencer (dentro de la ventana) y sin avisar => notifica DUE_SOON
      {
        id: 'sPorVencer',
        companyId: 'c1',
        currency: 'ARS',
        grandTotal: 100,
        documentNumber: 'DOC3',
        status: SettlementStatus.ISSUED,
        dueAt: daysFromNow(2),
        overdueNotifiedAt: null,
        dueSoonNotifiedAt: null,
      },
    ]);

    const result = await service.runDueReminders(admin);

    expect(result).toMatchObject({ scanned: 3, dueSoon: 1, overdue: 1 });
    expect(notifications.createForCompany).toHaveBeenCalledTimes(2);
    const types = notifications.createForCompany.mock.calls.map(
      (call: [{ type: string }]) => call[0].type,
    );
    expect(types).toContain('BILLING_SETTLEMENT_OVERDUE');
    expect(types).toContain('BILLING_SETTLEMENT_DUE_SOON');
  });
});
