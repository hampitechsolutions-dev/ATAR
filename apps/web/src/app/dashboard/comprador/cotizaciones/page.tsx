'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { LoadingState } from '@/components/ui/spinner';
import { type RequestRecord } from '@/lib/atar-api';
import { useBuyerDashboardData } from '@/lib/dashboard-hooks';
import { formatRequestCode } from '@/lib/request-code';
import { FALLBACK_REQUEST_CATEGORIES } from '@/lib/request-catalog-fallback';

function formatCurrency(value: number | null | undefined) {
  if (typeof value !== 'number') {
    return 'A convenir';
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
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

// Imagen de la categoría de la solicitud, para las tarjetas mobile.
function requestImage(request: RequestRecord) {
  const labels = [request.items?.[0]?.category, request.category].filter(Boolean);
  for (const label of labels) {
    const match = FALLBACK_REQUEST_CATEGORIES.find((category) => category.label === label);
    if (match?.imageSrc) return match.imageSrc;
  }
  return '/logoatar.png';
}

/** Menor monto entre las cotizaciones recibidas (las que informan precio). */
function bestOffer(request: RequestRecord) {
  const amounts = (request.quotes ?? []).map((quote) => quote.amount).filter((amount): amount is number => typeof amount === 'number');
  return amounts.length > 0 ? Math.min(...amounts) : null;
}

type MobileTab = 'ALL' | 'PENDING' | 'AWARDED';

export default function BuyerQuotesPage() {
  const { requests, loading, error } = useBuyerDashboardData();
  const [search, setSearch] = useState('');
  const [mobileTab, setMobileTab] = useState<MobileTab>('ALL');

  const quotedRequests = useMemo(() => {
    return requests
      .filter((request) => (request._count?.quotes ?? 0) > 0)
      .filter((request) => {
        const query = search.trim().toLowerCase();
        if (!query) {
          return true;
        }

        const provider = request.awardedQuote?.supplierCompany?.name ?? '';
        return (
          request.title.toLowerCase().includes(query) ||
          request.category.toLowerCase().includes(query) ||
          provider.toLowerCase().includes(query)
        );
      });
  }, [requests, search]);

  const awardedCount = quotedRequests.filter((request) => request.awardedQuoteId).length;
  const totalQuotes = quotedRequests.reduce((acc, request) => acc + (request._count?.quotes ?? 0), 0);

  const mobileRequests = quotedRequests.filter((request) =>
    mobileTab === 'ALL' ? true : mobileTab === 'AWARDED' ? Boolean(request.awardedQuoteId) : !request.awardedQuoteId,
  );

  return (
    <div>
      {/* ==================== VISTA MOBILE ==================== */}
      <div className="pb-4 lg:hidden">
        <h1 className="text-[26px] font-bold leading-tight tracking-[-0.03em] text-slate-950">Cotizaciones</h1>
        <p className="mt-1 text-[13px] text-slate-500">Compará propuestas y seguí cada respuesta de proveedor.</p>

        <div className="relative mt-4">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
              <path d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          </span>
          <input
            className="h-11 w-full rounded-[12px] border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-indigo-400"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por solicitud o proveedor..."
            value={search}
          />
        </div>

        <div className="-mx-3 mt-1.5 flex gap-2 overflow-x-auto px-3 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[
            { key: 'ALL' as const, label: 'Todas', count: quotedRequests.length },
            { key: 'PENDING' as const, label: 'Por decidir', count: quotedRequests.length - awardedCount },
            { key: 'AWARDED' as const, label: 'Adjudicadas', count: awardedCount },
          ].map((tab) => {
            const active = mobileTab === tab.key;
            return (
              <button
                key={tab.key}
                className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-[10px] px-3.5 text-[13px] font-semibold transition ${
                  active ? 'bg-indigo-600 text-white shadow-[0_8px_18px_rgba(79,70,229,0.28)]' : 'bg-white text-slate-600 ring-1 ring-slate-200'
                }`}
                onClick={() => setMobileTab(tab.key)}
                type="button"
              >
                {tab.label}
                <span className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] ${active ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {error ? <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-100 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

        <div className="mt-4 space-y-3" data-tour="quotes-list">
          {loading ? (
            <div className="rounded-[18px] border border-dashed border-slate-300 bg-white px-4 py-10">
              <LoadingState label="Cargando cotizaciones..." />
            </div>
          ) : mobileRequests.length === 0 ? (
            <div className="rounded-[18px] border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
              {quotedRequests.length === 0 ? 'Todavía no tenés cotizaciones para mostrar.' : 'No hay cotizaciones en este filtro.'}
            </div>
          ) : (
            mobileRequests.map((request) => {
              const quotes = request._count?.quotes ?? 0;
              const awarded = Boolean(request.awardedQuoteId);
              const supplier = request.awardedQuote?.supplierCompany?.name;
              return (
                <Link
                  key={request.id}
                  className="block rounded-[18px] border border-slate-300 bg-white p-3.5 shadow-[0_6px_20px_rgba(15,23,42,0.07)] transition active:scale-[0.99]"
                  href={`/dashboard/comprador/solicitudes/${request.id}`}
                >
                  <div className="flex gap-3">
                    <span className="relative h-[76px] w-[76px] shrink-0 overflow-hidden rounded-[12px] bg-slate-100">
                      <Image alt="" className="object-cover" fill sizes="76px" src={requestImage(request)} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-md bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-indigo-600">
                          {request.category}
                        </span>
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] ${
                            awarded ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {awarded ? 'Adjudicada' : 'Por decidir'}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[15px] font-bold leading-5 tracking-[-0.01em] text-slate-950">{request.title}</p>
                      <p className="mt-0.5 truncate text-[12px] text-slate-500">
                        {awarded && supplier ? supplier : formatRequestCode(request.id)}
                      </p>
                    </div>
                    <span className="self-center text-slate-400">
                      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <path d="M9 18l6-6-6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 divide-x divide-[#cfdcf7] rounded-[12px] bg-[#eef3ff] py-2 text-center">
                    <span className="px-1">
                      <span className="block text-[10px] text-slate-500">Propuestas</span>
                      <span className="block truncate text-[12px] font-semibold text-slate-900">{quotes}</span>
                    </span>
                    <span className="px-1">
                      <span className="block text-[10px] text-slate-500">{awarded ? 'Monto adjudicado' : 'Mejor oferta'}</span>
                      <span className="block truncate text-[12px] font-semibold text-slate-900">
                        {formatCurrency(awarded ? request.awardedQuote?.amount : bestOffer(request))}
                      </span>
                    </span>
                    <span className="px-1">
                      <span className="block text-[10px] text-slate-500">Actualizada</span>
                      <span className="block truncate text-[12px] font-semibold text-slate-900">
                        {new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(request.updatedAt))}
                      </span>
                    </span>
                  </div>
                  <span className="mt-3 flex h-9 items-center justify-center rounded-[10px] bg-indigo-100 text-[13px] font-semibold text-indigo-700">
                    {awarded ? 'Ver detalle' : 'Comparar propuestas'}
                  </span>
                </Link>
              );
            })
          )}
        </div>
      </div>

      {/* ==================== VISTA DESKTOP ==================== */}
      <div className="hidden space-y-6 lg:block">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Cotizaciones</h1>
          <p className="mt-1 text-sm text-slate-500">Compará propuestas y seguí cada respuesta de proveedor</p>
        </div>

        <div className="flex w-full items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-2.5 shadow-sm lg:w-[320px]">
          <svg aria-hidden="true" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24">
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            <path d="M11 19a8 8 0 100-16 8 8 0 000 16z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
          <input
            className="w-full bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por solicitud o proveedor..."
            value={search}
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-100 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {/* Una sola lista: sin tarjetas de métricas ni recuadros dentro de cada fila. */}
      <p className="text-sm text-slate-500">
        {quotedRequests.length} {quotedRequests.length === 1 ? 'solicitud cotizada' : 'solicitudes cotizadas'} · {totalQuotes}{' '}
        {totalQuotes === 1 ? 'cotización recibida' : 'cotizaciones recibidas'} · {awardedCount}{' '}
        {awardedCount === 1 ? 'adjudicada' : 'adjudicadas'}
      </p>

      <section className="rounded-2xl border border-slate-300 bg-white shadow-sm" data-tour="quotes-list">
        {loading ? (
          <div className="px-5 py-8">
            <LoadingState label="Cargando cotizaciones..." />
          </div>
        ) : quotedRequests.length === 0 ? (
          <p className="px-5 py-10 text-sm text-slate-500">Todavía no tenés cotizaciones para mostrar.</p>
        ) : (
          <ul className="divide-y divide-slate-200">
            {quotedRequests.map((request) => {
              const quotes = request._count?.quotes ?? 0;
              const awarded = Boolean(request.awardedQuoteId);
              return (
                <li key={request.id} className="even:bg-[#eef1f7] last:rounded-b-[inherit] grid grid-cols-[56px_minmax(0,1.6fr)_minmax(0,0.7fr)_minmax(0,0.8fr)_minmax(0,0.7fr)_210px] items-center gap-5 px-5 py-4">
                  <span className="relative h-14 w-14 overflow-hidden rounded-xl bg-slate-100">
                    <Image alt="" className="object-cover" fill sizes="56px" src={requestImage(request)} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold text-slate-950">{request.title}</p>
                    <p className="mt-0.5 truncate text-[13px] text-slate-500">
                      {request.category}
                      {request.awardedQuote?.supplierCompany?.name ? ` · Adjudicada a ${request.awardedQuote.supplierCompany.name}` : ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-[12px] text-slate-500">Propuestas</p>
                    <p className="text-[14px] font-semibold text-slate-950">{quotes}</p>
                  </div>
                  <div>
                    <p className="text-[12px] text-slate-500">{awarded ? 'Monto adjudicado' : 'Mejor oferta'}</p>
                    <p className="text-[14px] font-semibold text-slate-950">
                      {formatCurrency(awarded ? request.awardedQuote?.amount : bestOffer(request))}
                    </p>
                  </div>
                  <div>
                    <p className="text-[12px] text-slate-500">Actualizada</p>
                    <p className="text-[14px] font-semibold text-slate-950">{formatDate(request.updatedAt)}</p>
                  </div>
                  <div className="flex items-center justify-end gap-3">
                    <span className={`rounded-md px-2 py-1 text-[11px] font-semibold ${awarded ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {awarded ? 'Adjudicada' : 'Por decidir'}
                    </span>
                    <Link
                      className="inline-flex h-9 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-100 px-4 text-[13px] font-semibold text-indigo-700 hover:bg-indigo-100"
                      href={`/dashboard/comprador/solicitudes/${request.id}`}
                    >
                      {awarded ? 'Ver detalle' : 'Comparar'}
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      </div>
    </div>
  );
}
