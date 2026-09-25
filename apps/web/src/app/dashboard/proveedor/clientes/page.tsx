'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import SupplierDashboardShell from '@/components/dashboard/supplier-dashboard-shell';
import {
  atarApi,
  type CommercialOpportunityRecord,
  type CustomerDetailRecord,
  type CustomerRecord,
} from '@/lib/atar-api';
import { LoadingState } from '@/components/ui/spinner';
import { loadSession, type WebSession } from '@/lib/session';

const PAGE_SIZE = 5;

type SortKey = 'activity' | 'volume' | 'quotes' | 'name';
type StatusKey = 'active' | 'new' | 'repurchase' | 'follow' | 'inactive';

const STATUS_META: Record<StatusKey, { label: string; tone: string }> = {
  active: { label: 'Activo', tone: 'bg-emerald-50 text-emerald-600' },
  new: { label: 'Nuevo', tone: 'bg-indigo-50 text-indigo-600' },
  repurchase: { label: 'Recompra', tone: 'bg-sky-50 text-sky-600' },
  follow: { label: 'En seguimiento', tone: 'bg-amber-50 text-amber-600' },
  inactive: { label: 'Inactivo', tone: 'bg-slate-100 text-slate-500' },
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value);
}

/** "Hoy, 10:24", "Ayer, 16:03" o "19/09/2026". */
function formatDayTime(value: string) {
  const date = new Date(value);
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((startOf(new Date()) - startOf(date)) / 86400000);
  const time = new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date);
  if (diff === 0) return `Hoy, ${time}`;
  if (diff === 1) return `Ayer, ${time}`;
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join('') || 'CL'
  );
}

/** Lo último que pasó con el cliente: su compra o nuestra cotización. */
function lastActivity(customer: CustomerRecord) {
  const purchase = customer.lastPurchaseAt ? new Date(customer.lastPurchaseAt).getTime() : 0;
  const quote = customer.lastQuoteAt ? new Date(customer.lastQuoteAt).getTime() : 0;
  if (!purchase && !quote) return null;
  return purchase >= quote
    ? { at: customer.lastPurchaseAt as string, label: 'Realizó pedido', dot: 'bg-emerald-500' }
    : { at: customer.lastQuoteAt as string, label: 'Recibió cotización', dot: 'bg-indigo-500' };
}

/**
 * Estado comercial: las señales que detecta ATAR (recompra, seguimiento)
 * mandan; si no hay, se deriva de la historia de compras.
 */
function customerStatus(customer: CustomerRecord, signals: CommercialOpportunityRecord[]): StatusKey {
  if (signals.some((signal) => signal.type === 'FOLLOW_UP')) return 'follow';
  if (signals.some((signal) => signal.type === 'REPURCHASE')) return 'repurchase';
  if (customer.ordersCount === 0) return 'new';
  if (typeof customer.daysSinceLastPurchase === 'number' && customer.daysSinceLastPurchase > 180) return 'inactive';
  return 'active';
}

/* Íconos ------------------------------------------------------------------- */

type IconName = 'users' | 'doc' | 'box' | 'chart' | 'arrow' | 'search' | 'pin' | 'sort' | 'chev-left' | 'chev-right' | 'close' | 'chat';

const ICON_PATHS: Record<IconName, ReactNode> = {
  users: <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8" />,
  doc: <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5zM14 3v5h5M9 13h6M9 17h4" />,
  box: <path d="M21 16V8l-9-5-9 5v8l9 5 9-5zM3.3 7.3L12 12l8.7-4.7M12 22V12" />,
  chart: <path d="M5 20V12M12 20V5M19 20v-9" />,
  arrow: <path d="M9 6l6 6-6 6" />,
  search: <path d="M21 21l-4.3-4.3M11 19a8 8 0 100-16 8 8 0 000 16z" />,
  pin: <path d="M12 21s7-5.4 7-11a7 7 0 10-14 0c0 5.6 7 11 7 11zM12 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />,
  sort: <path d="M7 4v16M4 7l3-3 3 3M17 20V4M14 17l3 3 3-3" />,
  'chev-left': <path d="M15 18l-6-6 6-6" />,
  'chev-right': <path d="M9 6l6 6-6 6" />,
  close: <path d="M18 6L6 18M6 6l12 12" />,
  chat: <path d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z" />,
};

function Icon({ name, className = 'h-4 w-4' }: { name: IconName; className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      {ICON_PATHS[name]}
    </svg>
  );
}

const card = 'rounded-[18px] bg-white shadow-[0_10px_30px_rgba(40,28,110,0.05)]';
const selectClass =
  'h-11 appearance-none rounded-[12px] border border-slate-200 bg-white pl-3.5 pr-9 text-[14px] text-slate-700 outline-none transition focus:border-indigo-300';

function SelectChevron() {
  return (
    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
      <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M6 9l6 6 6-6" />
      </svg>
    </span>
  );
}

/**
 * Historial comercial del proveedor (base del CRM interno) y las señales
 * comerciales que ATAR detecta sobre esa historia.
 */
export default function SupplierClientsPage() {
  const [session, setSession] = useState<WebSession | null>(null);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [opportunities, setOpportunities] = useState<CommercialOpportunityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('all');
  const [status, setStatus] = useState<StatusKey | 'all'>('all');
  const [sort, setSort] = useState<SortKey>('activity');
  const [page, setPage] = useState(1);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [historyFor, setHistoryFor] = useState<CustomerRecord | null>(null);
  const [history, setHistory] = useState<CustomerDetailRecord | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const storedSession = loadSession();
      if (!storedSession) {
        return;
      }

      setSession(storedSession);

      try {
        setLoading(true);
        setError(null);
        const [customersResult, opportunitiesResult] = await Promise.all([
          atarApi.getSupplierCustomers(storedSession.accessToken),
          atarApi.getCommercialOpportunities(storedSession.accessToken),
        ]);

        if (!cancelled) {
          setCustomers(customersResult);
          setOpportunities(opportunitiesResult);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el historial comercial.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  async function openHistory(customer: CustomerRecord) {
    setMenuFor(null);
    setHistoryFor(customer);
    setHistory(null);
    setHistoryError(null);
    if (!session?.accessToken) return;
    try {
      setHistoryLoading(true);
      setHistory(await atarApi.getSupplierCustomerDetail(customer.companyId, session.accessToken));
    } catch (detailError) {
      setHistoryError(detailError instanceof Error ? detailError.message : 'No se pudo cargar el historial.');
    } finally {
      setHistoryLoading(false);
    }
  }

  const signalsByCompany = useMemo(() => {
    const map = new Map<string, CommercialOpportunityRecord[]>();
    for (const opportunity of opportunities) {
      map.set(opportunity.companyId, [...(map.get(opportunity.companyId) ?? []), opportunity]);
    }
    return map;
  }, [opportunities]);

  const statusOf = (customer: CustomerRecord) => customerStatus(customer, signalsByCompany.get(customer.companyId) ?? []);

  const locations = useMemo(
    () => Array.from(new Set(customers.map((customer) => customer.location).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'es')),
    [customers],
  );

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result = customers.filter((customer) => {
      if (location !== 'all' && customer.location !== location) return false;
      if (status !== 'all' && customerStatus(customer, signalsByCompany.get(customer.companyId) ?? []) !== status) return false;
      if (!query) return true;
      return [customer.name, customer.location, customer.lastProduct ?? '', customer.lastQuotedProduct ?? '']
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
    const activityTime = (customer: CustomerRecord) => {
      const activity = lastActivity(customer);
      return activity ? new Date(activity.at).getTime() : 0;
    };
    return [...result].sort((left, right) => {
      if (sort === 'volume') return right.purchasedAmount - left.purchasedAmount;
      if (sort === 'quotes') return right.quotesCount - left.quotesCount;
      if (sort === 'name') return left.name.localeCompare(right.name, 'es');
      return activityTime(right) - activityTime(left);
    });
  }, [customers, location, search, signalsByCompany, sort, status]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageCustomers = filteredCustomers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const totals = customers.reduce(
    (accumulator, customer) => ({
      revenue: accumulator.revenue + customer.purchasedAmount,
      quoted: accumulator.quoted + customer.quotedAmount,
      orders: accumulator.orders + customer.ordersCount,
      quotes: accumulator.quotes + customer.quotesCount,
      buyers: accumulator.buyers + (customer.ordersCount > 0 ? 1 : 0),
    }),
    { revenue: 0, quoted: 0, orders: 0, quotes: 0, buyers: 0 },
  );
  const conversion = totals.quotes > 0 ? Math.round((totals.orders / totals.quotes) * 100) : 0;
  const repurchaseSignals = opportunities.filter((opportunity) => opportunity.type === 'REPURCHASE').length;

  const kpis: { label: string; value: string | number; note: string; icon: IconName; action: () => void }[] = [
    {
      label: 'Clientes totales',
      value: customers.length,
      note: `${totals.buyers} ya ${totals.buyers === 1 ? 'compró' : 'compraron'}`,
      icon: 'users',
      action: () => updateFilters(() => setStatus('all')),
    },
    {
      label: 'Cotizaciones enviadas',
      value: totals.quotes,
      note: `${formatCurrency(totals.quoted)} cotizado`,
      icon: 'doc',
      action: () => updateFilters(() => setSort('quotes')),
    },
    {
      label: 'Pedidos concretados',
      value: totals.orders,
      note: `${conversion}% de conversión`,
      icon: 'box',
      action: () => updateFilters(() => setStatus('active')),
    },
    {
      label: 'Volumen vendido',
      value: formatCurrency(totals.revenue),
      note: repurchaseSignals > 0 ? `${repurchaseSignals} ${repurchaseSignals === 1 ? 'señal' : 'señales'} de recompra` : 'Sin señales de recompra',
      icon: 'chart',
      action: () => updateFilters(() => setSort('volume')),
    },
  ];

  const topCustomers = [...customers]
    .sort((left, right) => right.purchasedAmount - left.purchasedAmount || right.quotesCount - left.quotesCount)
    .slice(0, 3);

  function updateFilters(change: () => void) {
    change();
    setPage(1);
  }

  return (
    <SupplierDashboardShell
      onSearchChange={(value) => updateFilters(() => setSearch(value))}
      searchPlaceholder="Buscar clientes, empresas o ubicaciones..."
      searchValue={search}
      session={session}
    >
      {/* Encabezado */}
      <div>
        <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-500">Clientes</p>
        <h1 className="mt-1 text-[32px] font-bold leading-tight tracking-[-0.035em] text-[#16123a] sm:text-[36px]">Clientes</h1>
        <p className="mt-0.5 text-[15px] text-slate-500">Todo lo que cotizaste y vendiste, por cliente, con las señales de recompra.</p>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      {/* Contadores */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <button
            key={kpi.label}
            className={`${card} group flex items-start gap-4 p-5 text-left transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(40,28,110,0.09)]`}
            onClick={kpi.action}
            type="button"
          >
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
              <Icon className="h-6 w-6" name={kpi.icon} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[28px] font-bold leading-none text-[#16123a]">{loading ? '—' : kpi.value}</span>
              <span className="mt-1.5 block text-[15px] text-slate-600">{kpi.label}</span>
              <span className={`mt-2 block text-[12px] font-medium ${kpi.note.startsWith('Sin') ? 'text-slate-400' : 'text-emerald-600'}`}>
                {loading ? '' : kpi.note}
              </span>
            </span>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 transition group-hover:translate-x-0.5">
              <Icon name="arrow" />
            </span>
          </button>
        ))}
      </div>

      {/* Tabla */}
      <section className={`${card} mt-5 p-4`}>
        <div className="flex flex-wrap gap-3">
          <label className="relative min-w-[240px] flex-1">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <Icon name="search" />
            </span>
            <input
              className="h-11 w-full rounded-[12px] border border-slate-200 bg-white pl-10 pr-3 text-[14px] outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
              onChange={(event) => updateFilters(() => setSearch(event.target.value))}
              placeholder="Buscar clientes por nombre, ciudad o producto..."
              type="search"
              value={search}
            />
          </label>
          <label className="relative">
            <select aria-label="Ubicación" className={`${selectClass} min-w-[200px]`} onChange={(event) => updateFilters(() => setLocation(event.target.value))} value={location}>
              <option value="all">Todas las ubicaciones</option>
              {locations.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <SelectChevron />
          </label>
          <label className="relative">
            <select aria-label="Estado" className={`${selectClass} min-w-[200px]`} onChange={(event) => updateFilters(() => setStatus(event.target.value as StatusKey | 'all'))} value={status}>
              <option value="all">Todos los estados</option>
              {(Object.keys(STATUS_META) as StatusKey[]).map((key) => (
                <option key={key} value={key}>
                  {STATUS_META[key].label}
                </option>
              ))}
            </select>
            <SelectChevron />
          </label>
          <label className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              <Icon name="sort" />
            </span>
            <select aria-label="Ordenar por" className={`${selectClass} min-w-[190px] pl-9`} onChange={(event) => updateFilters(() => setSort(event.target.value as SortKey))} value={sort}>
              <option value="activity">Actividad reciente</option>
              <option value="volume">Mayor volumen</option>
              <option value="quotes">Más cotizaciones</option>
              <option value="name">Nombre (A-Z)</option>
            </select>
            <SelectChevron />
          </label>
        </div>

        {/* Mobile: tarjetas. Desde md, la tabla completa. */}
        <ul className="mt-4 space-y-3 md:hidden">
          {loading ? (
            <li className="py-10">
              <LoadingState label="Cargando clientes..." />
            </li>
          ) : pageCustomers.length === 0 ? (
            <li className="py-10 text-center text-[13px] text-slate-500">
              {customers.length === 0
                ? 'Todavía no hay clientes. Aparecen cuando cotizás a un comprador.'
                : 'No hay clientes que coincidan con los filtros.'}
            </li>
          ) : (
            pageCustomers.map((customer) => {
              const activity = lastActivity(customer);
              const meta = STATUS_META[statusOf(customer)];
              const product = customer.lastProduct ?? customer.lastQuotedProduct;
              return (
                <li key={customer.companyId} className="rounded-[14px] border border-slate-100 p-3.5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[13px] font-bold text-indigo-600">
                      {initials(customer.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-[14px] font-semibold text-slate-900">{customer.name}</p>
                        <span className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium ${meta.tone}`}>{meta.label}</span>
                      </div>
                      {product ? <p className="truncate text-[12px] text-slate-500">{product}</p> : null}
                      <p className="mt-0.5 flex items-center gap-1 text-[12px] text-slate-500">
                        <Icon className="h-3.5 w-3.5 text-slate-400" name="pin" />
                        {customer.location || '—'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 divide-x divide-slate-100 rounded-[10px] bg-[#f7f6fd] py-2 text-center">
                    <span>
                      <span className="block text-[10px] text-slate-500">Cotizaciones</span>
                      <span className="block text-[13px] font-semibold text-slate-900">{customer.quotesCount}</span>
                    </span>
                    <span>
                      <span className="block text-[10px] text-slate-500">Pedidos</span>
                      <span className="block text-[13px] font-semibold text-slate-900">{customer.ordersCount}</span>
                    </span>
                    <span>
                      <span className="block text-[10px] text-slate-500">Volumen</span>
                      <span className="block truncate px-1 text-[13px] font-semibold text-slate-900">{formatCurrency(customer.purchasedAmount)}</span>
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-[12px] text-slate-500">
                      {activity ? `${activity.label} · ${formatDayTime(activity.at)}` : 'Sin actividad'}
                    </p>
                    <button
                      className="inline-flex h-9 shrink-0 items-center rounded-[10px] bg-indigo-50 px-4 text-[13px] font-semibold text-indigo-600"
                      onClick={() => void openHistory(customer)}
                      type="button"
                    >
                      Ver historial
                    </button>
                  </div>
                </li>
              );
            })
          )}
        </ul>

        <div className="mt-4 hidden overflow-x-auto md:block">
          <table className="w-full min-w-[1000px] text-left text-[14px]">
            <thead>
              <tr className="bg-[#f6f4fd] text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                <th className="rounded-l-lg px-3 py-3">Cliente</th>
                <th className="px-3 py-3">Ubicación</th>
                <th className="px-3 py-3 text-center">Cotizaciones</th>
                <th className="px-3 py-3 text-center">Pedidos</th>
                <th className="px-3 py-3">Última actividad</th>
                <th className="px-3 py-3">Volumen total</th>
                <th className="px-3 py-3">Estado</th>
                <th className="rounded-r-lg px-3 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-3 py-10" colSpan={8}>
                    <LoadingState label="Cargando clientes..." />
                  </td>
                </tr>
              ) : pageCustomers.length === 0 ? (
                <tr>
                  <td className="px-3 py-10 text-center text-slate-500" colSpan={8}>
                    {customers.length === 0
                      ? 'Todavía no hay clientes. Aparecen cuando cotizás a un comprador.'
                      : 'No hay clientes que coincidan con los filtros.'}
                  </td>
                </tr>
              ) : (
                pageCustomers.map((customer) => {
                  const activity = lastActivity(customer);
                  const meta = STATUS_META[statusOf(customer)];
                  const product = customer.lastProduct ?? customer.lastQuotedProduct;
                  return (
                    <tr key={customer.companyId} className="border-b border-slate-100 last:border-b-0">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[13px] font-bold text-indigo-600">
                            {initials(customer.name)}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-semibold text-slate-900">{customer.name}</span>
                            {product ? <span className="block max-w-[200px] truncate text-[13px] text-slate-500">{product}</span> : null}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center gap-2 text-slate-600">
                          <Icon className="h-4 w-4 text-slate-400" name="pin" />
                          {customer.location || '—'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center text-slate-700">{customer.quotesCount}</td>
                      <td className="px-3 py-3 text-center text-slate-700">{customer.ordersCount}</td>
                      <td className="px-3 py-3">
                        {activity ? (
                          <span className="flex items-start gap-2.5">
                            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${activity.dot}`} />
                            <span>
                              <span className="block whitespace-nowrap text-slate-800">{formatDayTime(activity.at)}</span>
                              <span className="block text-[13px] text-slate-500">{activity.label}</span>
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-400">Sin actividad</span>
                        )}
                      </td>
                      <td className="px-3 py-3 font-semibold text-slate-900">{formatCurrency(customer.purchasedAmount)}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex whitespace-nowrap rounded-md px-2.5 py-1 text-[12px] font-medium ${meta.tone}`}>{meta.label}</span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            className="inline-flex h-10 items-center whitespace-nowrap rounded-[10px] bg-indigo-50 px-5 text-[13px] font-semibold text-indigo-600 transition hover:bg-indigo-100"
                            onClick={() => void openHistory(customer)}
                            type="button"
                          >
                            Ver historial
                          </button>
                          <div className="relative">
                            <button
                              aria-label="Más acciones"
                              className="flex h-10 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                              onClick={() => setMenuFor(menuFor === customer.companyId ? null : customer.companyId)}
                              type="button"
                            >
                              <svg aria-hidden="true" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                <circle cx="12" cy="5" r="1.8" />
                                <circle cx="12" cy="12" r="1.8" />
                                <circle cx="12" cy="19" r="1.8" />
                              </svg>
                            </button>
                            {menuFor === customer.companyId ? (
                              <>
                                <button aria-label="Cerrar menú" className="fixed inset-0 z-20 cursor-default" onClick={() => setMenuFor(null)} type="button" />
                                <div className="absolute right-0 top-11 z-30 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-[13px] shadow-[0_16px_40px_rgba(15,23,42,0.14)]">
                                  <Link className="block px-3 py-2 text-slate-700 hover:bg-slate-50" href="/dashboard/proveedor/mensajes">
                                    Enviar mensaje
                                  </Link>
                                  <Link className="block px-3 py-2 text-slate-700 hover:bg-slate-50" href="/dashboard/proveedor/cotizaciones">
                                    Ver cotizaciones
                                  </Link>
                                </div>
                              </>
                            ) : null}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 px-1 text-[13px] text-slate-500">
          <p>
            {filteredCustomers.length === 0
              ? 'Sin resultados'
              : `Mostrando ${(currentPage - 1) * PAGE_SIZE + 1} a ${Math.min(currentPage * PAGE_SIZE, filteredCustomers.length)} de ${filteredCustomers.length} clientes`}
          </p>
          {totalPages > 1 ? (
            <div className="flex items-center gap-1.5">
              <button aria-label="Página anterior" className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} type="button">
                <Icon name="chev-left" />
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => (
                <button
                  key={number}
                  className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-[13px] font-semibold ${
                    number === currentPage ? 'bg-indigo-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                  onClick={() => setPage(number)}
                  type="button"
                >
                  {number}
                </button>
              ))}
              <button aria-label="Página siguiente" className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)} type="button">
                <Icon name="chev-right" />
              </button>
            </div>
          ) : null}
        </div>
      </section>

      {/* Mayor actividad */}
      {topCustomers.length > 0 ? (
        <section className={`${card} mt-5 p-4`}>
          <div className="flex items-center justify-between gap-3 px-1">
            <h2 className="flex items-center gap-2 text-[16px] font-bold text-[#16123a]">
              <span className="text-indigo-600">
                <Icon name="chart" />
              </span>
              Clientes con mayor actividad
            </h2>
            <button className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-indigo-600" onClick={() => updateFilters(() => setSort('volume'))} type="button">
              Ver todos
              <Icon name="arrow" />
            </button>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {topCustomers.map((customer) => (
              <button
                key={customer.companyId}
                className="flex items-center gap-3 rounded-[14px] border border-slate-100 px-4 py-3 text-left transition hover:border-indigo-200 hover:bg-[#fbfaff]"
                onClick={() => void openHistory(customer)}
                type="button"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[12px] font-bold text-indigo-600">
                  {initials(customer.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-slate-900">{customer.name}</span>
                  <span className="block text-[13px] text-slate-500">
                    {customer.quotesCount} {customer.quotesCount === 1 ? 'cotización' : 'cotizaciones'} · {customer.ordersCount}{' '}
                    {customer.ordersCount === 1 ? 'pedido' : 'pedidos'}
                  </span>
                </span>
                <span className="font-semibold text-slate-900">{formatCurrency(customer.purchasedAmount)}</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {/* Historial del cliente */}
      {historyFor ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-[#120f2e]/40 backdrop-blur-[2px]" onClick={() => setHistoryFor(null)} role="presentation">
          <aside
            aria-label={`Historial de ${historyFor.name}`}
            className="flex h-full w-full max-w-[480px] flex-col bg-white shadow-[-20px_0_60px_rgba(18,15,46,0.25)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-[14px] font-bold text-indigo-600">
                  {initials(historyFor.name)}
                </span>
                <div>
                  <p className="text-[18px] font-bold text-[#16123a]">{historyFor.name}</p>
                  <p className="text-[13px] text-slate-500">{historyFor.location}</p>
                </div>
              </div>
              <button aria-label="Cerrar historial" className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100" onClick={() => setHistoryFor(null)} type="button">
                <Icon name="close" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3 border-b border-slate-100 p-5 text-center">
              <div>
                <p className="text-[20px] font-bold text-[#16123a]">{historyFor.quotesCount}</p>
                <p className="text-[12px] text-slate-500">Cotizaciones</p>
              </div>
              <div>
                <p className="text-[20px] font-bold text-[#16123a]">{historyFor.ordersCount}</p>
                <p className="text-[12px] text-slate-500">Pedidos</p>
              </div>
              <div>
                <p className="truncate text-[20px] font-bold text-[#16123a]">{formatCurrency(historyFor.purchasedAmount)}</p>
                <p className="text-[12px] text-slate-500">Vendido</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {(signalsByCompany.get(historyFor.companyId) ?? []).map((signal, index) => (
                <p key={`${signal.type}-${index}`} className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-[13px] text-amber-700">
                  {signal.type === 'REPURCHASE'
                    ? `Oportunidad de recompra${signal.product ? ` de ${signal.product}` : ''}${typeof signal.days === 'number' ? ` · última compra hace ${signal.days} días` : ''}.`
                    : signal.type === 'FOLLOW_UP'
                      ? `Seguimiento pendiente${signal.product ? ` de ${signal.product}` : ''}.`
                      : `Postventa${signal.product ? ` de ${signal.product}` : ''}: consultá cómo llegó la entrega.`}
                </p>
              ))}
              {historyLoading ? (
                <LoadingState label="Cargando historial..." />
              ) : historyError ? (
                <p className="rounded-xl bg-rose-50 px-3 py-2 text-[13px] text-rose-700">{historyError}</p>
              ) : history && history.quotes.length > 0 ? (
                <ol className="space-y-3">
                  {history.quotes.map((quote) => (
                    <li key={quote.id}>
                      <Link className="block rounded-[14px] border border-slate-100 p-3.5 transition hover:border-indigo-200 hover:bg-[#fbfaff]" href={`/dashboard/proveedor/cotizaciones/${quote.id}`}>
                        <span className="flex items-start justify-between gap-3">
                          <span className="min-w-0">
                            <span className="block truncate font-semibold text-slate-900">{quote.requestTitle}</span>
                            <span className="block text-[12px] text-slate-500">
                              {quote.category}
                              {typeof quote.quantity === 'number' ? ` · ${quote.quantity.toLocaleString('es-AR')} u.` : ''} · {formatDayTime(quote.createdAt)}
                            </span>
                          </span>
                          <span className="shrink-0 text-right">
                            <span className="block font-semibold text-slate-900">
                              {typeof quote.amount === 'number' ? formatCurrency(quote.amount) : 'A convenir'}
                            </span>
                            <span className={`mt-1 inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium ${quote.order ? 'bg-emerald-50 text-emerald-600' : quote.status === 'REJECTED' ? 'bg-slate-100 text-slate-500' : 'bg-indigo-50 text-indigo-600'}`}>
                              {quote.order ? 'Pedido' : quote.status === 'AWARDED' ? 'Aceptada' : quote.status === 'REJECTED' ? 'Rechazada' : 'Cotización'}
                            </span>
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              ) : history ? (
                <p className="text-center text-[13px] text-slate-500">Todavía no hay cotizaciones con este cliente.</p>
              ) : null}
            </div>
            <div className="border-t border-slate-100 p-5">
              <Link className="flex h-11 items-center justify-center gap-2 rounded-[12px] bg-indigo-600 text-[14px] font-semibold transition hover:bg-indigo-700" href="/dashboard/proveedor/mensajes">
                {/* globals.css fija `a { color: inherit }`: el color va en el hijo. */}
                <span className="inline-flex items-center gap-2 text-white">
                  <Icon name="chat" />
                  Enviar mensaje
                </span>
              </Link>
            </div>
          </aside>
        </div>
      ) : null}
    </SupplierDashboardShell>
  );
}
