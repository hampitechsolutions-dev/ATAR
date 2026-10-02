'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { atarApi, type RequestRecord } from '@/lib/atar-api';
import { LoadingState } from '@/components/ui/spinner';
import { formatRequestCode } from '@/lib/request-code';
import { useBuyerDashboardData } from '@/lib/dashboard-hooks';
import { FALLBACK_REQUEST_CATEGORIES } from '@/lib/request-catalog-fallback';

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

function formatTime(value: string) {
  return new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value));
}

function initialsOf(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
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

// Imagen de la categoría de la solicitud, para las tarjetas mobile.
function requestImage(request: RequestRecord) {
  const labels = [request.items?.[0]?.category, request.category].filter(Boolean);
  for (const label of labels) {
    const match = FALLBACK_REQUEST_CATEGORIES.find((category) => category.label === label);
    if (match?.imageSrc) return match.imageSrc;
  }
  return '/logoatar.png';
}

function requestQuantity(request: RequestRecord) {
  const items = request.items ?? [];
  if (items.length > 1) {
    return `${items.length} productos`;
  }
  const item = items[0];
  const quantity = item?.quantity ?? request.quantityRequested ?? null;
  return quantity !== null ? `${quantity.toLocaleString('es-AR')} ${item?.unit ?? 'un.'}` : 'A definir';
}

function requestStatusLabel(status: RequestRecord['status']) {
  if (status === 'REVIEWING') return 'En evaluación';
  if (status === 'CANCELLED') return 'Cancelada';
  if (status === 'AWARDED') return 'Aceptada';
  if (status === 'NEGOTIATING') return 'En producción';
  if (status === 'ORDER_ISSUED') return 'Completada';
  return 'Activa';
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
    <div>
      {/* ==================== VISTA MOBILE ==================== */}
      {/* Tarjetas, como en el panel del proveedor. Crear una solicitud va por
          el botón flotante "Nueva solicitud" del layout. */}
      <div className="pb-4 lg:hidden">
        <h1 className="text-[26px] font-bold leading-tight tracking-[-0.03em] text-slate-950">Mis solicitudes</h1>
        <p className="mt-1 text-[13px] text-slate-500">Seguí tus pedidos de cotización y las respuestas de los proveedores.</p>

        <div className="relative mt-4">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
              <path d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          </span>
          <input
            className="h-11 w-full rounded-[12px] border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-indigo-400"
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Buscar solicitud..."
            value={search}
          />
        </div>

        <div className="-mx-3 mt-1.5 flex gap-2 overflow-x-auto px-3 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[
            { key: 'ALL' as const, label: 'Todas', count: counts.total },
            { key: 'WITH_QUOTES' as const, label: 'Con cotizaciones', count: counts.withQuotes },
            { key: 'REVIEWING' as const, label: 'En evaluación', count: counts.reviewing },
            { key: 'AWARDED' as const, label: 'Aceptadas', count: counts.awarded },
            { key: 'NEGOTIATING' as const, label: 'En producción', count: counts.inProduction },
            { key: 'ORDER_ISSUED' as const, label: 'Completadas', count: counts.completed },
            { key: 'CANCELLED' as const, label: 'Canceladas', count: counts.cancelled },
          ].map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-[10px] px-3.5 text-[13px] font-semibold transition ${
                  active ? 'bg-indigo-600 text-white shadow-[0_8px_18px_rgba(79,70,229,0.28)]' : 'bg-white text-slate-600 ring-1 ring-slate-200'
                }`}
                onClick={() => {
                  setActiveTab(tab.key);
                  setPage(1);
                }}
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

        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="rounded-[18px] border border-dashed border-slate-300 bg-white px-4 py-10">
              <LoadingState label="Cargando solicitudes..." />
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="rounded-[18px] border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
              No hay solicitudes con ese criterio.
            </div>
          ) : (
            pageItems.map((request) => {
              const replies = request._count?.quotes ?? 0;
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
                        <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] ${getRequestStatusStyles(request.status)}`}>
                          {requestStatusLabel(request.status)}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[15px] font-bold leading-5 tracking-[-0.01em] text-slate-950">{request.title}</p>
                      <p className="mt-0.5 text-[12px] text-slate-500">{formatRequestCode(request.id)}</p>
                    </div>
                    <span className="self-center text-slate-400">
                      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <path d="M9 18l6-6-6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 divide-x divide-[#cfdcf7] rounded-[12px] bg-[#eef3ff] py-2 text-center">
                    <span className="px-1">
                      <span className="block text-[10px] text-slate-500">Cantidad</span>
                      <span className="block truncate text-[12px] font-semibold text-slate-900">{requestQuantity(request)}</span>
                    </span>
                    <span className="px-1">
                      <span className="block text-[10px] text-slate-500">Creada</span>
                      <span className="block truncate text-[12px] font-semibold text-slate-900">{formatDate(request.createdAt)}</span>
                    </span>
                    <span className="px-1">
                      <span className="block text-[10px] text-slate-500">Cotizaciones</span>
                      <span className={`block truncate text-[12px] font-semibold ${replies > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {replies > 0 ? `${replies} recibida${replies === 1 ? '' : 's'}` : 'Sin respuestas'}
                      </span>
                    </span>
                  </div>
                </Link>
              );
            })
          )}

          {totalPages > 1 ? (
            <div className="mt-4 flex items-center justify-between gap-3">
              <button
                className="inline-flex h-10 items-center rounded-[10px] bg-white px-4 text-[13px] font-semibold text-slate-700 ring-1 ring-slate-200 disabled:opacity-40"
                disabled={safePage <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                type="button"
              >
                Anterior
              </button>
              <span className="text-[12px] text-slate-500">
                Página {safePage} de {totalPages}
              </span>
              <button
                className="inline-flex h-10 items-center rounded-[10px] bg-white px-4 text-[13px] font-semibold text-slate-700 ring-1 ring-slate-200 disabled:opacity-40"
                disabled={safePage >= totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                type="button"
              >
                Siguiente
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* ==================== VISTA DESKTOP ==================== */}
      <div className="hidden space-y-6 lg:block">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Mis solicitudes</h1>
          <p className="mt-1 text-sm text-slate-500">Gestioná todas tus solicitudes de compra</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <div className="flex w-full items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-2.5 shadow-sm sm:w-[260px]">
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

          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50" type="button">
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
        <div className="flex min-w-max items-center gap-6 border-b border-slate-300 pb-3 text-sm">
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
        <div className="rounded-2xl border border-rose-200 bg-rose-100 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-300 bg-white shadow-sm">
        <div className="hidden lg:grid grid-cols-[0.26fr_0.16fr_0.16fr_0.18fr_0.16fr_0.14fr_0.14fr] gap-4 rounded-t-2xl border-b border-slate-300 bg-[#eef3ff] px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#33457a]">
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
            <div className="px-6 py-8"><LoadingState label="Cargando solicitudes..." /></div>
          ) : filteredRequests.length === 0 ? (
            <div className="px-6 py-10 text-sm text-slate-500">No hay solicitudes con ese criterio.</div>
          ) : (
            pageItems.map((request) => {
              const code = formatRequestCode(request.id);
              const replies = request._count?.quotes ?? 0;
              const suppliers = Array.from(
                new Set((request.quotes ?? []).map((quote) => quote.supplierCompany?.name).filter((name): name is string => Boolean(name))),
              );
              return (
                <div key={request.id} className="px-4 py-4 even:bg-[#eef1f7] sm:px-6">
                  <div className="grid gap-4 lg:grid-cols-[0.26fr_0.16fr_0.16fr_0.18fr_0.16fr_0.14fr_0.14fr] lg:items-center">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
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
                      <p className="font-semibold text-slate-700">{request.items?.[0]?.productName ?? request.title}</p>
                      {(request.items?.length ?? 0) > 1 ? (
                        <p className="mt-1 text-slate-500">+{(request.items?.length ?? 0) - 1} más</p>
                      ) : null}
                    </div>

                    <div className="text-xs text-slate-600">
                      <p className="font-semibold text-slate-700">{requestQuantity(request)}</p>
                    </div>

                    <div className="text-xs text-slate-600">
                      <p className="font-semibold text-slate-700">{formatDate(request.createdAt)}</p>
                      <p className="mt-1 text-slate-500">{formatTime(request.createdAt)}</p>
                    </div>

                    <div className="text-xs">
                      <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${getRequestStatusStyles(request.status)}`}>
                        {requestStatusLabel(request.status)}
                      </span>
                      <p className="mt-2 text-xs text-slate-500">
                        {replies} {replies === 1 ? 'cotización' : 'cotizaciones'}
                      </p>
                    </div>

                    {/* Proveedores que realmente cotizaron esta solicitud. */}
                    <div className="flex items-center gap-2">
                      {suppliers.length === 0 ? (
                        <span className="text-xs text-slate-400">Sin respuestas</span>
                      ) : (
                        <div className="flex -space-x-2">
                          {suppliers.slice(0, 3).map((name) => (
                            <span
                              key={`${request.id}-${name}`}
                              className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-indigo-600 text-[10px] font-semibold text-white"
                              title={name}
                            >
                              {initialsOf(name)}
                            </span>
                          ))}
                        </div>
                      )}
                      {suppliers.length > 3 ? <span className="text-xs text-slate-500">+{suppliers.length - 3}</span> : null}
                    </div>

                    <div className="flex justify-start lg:justify-end">
                      <Link
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-100 px-4 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
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

        <div className="flex flex-col gap-4 border-t border-slate-300 px-6 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Mostrando {(safePage - 1) * pageSize + (pageItems.length ? 1 : 0)} a {(safePage - 1) * pageSize + pageItems.length} de {filteredRequests.length} solicitudes
          </p>
          <div className="flex items-center justify-between gap-2 sm:justify-end">
            <button
              className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
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
                      isActive ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
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
              className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
              disabled={safePage >= totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              type="button"
            >
              Siguiente
            </button>
          </div>
        </div>
      </section>

      </div>

      {isCreateOpen ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-slate-950/40" onClick={() => setIsCreateOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-2xl rounded-t-3xl border border-slate-300 bg-white px-5 pb-6 pt-5 shadow-[0_-20px_60px_rgba(15,23,42,0.18)] sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:px-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-950">Nueva solicitud</p>
                <p className="mt-1 text-xs text-slate-500">Publicá un pedido y recibí cotizaciones reales.</p>
              </div>
              <button
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
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
                  className="h-11 w-full rounded-2xl border border-slate-300 bg-[#eef1f7] px-4 text-sm text-slate-950 outline-none transition focus:border-indigo-500"
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Ej. Bolsa de polipropileno 90x120cm"
                  required
                  value={form.title}
                />
              </label>
              <label className="block space-y-2 text-xs font-semibold text-slate-700">
                <span>Categoría</span>
                <input
                  className="h-11 w-full rounded-2xl border border-slate-300 bg-[#eef1f7] px-4 text-sm text-slate-950 outline-none transition focus:border-indigo-500"
                  onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                  placeholder="Packaging, químicos, maquinaria..."
                  required
                  value={form.category}
                />
              </label>
              <label className="block space-y-2 text-xs font-semibold text-slate-700">
                <span>Descripción</span>
                <textarea
                  className="min-h-28 w-full rounded-2xl border border-slate-300 bg-[#eef1f7] px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-indigo-500"
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
                    className="h-11 w-full rounded-2xl border border-slate-300 bg-[#eef1f7] px-4 text-sm text-slate-950 outline-none transition focus:border-indigo-500"
                    onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
                    type="date"
                    value={form.dueDate}
                  />
                </label>
                <label className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-300 bg-[#eef1f7] px-4 py-3 text-sm text-slate-700 sm:mt-7">
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
