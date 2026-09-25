'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';
import SupplierDashboardShell from '@/components/dashboard/supplier-dashboard-shell';
import { type QuoteRecord, type RequestRecord } from '@/lib/atar-api';
import { LoadingState } from '@/components/ui/spinner';
import { useSupplierDashboardData } from '@/lib/dashboard-hooks';
import { FALLBACK_REQUEST_CATEGORIES } from '@/lib/request-catalog-fallback';

type QuoteTab = 'all' | 'pending' | 'submitted' | 'awarded' | 'expired';

const PAGE_SIZE = 5;
const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;

/**
 * Una fila de la tabla. "Por responder" junta lo que todavía espera acción del
 * vendedor: solicitudes abiertas sin cotizar y cotizaciones en borrador.
 */
type Row = {
  id: string;
  request: RequestRecord | null;
  quote: QuoteRecord | null;
  title: string;
  buyer: string;
  amount: number | null;
  currency: string;
  updatedAt: string;
  /** Vencimiento relevante: cierre de la solicitud o validez de la oferta. */
  deadline: string | null;
  kind: 'pending' | 'submitted' | 'awarded' | 'rejected' | 'withdrawn';
  expired: boolean;
};

/* Formatos ----------------------------------------------------------------- */

function formatAmount(value: number | null, currency: string) {
  if (typeof value !== 'number') {
    return null;
  }
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: currency || 'ARS', maximumFractionDigits: 0 }).format(value);
}

/** "Hoy, 10:24", "Ayer, 16:03" o "19/09/2026". */
function formatDayTime(value: string) {
  const date = new Date(value);
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((startOf(new Date()) - startOf(date)) / DAY);
  const time = new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date);
  if (diff === 0) return `Hoy, ${time}`;
  if (diff === 1) return `Ayer, ${time}`;
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

/** "Vence en 23 h" / "Vence en 2 días" / "Venció". */
function formatDue(deadline: string | null, nowMs: number) {
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - nowMs;
  if (Number.isNaN(diff)) return null;
  if (diff <= 0) return 'Venció';
  if (diff < DAY) return `Vence en ${Math.max(1, Math.round(diff / HOUR))} h`;
  const days = Math.round(diff / DAY);
  return `Vence en ${days} ${days === 1 ? 'día' : 'días'}`;
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join('') || 'AT'
  );
}

function requestImage(request: RequestRecord | null) {
  const labels = [request?.items?.[0]?.category, request?.category].filter(Boolean);
  for (const label of labels) {
    const match = FALLBACK_REQUEST_CATEGORIES.find((category) => category.label === label);
    if (match?.imageSrc) return match.imageSrc;
  }
  return '/logoatar.png';
}

function requestQuantity(request: RequestRecord | null) {
  if (!request) return null;
  const item = request.items?.[0];
  const quantity = item?.quantity ?? request.quantityRequested ?? null;
  if (typeof quantity === 'number') {
    return `${quantity.toLocaleString('es-AR')} ${item?.unit ?? 'unidades'}`;
  }
  const line = (request.description ?? '').split('\n').find((raw) => /^cantidad/i.test(raw.trim()));
  const value = line?.split(':')[1]?.trim();
  if (!value) return null;
  return /^\d+$/.test(value) ? `${Number(value).toLocaleString('es-AR')} unidades` : value;
}

const STATUS_META: Record<Row['kind'] | 'expired', { label: string; tone: string; dot: string }> = {
  pending: { label: 'Por responder', tone: 'bg-rose-50 text-rose-600', dot: 'bg-rose-500' },
  submitted: { label: 'Enviada', tone: 'bg-indigo-50 text-indigo-600', dot: 'bg-indigo-500' },
  awarded: { label: 'Aceptada', tone: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-500' },
  rejected: { label: 'Rechazada', tone: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
  withdrawn: { label: 'Retirada', tone: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
  expired: { label: 'Vencida', tone: 'bg-amber-50 text-amber-600', dot: 'bg-amber-500' },
};

/* Íconos ------------------------------------------------------------------- */

type IconName = 'send' | 'check' | 'clock' | 'arrow' | 'plus' | 'search' | 'chev-left' | 'chev-right';

const ICON_PATHS: Record<IconName, ReactNode> = {
  send: <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />,
  check: <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0zM8 12.5l2.7 2.7L16 9.8" />,
  clock: <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0zM12 7v5l3 2" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  search: <path d="M21 21l-4.3-4.3M11 19a8 8 0 100-16 8 8 0 000 16z" />,
  'chev-left': <path d="M15 18l-6-6 6-6" />,
  'chev-right': <path d="M9 6l6 6-6 6" />,
};

function Icon({ name, className = 'h-4 w-4' }: { name: IconName; className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      {ICON_PATHS[name]}
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="5" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="12" cy="19" r="1.8" />
    </svg>
  );
}

const card = 'rounded-[18px] bg-white shadow-[0_10px_30px_rgba(40,28,110,0.05)]';

/* Página ------------------------------------------------------------------- */

export default function SupplierQuotesPage() {
  const { session, openRequests, myQuotes, loading, error } = useSupplierDashboardData();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<QuoteTab>('all');
  const [page, setPage] = useState(1);
  const [menuRow, setMenuRow] = useState<string | null>(null);
  // Hora de referencia fija para que los cálculos del render sean puros.
  const [nowMs] = useState(() => Date.now());

  const rows = useMemo<Row[]>(() => {
    const quotedRequestIds = new Set(myQuotes.filter((quote) => quote.status !== 'DRAFT').map((quote) => quote.requestId));

    const quoteRows: Row[] = myQuotes.map((quote) => {
      const kind: Row['kind'] =
        quote.status === 'DRAFT'
          ? 'pending'
          : quote.status === 'AWARDED'
            ? 'awarded'
            : quote.status === 'REJECTED'
              ? 'rejected'
              : quote.status === 'WITHDRAWN'
                ? 'withdrawn'
                : 'submitted';
      const deadline = kind === 'pending' ? quote.request?.dueDate ?? null : quote.validUntil ?? quote.request?.dueDate ?? null;
      return {
        id: `quote-${quote.id}`,
        request: quote.request ?? null,
        quote,
        title: quote.request?.productName || quote.request?.title || 'Cotización',
        buyer: quote.request?.buyerCompany?.name ?? 'Comprador',
        amount: quote.amount,
        currency: quote.currency,
        updatedAt: quote.updatedAt,
        deadline,
        kind,
        expired: (kind === 'submitted' || kind === 'pending') && Boolean(deadline) && new Date(deadline as string).getTime() < nowMs,
      };
    });

    const draftRequestIds = new Set(myQuotes.filter((quote) => quote.status === 'DRAFT').map((quote) => quote.requestId));
    const pendingRequestRows: Row[] = openRequests
      .filter((request) => !quotedRequestIds.has(request.id) && !draftRequestIds.has(request.id))
      .map((request) => ({
        id: `request-${request.id}`,
        request,
        quote: null,
        title: request.productName || request.title,
        buyer: request.buyerCompany?.name ?? 'Comprador',
        amount: null,
        currency: 'ARS',
        updatedAt: request.updatedAt,
        deadline: request.dueDate,
        kind: 'pending' as const,
        expired: Boolean(request.dueDate) && new Date(request.dueDate as string).getTime() < nowMs,
      }));

    return [...pendingRequestRows, ...quoteRows].sort(
      (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
    );
  }, [myQuotes, nowMs, openRequests]);

  const matchesTab = (tab: QuoteTab, row: Row) => {
    if (tab === 'pending') return row.kind === 'pending' && !row.expired;
    if (tab === 'submitted') return row.kind === 'submitted' && !row.expired;
    if (tab === 'awarded') return row.kind === 'awarded';
    if (tab === 'expired') return row.expired;
    return true;
  };

  const searchedRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) =>
      [row.title, row.buyer, row.request?.category ?? '', row.request?.title ?? ''].join(' ').toLowerCase().includes(query),
    );
  }, [rows, search]);

  const tabs: { key: QuoteTab; label: string }[] = [
    { key: 'all', label: 'Todas' },
    { key: 'pending', label: 'Por responder' },
    { key: 'submitted', label: 'Enviadas' },
    { key: 'awarded', label: 'Aceptadas' },
    { key: 'expired', label: 'Vencidas' },
  ];
  const tabCounts = Object.fromEntries(
    tabs.map((tab) => [tab.key, searchedRows.filter((row) => matchesTab(tab.key, row)).length]),
  ) as Record<QuoteTab, number>;

  const tabRows = searchedRows.filter((row) => matchesTab(activeTab, row));
  const totalPages = Math.max(1, Math.ceil(tabRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = tabRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Contadores superiores.
  const sentRows = rows.filter((row) => row.kind === 'submitted' || row.kind === 'awarded' || row.kind === 'rejected');
  const awardedRows = rows.filter((row) => row.kind === 'awarded');
  const pendingRows = rows.filter((row) => row.kind === 'pending' && !row.expired);
  const inLastWeek = (value: string) => nowMs - new Date(value).getTime() <= 7 * DAY;
  const sentThisWeek = sentRows.filter((row) => inLastWeek(row.quote?.createdAt ?? row.updatedAt)).length;
  const awardedThisWeek = awardedRows.filter((row) => inLastWeek(row.updatedAt)).length;
  const pendingOld = pendingRows.filter((row) => nowMs - new Date(row.request?.createdAt ?? row.updatedAt).getTime() > 48 * HOUR).length;

  const summaryCards = [
    {
      label: 'Enviadas',
      value: sentRows.length,
      note: sentThisWeek > 0 ? `↑ +${sentThisWeek} esta semana` : 'Sin envíos esta semana',
      noteTone: sentThisWeek > 0 ? 'text-emerald-600' : 'text-slate-400',
      icon: 'send' as const,
      tone: 'bg-indigo-50 text-indigo-600',
      tab: 'submitted' as const,
    },
    {
      label: 'Aceptadas',
      value: awardedRows.length,
      note: awardedThisWeek > 0 ? `+${awardedThisWeek} esta semana` : 'Sin novedades esta semana',
      noteTone: awardedThisWeek > 0 ? 'text-emerald-600' : 'text-slate-400',
      icon: 'check' as const,
      tone: 'bg-emerald-50 text-emerald-600',
      tab: 'awarded' as const,
    },
    {
      label: 'Por responder',
      value: pendingRows.length,
      note: pendingOld > 0 ? `+${pendingOld} con más de 48 h` : 'Todas al día',
      noteTone: pendingOld > 0 ? 'text-rose-500' : 'text-slate-400',
      icon: 'clock' as const,
      tone: 'bg-rose-50 text-rose-500',
      tab: 'pending' as const,
    },
  ];

  // Lo que vence en los próximos 7 días y todavía espera algo del vendedor o del comprador.
  const upcoming = rows
    .filter((row) => (row.kind === 'pending' || row.kind === 'submitted') && row.deadline && !row.expired)
    .filter((row) => new Date(row.deadline as string).getTime() - nowMs <= 7 * DAY)
    .sort((left, right) => new Date(left.deadline as string).getTime() - new Date(right.deadline as string).getTime());

  function selectTab(tab: QuoteTab) {
    setActiveTab(tab);
    setPage(1);
  }

  function updateSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function rowHref(row: Row) {
    return row.quote && row.kind !== 'pending'
      ? `/dashboard/proveedor/cotizaciones/${row.quote.id}`
      : `/dashboard/proveedor/solicitudes/${row.request?.id ?? ''}`;
  }

  function urgency(row: Row) {
    if (row.kind !== 'pending' || !row.deadline || row.expired) return null;
    const diff = new Date(row.deadline).getTime() - nowMs;
    if (diff < DAY) return { bg: 'bg-rose-50/70', text: 'text-rose-500' };
    if (diff < 3 * DAY) return { bg: 'bg-amber-50/70', text: 'text-amber-600' };
    return null;
  }

  return (
    <SupplierDashboardShell
      onSearchChange={updateSearch}
      searchPlaceholder="Buscar solicitudes, productos o clientes..."
      searchValue={search}
      session={session}
    >
      {/* Encabezado */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-bold leading-tight tracking-[-0.035em] text-[#16123a] sm:text-[36px]">Cotizaciones</h1>
          <p className="mt-0.5 text-[16px] text-slate-500">Gestioná y seguí tus propuestas.</p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <label className="relative min-w-[220px] flex-1 sm:w-[320px] sm:flex-none">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <Icon name="search" />
            </span>
            <input
              className="h-11 w-full rounded-[12px] border border-slate-200 bg-white pl-10 pr-3 text-[14px] outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
              onChange={(event) => updateSearch(event.target.value)}
              placeholder="Buscar cotizaciones..."
              type="search"
              value={search}
            />
          </label>
          <Link
            className="inline-flex h-11 items-center gap-2 rounded-[12px] bg-indigo-600 px-5 text-[15px] font-semibold shadow-[0_10px_24px_rgba(100,64,232,0.28)] transition hover:bg-indigo-700"
            href="/dashboard/proveedor/solicitudes"
          >
            {/* globals.css fija `a { color: inherit }`: el color va en el hijo. */}
            <span className="inline-flex items-center gap-2 text-white">
              <Icon name="plus" />
              Nueva cotización
            </span>
          </Link>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      {/* Contadores */}
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {summaryCards.map((summary) => (
          <button
            key={summary.label}
            className={`${card} group flex items-center gap-4 p-5 text-left transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(40,28,110,0.09)]`}
            onClick={() => selectTab(summary.tab)}
            type="button"
          >
            <span className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full ${summary.tone}`}>
              <Icon className="h-7 w-7" name={summary.icon} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[30px] font-bold leading-none text-[#16123a]">{loading ? '—' : summary.value}</span>
              <span className="mt-1 block text-[16px] text-slate-700">{summary.label}</span>
              <span className={`mt-0.5 block text-[13px] ${summary.noteTone}`}>{summary.note}</span>
            </span>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 transition group-hover:translate-x-0.5">
              <Icon name="arrow" />
            </span>
          </button>
        ))}
      </div>

      {/* Tabla */}
      <section className={`${card} mt-5 p-5`}>
        <div className="flex gap-2 overflow-x-auto border-b border-slate-100 [scrollbar-width:none]">
          {tabs.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                className={`relative -mb-px inline-flex shrink-0 items-center gap-2 border-b-2 px-3.5 pb-3 pt-1 text-[15px] transition ${
                  active ? 'border-indigo-600 font-semibold text-indigo-700' : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
                onClick={() => selectTab(tab.key)}
                type="button"
              >
                {tab.label}
                <span className={`rounded-md px-2 py-0.5 text-[12px] ${active ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                  {tabCounts[tab.key]}
                </span>
                {tab.key === 'pending' && tabCounts.pending > 0 ? (
                  <span className="absolute right-1 top-0.5 h-1.5 w-1.5 rounded-full bg-rose-500" />
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Mobile: tarjetas. Desde md, la tabla completa. */}
        <ul className="mt-3 space-y-3 md:hidden">
          {loading ? (
            <li className="py-10">
              <LoadingState label="Cargando cotizaciones..." />
            </li>
          ) : pageRows.length === 0 ? (
            <li className="py-10 text-center text-[13px] text-slate-500">No hay cotizaciones para este filtro.</li>
          ) : (
            pageRows.map((row) => {
              const status = STATUS_META[row.expired ? 'expired' : row.kind];
              const amount = formatAmount(row.amount, row.currency);
              const quantity = requestQuantity(row.request);
              const highlight = urgency(row);
              const due = row.kind === 'pending' || row.kind === 'submitted' ? formatDue(row.deadline, nowMs) : null;
              return (
                <li key={row.id}>
                  <Link className={`block rounded-[14px] border border-slate-100 p-3.5 ${highlight?.bg ?? ''}`} href={rowHref(row)}>
                    <div className="flex items-start gap-3">
                      <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[10px] bg-slate-100">
                        <Image alt="" className="object-cover" fill sizes="48px" src={requestImage(row.request)} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-semibold text-slate-900">{row.title}</p>
                        <p className="truncate text-[12px] text-slate-500">
                          {row.buyer}
                          {quantity ? ` · ${quantity}` : ''}
                        </p>
                        <span className={`mt-1.5 inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium ${status.tone}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[14px] font-semibold text-slate-900">{amount ?? 'A cotizar'}</p>
                        <p className="text-[11px] text-slate-400">{formatDayTime(row.updatedAt)}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className={`text-[12px] ${highlight?.text ?? 'text-slate-500'}`}>{due ?? ''}</span>
                      <span className="inline-flex h-9 items-center rounded-[10px] border border-indigo-200 bg-white px-4 text-[13px] font-semibold text-indigo-600">
                        {row.kind === 'pending' ? 'Cotizar' : 'Ver detalle'}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })
          )}
        </ul>

        <div className="mt-3 hidden overflow-x-auto md:block">
          <table className="w-full min-w-[900px] text-left text-[14px]">
            <thead>
              <tr className="bg-[#f6f4fd] text-[13px] text-slate-600">
                <th className="rounded-l-lg px-3 py-2.5 font-medium">Solicitud / Producto</th>
                <th className="px-3 py-2.5 font-medium">Comprador</th>
                <th className="px-3 py-2.5 font-medium">Monto</th>
                <th className="px-3 py-2.5 font-medium">Estado</th>
                <th className="px-3 py-2.5 font-medium">Fecha</th>
                <th className="rounded-r-lg px-3 py-2.5 text-center font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-3 py-10" colSpan={6}>
                    <LoadingState label="Cargando cotizaciones..." />
                  </td>
                </tr>
              ) : pageRows.length === 0 ? (
                <tr>
                  <td className="px-3 py-10 text-center text-slate-500" colSpan={6}>
                    No hay cotizaciones para este filtro.
                  </td>
                </tr>
              ) : (
                pageRows.map((row) => {
                  const status = STATUS_META[row.expired ? 'expired' : row.kind];
                  const amount = formatAmount(row.amount, row.currency);
                  const quantity = requestQuantity(row.request);
                  const highlight = urgency(row);
                  const due = row.kind === 'pending' || row.kind === 'submitted' ? formatDue(row.deadline, nowMs) : null;
                  return (
                    <tr key={row.id} className={`border-b border-slate-100 last:border-b-0 ${highlight?.bg ?? ''}`}>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[10px] bg-slate-100">
                            <Image alt="" className="object-cover" fill sizes="48px" src={requestImage(row.request)} />
                          </span>
                          <span className="min-w-0">
                            <span className="block max-w-[280px] truncate font-semibold text-slate-900">{row.title}</span>
                            {quantity ? <span className="block text-[13px] text-slate-500">{quantity}</span> : null}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[11px] font-bold text-indigo-600">
                            {initials(row.buyer)}
                          </span>
                          <span className="truncate text-slate-700">{row.buyer}</span>
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        {amount ? (
                          <>
                            <span className="block font-semibold text-slate-900">{amount}</span>
                            <span className="block text-[12px] text-slate-400">{row.currency || 'ARS'}</span>
                          </>
                        ) : (
                          <span className="text-slate-400">A cotizar</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1 text-[12px] font-medium ${status.tone}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="block whitespace-nowrap text-slate-700">{formatDayTime(row.updatedAt)}</span>
                        {due ? <span className={`block text-[12px] ${highlight?.text ?? 'text-slate-400'}`}>{due}</span> : null}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            className="inline-flex h-9 min-w-[112px] items-center justify-center whitespace-nowrap rounded-[10px] border border-indigo-200 bg-white px-4 text-[13px] font-semibold transition hover:bg-indigo-50"
                            href={rowHref(row)}
                          >
                            <span className="text-indigo-600">{row.kind === 'pending' ? 'Cotizar' : 'Ver detalle'}</span>
                          </Link>
                          <div className="relative">
                            <button
                              aria-label="Más acciones"
                              className="flex h-9 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                              onClick={() => setMenuRow(menuRow === row.id ? null : row.id)}
                              type="button"
                            >
                              <DotsIcon />
                            </button>
                            {menuRow === row.id ? (
                              <>
                                <button aria-label="Cerrar menú" className="fixed inset-0 z-20 cursor-default" onClick={() => setMenuRow(null)} type="button" />
                                <div className="absolute right-0 top-10 z-30 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-[13px] shadow-[0_16px_40px_rgba(15,23,42,0.14)]">
                                  {row.request ? (
                                    <Link className="block px-3 py-2 text-slate-700 hover:bg-slate-50" href={`/dashboard/proveedor/solicitudes/${row.request.id}`}>
                                      Ver solicitud
                                    </Link>
                                  ) : null}
                                  {row.quote ? (
                                    <Link className="block px-3 py-2 text-slate-700 hover:bg-slate-50" href={`/dashboard/proveedor/cotizaciones/${row.quote.id}`}>
                                      Ver cotización
                                    </Link>
                                  ) : null}
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

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[13px] text-slate-500">
          <p>
            {tabRows.length === 0
              ? 'Sin resultados'
              : `Mostrando ${(currentPage - 1) * PAGE_SIZE + 1} a ${Math.min(currentPage * PAGE_SIZE, tabRows.length)} de ${tabRows.length} cotizaciones`}
          </p>
          {totalPages > 1 ? (
            <div className="flex items-center gap-1.5">
              <button
                aria-label="Página anterior"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40"
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
                type="button"
              >
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
              <button
                aria-label="Página siguiente"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40"
                disabled={currentPage === totalPages}
                onClick={() => setPage(currentPage + 1)}
                type="button"
              >
                <Icon name="chev-right" />
              </button>
            </div>
          ) : null}
        </div>
      </section>

      {/* Próximas a vencer */}
      <section className={`${card} mt-5 p-5`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
              <Icon name="clock" />
            </span>
            <div>
              <h2 className="text-[17px] font-bold text-[#16123a]">Próximas a vencer</h2>
              <p className="text-[13px] text-slate-500">
                {upcoming.length === 0
                  ? 'No hay cotizaciones que venzan en los próximos 7 días.'
                  : `${upcoming.length} ${upcoming.length === 1 ? 'cotización requiere' : 'cotizaciones requieren'} tu atención en los próximos días.`}
              </p>
            </div>
          </div>
          {upcoming.length > 2 ? (
            <button className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-indigo-600" onClick={() => selectTab('pending')} type="button">
              Ver todas
              <Icon name="arrow" />
            </button>
          ) : null}
        </div>
        {upcoming.length > 0 ? (
          <div className="mt-4 grid gap-4 lg:grid-cols-2 lg:divide-x lg:divide-slate-100">
            {upcoming.slice(0, 2).map((row, index) => {
              const diff = new Date(row.deadline as string).getTime() - nowMs;
              const tone = diff < DAY ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-600';
              const amount = formatAmount(row.amount, row.currency);
              return (
                <div key={row.id} className={`flex flex-wrap items-center gap-4 ${index === 1 ? 'lg:pl-5' : ''}`}>
                  <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[10px] bg-slate-100">
                    <Image alt="" className="object-cover" fill sizes="48px" src={requestImage(row.request)} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-slate-900">{row.title}</span>
                    <span className="block text-[13px] text-slate-500">{row.buyer}</span>
                  </span>
                  <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-medium ${tone}`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {formatDue(row.deadline, nowMs)}
                  </span>
                  <span className="w-[110px]">
                    <span className="block font-semibold text-slate-900">{amount ?? 'A cotizar'}</span>
                    {amount ? <span className="block text-[12px] text-slate-400">{row.currency}</span> : null}
                  </span>
                  <Link
                    className="inline-flex h-10 items-center rounded-[10px] border border-indigo-200 px-5 text-[13px] font-semibold transition hover:bg-indigo-50"
                    href={rowHref(row)}
                  >
                    <span className="text-indigo-600">{row.kind === 'pending' ? 'Cotizar' : 'Ver detalle'}</span>
                  </Link>
                </div>
              );
            })}
          </div>
        ) : null}
      </section>
    </SupplierDashboardShell>
  );
}
