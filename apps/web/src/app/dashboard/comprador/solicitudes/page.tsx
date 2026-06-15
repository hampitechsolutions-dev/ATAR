'use client';

import Link from 'next/link';
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardHero,
  DashboardSectionHeading,
  DashboardShell,
  dashboardPrimaryButtonClassName,
  dashboardSecondaryButtonClassName,
} from '@/components/dashboard/dashboard-ui';
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
    <DashboardShell role="buyer" session={session}>
      <DashboardHero
        actions={
          <>
            <button className={dashboardSecondaryButtonClassName} onClick={() => void refresh()} type="button">
              Actualizar
            </button>
            <Link className={dashboardPrimaryButtonClassName} href="/dashboard/comprador">
              Nueva solicitud
            </Link>
          </>
        }
        description="Revisa el estado de cada solicitud, compara avance comercial y entra al detalle cuando ya existan propuestas."
        eyebrow="Operacion de compra"
        title={
          <>
            Mis solicitudes y <span className="text-indigo-600">estado comercial</span>
          </>
        }
      />

      {error ? (
        <div className="rounded-[1.5rem] bg-rose-100 px-5 py-4 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4">
        {loading ? (
          <DashboardEmptyState
            description="Estamos preparando tus solicitudes."
            title="Cargando solicitudes..."
          />
        ) : requests.length === 0 ? (
          <DashboardEmptyState
            description="Todavia no creaste solicitudes. Usa Dashboard para publicar la primera."
            title="Sin solicitudes cargadas"
          />
        ) : (
          requests.map((request) => (
            <DashboardCard key={request.id}>
              <DashboardSectionHeading
                action={
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
                }
                title={
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      {request.category}
                    </p>
                    <span className="mt-2 block text-xl font-semibold text-slate-950">
                      {request.title}
                    </span>
                  </div>
                }
              />
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
                {request.description}
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  className={dashboardSecondaryButtonClassName}
                  href={`/dashboard/comprador/solicitudes/${request.id}`}
                >
                  Ver detalle
                </Link>
                <Link
                  className="inline-flex items-center justify-center rounded-full border border-indigo-200 bg-indigo-50 px-5 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
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
            </DashboardCard>
          ))
        )}
      </div>
    </DashboardShell>
  );
}
