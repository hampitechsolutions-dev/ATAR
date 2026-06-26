'use client';

import { useMemo } from 'react';
import SupplierDashboardShell from '@/components/dashboard/supplier-dashboard-shell';
import { type OrderFulfillmentStatus } from '@/lib/atar-api';
import { useSupplierDashboardData } from '@/lib/dashboard-hooks';

function formatDate(value: string | null) {
  if (!value) {
    return 'Sin fecha';
  }

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function getStageLabel(status: OrderFulfillmentStatus) {
  if (status === 'CONFIRMED') {
    return 'Pendiente';
  }
  if (status === 'IN_PRODUCTION') {
    return 'En produccion';
  }
  if (status === 'DISPATCHED') {
    return 'Despachado';
  }
  if (status === 'DELIVERED') {
    return 'Entregado';
  }
  return 'Emitido';
}

function getProgress(status: OrderFulfillmentStatus) {
  if (status === 'ISSUED') {
    return 10;
  }
  if (status === 'CONFIRMED') {
    return 30;
  }
  if (status === 'IN_PRODUCTION') {
    return 65;
  }
  if (status === 'DISPATCHED') {
    return 90;
  }
  return 100;
}

export default function SupplierProductionPage() {
  const { session, myQuotes, loading, error } = useSupplierDashboardData();

  const productionRows = useMemo(() => {
    return myQuotes
      .filter((quote) => quote.status === 'AWARDED' && quote.request?.order)
      .map((quote) => ({
        id: quote.request!.order!.id,
        orderNumber: quote.request!.order!.orderNumber,
        title: quote.request?.title ?? 'Orden sin titulo',
        company: quote.request?.buyerCompany?.name ?? 'Cliente',
        promisedDate: formatDate(quote.request?.order?.promisedDate ?? null),
        stage: getStageLabel(quote.request!.order!.fulfillmentStatus),
        progress: getProgress(quote.request!.order!.fulfillmentStatus),
        notes: quote.request?.order?.notes ?? 'Sin notas operativas',
      }))
      .sort((left, right) => right.progress - left.progress);
  }, [myQuotes]);

  const metrics = useMemo(() => {
    return {
      pending: productionRows.filter((row) => row.progress <= 30).length,
      active: productionRows.filter((row) => row.progress > 30 && row.progress < 100).length,
      delivered: productionRows.filter((row) => row.progress === 100).length,
    };
  }, [productionRows]);

  return (
    <SupplierDashboardShell searchPlaceholder="Buscar ordenes, clientes o estado..." session={session}>
      <section className="space-y-4">
        <div className="rounded-[24px] border border-[#e7eaf3] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
          <h1 className="text-[32px] font-semibold tracking-[-0.03em] text-[#1f2373]">
            Produccion
          </h1>
          <p className="mt-1 text-sm text-[#7e85b2]">
            Segui el avance operativo de cada orden adjudicada.
          </p>
        </div>

        {error ? (
          <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-[22px] border border-[#e7eaf3] bg-white p-5">
            <p className="text-xs font-semibold text-[#8b92bc]">Pendientes</p>
            <p className="mt-2 text-[28px] font-semibold text-[#1f2373]">
              {loading ? '-' : metrics.pending}
            </p>
          </article>
          <article className="rounded-[22px] border border-[#e7eaf3] bg-white p-5">
            <p className="text-xs font-semibold text-[#8b92bc]">En proceso</p>
            <p className="mt-2 text-[28px] font-semibold text-[#1f2373]">
              {loading ? '-' : metrics.active}
            </p>
          </article>
          <article className="rounded-[22px] border border-[#e7eaf3] bg-white p-5">
            <p className="text-xs font-semibold text-[#8b92bc]">Entregadas</p>
            <p className="mt-2 text-[28px] font-semibold text-[#1f2373]">
              {loading ? '-' : metrics.delivered}
            </p>
          </article>
        </div>

        <div className="grid gap-3">
          {loading ? (
            <div className="rounded-[18px] border border-[#edf0fb] bg-white px-4 py-8 text-sm text-[#8d95be]">
              Cargando produccion...
            </div>
          ) : productionRows.length === 0 ? (
            <div className="rounded-[18px] border border-dashed border-[#d8ddee] bg-white px-4 py-8 text-sm text-[#8d95be]">
              Aun no hay ordenes en seguimiento productivo.
            </div>
          ) : (
            productionRows.map((row) => (
              <article
                key={row.id}
                className="rounded-[20px] border border-[#e7eaf3] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.04)]"
              >
                <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr_0.8fr] xl:items-center">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9aa1c8]">
                      {row.orderNumber}
                    </p>
                    <h2 className="mt-2 text-lg font-semibold text-[#33407a]">{row.title}</h2>
                    <p className="mt-1 text-sm text-[#7e85b2]">{row.company}</p>
                  </div>

                  <div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#edf0fb]">
                      <div
                        className="h-full rounded-full bg-[#5b4bff]"
                        style={{ width: `${row.progress}%` }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="font-semibold text-[#33407a]">{row.stage}</span>
                      <span className="text-[#8d95be]">{row.progress}%</span>
                    </div>
                  </div>

                  <div className="xl:text-right">
                    <p className="text-sm font-semibold text-[#33407a]">Entrega estimada</p>
                    <p className="mt-1 text-sm text-[#7e85b2]">{row.promisedDate}</p>
                    <p className="mt-2 text-xs text-[#9aa1c8]">{row.notes}</p>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </SupplierDashboardShell>
  );
}
