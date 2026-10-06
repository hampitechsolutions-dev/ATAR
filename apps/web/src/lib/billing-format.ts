import type {
  BillingCommissionStatus,
  BillingPaymentRecord,
  BillingPaymentStatus,
  BillingPeriodStatus,
  BillingSettlementStatus,
} from './atar-api';

/** Importe con la moneda de la liquidación (ARS/USD). Server manda el número; acá solo se formatea. */
export function formatMoney(value: number | null | undefined, currency = 'ARS') {
  const amount = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  try {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Moneda no reconocida por Intl: cae a un formato simple con el código.
    return `${currency} ${amount.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`;
  }
}

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return '—';
  }
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return '—';
  }
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export type BadgeTone = 'neutral' | 'indigo' | 'emerald' | 'amber' | 'sky' | 'rose';

export const SETTLEMENT_STATUS_LABEL: Record<BillingSettlementStatus, string> = {
  DRAFT: 'Borrador',
  ISSUED: 'Por pagar',
  PARTIALLY_PAID: 'Pago parcial',
  PAID: 'Pagada',
  OVERDUE: 'Vencida',
  VOID: 'Anulada',
};

export const SETTLEMENT_STATUS_TONE: Record<BillingSettlementStatus, BadgeTone> = {
  DRAFT: 'neutral',
  ISSUED: 'amber',
  PARTIALLY_PAID: 'sky',
  PAID: 'emerald',
  OVERDUE: 'rose',
  VOID: 'neutral',
};

export const PAYMENT_STATUS_LABEL: Record<BillingPaymentStatus, string> = {
  PENDING: 'En validación',
  CONFIRMED: 'Confirmado',
  REJECTED: 'Rechazado',
  REFUNDED: 'Reintegrado',
};

export const PAYMENT_STATUS_TONE: Record<BillingPaymentStatus, BadgeTone> = {
  PENDING: 'amber',
  CONFIRMED: 'emerald',
  REJECTED: 'rose',
  REFUNDED: 'neutral',
};

export const COMMISSION_STATUS_LABEL: Record<BillingCommissionStatus, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  INVOICED: 'Facturada',
  PAID: 'Pagada',
  VOID: 'Anulada',
  ADJUSTED: 'Ajustada',
};

export const PERIOD_STATUS_LABEL: Record<BillingPeriodStatus, string> = {
  OPEN: 'Abierto',
  PROCESSING: 'Procesando',
  GENERATED: 'Generado',
  ISSUED: 'Emitido',
  PARTIALLY_PAID: 'Pago parcial',
  PAID: 'Pagado',
  OVERDUE: 'Vencido',
  CLOSED: 'Cerrado',
  CANCELLED: 'Cancelado',
};

/** Suma de pagos CONFIRMED de una liquidación. */
export function confirmedPaid(payments: BillingPaymentRecord[] | undefined) {
  if (!payments) {
    return 0;
  }
  return payments
    .filter((payment) => payment.status === 'CONFIRMED')
    .reduce((sum, payment) => sum + payment.amount, 0);
}

/** Saldo pendiente (grandTotal menos lo confirmado). Nunca negativo. */
export function outstanding(grandTotal: number, payments: BillingPaymentRecord[] | undefined) {
  return Math.max(0, Math.round((grandTotal - confirmedPaid(payments)) * 100) / 100);
}

/** ¿Tiene algún pago PENDING esperando validación de ATAR? */
export function hasPendingPayment(payments: BillingPaymentRecord[] | undefined) {
  return Boolean(payments?.some((payment) => payment.status === 'PENDING'));
}

/** Período por defecto para el panel admin: el mes anterior (YYYY-MM), que es lo que se liquida. */
export function previousPeriodCode(reference = new Date()) {
  const year = reference.getUTCFullYear();
  const month = reference.getUTCMonth(); // 0-based; el mes anterior es este índice sin +1
  const date = new Date(Date.UTC(year, month - 1, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}
