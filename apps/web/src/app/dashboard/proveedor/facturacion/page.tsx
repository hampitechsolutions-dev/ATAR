'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardInfoBadge,
  DashboardSectionHeading,
  DashboardStatCard,
  dashboardInputClassName,
  dashboardPrimaryButtonClassName,
  dashboardSecondaryButtonClassName,
} from '@/components/dashboard/dashboard-ui';
import SupplierDashboardShell from '@/components/dashboard/supplier-dashboard-shell';
import { PageLoader } from '@/components/ui/spinner';
import {
  ApiError,
  atarApi,
  type BillingSettlementDetail,
  type BillingSettlementRecord,
} from '@/lib/atar-api';
import {
  COMMISSION_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_TONE,
  SETTLEMENT_STATUS_LABEL,
  SETTLEMENT_STATUS_TONE,
  confirmedPaid,
  formatDate,
  formatDateTime,
  formatMoney,
  hasPendingPayment,
  outstanding,
} from '@/lib/billing-format';

export default function SupplierBillingPage() {
  const { session, isHydrated } = useAuth();
  const token = session?.accessToken;

  const [settlements, setSettlements] = useState<BillingSettlementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await atarApi.getMySettlements(token);
      setSettlements(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudieron cargar las liquidaciones.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = useMemo(() => {
    let porPagar = 0;
    let pagado = 0;
    let enValidacion = 0;
    for (const settlement of settlements) {
      pagado += confirmedPaid(settlement.payments);
      if (settlement.status !== 'PAID' && settlement.status !== 'VOID') {
        porPagar += outstanding(settlement.grandTotal, settlement.payments);
      }
      if (hasPendingPayment(settlement.payments)) {
        enValidacion += settlement.payments!
          .filter((payment) => payment.status === 'PENDING')
          .reduce((sum, payment) => sum + payment.amount, 0);
      }
    }
    // La moneda predominante (en v1 casi siempre ARS). Si hay mezcla, se muestra la de la primera.
    const currency = settlements[0]?.currency ?? 'ARS';
    return { porPagar, pagado, enValidacion, currency };
  }, [settlements]);

  if (!isHydrated || (loading && settlements.length === 0)) {
    return (
      <SupplierDashboardShell session={session}>
        <PageLoader label="Cargando tu facturación…" />
      </SupplierDashboardShell>
    );
  }

  return (
    <SupplierDashboardShell session={session}>
      <div className="space-y-6">
        <DashboardSectionHeading
          title="Facturación"
          description="Liquidaciones de la comisión de ATAR por las operaciones que ganaste. Pagá por transferencia y seguí la validación."
        />

        {error ? (
          <DashboardCard className="border-rose-200 bg-rose-50/70">
            <p className="text-sm font-medium text-rose-700">{error}</p>
            <button className={`${dashboardSecondaryButtonClassName} mt-3`} onClick={() => void load()} type="button">
              Reintentar
            </button>
          </DashboardCard>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-3">
          <DashboardStatCard
            label="Por pagar"
            value={formatMoney(totals.porPagar, totals.currency)}
            helper="Saldo pendiente"
          />
          <DashboardStatCard
            label="En validación"
            value={formatMoney(totals.enValidacion, totals.currency)}
            helper="Pagos informados"
          />
          <DashboardStatCard
            label="Pagado"
            value={formatMoney(totals.pagado, totals.currency)}
            helper="Confirmado por ATAR"
          />
        </div>

        {settlements.length === 0 ? (
          <DashboardEmptyState
            title="Todavía no tenés liquidaciones"
            description="Cuando se cierre una operación que ganaste, ATAR genera la liquidación de la comisión y aparece acá para que la pagues."
          />
        ) : (
          <div className="space-y-3">
            {settlements.map((settlement) => {
              const saldo = outstanding(settlement.grandTotal, settlement.payments);
              const pendiente = hasPendingPayment(settlement.payments);
              return (
                <DashboardCard key={settlement.id} className="p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-mono text-sm font-semibold text-slate-950">{settlement.documentNumber}</p>
                        <DashboardInfoBadge tone={SETTLEMENT_STATUS_TONE[settlement.status]}>
                          {SETTLEMENT_STATUS_LABEL[settlement.status]}
                        </DashboardInfoBadge>
                        {pendiente ? <DashboardInfoBadge tone="amber">Pago en validación</DashboardInfoBadge> : null}
                      </div>
                      <p className="text-sm text-slate-500">
                        Período {settlement.period?.code ?? '—'} · {settlement.operationsCount} operación
                        {settlement.operationsCount === 1 ? '' : 'es'} · Vence {formatDate(settlement.dueAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Total</p>
                        <p className="text-xl font-semibold tracking-tight text-slate-950">
                          {formatMoney(settlement.grandTotal, settlement.currency)}
                        </p>
                        {saldo > 0 && saldo !== settlement.grandTotal ? (
                          <p className="text-xs text-slate-500">Saldo {formatMoney(saldo, settlement.currency)}</p>
                        ) : null}
                      </div>
                      <button
                        className={dashboardSecondaryButtonClassName}
                        onClick={() => setSelectedId(settlement.id)}
                        type="button"
                      >
                        Ver detalle
                      </button>
                    </div>
                  </div>
                </DashboardCard>
              );
            })}
          </div>
        )}
      </div>

      {selectedId ? (
        <SettlementDetailDrawer
          settlementId={selectedId}
          token={token}
          onClose={() => setSelectedId(null)}
          onPaid={() => {
            void load();
          }}
        />
      ) : null}
    </SupplierDashboardShell>
  );
}

function SettlementDetailDrawer({
  settlementId,
  token,
  onClose,
  onPaid,
}: {
  settlementId: string;
  token: string | undefined;
  onClose: () => void;
  onPaid: () => void;
}) {
  const [detail, setDetail] = useState<BillingSettlementDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [payOpen, setPayOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [okMessage, setOkMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await atarApi.getMySettlement(settlementId, token);
      setDetail(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cargar el detalle.');
    } finally {
      setLoading(false);
    }
  }, [settlementId, token]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const saldo = detail ? outstanding(detail.grandTotal, detail.payments) : 0;
  const payable = detail
    ? ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'].includes(detail.status) && saldo > 0
    : false;

  function openPayForm() {
    if (!detail) {
      return;
    }
    setAmount(String(saldo));
    setReceiptUrl('');
    setNote('');
    setFormError(null);
    setPayOpen(true);
  }

  async function submitPayment() {
    if (!token || !detail) {
      return;
    }
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setFormError('Ingresá un importe válido mayor a 0.');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await atarApi.payMySettlement(
        detail.id,
        {
          amount: value,
          receiptUrl: receiptUrl.trim() || undefined,
          note: note.trim() || undefined,
        },
        token,
      );
      setOkMessage('Pago informado. Queda pendiente de validación por ATAR.');
      setPayOpen(false);
      await load();
      onPaid();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'No se pudo registrar el pago.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.2em] text-indigo-600">Liquidación</p>
            <p className="truncate font-mono text-sm font-semibold text-slate-950">
              {detail?.documentNumber ?? 'Cargando…'}
            </p>
          </div>
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-500 hover:bg-slate-50"
            onClick={onClose}
            type="button"
            aria-label="Cerrar"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
            </svg>
          </button>
        </div>

        <div className="flex-1 space-y-5 px-6 py-5">
          {loading ? (
            <PageLoader className="min-h-[40vh]" label="Cargando detalle…" />
          ) : error ? (
            <DashboardCard className="border-rose-200 bg-rose-50/70">
              <p className="text-sm font-medium text-rose-700">{error}</p>
              <button className={`${dashboardSecondaryButtonClassName} mt-3`} onClick={() => void load()} type="button">
                Reintentar
              </button>
            </DashboardCard>
          ) : detail ? (
            <>
              {okMessage ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                  {okMessage}
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-2">
                <DashboardInfoBadge tone={SETTLEMENT_STATUS_TONE[detail.status]}>
                  {SETTLEMENT_STATUS_LABEL[detail.status]}
                </DashboardInfoBadge>
                <span className="text-sm text-slate-500">
                  Período {detail.period?.code ?? '—'} · Vence {formatDate(detail.dueAt)}
                </span>
              </div>

              {/* Datos fiscales de la empresa */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm">
                <p className="font-semibold text-slate-950">{detail.company?.legalName ?? detail.company?.name}</p>
                {detail.company?.taxId ? <p className="text-slate-500">CUIT {detail.company.taxId}</p> : null}
              </div>

              {/* Totales */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <TotalCell label="Operaciones" value={String(detail.operationsCount)} />
                <TotalCell label="Base" value={formatMoney(detail.baseTotal, detail.currency)} />
                <TotalCell label="Comisión" value={formatMoney(detail.commissionTotal, detail.currency)} />
                <TotalCell label="Total" value={formatMoney(detail.grandTotal, detail.currency)} strong />
              </div>

              {/* Comisiones (trazabilidad operación → comisión) */}
              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-950">Operaciones incluidas</h3>
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-2.5 font-semibold">Operación</th>
                        <th className="px-4 py-2.5 text-right font-semibold">Base</th>
                        <th className="px-4 py-2.5 text-right font-semibold">Comisión</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {detail.commissions.map((commission) => (
                        <tr key={commission.id}>
                          <td className="px-4 py-2.5">
                            <p className="font-medium text-slate-800">
                              {commission.request?.title ?? 'Operación'}
                            </p>
                            <p className="text-xs text-slate-400">
                              {formatDate(commission.generatedAt)} · {commission.ratePercentSnapshot}% ·{' '}
                              {COMMISSION_STATUS_LABEL[commission.status]}
                            </p>
                          </td>
                          <td className="px-4 py-2.5 text-right text-slate-600">
                            {formatMoney(commission.baseAmount, commission.currency)}
                          </td>
                          <td className="px-4 py-2.5 text-right font-semibold text-slate-900">
                            {formatMoney(commission.commissionAmount, commission.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {detail.adjustments.length > 0 ? (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-slate-950">Ajustes</h3>
                  <div className="space-y-2">
                    {detail.adjustments.map((adjustment) => (
                      <div
                        key={adjustment.id}
                        className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
                      >
                        <span className="text-slate-600">{adjustment.reason ?? adjustment.type}</span>
                        <span className="font-semibold text-slate-900">
                          {formatMoney(adjustment.amount, detail.currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Pagos */}
              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-950">Pagos</h3>
                {detail.payments.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500">
                    Todavía no informaste ningún pago.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {detail.payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">
                            {formatMoney(payment.amount, payment.currency)}
                          </p>
                          <p className="text-xs text-slate-400">{formatDateTime(payment.createdAt)}</p>
                        </div>
                        <DashboardInfoBadge tone={PAYMENT_STATUS_TONE[payment.status]}>
                          {PAYMENT_STATUS_LABEL[payment.status]}
                        </DashboardInfoBadge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {detail && payable ? (
          <div className="sticky bottom-0 border-t border-slate-200 bg-white/95 px-6 py-4 backdrop-blur">
            {payOpen ? (
              <div className="space-y-3">
                {formError ? <p className="text-sm font-medium text-rose-600">{formError}</p> : null}
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-slate-600">
                      Importe ({detail.currency})
                    </span>
                    <input
                      className={dashboardInputClassName}
                      inputMode="decimal"
                      onChange={(event) => setAmount(event.target.value)}
                      type="number"
                      value={amount}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-slate-600">Comprobante (URL, opcional)</span>
                    <input
                      className={dashboardInputClassName}
                      onChange={(event) => setReceiptUrl(event.target.value)}
                      placeholder="https://…"
                      type="url"
                      value={receiptUrl}
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-600">Nota (opcional)</span>
                  <input
                    className={dashboardInputClassName}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="N° de transferencia, banco…"
                    type="text"
                    value={note}
                  />
                </label>
                <p className="text-xs text-slate-400">
                  ATAR valida el pago antes de darlo por cobrado: no se marca pagado automáticamente.
                </p>
                <div className="flex gap-3">
                  <button
                    className={dashboardPrimaryButtonClassName}
                    disabled={submitting}
                    onClick={() => void submitPayment()}
                    type="button"
                  >
                    {submitting ? 'Enviando…' : 'Confirmar pago'}
                  </button>
                  <button
                    className={dashboardSecondaryButtonClassName}
                    disabled={submitting}
                    onClick={() => setPayOpen(false)}
                    type="button"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Saldo a pagar</p>
                  <p className="text-lg font-semibold text-slate-950">{formatMoney(saldo, detail.currency)}</p>
                </div>
                <button className={dashboardPrimaryButtonClassName} onClick={openPayForm} type="button">
                  Informar pago
                </button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function TotalCell({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className={`mt-1 ${strong ? 'text-base font-bold text-slate-950' : 'text-sm font-semibold text-slate-700'}`}>
        {value}
      </p>
    </div>
  );
}
