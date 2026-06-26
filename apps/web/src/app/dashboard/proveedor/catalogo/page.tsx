'use client';

import { useMemo } from 'react';
import SupplierDashboardShell from '@/components/dashboard/supplier-dashboard-shell';
import { useSupplierDashboardData } from '@/lib/dashboard-hooks';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function SupplierCatalogPage() {
  const { session, myQuotes, openRequests, loading, error } = useSupplierDashboardData();

  const catalogRows = useMemo(() => {
    const byCategory = new Map<
      string,
      {
        category: string;
        quotes: number;
        opportunities: number;
        totalAmount: number;
        avgLead: number;
        leadCount: number;
      }
    >();

    myQuotes.forEach((quote) => {
      const category = quote.request?.category ?? 'Sin categoria';
      const current =
        byCategory.get(category) ?? {
          category,
          quotes: 0,
          opportunities: 0,
          totalAmount: 0,
          avgLead: 0,
          leadCount: 0,
        };

      current.quotes += 1;
      current.totalAmount += quote.amount ?? 0;
      if (typeof quote.leadTimeDays === 'number') {
        current.avgLead += quote.leadTimeDays;
        current.leadCount += 1;
      }
      byCategory.set(category, current);
    });

    openRequests.forEach((request) => {
      const category = request.category;
      const current =
        byCategory.get(category) ?? {
          category,
          quotes: 0,
          opportunities: 0,
          totalAmount: 0,
          avgLead: 0,
          leadCount: 0,
        };
      current.opportunities += 1;
      byCategory.set(category, current);
    });

    return Array.from(byCategory.values())
      .map((item) => ({
        ...item,
        avgLead: item.leadCount === 0 ? null : Math.round(item.avgLead / item.leadCount),
      }))
      .sort((left, right) => right.quotes - left.quotes || right.opportunities - left.opportunities);
  }, [myQuotes, openRequests]);

  const metrics = useMemo(() => {
    return {
      categories: catalogRows.length,
      activeQuotes: myQuotes.length,
      openOpportunities: openRequests.length,
      estimatedRevenue: catalogRows.reduce((sum, item) => sum + item.totalAmount, 0),
    };
  }, [catalogRows, myQuotes.length, openRequests.length]);

  return (
    <SupplierDashboardShell searchPlaceholder="Buscar productos, categorias o materiales..." session={session}>
      <section className="space-y-4">
        <div className="rounded-[24px] border border-[#e7eaf3] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
          <h1 className="text-[32px] font-semibold tracking-[-0.03em] text-[#1f2373]">
            Catalogo
          </h1>
          <p className="mt-1 text-sm text-[#7e85b2]">
            Organiza tu oferta por categoria y detecta donde hoy tenes mayor demanda.
          </p>
        </div>

        {error ? (
          <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-[22px] border border-[#e7eaf3] bg-white p-5">
            <p className="text-xs font-semibold text-[#8b92bc]">Categorias activas</p>
            <p className="mt-2 text-[28px] font-semibold text-[#1f2373]">
              {loading ? '-' : metrics.categories}
            </p>
          </article>
          <article className="rounded-[22px] border border-[#e7eaf3] bg-white p-5">
            <p className="text-xs font-semibold text-[#8b92bc]">Cotizaciones asociadas</p>
            <p className="mt-2 text-[28px] font-semibold text-[#1f2373]">
              {loading ? '-' : metrics.activeQuotes}
            </p>
          </article>
          <article className="rounded-[22px] border border-[#e7eaf3] bg-white p-5">
            <p className="text-xs font-semibold text-[#8b92bc]">Oportunidades abiertas</p>
            <p className="mt-2 text-[28px] font-semibold text-[#1f2373]">
              {loading ? '-' : metrics.openOpportunities}
            </p>
          </article>
          <article className="rounded-[22px] border border-[#e7eaf3] bg-white p-5">
            <p className="text-xs font-semibold text-[#8b92bc]">Ingreso estimado</p>
            <p className="mt-2 text-[28px] font-semibold text-[#1f2373]">
              {loading ? '-' : formatCurrency(metrics.estimatedRevenue)}
            </p>
          </article>
        </div>

        <div className="rounded-[24px] border border-[#e7eaf3] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-[#27305f]">Categorias del catalogo</h2>
              <p className="mt-1 text-sm text-[#8d95be]">
                Resumen comercial por rubro y performance actual.
              </p>
            </div>
            <button
              className="inline-flex h-9 items-center rounded-xl border border-[#e7eaf3] px-3 text-sm font-semibold text-[#5546ff]"
              type="button"
            >
              Nuevo item
            </button>
          </div>

          <div className="mt-4 grid gap-3">
            {loading ? (
              <div className="rounded-[18px] border border-[#edf0fb] bg-[#fbfbff] px-4 py-8 text-sm text-[#8d95be]">
                Cargando catalogo...
              </div>
            ) : catalogRows.length === 0 ? (
              <div className="rounded-[18px] border border-dashed border-[#d8ddee] bg-[#fbfbff] px-4 py-8 text-sm text-[#8d95be]">
                Aun no hay categorias activas para mostrar.
              </div>
            ) : (
              catalogRows.map((row) => (
                <article
                  key={row.category}
                  className="grid gap-4 rounded-[18px] border border-[#edf0fb] bg-[#fbfbff] p-4 md:grid-cols-[1.2fr_repeat(4,0.6fr)] md:items-center"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#33407a]">{row.category}</p>
                    <p className="mt-1 text-xs text-[#8d95be]">
                      {row.opportunities} oportunidades activas en marketplace
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[#9aa1c8]">
                      Cotizaciones
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#33407a]">{row.quotes}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[#9aa1c8]">
                      Ingreso
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#33407a]">
                      {formatCurrency(row.totalAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[#9aa1c8]">
                      Lead time
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#33407a]">
                      {row.avgLead === null ? '-' : `${row.avgLead} dias`}
                    </p>
                  </div>
                  <div className="md:text-right">
                    <button
                      className="inline-flex h-9 items-center justify-center rounded-xl border border-[#dde2f5] px-4 text-sm font-semibold text-[#5546ff]"
                      type="button"
                    >
                      Ver detalle
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </SupplierDashboardShell>
  );
}
