'use client';

import Link from 'next/link';
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardHero,
  DashboardShell,
} from '@/components/dashboard/dashboard-ui';
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
    <DashboardShell role="supplier" session={session}>
      <DashboardHero
        description="Consulta todas las propuestas enviadas, su resultado comercial y el estado del pedido asociado dentro de una vista coherente con todo el panel."
        eyebrow="Historial de propuestas"
        title={
          <>
            Cotizaciones y <span className="text-indigo-600">resultado comercial</span>
          </>
        }
      />

      {error ? (
        <div className="rounded-[1.5rem] bg-rose-100 px-5 py-4 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {loading ? (
          <div className="md:col-span-2">
            <DashboardEmptyState
              description="Estamos cargando tus propuestas."
              title="Cargando cotizaciones..."
            />
          </div>
        ) : myQuotes.length === 0 ? (
          <div className="md:col-span-2">
            <DashboardEmptyState
              description="No hay cotizaciones cargadas todavia."
              title="Sin cotizaciones"
            />
          </div>
        ) : (
          myQuotes.map((quote) => (
            <DashboardCard key={quote.id}>
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
              <Link
                className="mt-5 inline-flex items-center justify-center rounded-full border border-indigo-200 bg-indigo-50 px-5 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
                href={`/dashboard/proveedor/cotizaciones/${quote.id}`}
              >
                Ver detalle y chat
              </Link>
            </DashboardCard>
          ))
        )}
      </div>
    </DashboardShell>
  );
}
