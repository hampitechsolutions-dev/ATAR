'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import SupplierDashboardShell from '@/components/dashboard/supplier-dashboard-shell';
import { atarApi, type OrderFulfillmentStatus, type QuoteRecord } from '@/lib/atar-api';
import { useSupplierDashboardData } from '@/lib/dashboard-hooks';

function stageBadgeClass(column: OrderColumnKey) {
  if (column === 'delivered') {
    return 'bg-emerald-50 text-emerald-600';
  }
  if (column === 'transit') {
    return 'bg-violet-50 text-violet-600';
  }
  if (column === 'production') {
    return 'bg-sky-50 text-sky-600';
  }
  return 'bg-amber-50 text-amber-600';
}

type OrderColumnKey = 'pending' | 'production' | 'transit' | 'delivered';

type OrderCard = {
  quote: QuoteRecord;
  column: OrderColumnKey;
  companyShort: string;
  companyName: string;
  orderNumber: string;
  title: string;
  amountLabel: string;
  updatedLabel: string;
  promisedLabel: string;
  progress: number;
  stageLabel: string;
  noteLabel: string;
};

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

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function getNextFulfillmentAction(status: OrderFulfillmentStatus) {
  if (status === 'ISSUED') {
    return { action: 'CONFIRM_ORDER' as const, label: 'Confirmar pedido' };
  }

  if (status === 'CONFIRMED') {
    return { action: 'START_PRODUCTION' as const, label: 'Iniciar produccion' };
  }

  if (status === 'IN_PRODUCTION') {
    return { action: 'MARK_DISPATCHED' as const, label: 'Marcar en transito' };
  }

  if (status === 'DISPATCHED') {
    return { action: 'MARK_DELIVERED' as const, label: 'Marcar entregado' };
  }

  return null;
}

function getColumnFromStatus(status: OrderFulfillmentStatus): OrderColumnKey {
  if (status === 'ISSUED') {
    return 'pending';
  }

  if (status === 'CONFIRMED' || status === 'IN_PRODUCTION') {
    return 'production';
  }

  if (status === 'DISPATCHED') {
    return 'transit';
  }

  return 'delivered';
}

function getProgressFromStatus(status: OrderFulfillmentStatus) {
  if (status === 'ISSUED') {
    return 20;
  }

  if (status === 'CONFIRMED') {
    return 40;
  }

  if (status === 'IN_PRODUCTION') {
    return 70;
  }

  if (status === 'DISPATCHED') {
    return 90;
  }

  return 100;
}

function getStageLabel(status: OrderFulfillmentStatus) {
  if (status === 'ISSUED') {
    return 'Pendiente';
  }

  if (status === 'CONFIRMED') {
    return 'Confirmado';
  }

  if (status === 'IN_PRODUCTION') {
    return 'En produccion';
  }

  if (status === 'DISPATCHED') {
    return 'En transito';
  }

  return 'Entregado';
}

function getNoteLabel(status: OrderFulfillmentStatus) {
  if (status === 'ISSUED') {
    return 'Confirmacion pendiente';
  }

  if (status === 'CONFIRMED') {
    return 'Esperando inicio';
  }

  if (status === 'IN_PRODUCTION') {
    return 'Produccion activa';
  }

  if (status === 'DISPATCHED') {
    return 'Llegada estimada';
  }

  return 'Entregado';
}

function getCompanyShort(name: string) {
  const words = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');

  return words || 'AT';
}

function OrderColumnIcon({ kind }: { kind: OrderColumnKey }) {
  if (kind === 'pending') {
    return (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path d="M8 7V3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="M16 7V3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="M4 11h16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <rect x="4" y="5" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }

  if (kind === 'production') {
    return (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33h.01A1.65 1.65 0 0010 3.09V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51h.01a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v.01a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      </svg>
    );
  }

  if (kind === 'transit') {
    return (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <rect x="1" y="6" width="15" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M16 10h3l4 4v3h-7z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <circle cx="5.5" cy="18.5" r="1.5" fill="currentColor" />
        <circle cx="18.5" cy="18.5" r="1.5" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function MetricIcon({ kind }: { kind: 'active' | 'production' | 'transit' | 'delivered' }) {
  const tone =
    kind === 'active'
      ? 'text-[#6c5bff]'
      : kind === 'production'
        ? 'text-[#2793ff]'
        : kind === 'transit'
          ? 'text-[#7f60ff]'
          : 'text-[#65c78d]';

  return (
    <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-[#f7f7ff] ${tone}`}>
      <OrderColumnIcon
        kind={
          kind === 'active'
            ? 'pending'
            : kind === 'production'
              ? 'production'
              : kind === 'transit'
                ? 'transit'
                : 'delivered'
        }
      />
    </div>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="M11 19a8 8 0 100-16 8 8 0 000 16z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M4 6h16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="M7 12h10" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="M10 18h4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M12 5h.01" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
      <path d="M12 12h.01" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
      <path d="M12 19h.01" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
    </svg>
  );
}

export default function SupplierOrdersPage() {
  const { session, myQuotes, loading, error, setError, refresh } = useSupplierDashboardData();
  const [message, setMessage] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [updatingFulfillmentId, setUpdatingFulfillmentId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'curso' | 'completados' | 'cancelados'>('curso');

  const orderCards = useMemo<OrderCard[]>(() => {
    return myQuotes
      .filter((quote) => quote.status === 'AWARDED' && quote.request?.order)
      .map((quote) => {
        const order = quote.request!.order!;
        const companyName = quote.request?.buyerCompany?.name ?? 'Comprador';

        return {
          quote,
          column: getColumnFromStatus(order.fulfillmentStatus),
          companyShort: getCompanyShort(companyName),
          companyName,
          orderNumber: order.orderNumber,
          title: quote.request?.title ?? 'Pedido sin titulo',
          amountLabel: formatCurrency(quote.amount),
          updatedLabel: formatShortDate(order.updatedAt),
          promisedLabel: formatDate(order.promisedDate),
          progress: getProgressFromStatus(order.fulfillmentStatus),
          stageLabel: getStageLabel(order.fulfillmentStatus),
          noteLabel: order.notes ?? getNoteLabel(order.fulfillmentStatus),
        };
      })
      .sort(
        (left, right) =>
          new Date(right.quote.request!.order!.updatedAt).getTime() -
          new Date(left.quote.request!.order!.updatedAt).getTime(),
      );
  }, [myQuotes]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return orderCards;
    }

    return orderCards.filter((item) => {
      return (
        item.orderNumber.toLowerCase().includes(query) ||
        item.companyName.toLowerCase().includes(query) ||
        item.title.toLowerCase().includes(query)
      );
    });
  }, [orderCards, search]);

  const groupedOrders = useMemo(() => {
    return {
      pending: filteredOrders.filter((item) => item.column === 'pending'),
      production: filteredOrders.filter((item) => item.column === 'production'),
      transit: filteredOrders.filter((item) => item.column === 'transit'),
      delivered: filteredOrders.filter((item) => item.column === 'delivered'),
    };
  }, [filteredOrders]);

  const metrics = useMemo(() => {
    const delivered = orderCards.filter((item) => item.column === 'delivered').length;
    const transit = orderCards.filter((item) => item.column === 'transit').length;
    const production = orderCards.filter((item) => item.column === 'production').length;
    const active = orderCards.length - delivered;

    return { active, production, transit, delivered };
  }, [orderCards]);

  async function handleUpdateFulfillment(
    requestId: string,
    action: 'CONFIRM_ORDER' | 'START_PRODUCTION' | 'MARK_DISPATCHED' | 'MARK_DELIVERED',
  ) {
    if (!session?.accessToken) {
      return;
    }

    try {
      setUpdatingFulfillmentId(requestId);
      setError(null);
      setMessage(null);
      await atarApi.updateFulfillment(requestId, { action }, session.accessToken);
      await refresh();
      setMessage('Pedido actualizado correctamente.');
    } catch (fulfillmentError) {
      setError(
        fulfillmentError instanceof Error
          ? fulfillmentError.message
          : 'No se pudo actualizar el pedido.',
      );
    } finally {
      setUpdatingFulfillmentId(null);
    }
  }

  const columns: Array<{
    key: OrderColumnKey;
    title: string;
    dot: string;
    bg: string;
    moreLabel: string;
  }> = [
    {
      key: 'pending',
      title: 'Pendientes',
      dot: 'bg-[#ffcc7a]',
      bg: 'bg-[#fffaf1]',
      moreLabel: 'Ver 1 pedido mas',
    },
    {
      key: 'production',
      title: 'Produccion',
      dot: 'bg-[#5ba8ff]',
      bg: 'bg-[#f6faff]',
      moreLabel: 'Ver 1 pedido mas',
    },
    {
      key: 'transit',
      title: 'En transito',
      dot: 'bg-[#7f60ff]',
      bg: 'bg-[#faf7ff]',
      moreLabel: 'Agregar pedido',
    },
    {
      key: 'delivered',
      title: 'Entregados',
      dot: 'bg-[#70d299]',
      bg: 'bg-[#f5fcf7]',
      moreLabel: 'Ver 2 pedidos mas',
    },
  ];

  const mobileOrders = useMemo(() => {
    const byTab =
      mobileTab === 'curso'
        ? filteredOrders.filter((item) => item.column !== 'delivered')
        : mobileTab === 'completados'
          ? filteredOrders.filter((item) => item.column === 'delivered')
          : [];
    return byTab;
  }, [filteredOrders, mobileTab]);

  const mobileTabs = [
    { key: 'curso' as const, label: 'En curso', count: orderCards.filter((item) => item.column !== 'delivered').length },
    { key: 'completados' as const, label: 'Completados', count: orderCards.filter((item) => item.column === 'delivered').length },
    { key: 'cancelados' as const, label: 'Cancelados', count: 0 },
  ];

  return (
    <SupplierDashboardShell
      searchPlaceholder="Buscar pedidos, solicitudes, clientes..."
      session={session}
    >
      {/* ==================== VISTA MOBILE ==================== */}
      <div className="lg:hidden pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Pedidos</h1>

        {/* Tabs */}
        <div className="mt-4 flex items-center gap-5 border-b border-slate-200">
          {mobileTabs.map((tab) => {
            const active = mobileTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setMobileTab(tab.key)}
                className={`relative -mb-px flex items-center gap-1.5 pb-3 text-sm font-semibold transition ${
                  active ? 'text-slate-950' : 'text-slate-400'
                }`}
              >
                {tab.label}
                {tab.count > 0 ? (
                  <span
                    className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${
                      active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {tab.count}
                  </span>
                ) : null}
                {active ? <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-indigo-600" /> : null}
              </button>
            );
          })}
        </div>

        {/* Buscador */}
        <div className="mt-4">
          <div className="relative">
            <svg aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24">
              <path d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-indigo-400"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar pedido..."
              value={search}
            />
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : null}
        {message ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        ) : null}

        {/* Lista */}
        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
              Cargando pedidos...
            </div>
          ) : mobileOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
              {mobileTab === 'cancelados' ? 'No hay pedidos cancelados.' : 'No hay pedidos en esta pestaña.'}
            </div>
          ) : (
            mobileOrders.map((item) => (
              <Link
                key={item.quote.id}
                href={`/dashboard/proveedor/pedidos/${item.quote.requestId}`}
                className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition active:bg-slate-50"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[15px] font-bold text-slate-950">Pedido {item.orderNumber}</p>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${stageBadgeClass(item.column)}`}>
                    {item.stageLabel}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">{item.companyName}</p>
                <p className="mt-2 text-sm font-medium text-slate-800">{item.title}</p>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span>Entrega: <span className="font-medium text-slate-700">{item.promisedLabel}</span></span>
                  <span>Total: <span className="font-semibold text-slate-900">{item.amountLabel}</span></span>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Progreso</span>
                    <span className="font-semibold text-slate-700">{item.progress}%</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-indigo-600" style={{ width: `${item.progress}%` }} />
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* ==================== VISTA DESKTOP ==================== */}
      <section className="hidden space-y-4 lg:block">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-[24px] font-semibold tracking-[-0.03em] text-[#1f2373] sm:text-[32px]">
              Pedidos
            </h1>
            <p className="mt-1 text-sm text-[#7e85b2]">
              Gestiona el estado de tus pedidos y cumpli cada etapa.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#e7eaf3] bg-white px-4 text-sm font-semibold text-[#6d739d] transition hover:bg-[#f8f9fe]"
              type="button"
            >
              <FilterIcon />
              Filtros
            </button>

            <label className="flex h-10 min-w-[250px] items-center gap-2 rounded-xl border border-[#e7eaf3] bg-white px-3 text-sm text-[#7f86ad]">
              <SearchIcon />
              <input
                className="w-full bg-transparent outline-none placeholder:text-[#a4aac9]"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar en pedidos..."
                value={search}
              />
            </label>

            <button
              className="inline-flex h-10 items-center justify-center rounded-xl bg-[#5546ff] px-4 text-sm font-semibold text-white transition hover:bg-[#4739ea]"
              type="button"
            >
              + Nuevo pedido manual
            </button>
          </div>
        </div>

        {error ? (
          <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="rounded-[20px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
            {message}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <article className="rounded-[24px] border border-[#e7eaf3] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
            <div className="flex items-start gap-3">
              <MetricIcon kind="active" />
              <div>
                <p className="text-xs font-semibold text-[#8b92bc]">Pedidos activos</p>
                <p className="mt-1 text-[22px] font-semibold text-[#1f2373] sm:text-[30px]">{metrics.active}</p>
              </div>
            </div>
          </article>

          <article className="rounded-[24px] border border-[#e7eaf3] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
            <div className="flex items-start gap-3">
              <MetricIcon kind="production" />
              <div>
                <p className="text-xs font-semibold text-[#8b92bc]">En produccion</p>
                <p className="mt-1 text-[22px] font-semibold text-[#1f2373] sm:text-[30px]">{metrics.production}</p>
              </div>
            </div>
          </article>

          <article className="rounded-[24px] border border-[#e7eaf3] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
            <div className="flex items-start gap-3">
              <MetricIcon kind="transit" />
              <div>
                <p className="text-xs font-semibold text-[#8b92bc]">En transito</p>
                <p className="mt-1 text-[22px] font-semibold text-[#1f2373] sm:text-[30px]">{metrics.transit}</p>
              </div>
            </div>
          </article>

          <article className="rounded-[24px] border border-[#e7eaf3] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
            <div className="flex items-start gap-3">
              <MetricIcon kind="delivered" />
              <div>
                <p className="text-xs font-semibold text-[#8b92bc]">Entregados</p>
                <p className="mt-1 text-[22px] font-semibold text-[#1f2373] sm:text-[30px]">{metrics.delivered}</p>
              </div>
            </div>
          </article>
        </div>

        {loading ? (
          <div className="rounded-[24px] border border-[#e7eaf3] bg-white px-6 py-10 text-sm text-[#7e85b2]">
            Cargando pedidos...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-[24px] border border-[#e7eaf3] bg-white px-6 py-10 text-sm text-[#7e85b2]">
            No hay pedidos que coincidan con tu busqueda.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {columns.map((column) => (
              <section
                key={column.key}
                className={`rounded-[24px] border border-[#eceff8] p-4 ${column.bg}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${column.dot}`} />
                    <h2 className="text-sm font-semibold text-[#2a3266]">{column.title}</h2>
                  </div>
                  <button
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#8f95b8] transition hover:bg-white/70"
                    type="button"
                  >
                    <DotsIcon />
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {groupedOrders[column.key].length === 0 ? (
                    <div className="rounded-[18px] border border-dashed border-[#dfe4f3] bg-white/70 px-4 py-8 text-center text-sm text-[#97a0c6]">
                      Sin pedidos en esta etapa.
                    </div>
                  ) : (
                    groupedOrders[column.key].map((item) => {
                      const nextAction = getNextFulfillmentAction(
                        item.quote.request!.order!.fulfillmentStatus,
                      );

                      return (
                        <article
                          key={item.quote.id}
                          className="rounded-[18px] border border-white/80 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)]"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f4f6ff] text-xs font-bold text-[#4f59a7]">
                              {item.companyShort}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-[11px] font-semibold text-[#8b92bc]">
                                    {item.orderNumber}
                                  </p>
                                  <h3 className="truncate text-sm font-semibold text-[#24305f]">
                                    {item.companyName}
                                  </h3>
                                </div>
                                <span className="shrink-0 text-[10px] font-medium text-[#9ea5c8]">
                                  {item.updatedLabel}
                                </span>
                              </div>

                              <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-[#6f77a7]">
                                {item.title}
                              </p>

                              {column.key === 'production' ? (
                                <div className="mt-3">
                                  <div className="h-1.5 overflow-hidden rounded-full bg-[#e7ebff]">
                                    <div
                                      className="h-full rounded-full bg-[#4f65ff]"
                                      style={{ width: `${item.progress}%` }}
                                    />
                                  </div>
                                  <div className="mt-2 flex items-center justify-between text-[11px]">
                                    <span className="font-medium text-[#7d86b6]">
                                      {item.stageLabel}
                                    </span>
                                    <span className="font-semibold text-[#2b3470]">
                                      {item.progress}%
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-3 text-[11px] font-medium text-[#7d86b6]">
                                  {item.noteLabel}
                                  {column.key === 'transit' ? `: ${item.promisedLabel}` : ''}
                                </div>
                              )}

                              <div className="mt-3 flex items-center justify-between gap-3">
                                <span
                                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                                    column.key === 'delivered'
                                      ? 'bg-emerald-50 text-emerald-600'
                                      : column.key === 'transit'
                                        ? 'bg-violet-50 text-violet-600'
                                        : column.key === 'production'
                                          ? 'bg-sky-50 text-sky-600'
                                          : 'bg-amber-50 text-amber-600'
                                  }`}
                                >
                                  {item.stageLabel}
                                </span>
                                <span className="text-sm font-semibold text-[#1f2373]">
                                  {item.amountLabel}
                                </span>
                              </div>

                              {column.key !== 'delivered' ? (
                                <button
                                  className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-xl border border-[#dfe4f5] bg-white text-sm font-semibold text-[#5546ff] transition hover:bg-[#f7f6ff] disabled:opacity-60"
                                  disabled={
                                    !nextAction || updatingFulfillmentId === item.quote.requestId
                                  }
                                  onClick={() =>
                                    nextAction
                                      ? void handleUpdateFulfillment(
                                          item.quote.requestId,
                                          nextAction.action,
                                        )
                                      : undefined
                                  }
                                  type="button"
                                >
                                  {updatingFulfillmentId === item.quote.requestId
                                    ? 'Actualizando...'
                                    : nextAction?.label ?? 'Sin accion'}
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>

                <button
                  className="mt-4 text-sm font-semibold text-[#5546ff] transition hover:text-[#4336dc]"
                  type="button"
                >
                  + {column.moreLabel}
                </button>
              </section>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-4 rounded-[24px] border border-[#eceff8] bg-white px-5 py-4 shadow-[0_16px_40px_rgba(15,23,42,0.04)] lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f4f1ff] text-[#6f57ff]">
              <OrderColumnIcon kind="pending" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#2b336a]">
                Necesitas ayuda para gestionar tus pedidos?
              </p>
              <p className="mt-1 text-sm text-[#7e85b2]">
                El Asistente ATAR puede ayudarte a actualizar estados, generar documentos y
                mas.
              </p>
            </div>
          </div>

          <button
            className="inline-flex h-10 items-center justify-center rounded-xl border border-[#ddd8ff] bg-[#fbfaff] px-4 text-sm font-semibold text-[#5546ff] transition hover:bg-[#f5f2ff]"
            type="button"
          >
            Hablar con el Asistente
          </button>
        </div>
      </section>
    </SupplierDashboardShell>
  );
}
