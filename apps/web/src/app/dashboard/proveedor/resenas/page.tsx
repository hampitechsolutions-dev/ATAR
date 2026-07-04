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

  return (
    <SupplierDashboardShell searchPlaceholder="Buscar clientes u operaciones..." session={session}>
      <section className="space-y-4">
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
