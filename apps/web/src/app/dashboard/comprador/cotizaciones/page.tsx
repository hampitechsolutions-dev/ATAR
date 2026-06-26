'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useBuyerDashboardData } from '@/lib/dashboard-hooks';

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

export default function BuyerQuotesPage() {
  const { requests, loading, error } = useBuyerDashboardData();
  const [search, setSearch] = useState('');

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Cotizaciones</h1>
          <p className="mt-1 text-sm text-slate-500">Compará propuestas y seguí cada respuesta de proveedor</p>
        </div>

        <div className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm lg:w-[320px]">
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
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Solicitudes cotizadas', value: quotedRequests.length, tone: 'bg-indigo-50 text-indigo-600' },
          { label: 'Cotizaciones recibidas', value: totalQuotes, tone: 'bg-violet-50 text-violet-600' },
          { label: 'Propuestas adjudicadas', value: awardedCount, tone: 'bg-emerald-50 text-emerald-600' },
        ].map((card) => (
          <article key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${card.tone}`}>
              <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                <path d="M14 2H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V8l-5-6z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                <path d="M14 2v6h6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </div>
            <p className="mt-4 text-2xl font-semibold text-slate-950">{card.value}</p>
            <p className="mt-1 text-xs font-semibold text-slate-950">{card.label}</p>
          </article>
        ))}
      </div>

      <section className="space-y-4">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-6 text-sm text-slate-500 shadow-sm">
            Cargando cotizaciones...
          </div>
        ) : quotedRequests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-10 text-sm text-slate-500 shadow-sm">
            Todavía no tenés cotizaciones para mostrar.
          </div>
        ) : (
          quotedRequests.map((request) => (
            <article key={request.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{request.category}</p>
                  <h2 className="mt-2 text-lg font-semibold text-slate-950">{request.title}</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    {request._count?.quotes ?? 0} propuestas recibidas
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <p>
                    Mejor oferta:{' '}
                    <span className="font-semibold text-slate-950">{formatCurrency(request.awardedQuote?.amount)}</span>
                  </p>
                  <p className="mt-1">
                    Actualizado:{' '}
                    <span className="font-semibold text-slate-950">{formatDate(request.updatedAt)}</span>
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 px-4 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
                  href={`/dashboard/comprador/solicitudes/${request.id}`}
                >
                  Ver comparativa
                </Link>
                <Link
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  href="/dashboard/comprador/pedidos"
                >
                  Ir a pedidos
                </Link>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
