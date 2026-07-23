'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import SupplierDashboardShell from '@/components/dashboard/supplier-dashboard-shell';
import { atarApi, type OrderFulfillmentStatus } from '@/lib/atar-api';
import { useSupplierDashboardData } from '@/lib/dashboard-hooks';

function formatCurrency(value: number | null | undefined) {
  if (typeof value !== 'number') {
    return 'A consultar';
  }
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value);
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return 'A coordinar';
  }
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

const STATUS_ORDER: OrderFulfillmentStatus[] = ['ISSUED', 'CONFIRMED', 'IN_PRODUCTION', 'DISPATCHED', 'DELIVERED'];

const TIMELINE_STEPS: { label: string; reached: OrderFulfillmentStatus }[] = [
  { label: 'Confirmado', reached: 'CONFIRMED' },
  { label: 'Producción', reached: 'IN_PRODUCTION' },
  { label: 'Enviado', reached: 'DISPATCHED' },
  { label: 'Entregado', reached: 'DELIVERED' },
];

function getNextFulfillmentAction(status: OrderFulfillmentStatus) {
  if (status === 'ISSUED') {
    return { action: 'CONFIRM_ORDER' as const, label: 'Confirmar pedido' };
  }
  if (status === 'CONFIRMED') {
    return { action: 'START_PRODUCTION' as const, label: 'Iniciar producción' };
  }
  if (status === 'IN_PRODUCTION') {
    return { action: 'MARK_DISPATCHED' as const, label: 'Marcar en tránsito' };
  }
  if (status === 'DISPATCHED') {
    return { action: 'MARK_DELIVERED' as const, label: 'Marcar entregado' };
  }
  return null;
}

function stageLabel(status: OrderFulfillmentStatus) {
  return status === 'ISSUED'
    ? 'Pendiente'
    : status === 'CONFIRMED'
      ? 'Confirmado'
      : status === 'IN_PRODUCTION'
        ? 'En producción'
        : status === 'DISPATCHED'
          ? 'En tránsito'
          : 'Entregado';
}

export default function SupplierOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const requestId = typeof params.id === 'string' ? params.id : '';

  const { session, myQuotes, loading, error, setError, refresh } = useSupplierDashboardData();
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const quote = useMemo(
    () => myQuotes.find((item) => item.requestId === requestId && item.request?.order) ?? null,
    [myQuotes, requestId],
  );

  const order = quote?.request?.order ?? null;
  const request = quote?.request ?? null;
  const buyerName = request?.buyerCompany?.name ?? 'Comprador';
  const buyerLocation =
    [request?.buyerCompany?.city, request?.buyerCompany?.country].filter(Boolean).join(', ') || 'No informada';

  const currentIndex = order ? STATUS_ORDER.indexOf(order.fulfillmentStatus) : -1;
  const nextAction = order ? getNextFulfillmentAction(order.fulfillmentStatus) : null;

  async function handleAdvance() {
    if (!session?.accessToken || !order || !nextAction) {
      return;
    }
    try {
      setUpdating(true);
      setError(null);
      setMessage(null);
      await atarApi.updateFulfillment(requestId, { action: nextAction.action }, session.accessToken);
      await refresh();
      setMessage('Pedido actualizado correctamente.');
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'No se pudo actualizar el pedido.');
    } finally {
      setUpdating(false);
    }
  }

  const infoRows = order
    ? [
        { label: 'Cliente', value: buyerName },
        { label: 'Producto', value: request?.title ?? 'Pedido' },
        { label: 'Total', value: formatCurrency(quote?.amount) },
        { label: 'Entrega estimada', value: formatDate(order.promisedDate) },
        { label: 'Dirección', value: buyerLocation },
      ]
    : [];

  return (
    <SupplierDashboardShell session={session}>
      <div className="mx-auto w-full max-w-2xl pb-28 lg:pb-0">
        {/* Encabezado */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Volver"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700"
          >
            <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-500">Detalle del pedido</p>
            <h1 className="truncate text-lg font-bold tracking-tight text-slate-950">
              {order ? `Pedido ${order.orderNumber}` : 'Pedido'}
            </h1>
          </div>
          {order ? (
            <span className="shrink-0 rounded-full bg-sky-50 px-3 py-1 text-[11px] font-semibold text-sky-600">
              {stageLabel(order.fulfillmentStatus)}
            </span>
          ) : null}
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : null}
        {message ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        ) : null}

        {loading && !order ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
            Cargando pedido...
          </div>
        ) : !order || !request ? (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
            No se encontró el pedido.
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm text-slate-500">{buyerName}</p>

            {/* Timeline */}
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                {TIMELINE_STEPS.map((step, index) => {
                  const stepIndex = STATUS_ORDER.indexOf(step.reached);
                  const done = currentIndex >= stepIndex;
                  const isLast = index === TIMELINE_STEPS.length - 1;
                  return (
                    <div key={step.label} className="relative flex flex-1 flex-col items-center">
                      {!isLast ? (
                        <span
                          className={`absolute left-1/2 top-4 h-0.5 w-full ${
                            currentIndex > stepIndex ? 'bg-indigo-600' : 'bg-slate-200'
                          }`}
                        />
                      ) : null}
                      <span
                        className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                          done ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {done ? (
                          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <path d="M5 12l5 5L20 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                          </svg>
                        ) : (
                          index + 1
                        )}
                      </span>
                      <span className={`mt-2 text-center text-[11px] font-semibold ${done ? 'text-slate-900' : 'text-slate-400'}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Información */}
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-bold text-slate-950">Información del pedido</p>
              <dl className="mt-3 divide-y divide-slate-100">
                {infoRows.map((row) => (
                  <div key={row.label} className="flex items-start justify-between gap-4 py-2.5">
                    <dt className="shrink-0 text-xs text-slate-500">{row.label}</dt>
                    <dd className="text-right text-sm font-medium text-slate-900">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Documentos */}
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-bold text-slate-950">Documentos</p>
              {order.notes ? (
                <p className="mt-2 text-sm text-slate-600">{order.notes}</p>
              ) : (
                <p className="mt-2 text-sm text-slate-500">No hay documentos adjuntos para este pedido.</p>
              )}
            </div>

            {/* Ver conversación */}
            <Link
              href="/dashboard/proveedor/mensajes"
              className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                <path d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4v8z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
              Ver conversación
            </Link>
          </>
        )}
      </div>

      {/* Acción de avance (fija en mobile) */}
      {order && nextAction ? (
        <div className="fixed inset-x-0 bottom-[68px] z-30 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:static lg:mt-6 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0">
          <div className="mx-auto w-full max-w-2xl">
            <button
              type="button"
              disabled={updating}
              onClick={() => void handleAdvance()}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-indigo-600 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
            >
              {updating ? 'Actualizando...' : nextAction.label}
            </button>
          </div>
        </div>
      ) : null}
    </SupplierDashboardShell>
  );
}
