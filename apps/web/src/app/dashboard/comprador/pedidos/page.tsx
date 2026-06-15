'use client';

import Link from 'next/link';
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardHero,
  DashboardSectionHeading,
  DashboardShell,
  DashboardStatCard,
  dashboardSecondaryButtonClassName,
} from '@/components/dashboard/dashboard-ui';
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
    <DashboardShell role="buyer" session={session}>
      <DashboardHero
        actions={
          <button className={dashboardSecondaryButtonClassName} onClick={() => void refresh()} type="button">
            Actualizar
          </button>
        }
        description="Consolida solicitudes adjudicadas, ordenes emitidas y avance operativo en una vista consistente con toda la experiencia ATAR."
        eyebrow="Seguimiento comercial"
        title={
          <>
            Pedidos y <span className="text-indigo-600">cumplimiento</span>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <DashboardStatCard helper="En curso" label="Pedidos visibles" value={orders.length} />
        <DashboardStatCard
          helper="Con orden emitida"
          label="Ordenes activas"
          value={orders.filter((request) => request.order?.orderNumber).length}
        />
        <DashboardStatCard
          helper="Con proveedor"
          label="Solicitudes adjudicadas"
          value={orders.filter((request) => request.awardedQuoteId).length}
        />
      </div>

      {error ? (
        <div className="rounded-[1.5rem] bg-rose-100 px-5 py-4 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4">
        {loading ? (
          <DashboardEmptyState description="Estamos cargando tus pedidos." title="Cargando pedidos..." />
        ) : orders.length === 0 ? (
          <DashboardEmptyState
            description="Todavia no hay pedidos adjudicados."
            title="Sin pedidos activos"
          />
        ) : (
          orders.map((request) => (
            <DashboardCard key={request.id}>
              <DashboardSectionHeading
                action={
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
                }
                title={
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      {request.category}
                    </p>
                    <span className="mt-2 block text-xl font-semibold text-slate-950">
                      {request.title}
                    </span>
                    <span className="mt-2 block text-sm leading-7 text-slate-600">
                      Proveedor adjudicado:{' '}
                      {request.awardedQuote?.supplierCompany?.name ?? 'Sin definir'}
                    </span>
                  </div>
                }
              />

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Estado del pedido</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">{request.status}</p>
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
                  className="inline-flex items-center justify-center rounded-full border border-indigo-200 bg-indigo-50 px-5 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
                  href={`/dashboard/comprador/solicitudes/${request.id}`}
                >
                  Abrir seguimiento
                </Link>
              </div>
            </DashboardCard>
          ))
        )}
      </div>
    </DashboardShell>
  );
}
