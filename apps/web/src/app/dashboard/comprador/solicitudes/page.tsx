'use client';

import Link from 'next/link';
import DashboardSidebar from '@/components/dashboard/dashboard-sidebar';
import { useBuyerDashboardData } from '@/lib/dashboard-hooks';
import type { RequestRecord } from '@/lib/atar-api';

function formatDate(value: string | null) {
  if (!value) {
    return 'Sin fecha';
  }

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

function getRequestStatusStyles(status: RequestRecord['status']) {
  if (status === 'ORDER_ISSUED') {
    return 'bg-violet-100 text-violet-800';
  }

  if (status === 'NEGOTIATING') {
    return 'bg-amber-100 text-amber-800';
  }

  if (status === 'AWARDED') {
    return 'bg-emerald-100 text-emerald-800';
  }

  if (status === 'REVIEWING') {
    return 'bg-sky-100 text-sky-800';
  }

  return 'bg-slate-100 text-slate-700';
}

export default function BuyerRequestsPage() {
  const { session, requests, loading, error, refresh } = useBuyerDashboardData();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[0.2fr_0.8fr] lg:px-10">
        <DashboardSidebar role="buyer" session={session} />

        <section className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm text-slate-500">Operacion de compra</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                  Mis solicitudes
                </h1>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Revisa el estado de cada solicitud y entra al comparador detallado cuando
                  ya existan propuestas.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                  onClick={() => void refresh()}
                  type="button"
                >
                  Actualizar
                </button>
                <Link
                  className="rounded-full bg-gradient-to-r from-sky-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white"
                  href="/dashboard/comprador"
                >
                  Nueva solicitud
                </Link>
              </div>
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
                Cargando solicitudes...
              </div>
            ) : requests.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white px-6 py-10 text-sm text-slate-500 shadow-sm">
                Todavia no creaste solicitudes. Usa `Dashboard` para publicar la primera.
              </div>
            ) : (
              requests.map((request) => (
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
                      <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
                        {request.description}
                      </p>
                    </div>

                    <div className="flex flex-col items-start gap-2 lg:items-end">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${getRequestStatusStyles(request.status)}`}
                      >
                        {request.status}
                      </span>
                      <span className="text-sm text-slate-500">
                        Fecha limite: {formatDate(request.dueDate)}
                      </span>
                      <span className="text-sm text-slate-500">
                        {request._count?.quotes ?? 0} cotizaciones
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                      href={`/dashboard/comprador/solicitudes/${request.id}`}
                    >
                      Ver detalle
                    </Link>
                    <Link
                      className="rounded-full border border-violet-200 px-4 py-2 text-sm font-semibold text-violet-700"
                      href={
                        request.status === 'ORDER_ISSUED' ||
                        request.status === 'NEGOTIATING' ||
                        request.status === 'AWARDED'
                          ? '/dashboard/comprador/pedidos'
                          : '/dashboard/comprador'
                      }
                    >
                      {request.awardedQuoteId ? 'Ver pedido' : 'Volver al dashboard'}
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
