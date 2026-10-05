import { ForbiddenException } from '@nestjs/common';
import {
  CommissionStatus,
  MembershipRole,
  SettlementStatus,
} from '@prisma/client';
import type { AuthUser } from '../auth/auth-user.interface';
import { BillingReportsService } from './billing-reports.service';

function makePrismaMock() {
  return {
    billingSettlement: { findMany: jest.fn().mockResolvedValue([]) },
    billingPayment: { count: jest.fn().mockResolvedValue(0) },
    billingCommission: { findMany: jest.fn().mockResolvedValue([]) },
    billingPeriod: { findUnique: jest.fn() },
  };
}

function makeUser(role: MembershipRole): AuthUser {
  return {
    userId: 'u1',
    email: 'u@test.com',
    memberships: [
      {
        id: 'm0',
        companyId: 'x',
        role,
        companyType: 'SUPPLIER',
        isPrimary: true,
      },
    ],
  } as unknown as AuthUser;
}

const admin = makeUser(MembershipRole.ADMIN);
const supplier = makeUser(MembershipRole.SUPPLIER);

function makeService() {
  const prisma = makePrismaMock();
  const service = new BillingReportsService(prisma as never);
  return { service, prisma };
}

describe('BillingReportsService — seguridad', () => {
  it('overview exige admin', async () => {
    const { service } = makeService();
    await expect(service.overview(supplier)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});

describe('BillingReportsService — overview', () => {
  it('agrupa por moneda: facturado / cobrado / pendiente / vencido', async () => {
    const { service, prisma } = makeService();
    prisma.billingSettlement.findMany.mockResolvedValueOnce([
      {
        currency: 'ARS',
        grandTotal: 100,
        status: SettlementStatus.ISSUED,
        payments: [{ amount: 40 }],
      },
      {
        currency: 'ARS',
        grandTotal: 50,
        status: SettlementStatus.OVERDUE,
        payments: [],
      },
    ]);
    prisma.billingPayment.count.mockResolvedValueOnce(3);

    const result = await service.overview(admin);

    expect(result.pendingPaymentsToValidate).toBe(3);
    const ars = result.currencies.find((entry) => entry.currency === 'ARS');
    expect(ars).toMatchObject({
      billed: 150,
      collected: 40,
      pending: 110,
      overdue: 50,
      settlements: 2,
    });
  });
});

describe('BillingReportsService — reconciliación', () => {
  it('marca descuadre si hay comisiones confirmadas sin liquidar', async () => {
    const { service, prisma } = makeService();
    prisma.billingPeriod.findUnique.mockResolvedValueOnce({
      id: 'p1',
      code: '2026-09',
      status: 'GENERATED',
    });
    prisma.billingCommission.findMany.mockResolvedValueOnce([
      {
        id: 'cm1',
        requestId: 'r1',
        status: CommissionStatus.CONFIRMED,
        settlementId: null,
        commissionAmount: 100,
      },
      {
        id: 'cm2',
        requestId: 'r2',
        status: CommissionStatus.INVOICED,
        settlementId: 's1',
        commissionAmount: 50,
      },
    ]);
    prisma.billingSettlement.findMany.mockResolvedValueOnce([
      {
        documentNumber: 'DOC1',
        grandTotal: 50,
        commissionTotal: 50,
        adjustmentsTotal: 0,
        payments: [{ amount: 50 }],
      },
    ]);

    const result = await service.reconciliation(admin, '2026-09');

    expect(result.balanced).toBe(false);
    expect(result.issues.confirmedUnsettled).toHaveLength(1);
    expect(result.collectedTotal).toBe(50);
  });

  it('balanced=true cuando todo cuadra', async () => {
    const { service, prisma } = makeService();
    prisma.billingPeriod.findUnique.mockResolvedValueOnce({
      id: 'p1',
      code: '2026-09',
      status: 'PAID',
    });
    prisma.billingCommission.findMany.mockResolvedValueOnce([
      {
        id: 'cm2',
        requestId: 'r2',
        status: CommissionStatus.PAID,
        settlementId: 's1',
        commissionAmount: 50,
      },
    ]);
    prisma.billingSettlement.findMany.mockResolvedValueOnce([
      {
        documentNumber: 'DOC1',
        grandTotal: 50,
        commissionTotal: 50,
        adjustmentsTotal: 0,
        payments: [{ amount: 50 }],
      },
    ]);

    const result = await service.reconciliation(admin, '2026-09');
    expect(result.balanced).toBe(true);
    expect(result.issues.mismatchedSettlements).toHaveLength(0);
  });

  it('detecta descuadre contable (grandTotal != comisión + ajustes)', async () => {
    const { service, prisma } = makeService();
    prisma.billingPeriod.findUnique.mockResolvedValueOnce({
      id: 'p1',
      code: '2026-09',
      status: 'GENERATED',
    });
    prisma.billingCommission.findMany.mockResolvedValueOnce([]);
    prisma.billingSettlement.findMany.mockResolvedValueOnce([
      {
        documentNumber: 'DOC1',
        grandTotal: 999,
        commissionTotal: 50,
        adjustmentsTotal: 0,
        payments: [],
      },
    ]);

    const result = await service.reconciliation(admin, '2026-09');
    expect(result.balanced).toBe(false);
    expect(result.issues.mismatchedSettlements).toHaveLength(1);
  });
});

describe('BillingReportsService — export CSV', () => {
  it('genera encabezado y una fila por liquidación (con BOM)', async () => {
    const { service, prisma } = makeService();
    prisma.billingSettlement.findMany.mockResolvedValueOnce([
      {
        documentNumber: 'ATAR-2026-09-000001',
        period: { code: '2026-09' },
        company: {
          name: 'Proveedora SA',
          legalName: 'Proveedora S.A.',
          taxId: '30-1234-5',
        },
        currency: 'ARS',
        status: SettlementStatus.ISSUED,
        operationsCount: 2,
        baseTotal: 15000,
        commissionTotal: 150,
        adjustmentsTotal: 0,
        grandTotal: 150,
        issuedAt: new Date('2026-10-01T00:00:00Z'),
        dueAt: new Date('2026-10-16T00:00:00Z'),
        payments: [{ status: 'CONFIRMED', amount: 100 }],
      },
    ]);

    const csv = await service.settlementsCsv(admin, '2026-09');

    expect(csv.startsWith('﻿')).toBe(true);
    expect(csv).toContain('documento,periodo,empresa');
    expect(csv).toContain('ATAR-2026-09-000001');
    // saldo = total - cobrado = 150 - 100 = 50
    expect(csv).toContain('50');
  });
});
