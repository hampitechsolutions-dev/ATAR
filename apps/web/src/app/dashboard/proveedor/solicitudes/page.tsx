'use client';

import DashboardSidebar from '@/components/dashboard/dashboard-sidebar';
import { useSupplierDashboardData } from '@/lib/dashboard-hooks';

export default function SupplierRequestsPage() {
  const { session, myQuotes, loading, error } = useSupplierDashboardData();

  const requests = myQuotes.reduce<typeof myQuotes>((accumulator, quote) => {
    if (!quote.request || accumulator.some((item) => item.requestId === quote.requestId)) {
      return accumulator;
    }

    return [...accumulator, quote];
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[0.22fr_0.78fr] lg:px-10">
        <DashboardSidebar role="supplier" session={session} />

        <section className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Seguimiento comercial</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Solicitudes
            </h1>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Resume las solicitudes donde ya participas con una cotizacion enviada.
            </p>
          </div>

          {error ? (
            <div className="rounded-[1.5rem] bg-rose-100 px-5 py-4 text-sm text-rose-800">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4">
            {loading ? (
              <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-8 text-sm text-slate-500 shadow-sm">
                Cargando solicitudes...
              </div>
            ) : requests.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white px-6 py-10 text-sm text-slate-500 shadow-sm">
                Todavia no participas en solicitudes.
              </div>
            ) : (
              requests.map((quote) => (
                <article
                  key={quote.requestId}
                  className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        {quote.request?.category}
                      </p>
                      <h2 className="mt-2 text-xl font-semibold text-slate-950">
                        {quote.request?.title}
                      </h2>
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        {quote.request?.description}
                      </p>
                    </div>
                    <div className="rounded-[1.5rem] bg-slate-50 p-4 text-sm text-slate-600">
                      <p>
                        Estado del pedido:{' '}
                        <span className="font-semibold text-slate-950">
                          {quote.request?.status ?? '-'}
                        </span>
                      </p>
                      <p className="mt-1">
                        Estado de tu propuesta:{' '}
                        <span className="font-semibold text-slate-950">{quote.status}</span>
                      </p>
                    </div>
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
