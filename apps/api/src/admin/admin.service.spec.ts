import { ForbiddenException } from '@nestjs/common';
import { MembershipRole } from '@prisma/client';
import type { AuthUser } from '../auth/auth-user.interface';
import { AdminService } from './admin.service';

function makePrismaMock() {
  return {
    billingCommission: { findMany: jest.fn().mockResolvedValue([]) },
    company: { findUnique: jest.fn() },
  };
}

function makeUser(role: MembershipRole): AuthUser {
  return {
    userId: 'u1',
    email: 'u@test.com',
    memberships: [{ id: 'm0', companyId: 'x', role, companyType: 'SUPPLIER', isPrimary: true }],
  } as unknown as AuthUser;
}

const admin = makeUser(MembershipRole.ADMIN);
const supplier = makeUser(MembershipRole.SUPPLIER);

function makeService() {
  const prisma = makePrismaMock();
  const service = new AdminService(prisma as never);
  return { service, prisma };
}

function comm(companyId: string, commissionAmount: number, baseAmount: number, currency = 'ARS') {
  return {
    companyId,
    commissionAmount,
    baseAmount,
    currency,
    status: 'CONFIRMED',
    company: { id: companyId, name: `Empresa ${companyId}`, legalName: null, taxId: null },
    request: { buyerCompany: { id: `buyer-${companyId}`, name: `Comprador ${companyId}`, legalName: null, taxId: null } },
  };
}

describe('AdminService — seguridad', () => {
  it('supplierRanking exige admin', async () => {
    const { service } = makeService();
    await expect(service.supplierRanking(supplier)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('buyerRanking exige admin', async () => {
    const { service } = makeService();
    await expect(service.buyerRanking(supplier)).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('AdminService — ranking de proveedores', () => {
  it('agrupa por empresa y ordena de mayor a menor comisión', async () => {
    const { service, prisma } = makeService();
    prisma.billingCommission.findMany.mockResolvedValueOnce([
      comm('A', 100, 10000),
      comm('A', 50, 5000),
      comm('B', 300, 30000),
    ]);

    const ranking = await service.supplierRanking(admin);

    expect(ranking.map((r) => r.companyId)).toEqual(['B', 'A']); // B (300) antes que A (150)
    const a = ranking.find((r) => r.companyId === 'A')!;
    expect(a.operationsCount).toBe(2);
    expect(a.commissionTotal).toBe(150);
    expect(a.salesVolume).toBe(15000);
  });

  it('marca MIXED cuando una empresa tiene operaciones en varias monedas', async () => {
    const { service, prisma } = makeService();
    prisma.billingCommission.findMany.mockResolvedValueOnce([
      comm('A', 100, 10000, 'ARS'),
      comm('A', 7, 700, 'USD'),
    ]);
    const ranking = await service.supplierRanking(admin);
    expect(ranking[0].currency).toBe('MIXED');
  });
});

describe('AdminService — ranking de compradores', () => {
  it('agrupa por comprador y ordena por volumen de compra', async () => {
    const { service, prisma } = makeService();
    prisma.billingCommission.findMany.mockResolvedValueOnce([
      comm('A', 100, 10000),
      comm('B', 50, 40000),
    ]);
    const ranking = await service.buyerRanking(admin);
    // buyer-B compró 40000 > buyer-A 10000
    expect(ranking.map((r) => r.companyId)).toEqual(['buyer-B', 'buyer-A']);
  });
});
