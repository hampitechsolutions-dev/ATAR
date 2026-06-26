'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { atarApi, type RequestRecord } from '@/lib/atar-api';
import { useBuyerDashboardData } from '@/lib/dashboard-hooks';

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

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function getRequestStatusStyles(status: RequestRecord['status']) {
  if (status === 'ORDER_ISSUED') {
    return 'bg-indigo-100 text-indigo-700';
  }

  if (status === 'NEGOTIATING') {
    return 'bg-emerald-100 text-emerald-700';
  }

  if (status === 'AWARDED') {
    return 'bg-emerald-100 text-emerald-700';
  }

  if (status === 'REVIEWING') {
    return 'bg-amber-100 text-amber-700';
  }

  if (status === 'CANCELLED') {
    return 'bg-rose-100 text-rose-700';
  }

  return 'bg-indigo-100 text-indigo-700';
}

export default function BuyerRequestsPage() {
  const { session, requests, loading, error, refresh } = useBuyerDashboardData();
  const [activeTab, setActiveTab] = useState<
    'ALL' | 'REVIEWING' | 'WITH_QUOTES' | 'AWARDED' | 'NEGOTIATING' | 'ORDER_ISSUED' | 'CANCELLED'
  >('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: '',
    description: '',
    dueDate: '',
    privateRequest: false,
  });

  const counts = useMemo(() => {
    const total = requests.length;
    const reviewing = requests.filter((item) => item.status === 'REVIEWING').length;
    const withQuotes = requests.filter((item) => (item._count?.quotes ?? 0) > 0).length;
    const awarded = requests.filter((item) => item.status === 'AWARDED').length;
    const inProduction = requests.filter((item) => item.status === 'NEGOTIATING').length;
    const completed = requests.filter((item) => item.status === 'ORDER_ISSUED').length;
    const cancelled = requests.filter((item) => item.status === 'CANCELLED').length;

    return { total, reviewing, withQuotes, awarded, inProduction, completed, cancelled };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();
    const base = requests.filter((request) => {
      if (!query) {
        return true;
      }

      return (
        request.title.toLowerCase().includes(query) ||
        request.category.toLowerCase().includes(query) ||
        request.description.toLowerCase().includes(query)
      );
    });

    if (activeTab === 'ALL') {
      return base;
    }

    if (activeTab === 'WITH_QUOTES') {
      return base.filter((request) => (request._count?.quotes ?? 0) > 0);
    }

    return base.filter((request) => request.status === activeTab);
  }, [activeTab, requests, search]);

  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageItems = filteredRequests.slice((safePage - 1) * pageSize, safePage * pageSize);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.accessToken) {
      return;
    }

    try {
      setSubmitting(true);
      await atarApi.createRequest(
        {
          title: form.title,
          category: form.category,
          description: form.description,
          dueDate: form.dueDate || undefined,
          privateRequest: form.privateRequest,
          status: 'PUBLISHED',
        },
        session.accessToken,
      );
      setIsCreateOpen(false);
      setForm({ title: '', category: '', description: '', dueDate: '', privateRequest: false });
      await refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Mis solicitudes</h1>
          <p className="mt-1 text-sm text-slate-500">Gestioná todas tus solicitudes de compra</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <div className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm sm:w-[260px]">
            <svg aria-hidden="true" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24">
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              <path d="M11 19a8 8 0 100-16 8 8 0 000 16z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
            <input
              className="w-full bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Buscar solicitud..."
              value={search}
            />
          </div>

          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50" type="button">
            Filtros
            <svg aria-hidden="true" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24">
              <path d="M4 6h16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              <path d="M7 12h10" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              <path d="M10 18h4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          </button>

          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(79,70,229,0.25)] hover:bg-indigo-500"
            onClick={() => setIsCreateOpen(true)}
            type="button"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-white/10">
              <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                <path d="M12 5v14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                <path d="M5 12h14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </span>
            Nueva solicitud
          </button>
        </div>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex min-w-max items-center gap-6 border-b border-slate-200 pb-3 text-sm">
          {[
            { key: 'ALL' as const, label: 'Todas', count: counts.total },
            { key: 'REVIEWING' as const, label: 'En evaluación', count: counts.reviewing },
            { key: 'WITH_QUOTES' as const, label: 'Con cotizaciones', count: counts.withQuotes },
            { key: 'AWARDED' as const, label: 'Aceptadas', count: counts.awarded },
            { key: 'NEGOTIATING' as const, label: 'En producción', count: counts.inProduction },
            { key: 'ORDER_ISSUED' as const, label: 'Completadas', count: counts.completed },
            { key: 'CANCELLED' as const, label: 'Canceladas', count: counts.cancelled },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                className={`relative pb-3 text-sm font-semibold transition ${
                  isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'
                }`}
                onClick={() => {
                  setActiveTab(tab.key);
                  setPage(1);
                }}
                type="button"
              >
                <span className="flex items-center gap-2">
                  {tab.label}
                  <span className="text-xs font-semibold text-slate-400">{tab.count}</span>
                </span>
                {isActive ? (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-indigo-600" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
        {[
          { label: 'Total solicitudes', value: counts.total, sub: 'Todas las solicitudes', tone: 'indigo' as const, icon: 'file' as const },
          { label: 'En evaluación', value: counts.reviewing, sub: 'Proveedores revisando', tone: 'amber' as const, icon: 'clock' as const },
          { label: 'Con cotizaciones', value: counts.withQuotes, sub: 'Cotizaciones recibidas', tone: 'violet' as const, icon: 'chat' as const },
          { label: 'Aceptadas', value: counts.awarded, sub: 'Procesos confirmados', tone: 'emerald' as const, icon: 'check' as const },
          { label: 'En producción', value: counts.inProduction, sub: 'Órdenes en curso', tone: 'sky' as const, icon: 'factory' as const },
          { label: 'Completadas', value: counts.completed, sub: 'Órdenes finalizadas', tone: 'slate' as const, icon: 'done' as const },
          { label: 'Canceladas', value: counts.cancelled, sub: 'Solicitudes canceladas', tone: 'rose' as const, icon: 'x' as const },
        ].map((card) => {
          const tones = {
            indigo: 'bg-indigo-50 text-indigo-600',
            amber: 'bg-amber-50 text-amber-600',
            violet: 'bg-violet-50 text-violet-600',
            emerald: 'bg-emerald-50 text-emerald-600',
            sky: 'bg-sky-50 text-sky-600',
            slate: 'bg-slate-100 text-slate-600',
            rose: 'bg-rose-50 text-rose-600',
          } as const;

          const icon = (() => {
            const cls = 'h-4 w-4';
            if (card.icon === 'file') {
              return (
                <svg aria-hidden="true" className={cls} fill="none" viewBox="0 0 24 24">
                  <path d="M14 2H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V8l-5-6z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  <path d="M14 2v6h6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              );
            }
            if (card.icon === 'clock') {
              return (
                <svg aria-hidden="true" className={cls} fill="none" viewBox="0 0 24 24">
                  <path d="M12 22a10 10 0 100-20 10 10 0 000 20z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  <path d="M12 6v6l4 2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              );
            }
            if (card.icon === 'chat') {
              return (
                <svg aria-hidden="true" className={cls} fill="none" viewBox="0 0 24 24">
                  <path d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4v8z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              );
            }
            if (card.icon === 'check') {
              return (
                <svg aria-hidden="true" className={cls} fill="none" viewBox="0 0 24 24">
                  <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              );
            }
            if (card.icon === 'factory') {
              return (
                <svg aria-hidden="true" className={cls} fill="none" viewBox="0 0 24 24">
                  <path d="M3 21V10l6 3V10l6 3V10l6 3v8H3z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  <path d="M9 21v-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  <path d="M15 21v-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              );
            }
            if (card.icon === 'done') {
              return (
                <svg aria-hidden="true" className={cls} fill="none" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  <path d="M21 12a9 9 0 11-6.219-8.56" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              );
            }
            return (
              <svg aria-hidden="true" className={cls} fill="none" viewBox="0 0 24 24">
                <path d="M18 6L6 18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                <path d="M6 6l12 12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            );
          })();

          return (
            <article key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:p-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${tones[card.tone]}`}>{icon}</div>
              <p className="mt-4 text-2xl font-semibold text-slate-950">{card.value}</p>
              <p className="mt-1 text-xs font-semibold text-slate-950">{card.label}</p>
              <p className="mt-1 text-xs text-slate-500">{card.sub}</p>
            </article>
          );
        })}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="hidden lg:grid grid-cols-[0.26fr_0.16fr_0.16fr_0.18fr_0.16fr_0.14fr_0.14fr] gap-4 border-b border-slate-200 px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          <p>Solicitud</p>
          <p>Producto</p>
          <p>Cantidad</p>
          <p>Fecha de creación</p>
          <p>Estado</p>
          <p>Proveedores</p>
          <p className="text-right">Acciones</p>
        </div>

        <div className="divide-y divide-slate-200">
          {loading ? (
            <div className="px-6 py-8 text-sm text-slate-500">Cargando solicitudes...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="px-6 py-10 text-sm text-slate-500">No hay solicitudes con ese criterio.</div>
          ) : (
            pageItems.map((request, index) => {
              const code = `Solicitud #${String(index + 1244 + (safePage - 1) * pageSize)}`;
              const replies = request._count?.quotes ?? 0;
              return (
                <div key={request.id} className="px-4 py-4 sm:px-6">
                  <div className="grid gap-4 lg:grid-cols-[0.26fr_0.16fr_0.16fr_0.18fr_0.16fr_0.14fr_0.14fr] lg:items-center">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                        <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <path d="M14 2H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V8l-5-6z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                          <path d="M14 2v6h6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-950">{code}</p>
                        <p className="mt-1 line-clamp-1 text-xs text-slate-500">{request.title}</p>
                        <p className="mt-1 inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                          {request.category}
                        </p>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600">
                      <p className="font-semibold text-slate-700">{request.title}</p>
                      <p className="mt-1 text-slate-500">-</p>
                    </div>

                    <div className="text-xs text-slate-600">
                      <p className="font-semibold text-slate-700">{Math.max(1, replies * 100)} unidades</p>
                      <p className="mt-1 text-slate-500">-</p>
                    </div>

                    <div className="text-xs text-slate-600">
                      <p className="font-semibold text-slate-700">{formatDate(request.createdAt)}</p>
                      <p className="mt-1 text-slate-500">{formatDateTime(request.createdAt).split(' ').slice(-1)[0]}</p>
                    </div>

                    <div className="text-xs">
                      <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${getRequestStatusStyles(request.status)}`}>
                        {request.status === 'REVIEWING'
                          ? 'En evaluación'
                          : request.status === 'CANCELLED'
                            ? 'Cancelada'
                            : request.status === 'AWARDED'
                              ? 'Aceptada'
                              : request.status === 'NEGOTIATING'
                                ? 'En producción'
                                : request.status === 'ORDER_ISSUED'
                                  ? 'Completada'
                                  : 'Activa'}
                      </span>
                      <p className="mt-2 text-xs text-slate-500">{replies} proveedores</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {['PB', 'BL', 'AR'].slice(0, Math.min(3, Math.max(1, replies))).map((initials) => (
                          <span
                            key={`${request.id}-${initials}`}
                            className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-950 text-[10px] font-semibold text-white"
                          >
                            {initials}
                          </span>
                        ))}
                      </div>
                      {replies > 3 ? <span className="text-xs text-slate-500">+{replies - 3}</span> : null}
                    </div>

                    <div className="flex justify-start lg:justify-end">
                      <Link
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                        href={`/dashboard/comprador/solicitudes/${request.id}`}
                      >
                        Ver detalle
                        <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <path d="M9 18l6-6-6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex flex-col gap-4 border-t border-slate-200 px-6 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Mostrando {(safePage - 1) * pageSize + (pageItems.length ? 1 : 0)} a {(safePage - 1) * pageSize + pageItems.length} de {filteredRequests.length} solicitudes
          </p>
          <div className="flex items-center justify-between gap-2 sm:justify-end">
            <button
              className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
              disabled={safePage <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              type="button"
            >
              Anterior
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                const p = idx + 1;
                const isActive = p === safePage;
                return (
                  <button
                    key={p}
                    className={`h-9 w-9 rounded-xl border text-xs font-semibold ${
                      isActive ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                    onClick={() => setPage(p)}
                    type="button"
                  >
                    {p}
                  </button>
                );
              })}
            </div>
            <button
              className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
              disabled={safePage >= totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              type="button"
            >
              Siguiente
            </button>
          </div>
        </div>
      </section>

      {isCreateOpen ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-slate-950/40" onClick={() => setIsCreateOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-2xl rounded-t-3xl border border-slate-200 bg-white px-5 pb-6 pt-5 shadow-[0_-20px_60px_rgba(15,23,42,0.18)] sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:px-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-950">Nueva solicitud</p>
                <p className="mt-1 text-xs text-slate-500">Publicá un pedido y recibí cotizaciones reales.</p>
              </div>
              <button
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                onClick={() => setIsCreateOpen(false)}
                type="button"
              >
                <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <path d="M18 6L6 18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  <path d="M6 6l12 12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </button>
            </div>

            <form className="mt-5 space-y-4" onSubmit={handleCreate}>
              <label className="block space-y-2 text-xs font-semibold text-slate-700">
                <span>Título</span>
                <input
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-indigo-500"
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Ej. Bolsa de polipropileno 90x120cm"
                  required
                  value={form.title}
                />
              </label>
              <label className="block space-y-2 text-xs font-semibold text-slate-700">
                <span>Categoría</span>
                <input
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-indigo-500"
                  onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                  placeholder="Packaging, químicos, maquinaria..."
                  required
                  value={form.category}
                />
              </label>
              <label className="block space-y-2 text-xs font-semibold text-slate-700">
                <span>Descripción</span>
                <textarea
                  className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-indigo-500"
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Detallá especificaciones, volumen y condiciones."
                  required
                  value={form.description}
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-[0.7fr_0.3fr]">
                <label className="block space-y-2 text-xs font-semibold text-slate-700">
                  <span>Fecha límite</span>
                  <input
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-indigo-500"
                    onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
                    type="date"
                    value={form.dueDate}
                  />
                </label>
                <label className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 sm:mt-7">
                  <input
                    checked={form.privateRequest}
                    onChange={(event) => setForm((current) => ({ ...current, privateRequest: event.target.checked }))}
                    type="checkbox"
                  />
                  Pedido privado
                </label>
              </div>
              <button
                className="flex h-11 w-full items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(79,70,229,0.25)] hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={submitting}
                type="submit"
              >
                {submitting ? 'Publicando...' : 'Publicar solicitud'}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
