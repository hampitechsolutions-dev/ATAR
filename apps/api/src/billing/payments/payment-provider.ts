import { randomUUID } from 'node:crypto';
import { BillingPaymentMethod } from '@prisma/client';

// Abstracción de proveedor de pago. Billing NO se acopla a un gateway concreto
// (ver docs/billing/README.md §24). v1: solo transferencia manual. MercadoPago
// se agrega como otra implementación sin tocar el resto del flujo.

export type ChargeContext = {
  settlementId: string;
  periodCode: string;
  companyId: string;
  amount: number;
  currency: string;
};

export type ChargeResult = {
  externalReference: string;
  redirectUrl?: string; // gateways redirigen; el manual no.
};

export interface PaymentProvider {
  readonly method: BillingPaymentMethod;
  createCharge(ctx: ChargeContext): Promise<ChargeResult>;
}

/** Referencia única y legible: ATAR-BILLING-<period>-COMPANY-<id>-<uuid8>. */
export function buildExternalReference(periodCode: string, companyId: string): string {
  const short = randomUUID().slice(0, 8);
  return `ATAR-BILLING-${periodCode}-COMPANY-${companyId}-${short}`;
}

/** Pago por transferencia: no hay redirect; queda PENDING hasta validación admin. */
export class ManualTransferProvider implements PaymentProvider {
  readonly method = BillingPaymentMethod.MANUAL_TRANSFER;

  async createCharge(ctx: ChargeContext): Promise<ChargeResult> {
    return { externalReference: buildExternalReference(ctx.periodCode, ctx.companyId) };
  }
}
