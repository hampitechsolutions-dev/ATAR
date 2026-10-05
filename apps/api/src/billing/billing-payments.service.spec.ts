import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  BillingPaymentStatus,
  MembershipRole,
  SettlementStatus,
} from '@prisma/client';
import type { AuthUser } from '../auth/auth-user.interface';
import { BillingPaymentsService } from './billing-payments.service';

// Mock mínimo de Prisma: solo los métodos que toca el servicio. Cada test
// programa los valores con mockResolvedValueOnce en el orden en que se llaman.
function makePrismaMock() {
  return {
    billingSettlement: {
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
      count: jest.fn().mockResolvedValue(0),
    },
    billingPayment: {
      findUnique: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
    },
    billingCommission: {
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    billingPeriod: {
      update: jest.fn().mockResolvedValue({}),
    },
    billingAuditLog: {
      create: jest.fn().mockResolvedValue({}),
    },
  };
}

function makeNotificationsMock() {
  return { createForCompany: jest.fn().mockResolvedValue([]) };
}

function makeUser(
  memberships: { companyId: string; role: MembershipRole }[],
): AuthUser {
  return {
    userId: 'u1',
    email: 'u@test.com',
    memberships: memberships.map((m, index) => ({
      id: `m${index}`,
      companyId: m.companyId,
      role: m.role,
      companyType: 'SUPPLIER',
      isPrimary: index === 0,
    })),
  } as unknown as AuthUser;
}

const admin = makeUser([{ companyId: 'atar', role: MembershipRole.ADMIN }]);
const supplier = makeUser([{ companyId: 'c1', role: MembershipRole.SUPPLIER }]);

function makeService() {
  const prisma = makePrismaMock();
  const notifications = makeNotificationsMock();
  const service = new BillingPaymentsService(
    prisma as never,
    notifications as never,
  );
  return { service, prisma, notifications };
}

describe('BillingPaymentsService — seguridad', () => {
  it('listPayments rechaza a quien no es admin de plataforma', async () => {
    const { service } = makeService();
    await expect(service.listPayments(supplier)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('confirmPayment rechaza a quien no es admin', async () => {
    const { service } = makeService();
    await expect(
      service.confirmPayment(supplier, 'pay1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('registerManualPayment no deja pagar una liquidación de otra empresa', async () => {
    const { service, prisma } = makeService();
    prisma.billingSettlement.findUnique.mockResolvedValueOnce({
      id: 's1',
      companyId: 'OTRA',
      currency: 'ARS',
      status: SettlementStatus.ISSUED,
      grandTotal: 100,
      period: { code: '2026-09' },
    });
    await expect(
      service.registerManualPayment(supplier, 's1', { amount: 100 }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('BillingPaymentsService — registro de pago', () => {
  const issuedSettlement = {
    id: 's1',
    companyId: 'c1',
    currency: 'ARS',
    status: SettlementStatus.ISSUED,
    grandTotal: 100,
    period: { code: '2026-09' },
  };

  it('rechaza importe <= 0', async () => {
    const { service, prisma } = makeService();
    prisma.billingSettlement.findUnique.mockResolvedValueOnce(issuedSettlement);
    await expect(
      service.registerManualPayment(supplier, 's1', { amount: 0 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('no permite pagar una liquidación en estado no cobrable (DRAFT)', async () => {
    const { service, prisma } = makeService();
    prisma.billingSettlement.findUnique.mockResolvedValueOnce({
      ...issuedSettlement,
      status: SettlementStatus.DRAFT,
    });
    await expect(
      service.registerManualPayment(supplier, 's1', { amount: 100 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('crea el pago en estado PENDING (nunca pagado por el cliente)', async () => {
    const { service, prisma } = makeService();
    prisma.billingSettlement.findUnique.mockResolvedValueOnce(issuedSettlement);
    prisma.billingPayment.create.mockImplementation(
      ({ data }: { data: unknown }) => Promise.resolve(data),
    );

    const created = (await service.registerManualPayment(supplier, 's1', {
      amount: 100,
      note: 'transfer 123',
    })) as { status: BillingPaymentStatus; externalReference: string };

    expect(created.status).toBe(BillingPaymentStatus.PENDING);
    expect(created.externalReference).toContain('ATAR-BILLING');
  });
});

describe('BillingPaymentsService — confirmación y recálculo', () => {
  it('es idempotente: un pago ya CONFIRMED no se vuelve a procesar', async () => {
    const { service, prisma } = makeService();
    prisma.billingPayment.findUnique.mockResolvedValueOnce({
      id: 'pay1',
      status: BillingPaymentStatus.CONFIRMED,
      settlementId: 's1',
      amount: 100,
    });
    const result = await service.confirmPayment(admin, 'pay1');
    expect(result).toMatchObject({ status: BillingPaymentStatus.CONFIRMED });
    expect(prisma.billingPayment.update).not.toHaveBeenCalled();
  });

  it('no confirma un pago REJECTED', async () => {
    const { service, prisma } = makeService();
    prisma.billingPayment.findUnique.mockResolvedValueOnce({
      id: 'pay1',
      status: BillingPaymentStatus.REJECTED,
      settlementId: 's1',
      amount: 100,
    });
    await expect(service.confirmPayment(admin, 'pay1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('pago total => liquidación PAID, comisiones PAID y notificación al cliente', async () => {
    const { service, prisma, notifications } = makeService();
    prisma.billingPayment.findUnique.mockResolvedValueOnce({
      id: 'pay1',
      status: BillingPaymentStatus.PENDING,
      settlementId: 's1',
      amount: 100,
      currency: 'ARS',
      paidAt: null,
    });
    prisma.billingPayment.update.mockResolvedValueOnce({
      id: 'pay1',
      status: BillingPaymentStatus.CONFIRMED,
    });
    // recompute: settlement, luego los pagos confirmados que cubren el total
    prisma.billingSettlement.findUnique.mockResolvedValueOnce({
      id: 's1',
      companyId: 'c1',
      currency: 'ARS',
      grandTotal: 100,
      status: SettlementStatus.ISSUED,
      periodId: 'p1',
      paidAt: null,
      documentNumber: 'ATAR-2026-09-000001',
    });
    prisma.billingPayment.findMany.mockResolvedValueOnce([{ amount: 100 }]);
    prisma.billingSettlement.count.mockResolvedValueOnce(0);
    // segunda lectura (para la notificación) ya con estado PAID
    prisma.billingSettlement.findUnique.mockResolvedValueOnce({
      id: 's1',
      companyId: 'c1',
      currency: 'ARS',
      grandTotal: 100,
      status: SettlementStatus.PAID,
      documentNumber: 'ATAR-2026-09-000001',
    });

    await service.confirmPayment(admin, 'pay1');

    const paidCalls = prisma.billingSettlement.update.mock.calls as Array<
      [{ data?: { status?: SettlementStatus } }]
    >;
    const settlementUpdate = paidCalls.find(
      (call) => call[0]?.data?.status === SettlementStatus.PAID,
    );
    expect(settlementUpdate).toBeTruthy();
    expect(prisma.billingCommission.updateMany).toHaveBeenCalled();
    expect(prisma.billingPeriod.update).toHaveBeenCalled(); // rollup del período a PAID
    expect(notifications.createForCompany).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: 'c1',
        type: 'BILLING_PAYMENT_CONFIRMED',
      }),
    );
  });

  it('pago parcial => liquidación PARTIALLY_PAID y no toca comisiones', async () => {
    const { service, prisma } = makeService();
    prisma.billingPayment.findUnique.mockResolvedValueOnce({
      id: 'pay1',
      status: BillingPaymentStatus.PENDING,
      settlementId: 's1',
      amount: 40,
      currency: 'ARS',
      paidAt: null,
    });
    prisma.billingPayment.update.mockResolvedValueOnce({
      id: 'pay1',
      status: BillingPaymentStatus.CONFIRMED,
    });
    prisma.billingSettlement.findUnique.mockResolvedValueOnce({
      id: 's1',
      companyId: 'c1',
      currency: 'ARS',
      grandTotal: 100,
      status: SettlementStatus.ISSUED,
      periodId: 'p1',
      paidAt: null,
      documentNumber: 'DOC',
    });
    prisma.billingPayment.findMany.mockResolvedValueOnce([{ amount: 40 }]);
    prisma.billingSettlement.findUnique.mockResolvedValueOnce({
      id: 's1',
      companyId: 'c1',
      currency: 'ARS',
      grandTotal: 100,
      status: SettlementStatus.PARTIALLY_PAID,
      documentNumber: 'DOC',
    });

    await service.confirmPayment(admin, 'pay1');

    const partialCalls = prisma.billingSettlement.update.mock.calls as Array<
      [{ data?: { status?: SettlementStatus } }]
    >;
    const partial = partialCalls.find(
      (call) => call[0]?.data?.status === SettlementStatus.PARTIALLY_PAID,
    );
    expect(partial).toBeTruthy();
    expect(prisma.billingCommission.updateMany).not.toHaveBeenCalled();
    expect(prisma.billingPeriod.update).not.toHaveBeenCalled();
  });
});

describe('BillingPaymentsService — rechazo', () => {
  it('solo rechaza pagos PENDING', async () => {
    const { service, prisma } = makeService();
    prisma.billingPayment.findUnique.mockResolvedValueOnce({
      id: 'pay1',
      status: BillingPaymentStatus.CONFIRMED,
      settlementId: 's1',
      amount: 100,
      metadata: null,
    });
    await expect(
      service.rejectPayment(admin, 'pay1', 'comprobante ilegible'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza un pago PENDING y notifica el motivo', async () => {
    const { service, prisma, notifications } = makeService();
    prisma.billingPayment.findUnique.mockResolvedValueOnce({
      id: 'pay1',
      status: BillingPaymentStatus.PENDING,
      settlementId: 's1',
      amount: 100,
      currency: 'ARS',
      metadata: null,
    });
    prisma.billingPayment.update.mockResolvedValueOnce({
      id: 'pay1',
      status: BillingPaymentStatus.REJECTED,
    });
    prisma.billingSettlement.findUnique.mockResolvedValueOnce({
      id: 's1',
      companyId: 'c1',
      currency: 'ARS',
      documentNumber: 'DOC',
      grandTotal: 100,
    });

    await service.rejectPayment(admin, 'pay1', 'comprobante ilegible');

    expect(notifications.createForCompany).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'BILLING_PAYMENT_REJECTED' }),
    );
  });
});
