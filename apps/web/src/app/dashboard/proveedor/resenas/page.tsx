'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import SupplierDashboardShell from '@/components/dashboard/supplier-dashboard-shell';
import { useSupplierDashboardData } from '@/lib/dashboard-hooks';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export default function SupplierReviewsPage() {
  const { session, myQuotes, loading, error } = useSupplierDashboardData();

  const awardedQuotes = useMemo(
    () =>
      myQuotes
        .filter((quote) => quote.status === 'AWARDED')
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [myQuotes],
  );

  const metrics = useMemo(() => {
    const total = awardedQuotes.length;
    const withOrder = awardedQuotes.filter((quote) => quote.request?.order).length;
    const totalAmount = awardedQuotes.reduce((sum, quote) => sum + (quote.amount ?? 0), 0);

    return { total, withOrder, totalAmount };
  }, [awardedQuotes]);

  const distribution = [5, 4, 3, 2, 1];

  return (
    <SupplierDashboardShell searchPlaceholder="Buscar clientes u operaciones..." session={session}>
      {/* ==================== VISTA MOBILE ==================== */}
      <div className="lg:hidden pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Calificaciones</h1>

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {/* Rating general (sin calificaciones aún: el API no expone reseñas) */}
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Rating general</p>
          <div className="mt-2 flex items-end gap-3">
            <p className="text-4xl font-bold tracking-tight text-slate-950">—</p>
            <div className="mb-1 flex gap-0.5">
              {Array.from({ length: 5 }).map((_, index) => (
                <svg key={index} aria-hidden="true" className="h-4 w-4 text-slate-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 7.1-1.01L12 2z" />
                </svg>
              ))}
            </div>
          </div>
          <p className="mt-2 text-sm font-medium text-slate-600">Sin calificaciones aún</p>
          <p className="text-xs text-slate-400">Basado en 0 calificaciones</p>

          <div className="mt-4 space-y-2">
            {distribution.map((stars) => (
              <div key={stars} className="flex items-center gap-3">
                <span className="w-16 shrink-0 text-xs text-slate-500">{stars} estrellas</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-amber-400" style={{ width: '0%' }} />
                </div>
                <span className="w-8 shrink-0 text-right text-xs text-slate-400">0%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Operaciones adjudicadas (datos reales) */}
        <div className="mt-6 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-950">Operaciones adjudicadas</h2>
          <span className="text-xs text-slate-400">{loading ? '' : metrics.total}</span>
        </div>

        <div className="mt-3 space-y-3">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
              Cargando...
            </div>
          ) : awardedQuotes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
              Todavía no hay operaciones adjudicadas.
            </div>
          ) : (
            awardedQuotes.map((quote) => (
              <article key={quote.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-bold text-white">
                      {(quote.request?.buyerCompany?.name ?? 'CL').slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-950">
                        {quote.request?.buyerCompany?.name ?? 'Cliente'}
                      </p>
                      <p className="text-xs text-slate-400">{formatDate(quote.updatedAt)}</p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">
                    Adjudicada
                  </span>
                </div>

                <p className="mt-2 text-sm text-slate-700">{quote.request?.title ?? 'Solicitud adjudicada'}</p>

                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Monto:{' '}
                    <span className="font-semibold text-slate-900">
                      {typeof quote.amount === 'number' ? formatCurrency(quote.amount) : 'A consultar'}
                    </span>
                  </span>
                  <Link
                    className="font-semibold text-indigo-600"
                    href={`/dashboard/proveedor/cotizaciones/${quote.id}`}
                  >
                    Ver detalle
                  </Link>
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      {/* ==================== VISTA DESKTOP ==================== */}
      <section className="hidden space-y-4 lg:block">
        <div className="rounded-[24px] border border-[#e7eaf3] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
          <h1 className="text-[24px] font-semibold tracking-[-0.03em] text-[#1f2373] sm:text-[32px]">
            Historial comercial
          </h1>
          <p className="mt-1 text-sm text-[#7e85b2]">
            Esta vista muestra operaciones reales adjudicadas. No se inventan reseñas ni puntuaciones.
          </p>
        </div>

        {error ? (
          <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <article className="rounded-[22px] border border-[#e7eaf3] bg-white p-5">
            <p className="text-xs font-semibold text-[#8b92bc]">Cotizaciones adjudicadas</p>
            <p className="mt-2 text-[22px] font-semibold text-[#1f2373] sm:text-[28px]">
              {loading ? '-' : metrics.total}
            </p>
          </article>
          <article className="rounded-[22px] border border-[#e7eaf3] bg-white p-5">
            <p className="text-xs font-semibold text-[#8b92bc]">Con orden emitida</p>
            <p className="mt-2 text-[22px] font-semibold text-[#1f2373] sm:text-[28px]">
              {loading ? '-' : metrics.withOrder}
            </p>
          </article>
          <article className="rounded-[22px] border border-[#e7eaf3] bg-white p-5">
            <p className="text-xs font-semibold text-[#8b92bc]">Monto adjudicado</p>
            <p className="mt-2 text-[22px] font-semibold text-[#1f2373] sm:text-[28px]">
              {loading ? '-' : formatCurrency(metrics.totalAmount)}
            </p>
          </article>
        </div>

        <div className="grid gap-3">
          {loading ? (
            <div className="rounded-[18px] border border-[#edf0fb] bg-white px-4 py-8 text-sm text-[#8d95be]">
              Cargando historial comercial...
            </div>
          ) : awardedQuotes.length === 0 ? (
            <div className="rounded-[18px] border border-dashed border-[#d8ddee] bg-white px-4 py-8 text-sm text-[#8d95be]">
              Todavía no hay operaciones adjudicadas para mostrar.
            </div>
          ) : (
            awardedQuotes.map((quote) => (
              <article
                key={quote.id}
                className="rounded-[20px] border border-[#e7eaf3] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.04)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-[#33407a]">
                      {quote.request?.buyerCompany?.name ?? 'Cliente'}
                    </p>
                    <p className="mt-1 text-sm text-[#7e85b2]">{quote.request?.title ?? 'Solicitud adjudicada'}</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Adjudicada
                  </span>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Monto</p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">
                      {typeof quote.amount === 'number' ? formatCurrency(quote.amount) : 'No informado'}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Actualizada</p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">{formatDate(quote.updatedAt)}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Orden</p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">
                      {quote.request?.order?.orderNumber ?? 'No emitida'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <Link className="text-sm font-semibold text-[#4a3df0] hover:text-[#3d31d6]" href={`/dashboard/proveedor/cotizaciones/${quote.id}`}>
                    Ver detalle
                  </Link>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </SupplierDashboardShell>
  );
}
