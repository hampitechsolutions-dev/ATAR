'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import AdminShell from '@/components/dashboard/admin-shell';
import {
  DashboardEmptyState,
  DashboardInfoBadge,
  dashboardInputClassName,
  dashboardPrimaryButtonClassName,
  dashboardSecondaryButtonClassName,
} from '@/components/dashboard/dashboard-ui';
import { Spinner } from '@/components/ui/spinner';
import {
  ApiError,
  atarApi,
  downloadBillingCsv,
  type BillingAdminPaymentRecord,
  type BillingGenerateResult,
  type BillingOverview,
  type BillingPaymentStatus,
  type BillingPreview,
  type BillingReconciliation,
} from '@/lib/atar-api';
import {
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_TONE,
  formatDateTime,
  formatMoney,
  previousPeriodCode,
} from '@/lib/billing-format';

const PAYMENT_TABS: { key: BillingPaymentStatus; label: string }[] = [
  { key: 'PENDING', label: 'Por validar' },
  { key: 'CONFIRMED', label: 'Confirmados' },
  { key: 'REJECTED', label: 'Rechazados' },
];

/** Tarjeta blanca sobre el canvas oscuro del admin. */
function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[1.75rem] border border-white/10 bg-white p-5 text-slate-900 shadow-[0_18px_50px_rgba(0,0,0,0.35)] sm:p-6 ${className}`.trim()}>
      {children}
    </div>
  );
}

export default function AdminBillingPage() {
  const { session } = useAuth();
  const token = session?.accessToken;

  const [period, setPeriod] = useState(() => previousPeriodCode());

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-indigo-300">Facturación</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Comisiones y liquidaciones</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-white/70">
            Cerrá el período, generá las liquidaciones de comisión por empresa y validá los pagos recibidos. Todo queda
            auditado y es idempotente: regenerar no duplica.
          </p>
        </div>

        <OverviewSection token={token} />
        <PeriodSection period={period} onPeriodChange={setPeriod} token={token} />
        <PaymentsSection token={token} />
      </div>
    </AdminShell>
  );
}

/** Baja un Blob como archivo desde el navegador. */
function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function OverviewSection({ token }: { token: string | undefined }) {
  const [overview, setOverview] = useState<BillingOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reminderBusy, setReminderBusy] = useState(false);
  const [reminderMsg, setReminderMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setOverview(await atarApi.getBillingOverview(token));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cargar el resumen.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function runReminders() {
    if (!token) {
      return;
    }
    setReminderBusy(true);
    setReminderMsg(null);
    try {
      const res = await atarApi.runBillingReminders(token);
      setReminderMsg(
        `Recordatorios: ${res.dueSoon} por vencer, ${res.overdue} vencidas (de ${res.scanned} revisadas).`,
      );
      await load();
    } catch (err) {
      setReminderMsg(err instanceof ApiError ? err.message : 'No se pudieron correr los recordatorios.');
    } finally {
      setReminderBusy(false);
    }
  }

  return (
    <Panel>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Cobranza</h2>
        <button
          className={dashboardSecondaryButtonClassName}
          disabled={reminderBusy}
          onClick={() => void runReminders()}
          type="button"
        >
          {reminderBusy ? 'Procesando…' : 'Correr recordatorios de vencimiento'}
        </button>
      </div>

      {reminderMsg ? (
        <div className="mt-3 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-800">
          {reminderMsg}
        </div>
      ) : null}
      {error ? (
        <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : null}

      {loading && !overview ? (
        <div className="mt-4 flex items-center gap-3 text-sm text-slate-500">
          <Spinner className="h-5 w-5" /> Cargando resumen…
        </div>
      ) : overview ? (
        <div className="mt-4 space-y-4">
          {overview.currencies.length === 0 ? (
            <p className="text-sm text-slate-500">Todavía no hay liquidaciones emitidas.</p>
          ) : (
            overview.currencies.map((entry) => (
              <div key={entry.currency}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  {entry.currency} · {entry.settlements} liquidación{entry.settlements === 1 ? '' : 'es'}
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Stat label="Facturado" value={formatMoney(entry.billed, entry.currency)} />
                  <Stat label="Cobrado" value={formatMoney(entry.collected, entry.currency)} />
                  <Stat label="Pendiente" value={formatMoney(entry.pending, entry.currency)} />
                  <Stat label="Vencido" value={formatMoney(entry.overdue, entry.currency)} />
                </div>
              </div>
            ))
          )}
          {overview.pendingPaymentsToValidate > 0 ? (
            <p className="text-sm text-amber-600">
              {overview.pendingPaymentsToValidate} pago(s) pendiente(s) de validación.
            </p>
          ) : null}
        </div>
      ) : null}
    </Panel>
  );
}

function PeriodSection({
  period,
  onPeriodChange,
  token,
}: {
  period: string;
  onPeriodChange: (value: string) => void;
  token: string | undefined;
}) {
  const [preview, setPreview] = useState<BillingPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<null | 'generate' | 'issue'>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [recon, setRecon] = useState<BillingReconciliation | null>(null);
  const [reconBusy, setReconBusy] = useState(false);
  const [csvBusy, setCsvBusy] = useState<null | 'settlements' | 'commissions'>(null);

  const validPeriod = /^\d{4}-\d{2}$/.test(period);

  const loadPreview = useCallback(async () => {
    if (!token || !validPeriod) {
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await atarApi.previewBillingPeriod(period, token);
      setPreview(data);
    } catch (err) {
      setPreview(null);
      setError(err instanceof ApiError ? err.message : 'No se pudo calcular la vista previa.');
    } finally {
      setLoading(false);
    }
  }, [period, token, validPeriod]);

  useEffect(() => {
    void loadPreview();
  }, [loadPreview]);

  async function runGenerate() {
    if (!token) {
      return;
    }
    setBusy('generate');
    setError(null);
    setResult(null);
    try {
      const res: BillingGenerateResult = await atarApi.generateBillingPeriod(period, token);
      setResult(
        `Se generaron ${res.settlementsCount} liquidación(es) con ${res.commissionsProcessed} comisión(es)` +
          (res.skipped ? `; ${res.skipped} quedaron sin liquidar (liquidación ya emitida).` : '.'),
      );
      await loadPreview();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo generar el período.');
    } finally {
      setBusy(null);
    }
  }

  async function runIssue() {
    if (!token) {
      return;
    }
    setBusy('issue');
    setError(null);
    setResult(null);
    try {
      const res = await atarApi.issueBillingPeriod(period, token);
      setResult(`Se emitieron ${res.issued} liquidación(es). Ya son visibles y cobrables para cada empresa.`);
      await loadPreview();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo emitir el período.');
    } finally {
      setBusy(null);
    }
  }

  async function loadReconciliation() {
    if (!token || !validPeriod) {
      return;
    }
    setReconBusy(true);
    setError(null);
    try {
      setRecon(await atarApi.getBillingReconciliation(period, token));
    } catch (err) {
      setRecon(null);
      setError(err instanceof ApiError ? err.message : 'No se pudo calcular la reconciliación.');
    } finally {
      setReconBusy(false);
    }
  }

  async function exportCsv(kind: 'settlements' | 'commissions') {
    if (!token) {
      return;
    }
    setCsvBusy(kind);
    setError(null);
    try {
      const blob = await downloadBillingCsv(kind, validPeriod ? period : undefined, token);
      const name = kind === 'settlements' ? 'liquidaciones' : 'comisiones';
      triggerDownload(blob, `${name}${validPeriod ? `-${period}` : ''}.csv`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo exportar el CSV.');
    } finally {
      setCsvBusy(null);
    }
  }

  return (
    <Panel>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Período</span>
          <input
            className={`${dashboardInputClassName} sm:w-48`}
            onChange={(event) => onPeriodChange(event.target.value)}
            placeholder="AAAA-MM"
            type="month"
            value={period}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button className={dashboardSecondaryButtonClassName} disabled={loading || !validPeriod} onClick={() => void loadPreview()} type="button">
            {loading ? 'Calculando…' : 'Actualizar vista'}
          </button>
          <button
            className={dashboardSecondaryButtonClassName}
            disabled={busy !== null || !validPeriod || !preview || preview.settlements.length === 0}
            onClick={() => void runGenerate()}
            type="button"
          >
            {busy === 'generate' ? 'Generando…' : 'Generar liquidaciones'}
          </button>
          <button
            className={dashboardPrimaryButtonClassName}
            disabled={busy !== null || !validPeriod}
            onClick={() => void runIssue()}
            type="button"
          >
            {busy === 'issue' ? 'Emitiendo…' : 'Emitir período'}
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          className={dashboardSecondaryButtonClassName}
          disabled={reconBusy || !validPeriod}
          onClick={() => void loadReconciliation()}
          type="button"
        >
          {reconBusy ? 'Reconciliando…' : 'Reconciliación'}
        </button>
        <button
          className={dashboardSecondaryButtonClassName}
          disabled={csvBusy !== null}
          onClick={() => void exportCsv('settlements')}
          type="button"
        >
          {csvBusy === 'settlements' ? 'Exportando…' : 'Export liquidaciones (CSV)'}
        </button>
        <button
          className={dashboardSecondaryButtonClassName}
          disabled={csvBusy !== null}
          onClick={() => void exportCsv('commissions')}
          type="button"
        >
          {csvBusy === 'commissions' ? 'Exportando…' : 'Export comisiones (CSV)'}
        </button>
      </div>

      {!validPeriod ? (
        <p className="mt-4 text-sm text-amber-600">El período debe tener formato AAAA-MM.</p>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : null}
      {result ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {result}
        </div>
      ) : null}

      {recon ? (
        <div
          className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
            recon.balanced ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'
          }`}
        >
          <p className="font-semibold text-slate-900">
            Reconciliación {recon.period} ·{' '}
            {recon.balanced ? 'cuadra ✓' : 'con descuadres'}
          </p>
          <p className="mt-1 text-slate-600">
            Comisiones {formatMoney(recon.commissionTotal)} · Liquidado {formatMoney(recon.settledTotal)} · Cobrado{' '}
            {formatMoney(recon.collectedTotal)}
          </p>
          {recon.issues.confirmedUnsettled.length > 0 ? (
            <p className="mt-1 text-amber-700">
              {recon.issues.confirmedUnsettled.length} comisión(es) confirmada(s) sin liquidar.
            </p>
          ) : null}
          {recon.issues.mismatchedSettlements.length > 0 ? (
            <p className="mt-1 text-amber-700">
              {recon.issues.mismatchedSettlements.length} liquidación(es) con descuadre contable.
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Overview de la vista previa */}
      {loading && !preview ? (
        <div className="mt-6 flex items-center gap-3 text-sm text-slate-500">
          <Spinner className="h-5 w-5" /> Calculando comisiones del período…
        </div>
      ) : preview ? (
        <div className="mt-6 space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="A facturar" value={formatMoney(preview.totalCommission, preview.settlements[0]?.currency ?? 'ARS')} />
            <Stat label="Liquidaciones" value={String(preview.settlements.length)} />
            <Stat
              label="Operaciones"
              value={String(preview.settlements.reduce((sum, group) => sum + group.operationsCount, 0))}
            />
          </div>

          {preview.settlements.length === 0 ? (
            <DashboardEmptyState
              title="No hay comisiones pendientes de liquidar"
              description="En este período no quedan comisiones confirmadas sin liquidar. Si ya generaste las liquidaciones, revisalas en la sección de pagos."
            />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Empresa</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Operaciones</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Base</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Comisión</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {preview.settlements.map((group) => (
                    <tr key={`${group.companyId}-${group.currency}`}>
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-slate-800">{group.companyName}</p>
                        <p className="text-xs text-slate-400">{group.currency}</p>
                      </td>
                      <td className="px-4 py-2.5 text-right text-slate-600">{group.operationsCount}</td>
                      <td className="px-4 py-2.5 text-right text-slate-600">
                        {formatMoney(group.baseTotal, group.currency)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-slate-900">
                        {formatMoney(group.commissionTotal, group.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}
    </Panel>
  );
}

function PaymentsSection({ token }: { token: string | undefined }) {
  const [status, setStatus] = useState<BillingPaymentStatus>('PENDING');
  const [payments, setPayments] = useState<BillingAdminPaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = useCallback(async () => {
    if (!token) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await atarApi.listBillingPayments(status, token);
      setPayments(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudieron cargar los pagos.');
    } finally {
      setLoading(false);
    }
  }, [status, token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function confirm(id: string) {
    if (!token) {
      return;
    }
    setActingId(id);
    setError(null);
    try {
      await atarApi.confirmBillingPayment(id, token);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo confirmar el pago.');
    } finally {
      setActingId(null);
    }
  }

  async function reject(id: string) {
    if (!token) {
      return;
    }
    if (!rejectReason.trim()) {
      setError('Indicá el motivo del rechazo.');
      return;
    }
    setActingId(id);
    setError(null);
    try {
      await atarApi.rejectBillingPayment(id, rejectReason.trim(), token);
      setRejectingId(null);
      setRejectReason('');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo rechazar el pago.');
    } finally {
      setActingId(null);
    }
  }

  const title = useMemo(() => PAYMENT_TABS.find((tab) => tab.key === status)?.label ?? 'Pagos', [status]);

  return (
    <Panel>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Pagos recibidos</h2>
        <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1">
          {PAYMENT_TABS.map((tab) => (
            <button
              key={tab.key}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                status === tab.key ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'
              }`}
              onClick={() => {
                setStatus(tab.key);
                setRejectingId(null);
              }}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="mt-4">
        {loading ? (
          <div className="flex items-center gap-3 py-8 text-sm text-slate-500">
            <Spinner className="h-5 w-5" /> Cargando pagos…
          </div>
        ) : payments.length === 0 ? (
          <DashboardEmptyState title={`No hay pagos ${title.toLowerCase()}`} description="Cuando una empresa informe un pago, aparece acá para validarlo." />
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <div key={payment.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mono text-sm font-semibold text-slate-900">
                        {payment.settlement?.documentNumber ?? 'Liquidación'}
                      </p>
                      <DashboardInfoBadge tone={PAYMENT_STATUS_TONE[payment.status]}>
                        {PAYMENT_STATUS_LABEL[payment.status]}
                      </DashboardInfoBadge>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      {formatDateTime(payment.createdAt)} · Ref {payment.externalReference ?? '—'}
                    </p>
                    {payment.receiptUrl ? (
                      <a
                        className="mt-1 inline-block text-xs font-semibold text-indigo-600 hover:underline"
                        href={payment.receiptUrl}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        Ver comprobante
                      </a>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-semibold text-slate-900">
                        {formatMoney(payment.amount, payment.currency)}
                      </p>
                      {payment.settlement ? (
                        <p className="text-xs text-slate-400">
                          de {formatMoney(payment.settlement.grandTotal, payment.settlement.currency)}
                        </p>
                      ) : null}
                    </div>
                    {payment.status === 'PENDING' ? (
                      <div className="flex gap-2">
                        <button
                          className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
                          disabled={actingId === payment.id}
                          onClick={() => void confirm(payment.id)}
                          type="button"
                        >
                          {actingId === payment.id ? '…' : 'Confirmar'}
                        </button>
                        <button
                          className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
                          disabled={actingId === payment.id}
                          onClick={() => {
                            setRejectingId(rejectingId === payment.id ? null : payment.id);
                            setRejectReason('');
                          }}
                          type="button"
                        >
                          Rechazar
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>

                {rejectingId === payment.id ? (
                  <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row">
                    <input
                      autoFocus
                      className={dashboardInputClassName}
                      onChange={(event) => setRejectReason(event.target.value)}
                      placeholder="Motivo del rechazo (visible en la auditoría)"
                      type="text"
                      value={rejectReason}
                    />
                    <button
                      className="inline-flex shrink-0 items-center justify-center rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:opacity-60"
                      disabled={actingId === payment.id}
                      onClick={() => void reject(payment.id)}
                      type="button"
                    >
                      Confirmar rechazo
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </Panel>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
    </div>
  );
}
