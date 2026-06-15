'use client';

import { useState } from 'react';
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardHero,
  DashboardShell,
  DashboardStatCard,
  dashboardPrimaryButtonClassName,
} from '@/components/dashboard/dashboard-ui';
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
    <DashboardShell role="supplier" session={session}>
      <DashboardHero
        description="Gestiona el cumplimiento de las ordenes donde tu cotizacion fue adjudicada manteniendo la misma estetica operativa del panel principal."
        eyebrow="Operaciones ganadas"
        title={
          <>
            Pedidos y <span className="text-indigo-600">seguimiento operativo</span>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <DashboardStatCard helper="Ganados" label="Pedidos adjudicados" value={awardedOrders.length} />
        <DashboardStatCard
          helper="Con orden"
          label="Ordenes emitidas"
          value={awardedOrders.filter((quote) => quote.request?.order?.orderNumber).length}
        />
        <DashboardStatCard
          helper="En cumplimiento"
          label="Con accion pendiente"
          value={
            awardedOrders.filter((quote) =>
              quote.request?.order
                ? getNextFulfillmentAction(quote.request.order.fulfillmentStatus)
                : null,
            ).length
          }
        />
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
          <DashboardEmptyState description="Estamos cargando tus pedidos." title="Cargando pedidos..." />
        ) : awardedOrders.length === 0 ? (
          <DashboardEmptyState
            description="Aun no tienes pedidos adjudicados."
            title="Sin pedidos activos"
          />
        ) : (
          awardedOrders.map((quote) => {
            const nextAction = getNextFulfillmentAction(
              quote.request!.order!.fulfillmentStatus,
            );

            return (
              <DashboardCard key={quote.id}>
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
                      className={dashboardPrimaryButtonClassName}
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
              </DashboardCard>
            );
          })
        )}
      </div>
    </DashboardShell>
  );
}
