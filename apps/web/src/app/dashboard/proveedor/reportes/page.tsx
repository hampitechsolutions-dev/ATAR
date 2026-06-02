'use client';

import { useMemo } from 'react';
import DashboardSidebar from '@/components/dashboard/dashboard-sidebar';
import { type OrderFulfillmentStatus } from '@/lib/atar-api';
import { useSupplierDashboardData } from '@/lib/dashboard-hooks';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value);
}

function getFulfillmentLabel(status: OrderFulfillmentStatus) {
  if (status === 'IN_PRODUCTION') {
    return 'En produccion';
  }

  if (status === 'CONFIRMED') {
    return 'Confirmada';
  }

  if (status === 'DISPATCHED') {
    return 'Despachada';
  }

  if (status === 'DELIVERED') {
    return 'Entregada';
  }

  return 'Emitida';
}

export default function SupplierReportsPage() {
  const { session, openRequests, myQuotes, loading, error } = useSupplierDashboardData();

  const quotedAmount = useMemo(() => {
    return myQuotes.reduce((accumulator, quote) => accumulator + (quote.amount ?? 0), 0);
  }, [myQuotes]);

  const awardedQuotes = useMemo(() => {
    return myQuotes.filter((quote) => quote.status === 'AWARDED');
  }, [myQuotes]);

  const averageQuoteAmount = useMemo(() => {
    const quotesWithAmount = myQuotes.filter((quote) => typeof quote.amount === 'number');
    if (quotesWithAmount.length === 0) {
      return 0;
    }

    return (
      quotesWithAmount.reduce((accumulator, quote) => accumulator + (quote.amount ?? 0), 0) /
      quotesWithAmount.length
    );
  }, [myQuotes]);

  const responseRate = openRequests.length === 0 ? 0 : Math.round((myQuotes.length / openRequests.length) * 100);
  const conversionRate = myQuotes.length === 0 ? 0 : Math.round((awardedQuotes.length / myQuotes.length) * 100);

  const categoryBreakdown = useMemo(() => {
    const counts = new Map<string, number>();

    myQuotes.forEach((quote) => {
      const category = quote.request?.category ?? 'Sin categoria';
      counts.set(category, (counts.get(category) ?? 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([category, total]) => ({ category, total }))
      .sort((left, right) => right.total - left.total);
  }, [myQuotes]);

  const orderPipeline = useMemo(() => {
    const counts = new Map<string, number>();

    awardedQuotes.forEach((quote) => {
      const status = quote.request?.order?.fulfillmentStatus
        ? getFulfillmentLabel(quote.request.order.fulfillmentStatus)
        : 'Sin orden emitida';
      counts.set(status, (counts.get(status) ?? 0) + 1);
    });

    return Array.from(counts.entries()).map(([label, total]) => ({ label, total }));
  }, [awardedQuotes]);

  const recentPerformance = useMemo(() => {
    return [...myQuotes]
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      )
      .slice(0, 6);
  }, [myQuotes]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[0.22fr_0.78fr] lg:px-10">
        <DashboardSidebar role="supplier" session={session} />

        <section className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Analitica comercial</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Reportes
            </h1>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Sigue tu actividad comercial, conversion sobre cotizaciones y avance operativo
              de los pedidos adjudicados.
            </p>
          </div>

          {error ? (
            <div className="rounded-[1.5rem] bg-rose-100 px-5 py-4 text-sm text-rose-800">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Cotizaciones emitidas</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">
                {loading ? '-' : myQuotes.length}
              </p>
            </article>
            <article className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Monto cotizado</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">
                {loading ? '-' : formatCurrency(quotedAmount)}
              </p>
            </article>
            <article className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Tasa de respuesta</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">
                {loading ? '-' : `${responseRate}%`}
              </p>
            </article>
            <article className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Conversion a adjudicacion</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">
                {loading ? '-' : `${conversionRate}%`}
              </p>
            </article>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">Rendimiento reciente</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Ultimas propuestas emitidas y su estado comercial.
                  </p>
                </div>
                <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                  Promedio: {loading ? '-' : formatCurrency(averageQuoteAmount)}
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {loading ? (
                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-8 text-sm text-slate-500">
                    Cargando reportes...
                  </div>
                ) : recentPerformance.length === 0 ? (
                  <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm text-slate-500">
                    Aun no hay cotizaciones para analizar.
                  </div>
                ) : (
                  recentPerformance.map((quote) => (
                    <article
                      key={quote.id}
                      className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                            {quote.request?.category ?? 'Sin categoria'}
                          </p>
                          <h3 className="mt-2 text-lg font-semibold text-slate-950">
                            {quote.request?.title ?? 'Solicitud'}
                          </h3>
                          <p className="mt-1 text-sm text-slate-600">
                            {quote.amount ? formatCurrency(quote.amount) : 'Monto a consultar'} ·{' '}
                            {quote.paymentTerms ?? 'Pago no informado'}
                          </p>
                        </div>
                        <div className="rounded-[1.25rem] bg-white px-4 py-3 text-sm text-slate-600">
                          <p>
                            Estado: <span className="font-semibold text-slate-950">{quote.status}</span>
                          </p>
                          <p className="mt-1">
                            Pedido:{' '}
                            <span className="font-semibold text-slate-950">
                              {quote.request?.status ?? 'Sin estado'}
                            </span>
                          </p>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-950">Por categoria</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Donde concentras hoy tu participacion comercial.
                </p>

                <div className="mt-5 space-y-3">
                  {loading ? (
                    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                      Cargando categorias...
                    </div>
                  ) : categoryBreakdown.length === 0 ? (
                    <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                      Sin datos todavia.
                    </div>
                  ) : (
                    categoryBreakdown.map((item) => (
                      <div
                        key={item.category}
                        className="flex items-center justify-between rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3"
                      >
                        <span className="text-sm font-medium text-slate-700">{item.category}</span>
                        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white">
                          {item.total}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-950">Pipeline de pedidos</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Estado operativo de las oportunidades ganadas.
                </p>

                <div className="mt-5 space-y-3">
                  {loading ? (
                    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                      Cargando pipeline...
                    </div>
                  ) : orderPipeline.length === 0 ? (
                    <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                      Aun no hay pedidos adjudicados.
                    </div>
                  ) : (
                    orderPipeline.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3"
                      >
                        <span className="text-sm font-medium text-slate-700">{item.label}</span>
                        <span className="text-sm font-semibold text-slate-950">{item.total}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
