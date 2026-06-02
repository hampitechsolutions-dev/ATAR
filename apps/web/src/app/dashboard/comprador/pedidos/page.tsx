'use client';

import Link from 'next/link';
import DashboardSidebar from '@/components/dashboard/dashboard-sidebar';
import { useBuyerDashboardData } from '@/lib/dashboard-hooks';

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

function formatDate(value: string | null | undefined) {
  if (!value) {
    return 'Sin fecha';
  }

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

export default function BuyerOrdersPage() {
  const { session, requests, loading, error, refresh } = useBuyerDashboardData();

  const orders = requests.filter((request) =>
    ['AWARDED', 'NEGOTIATING', 'ORDER_ISSUED'].includes(request.status),
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[0.2fr_0.8fr] lg:px-10">
        <DashboardSidebar role="buyer" session={session} />

        <section className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm text-slate-500">Seguimiento comercial</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                  Pedidos
                </h1>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Consolida las solicitudes ya adjudicadas y el avance de sus ordenes
                  emitidas.
                </p>
              </div>
              <button
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                onClick={() => void refresh()}
                type="button"
              >
                Actualizar
              </button>
            </div>
          </div>

          {error ? (
            <div className="rounded-[1.5rem] bg-rose-100 px-5 py-4 text-sm text-rose-800">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4">
            {loading ? (
              <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-8 text-sm text-slate-500 shadow-sm">
                Cargando pedidos...
              </div>
            ) : orders.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white px-6 py-10 text-sm text-slate-500 shadow-sm">
                Todavia no hay pedidos adjudicados.
              </div>
            ) : (
              orders.map((request) => (
                <article
                  key={request.id}
                  className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        {request.category}
                      </p>
                      <h2 className="mt-2 text-xl font-semibold text-slate-950">
                        {request.title}
                      </h2>
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        Proveedor adjudicado:{' '}
                        {request.awardedQuote?.supplierCompany?.name ?? 'Sin definir'}
                      </p>
                    </div>

                    <div className="rounded-[1.5rem] bg-slate-50 p-4 text-sm text-slate-600">
                      <p>
                        Orden:{' '}
                        <span className="font-semibold text-slate-950">
                          {request.order?.orderNumber ?? 'Pendiente'}
                        </span>
                      </p>
                      <p className="mt-1">
                        Estado de cumplimiento:{' '}
                        <span className="font-semibold text-slate-950">
                          {request.order?.fulfillmentStatus ?? 'Sin emitir'}
                        </span>
                      </p>
                      <p className="mt-1">
                        Fecha prometida:{' '}
                        <span className="font-semibold text-slate-950">
                          {formatDate(request.order?.promisedDate)}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-3">
                    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">Estado del pedido</p>
                      <p className="mt-2 text-lg font-semibold text-slate-950">
                        {request.status}
                      </p>
                    </div>
                    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">Valor adjudicado</p>
                      <p className="mt-2 text-lg font-semibold text-slate-950">
                        {formatCurrency(request.awardedQuote?.amount)}
                      </p>
                    </div>
                    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">Pago</p>
                      <p className="mt-2 text-lg font-semibold text-slate-950">
                        {request.awardedQuote?.paymentTerms ?? 'No informado'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <Link
                      className="rounded-full border border-violet-200 px-4 py-2 text-sm font-semibold text-violet-700"
                      href={`/dashboard/comprador/solicitudes/${request.id}`}
                    >
                      Abrir seguimiento
                    </Link>
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
