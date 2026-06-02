'use client';

import DashboardSidebar from '@/components/dashboard/dashboard-sidebar';
import { useSupplierDashboardData } from '@/lib/dashboard-hooks';

function formatCurrency(value: number | null | undefined) {
  if (typeof value !== 'number') {
    return 'A consultar';
  }

  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function SupplierQuotesPage() {
  const { session, myQuotes, loading, error } = useSupplierDashboardData();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[0.22fr_0.78fr] lg:px-10">
        <DashboardSidebar role="supplier" session={session} />

        <section className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Historial de propuestas</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Cotizaciones
            </h1>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Consulta todas las propuestas enviadas y su resultado sobre cada solicitud.
            </p>
          </div>

          {error ? (
            <div className="rounded-[1.5rem] bg-rose-100 px-5 py-4 text-sm text-rose-800">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            {loading ? (
              <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-8 text-sm text-slate-500 shadow-sm md:col-span-2">
                Cargando cotizaciones...
              </div>
            ) : myQuotes.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white px-6 py-10 text-sm text-slate-500 shadow-sm md:col-span-2">
                No hay cotizaciones cargadas todavia.
              </div>
            ) : (
              myQuotes.map((quote) => (
                <article
                  key={quote.id}
                  className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    {quote.request?.category ?? 'Solicitud'}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-950">
                    {quote.request?.title ?? 'Sin titulo'}
                  </h2>
                  <p className="mt-4 text-3xl font-semibold text-slate-950">
                    {formatCurrency(quote.amount)}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    Plazo: {quote.leadTimeDays ?? '-'} dias
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Pago: {quote.paymentTerms ?? 'No informado'}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">
                      {quote.status}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">
                      Pedido: {quote.request?.status ?? '-'}
                    </span>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
