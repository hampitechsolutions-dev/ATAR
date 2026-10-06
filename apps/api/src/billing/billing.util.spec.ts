import { computeCommission, roundMoney } from './billing.util';

describe('billing calc engine', () => {
  const rule = (over: Partial<Parameters<typeof computeCommission>[1]> = {}) => ({
    ratePercent: 1,
    fixedAmount: null,
    minAmount: null,
    maxAmount: null,
    ...over,
  });

  it('1% sobre 10.000 = 100 (Caso de negocio 1, con 1%)', () => {
    expect(computeCommission(10000, rule()).commissionAmount).toBe(100);
  });

  it('3% sobre 10.000 = 300', () => {
    expect(computeCommission(10000, rule({ ratePercent: 3 })).commissionAmount).toBe(300);
  });

  it('porcentaje + monto fijo', () => {
    expect(computeCommission(10000, rule({ ratePercent: 1, fixedAmount: 50 })).commissionAmount).toBe(150);
  });

  it('respeta el mínimo', () => {
    expect(computeCommission(1000, rule({ ratePercent: 1, minAmount: 50 })).commissionAmount).toBe(50);
  });

  it('respeta el máximo', () => {
    expect(computeCommission(1000000, rule({ ratePercent: 1, maxAmount: 500 })).commissionAmount).toBe(500);
  });

  it('base 0 o inválida => 0', () => {
    expect(computeCommission(0, rule()).commissionAmount).toBe(0);
    expect(computeCommission(-5, rule()).commissionAmount).toBe(0);
    expect(computeCommission(Number.NaN, rule()).commissionAmount).toBe(0);
  });

  it('guarda snapshots de rate y fixed', () => {
    const out = computeCommission(10000, rule({ ratePercent: 2.5, fixedAmount: 10 }));
    expect(out.ratePercentSnapshot).toBe(2.5);
    expect(out.fixedAmountSnapshot).toBe(10);
  });

  it('redondea a 2 decimales', () => {
    expect(roundMoney(100.005)).toBe(100.01);
    expect(computeCommission(333.33, rule({ ratePercent: 1 })).commissionAmount).toBe(3.33);
  });
});
