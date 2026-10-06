'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiError, type AdminCompanyDetail, type AdminCompanyRankRow } from '@/lib/atar-api';
import { COMMISSION_STATUS_LABEL, formatDate, formatMoney } from '@/lib/billing-format';

type AdminCompanyRankingProps = {
  token: string | undefined;
  title: string;
  description: string;
  /** Qué es la contraparte en el detalle: para proveedores es el comprador y viceversa. */
  counterpartyLabel: string;
  /** Métrica principal del ranking. */
  rankBy: 'commission' | 'sales';
  loadList: (token: string) => Promise<AdminCompanyRankRow[]>;
  loadDetail: (companyId: string, token: string) => Promise<AdminCompanyDetail>;
};

export default function AdminCompanyRanking({
  token,
  title,
  description,
  counterpartyLabel,
  rankBy,
  loadList,
  loadDetail,
}: AdminCompanyRankingProps) {
  const [rows, setRows] = useState<AdminCompanyRankRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminCompanyRankRow | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setRows(await loadList(token));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cargar el ranking.');
    } finally {
      setLoading(false);
    }
  }, [loadList, token]);

  useEffect(() => {
    void load();
  }, [load]);

  const maxMetric = Math.max(
    1,
    ...rows.map((row) => (rankBy === 'commission' ? row.commissionTotal : row.salesVolume)),
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-indigo-300">{title}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-white/70">{description}</p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="rounded-[1.75rem] border border-white/10 bg-white p-5 text-slate-900 shadow-[0_18px_50px_rgba(0,0,0,0.35)] sm:p-6">
        {loading ? (
          <p className="py-8 text-center text-sm text-slate-500">Cargando ranking…</p>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">Todavía no hay operaciones registradas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">#</th>
                  <th className="px-3 py-2.5 font-semibold">Empresa</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Operaciones</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Volumen</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Comisión</th>
                  <th className="px-3 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, index) => {
                  const metric = rankBy === 'commission' ? row.commissionTotal : row.salesVolume;
                  return (
                    <tr key={row.companyId} className="transition hover:bg-slate-50">
                      <td className="px-3 py-3 font-semibold text-slate-400">{index + 1}</td>
                      <td className="px-3 py-3">
                        <p className="font-semibold text-slate-900">{row.name}</p>
                        <div className="mt-1 h-1.5 w-32 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-indigo-500"
                            style={{ width: `${Math.round((metric / maxMetric) * 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right text-slate-600">{row.operationsCount}</td>
                      <td className="px-3 py-3 text-right text-slate-600">
                        {formatMoney(row.salesVolume, row.currency === 'MIXED' ? 'ARS' : row.currency)}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-slate-900">
                        {formatMoney(row.commissionTotal, row.currency === 'MIXED' ? 'ARS' : row.currency)}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                          onClick={() => setSelected(row)}
                          type="button"
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected ? (
        <CompanyDetailDrawer
          company={selected}
          counterpartyLabel={counterpartyLabel}
          token={token}
          loadDetail={loadDetail}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </div>
  );
}

function CompanyDetailDrawer({
  company,
  counterpartyLabel,
  token,
  loadDetail,
  onClose,
}: {
  company: AdminCompanyRankRow;
  counterpartyLabel: string;
  token: string | undefined;
  loadDetail: (companyId: string, token: string) => Promise<AdminCompanyDetail>;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<AdminCompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setDetail(await loadDetail(company.companyId, token));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cargar el detalle.');
    } finally {
      setLoading(false);
    }
  }, [company.companyId, loadDetail, token]);

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

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col overflow-y-auto bg-white text-slate-900 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.2em] text-indigo-600">Empresa</p>
            <p className="truncate text-base font-semibold text-slate-950">{company.name}</p>
            {company.taxId ? <p className="text-xs text-slate-500">CUIT {company.taxId}</p> : null}
          </div>
          <button
            aria-label="Cerrar"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-500 hover:bg-slate-50"
            onClick={onClose}
            type="button"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
            </svg>
          </button>
        </div>

        <div className="flex-1 space-y-5 px-6 py-5">
          {loading ? (
            <p className="py-10 text-center text-sm text-slate-500">Cargando transacciones…</p>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error}
            </div>
          ) : detail ? (
            <>
              <div className="grid grid-cols-3 gap-3">
                <Metric label="Operaciones" value={String(detail.totals.operationsCount)} />
                <Metric label="Volumen" value={formatMoney(detail.totals.salesVolume)} />
                <Metric label="Comisión" value={formatMoney(detail.totals.commissionTotal)} strong />
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-950">Transacciones</h3>
                {detail.transactions.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500">
                    Sin operaciones cerradas todavía.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {detail.transactions.map((tx) => (
                      <div key={tx.requestId} className="rounded-2xl border border-slate-200 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900">{tx.title}</p>
                            <p className="text-xs text-slate-500">
                              {counterpartyLabel}: {tx.counterpartyName} · {formatDate(tx.date)}
                            </p>
                            {tx.products.length > 0 ? (
                              <p className="mt-1 text-xs text-slate-500">
                                Productos: {tx.products.join(', ')}
                              </p>
                            ) : null}
                            {tx.settlementNumber ? (
                              <p className="mt-1 font-mono text-[11px] text-slate-400">{tx.settlementNumber}</p>
                            ) : null}
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="font-semibold text-slate-900">{formatMoney(tx.saleAmount, tx.currency)}</p>
                            <p className="text-xs text-emerald-600">
                              comisión {formatMoney(tx.commissionAmount, tx.currency)}
                            </p>
                            <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">
                              {COMMISSION_STATUS_LABEL[tx.commissionStatus]}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className={`mt-1 ${strong ? 'text-xl font-bold text-slate-950' : 'text-lg font-semibold text-slate-800'}`}>
        {value}
      </p>
    </div>
  );
}
