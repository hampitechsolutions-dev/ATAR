'use client';

import {
  DashboardCard,
  DashboardEmptyState,
  DashboardHero,
  DashboardShell,
} from '@/components/dashboard/dashboard-ui';
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
    <DashboardShell role="supplier" session={session}>
      <DashboardHero
        description="Resume las solicitudes donde ya participas con una cotización enviada y deja visible la relación entre el estado del pedido y el de tu propuesta."
        eyebrow="Seguimiento comercial"
        title={
          <>
            Solicitudes con <span className="text-indigo-600">participación activa</span>
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
            description="Estamos cargando las solicitudes donde participas."
            title="Cargando solicitudes..."
          />
        ) : requests.length === 0 ? (
          <DashboardEmptyState
            description="Todavia no participas en solicitudes."
            title="Sin solicitudes participadas"
          />
        ) : (
          requests.map((quote) => (
            <DashboardCard key={quote.requestId}>
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
            </DashboardCard>
          ))
        )}
      </div>
    </DashboardShell>
  );
}
