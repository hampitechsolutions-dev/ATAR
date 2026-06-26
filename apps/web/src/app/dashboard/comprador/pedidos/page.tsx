'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useBuyerDashboardData } from '@/lib/dashboard-hooks';

function formatCurrency(value: number | null | undefined) {
  if (typeof value !== 'number') {
    return '$0';
  }

  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatUsd(value: number | null | undefined) {
  if (typeof value !== 'number') {
    return 'USD 0';
  }

  return `USD ${Math.round(value / 1040)}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function getOrderMeta(status: string) {
  if (status === 'NEGOTIATING') {
    return {
      label: 'En producción',
      pill: 'bg-indigo-100 text-indigo-700',
      progressText: '60% completado',
      progress: 'w-3/5',
      progressColor: 'bg-indigo-600',
      iconTone: 'bg-amber-50 text-amber-600',
    };
  }

  if (status === 'AWARDED') {
    return {
      label: 'En camino',
      pill: 'bg-violet-100 text-violet-700',
      progressText: 'En tránsito',
      progress: 'w-4/5',
      progressColor: 'bg-violet-600',
      iconTone: 'bg-violet-50 text-violet-600',
    };
  }

  if (status === 'ORDER_ISSUED') {
    return {
      label: 'Entregado',
      pill: 'bg-emerald-100 text-emerald-700',
      progressText: 'Completado',
      progress: 'w-full',
      progressColor: 'bg-emerald-500',
      iconTone: 'bg-emerald-50 text-emerald-600',
    };
  }

  return {
    label: 'Cancelado',
    pill: 'bg-rose-100 text-rose-700',
    progressText: 'Cancelado por el proveedor',
    progress: 'w-1/4',
    progressColor: 'bg-rose-500',
    iconTone: 'bg-slate-100 text-slate-500',
  };
}

function OrderIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M6 7h12l-1 14H7L6 7z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="M9 7a3 3 0 016 0" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function StatIcon({ name }: { name: 'bag' | 'box' | 'truck' | 'check' | 'x' }) {
  if (name === 'bag') {
    return <OrderIcon />;
  }
  if (name === 'box') {
    return (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="M3.3 7.3L12 12l8.7-4.7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }
  if (name === 'truck') {
    return (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path d="M1 3h14v13H1V3z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="M15 8h4l4 4v4h-8V8z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }
  if (name === 'check') {
    return (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M18 6L6 18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="M6 6l12 12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

export default function BuyerOrdersPage() {
  const { requests, loading, error } = useBuyerDashboardData();
  const [activeTab, setActiveTab] = useState<'ALL' | 'NEGOTIATING' | 'AWARDED' | 'ORDER_ISSUED' | 'CANCELLED'>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const orders = useMemo(() => {
    return requests.filter((request) =>
      ['AWARDED', 'NEGOTIATING', 'ORDER_ISSUED', 'CANCELLED'].includes(request.status),
    );
  }, [requests]);

  const counts = useMemo(() => {
    const total = orders.length;
    const inProduction = orders.filter((item) => item.status === 'NEGOTIATING').length;
    const onWay = orders.filter((item) => item.status === 'AWARDED').length;
    const delivered = orders.filter((item) => item.status === 'ORDER_ISSUED').length;
    const cancelled = orders.filter((item) => item.status === 'CANCELLED').length;
    return { total, inProduction, onWay, delivered, cancelled };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    const base = orders.filter((request) => {
      const provider = request.awardedQuote?.supplierCompany?.name ?? '';
      return (
        query.length === 0 ||
        request.title.toLowerCase().includes(query) ||
        request.category.toLowerCase().includes(query) ||
        provider.toLowerCase().includes(query)
      );
    });

    if (activeTab === 'ALL') {
      return base;
    }

    return base.filter((request) => request.status === activeTab);
  }, [activeTab, orders, search]);

  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleOrders = filteredOrders.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Pedidos</h1>
          <p className="mt-1 text-sm text-slate-500">Gestioná y hacé seguimiento de todos tus pedidos</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm sm:w-[320px]">
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
              placeholder="Buscar pedido, producto o proveedor..."
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

          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50" type="button">
            Exportar
            <svg aria-hidden="true" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24">
              <path d="M12 3v12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              <path d="M7 10l5 5 5-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              <path d="M5 21h14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          </button>
        </div>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex min-w-max items-center gap-6 border-b border-slate-200 pb-3 text-sm">
          {[
            { key: 'ALL' as const, label: 'Todos', count: counts.total },
            { key: 'NEGOTIATING' as const, label: 'En producción', count: counts.inProduction },
            { key: 'AWARDED' as const, label: 'En camino', count: counts.onWay },
            { key: 'ORDER_ISSUED' as const, label: 'Entregados', count: counts.delivered },
            { key: 'CANCELLED' as const, label: 'Cancelados', count: counts.cancelled },
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
                {isActive ? <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-indigo-600" /> : null}
              </button>
            );
          })}
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'Total pedidos', value: counts.total, sub: 'Todos los pedidos', tone: 'bg-indigo-50 text-indigo-600', icon: 'bag' as const },
          { label: 'En producción', value: counts.inProduction, sub: 'Actualmente en proceso', tone: 'bg-amber-50 text-amber-600', icon: 'box' as const },
          { label: 'En camino', value: counts.onWay, sub: 'En tránsito', tone: 'bg-violet-50 text-violet-600', icon: 'truck' as const },
          { label: 'Entregados', value: counts.delivered, sub: 'Completados', tone: 'bg-emerald-50 text-emerald-600', icon: 'check' as const },
          { label: 'Cancelados', value: counts.cancelled, sub: 'No completados', tone: 'bg-rose-50 text-rose-600', icon: 'x' as const },
        ].map((card) => (
          <article key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${card.tone}`}>
              <StatIcon name={card.icon} />
            </div>
            <p className="mt-4 text-2xl font-semibold text-slate-950">{card.value}</p>
            <p className="mt-1 text-xs font-semibold text-slate-950">{card.label}</p>
            <p className="mt-1 text-xs text-slate-500">{card.sub}</p>
          </article>
        ))}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="hidden lg:grid grid-cols-[0.22fr_0.22fr_0.2fr_0.2fr_0.12fr_0.12fr_0.12fr] gap-4 border-b border-slate-200 px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          <p>Pedido</p>
          <p>Producto</p>
          <p>Proveedor</p>
          <p>Estado</p>
          <p>Entrega estimada</p>
          <p>Total</p>
          <p className="text-right">Acciones</p>
        </div>

        <div className="divide-y divide-slate-200">
          {loading ? (
            <div className="px-6 py-8 text-sm text-slate-500">Cargando pedidos...</div>
          ) : visibleOrders.length === 0 ? (
            <div className="px-6 py-10 text-sm text-slate-500">No hay pedidos para mostrar.</div>
          ) : (
            visibleOrders.map((request, index) => {
              const providerName = request.awardedQuote?.supplierCompany?.name ?? 'Proveedor asignado';
              const orderMeta = getOrderMeta(request.status);
              const orderNumber = request.order?.orderNumber ?? `Pedido #${5678 - ((safePage - 1) * pageSize + index)}`;
              const deliveredLabel = request.status === 'ORDER_ISSUED' ? 'Entregado' : `${Math.max(3, index + 3)} días hábiles`;

              return (
                <div key={request.id} className="px-4 py-4 sm:px-6">
                  <div className="grid gap-4 lg:grid-cols-[0.22fr_0.22fr_0.2fr_0.2fr_0.12fr_0.12fr_0.12fr] lg:items-center">
                    <div className="flex items-start gap-4">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${orderMeta.iconTone}`}>
                        <OrderIcon />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-950">{orderNumber}</p>
                        <p className="mt-1 text-[11px] text-slate-500">Creado el {formatDate(request.createdAt)}</p>
                        <p className="mt-2 inline-flex rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-semibold text-indigo-600">
                          Solicitud #{1248 - ((safePage - 1) * pageSize + index)}
                        </p>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600">
                      <p className="font-semibold text-slate-900">{request.title}</p>
                      <p className="mt-1 text-slate-500">{request.description.slice(0, 28) || request.category}</p>
                      <p className="mt-1 text-slate-500">{request.category}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-[11px] font-semibold text-white">
                        {providerName
                          .split(' ')
                          .slice(0, 2)
                          .map((part) => part[0])
                          .join('')
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-slate-950">{providerName}</p>
                        <p className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Verificado
                        </p>
                      </div>
                    </div>

                    <div className="text-xs">
                      <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${orderMeta.pill}`}>
                        {orderMeta.label}
                      </span>
                      <p className="mt-2 text-[11px] text-slate-500">{orderMeta.progressText}</p>
                      <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100">
                        <div className={`h-1.5 rounded-full ${orderMeta.progress} ${orderMeta.progressColor}`} />
                      </div>
                    </div>

                    <div className="text-xs text-slate-600">
                      <p className="font-semibold text-slate-900">{formatDate(request.order?.promisedDate ?? request.dueDate ?? request.updatedAt)}</p>
                      <p className="mt-1 text-slate-500">{deliveredLabel}</p>
                    </div>

                    <div className="text-xs text-slate-600">
                      <p className="font-semibold text-slate-900">{formatCurrency(request.awardedQuote?.amount)}</p>
                      <p className="mt-1 text-slate-500">{formatUsd(request.awardedQuote?.amount)}</p>
                    </div>

                    <div className="flex justify-start gap-2 lg:justify-end">
                      <Link
                        className="inline-flex h-9 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 px-4 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                        href={`/dashboard/comprador/solicitudes/${request.id}`}
                      >
                        Ver detalle
                      </Link>
                      <button className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50" type="button">
                        <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <path d="M12 5h.01" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                          <path d="M12 12h.01" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                          <path d="M12 19h.01" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex flex-col gap-4 border-t border-slate-200 px-6 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Mostrando {(safePage - 1) * pageSize + (visibleOrders.length ? 1 : 0)} a {(safePage - 1) * pageSize + visibleOrders.length} de {filteredOrders.length} pedidos
          </p>
          <div className="flex items-center gap-2">
            <button
              className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
              disabled={safePage <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              type="button"
            >
              Anterior
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(4, totalPages) }).map((_, idx) => {
                const number = idx + 1;
                const isActive = number === safePage;
                return (
                  <button
                    key={number}
                    className={`h-9 w-9 rounded-xl border text-xs font-semibold ${
                      isActive ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                    onClick={() => setPage(number)}
                    type="button"
                  >
                    {number}
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
    </div>
  );
}
