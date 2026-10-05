// Cálculo de comisión — fuente ÚNICA de la fórmula (ver docs/billing/README.md).
// No duplicar esta lógica en otros lugares.

export type CommissionRuleLike = {
  ratePercent: number | null;
  fixedAmount: number | null;
  minAmount: number | null;
  maxAmount: number | null;
};

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Etiqueta monetaria para textos (notificaciones, CSV legible). Formato es-AR
 * con el código de moneda al frente. No es para cálculo, solo presentación.
 */
export function formatMoneyLabel(value: number, currency = 'ARS'): string {
  const amount = Number.isFinite(value) ? value : 0;
  return `${currency} ${amount.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Comisión = base * ratePercent% + fixedAmount, acotada por [minAmount, maxAmount].
 * Devuelve el monto y los snapshots usados (para persistir y no recalcular luego).
 */
export function computeCommission(base: number, rule: CommissionRuleLike) {
  const safeBase = Number.isFinite(base) && base > 0 ? base : 0;
  const ratePercent = rule.ratePercent ?? 0;
  const fixedAmount = rule.fixedAmount ?? 0;

  let amount = (safeBase * ratePercent) / 100 + fixedAmount;
  if (rule.minAmount != null) {
    amount = Math.max(amount, rule.minAmount);
  }
  if (rule.maxAmount != null) {
    amount = Math.min(amount, rule.maxAmount);
  }
  amount = roundMoney(Math.max(amount, 0));

  return {
    commissionAmount: amount,
    ratePercentSnapshot: rule.ratePercent,
    fixedAmountSnapshot: rule.fixedAmount,
  };
}
