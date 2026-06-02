'use client';

import { useState } from 'react';
import DashboardSidebar from '@/components/dashboard/dashboard-sidebar';
import { atarApi, type OrderFulfillmentStatus } from '@/lib/atar-api';
import { useSupplierDashboardData } from '@/lib/dashboard-hooks';

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

function getNextFulfillmentAction(status: OrderFulfillmentStatus) {
  if (status === 'ISSUED') {
    return { action: 'CONFIRM_ORDER' as const, label: 'Confirmar orden' };
  }

  if (status === 'CONFIRMED') {
    return { action: 'START_PRODUCTION' as const, label: 'Iniciar produccion' };
  }

  if (status === 'IN_PRODUCTION') {
    return { action: 'MARK_DISPATCHED' as const, label: 'Marcar despacho' };
  }

  if (status === 'DISPATCHED') {
    return { action: 'MARK_DELIVERED' as const, label: 'Marcar entrega' };
  }

  return null;
}

export default function SupplierOrdersPage() {
  const { session, myQuotes, loading, error, setError, refresh } = useSupplierDashboardData();
  const [message, setMessage] = useState<string | null>(null);
  const [updatingFulfillmentId, setUpdatingFulfillmentId] = useState<string | null>(null);

  const awardedOrders = myQuotes.filter(
    (quote) => quote.status === 'AWARDED' && quote.request?.order,
  );

  async function handleUpdateFulfillment(
    requestId: string,
    action: 'CONFIRM_ORDER' | 'START_PRODUCTION' | 'MARK_DISPATCHED' | 'MARK_DELIVERED',
  ) {
    if (!session?.accessToken) {
      return;
    }

    try {
      setUpdatingFulfillmentId(requestId);
      setError(null);
      setMessage(null);
      await atarApi.updateFulfillment(requestId, { action }, session.accessToken);
      await refresh();
      setMessage('Pedido actualizado correctamente.');
    } catch (fulfillmentError) {
      setError(
        fulfillmentError instanceof Error
          ? fulfillmentError.message
          : 'No se pudo actualizar el pedido.',
      );
    } finally {
      setUpdatingFulfillmentId(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[0.22fr_0.78fr] lg:px-10">
        <DashboardSidebar role="supplier" session={session} />

        <section className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Operaciones ganadas</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Pedidos
            </h1>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Gestiona el cumplimiento de las ordenes donde tu cotizacion fue adjudicada.
            </p>
          </div>

          {error ? (
            <div className="rounded-[1.5rem] bg-rose-100 px-5 py-4 text-sm text-rose-800">
              {error}
            </div>
          ) : null}
          {message ? (
            <div className="rounded-[1.5rem] bg-emerald-100 px-5 py-4 text-sm text-emerald-800">
              {message}
            </div>
          ) : null}

          <div className="grid gap-4">
            {loading ? (
              <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-8 text-sm text-slate-500 shadow-sm">
                Cargando pedidos...
              </div>
            ) : awardedOrders.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white px-6 py-10 text-sm text-slate-500 shadow-sm">
                Aun no tienes pedidos adjudicados.
              </div>
            ) : (
              awardedOrders.map((quote) => {
                const nextAction = getNextFulfillmentAction(
                  quote.request!.order!.fulfillmentStatus,
                );

                return (
                  <article
                    key={quote.id}
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
                          Orden {quote.request?.order?.orderNumber} con fecha prometida{' '}
                          {formatDate(quote.request?.order?.promisedDate ?? null)}.
                        </p>
                      </div>
                      <div className="rounded-[1.5rem] bg-slate-50 p-4 text-sm text-slate-600">
                        <p>
                          Cumplimiento:{' '}
                          <span className="font-semibold text-slate-950">
                            {getFulfillmentLabel(quote.request!.order!.fulfillmentStatus)}
                          </span>
                        </p>
                        <p className="mt-1">
                          Notas:{' '}
                          <span className="font-semibold text-slate-950">
                            {quote.request?.order?.notes ?? 'Sin notas'}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      {nextAction ? (
                        <button
                          className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={updatingFulfillmentId === quote.requestId}
                          onClick={() =>
                            void handleUpdateFulfillment(quote.requestId, nextAction.action)
                          }
                          type="button"
                        >
                          {updatingFulfillmentId === quote.requestId
                            ? 'Actualizando...'
                            : nextAction.label}
                        </button>
                      ) : (
                        <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-800">
                          Cumplimiento completo
                        </span>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
