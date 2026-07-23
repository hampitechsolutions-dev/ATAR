'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
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
  const [mobileTab, setMobileTab] = useState<'productos' | 'capacidades' | 'certificaciones'>('productos');

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

  const leadRows = catalogRows.filter((row) => typeof row.avgLead === 'number');
  const avgLeadOverall =
    leadRows.length === 0
      ? null
      : Math.round(leadRows.reduce((sum, row) => sum + (row.avgLead ?? 0), 0) / leadRows.length);

  const mobileTabs = [
    { key: 'productos' as const, label: 'Productos' },
    { key: 'capacidades' as const, label: 'Capacidades' },
    { key: 'certificaciones' as const, label: 'Certificaciones' },
  ];

  return (
    <SupplierDashboardShell searchPlaceholder="Buscar productos, categorias o materiales..." session={session}>
      {/* ==================== VISTA MOBILE ==================== */}
      <div className="lg:hidden pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Productos y capacidades</h1>

        {/* Tabs */}
        <div className="mt-4 flex items-center gap-5 border-b border-slate-200">
          {mobileTabs.map((tab) => {
            const active = mobileTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setMobileTab(tab.key)}
                className={`relative -mb-px pb-3 text-sm font-semibold transition ${
                  active ? 'text-slate-950' : 'text-slate-400'
                }`}
              >
                {tab.label}
                {active ? <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-indigo-600" /> : null}
              </button>
            );
          })}
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {/* PRODUCTOS */}
        {mobileTab === 'productos' ? (
          <div className="mt-4">
            <Link
              href="/dashboard/proveedor/configuracion"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
              </svg>
              Agregar producto
            </Link>

            <div className="mt-3 space-y-3">
              {loading ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
                  Cargando catálogo...
                </div>
              ) : catalogRows.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
                  Todavía no hay líneas de producto con actividad.
                </div>
              ) : (
                catalogRows.map((row) => {
                  const active = row.quotes > 0;
                  return (
                    <article
                      key={row.category}
                      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                          <path d="M3.3 7.3L12 12l8.7-4.7M12 22V12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                        </svg>
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-semibold text-slate-950">{row.category}</p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {row.quotes} cotizaciones · {row.avgLead === null ? 'lead s/d' : `${row.avgLead} días`}
                        </p>
                        <span
                          className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {active ? 'Activo' : 'Sin actividad'}
                        </span>
                      </div>

                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-400">
                        <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4 12.5-12.5z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                        </svg>
                      </span>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        ) : null}

        {/* CAPACIDADES */}
        {mobileTab === 'capacidades' ? (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              { label: 'Categorías activas', value: loading ? '—' : metrics.categories },
              { label: 'Lead time promedio', value: loading ? '—' : avgLeadOverall === null ? 's/d' : `${avgLeadOverall} días` },
              { label: 'Oportunidades abiertas', value: loading ? '—' : metrics.openOpportunities },
              { label: 'Ingreso estimado', value: loading ? '—' : formatCurrency(metrics.estimatedRevenue) },
            ].map((card) => (
              <article key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-lg font-bold tracking-tight text-slate-950">{card.value}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">{card.label}</p>
              </article>
            ))}
          </div>
        ) : null}

        {/* CERTIFICACIONES */}
        {mobileTab === 'certificaciones' ? (
          <div className="mt-4">
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path d="M12 15a4 4 0 100-8 4 4 0 000 8zM8.2 13.5L7 22l5-3 5 3-1.2-8.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-950">Sin certificaciones cargadas</p>
              <p className="mt-1 text-xs text-slate-500">Sumá tus certificaciones para ganar más confianza con los compradores.</p>
              <Link
                href="/dashboard/proveedor/configuracion"
                className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white"
              >
                Agregar certificación
              </Link>
            </div>
          </div>
        ) : null}
      </div>

      {/* ==================== VISTA DESKTOP ==================== */}
      <section className="hidden space-y-4 lg:block">
        <div className="rounded-[24px] border border-[#e7eaf3] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
          <h1 className="text-[24px] font-semibold tracking-[-0.03em] text-[#1f2373] sm:text-[32px]">
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

        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <article className="rounded-[22px] border border-[#e7eaf3] bg-white p-5">
            <p className="text-xs font-semibold text-[#8b92bc]">Categorias activas</p>
            <p className="mt-2 text-[22px] font-semibold text-[#1f2373] sm:text-[28px]">
              {loading ? '-' : metrics.categories}
            </p>
          </article>
          <article className="rounded-[22px] border border-[#e7eaf3] bg-white p-5">
            <p className="text-xs font-semibold text-[#8b92bc]">Cotizaciones asociadas</p>
            <p className="mt-2 text-[22px] font-semibold text-[#1f2373] sm:text-[28px]">
              {loading ? '-' : metrics.activeQuotes}
            </p>
          </article>
          <article className="rounded-[22px] border border-[#e7eaf3] bg-white p-5">
            <p className="text-xs font-semibold text-[#8b92bc]">Oportunidades abiertas</p>
            <p className="mt-2 text-[22px] font-semibold text-[#1f2373] sm:text-[28px]">
              {loading ? '-' : metrics.openOpportunities}
            </p>
          </article>
          <article className="rounded-[22px] border border-[#e7eaf3] bg-white p-5">
            <p className="text-xs font-semibold text-[#8b92bc]">Ingreso estimado</p>
            <p className="mt-2 text-[22px] font-semibold text-[#1f2373] sm:text-[28px]">
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
                  className="grid grid-cols-1 gap-4 rounded-[18px] border border-[#edf0fb] bg-[#fbfbff] p-4 md:grid-cols-[1.2fr_repeat(4,0.6fr)] md:items-center"
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
