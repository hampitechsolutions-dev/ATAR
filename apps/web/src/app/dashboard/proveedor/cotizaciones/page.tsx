'use client';

import { useEffect, useMemo, useState } from 'react';
import SupplierDashboardShell from '@/components/dashboard/supplier-dashboard-shell';
import { type QuoteRecord } from '@/lib/atar-api';
import { useSupplierDashboardData } from '@/lib/dashboard-hooks';

type QuoteTab = 'all' | 'draft' | 'submitted' | 'awarded' | 'rejected' | 'expired';

const PAGE_SIZE = 8;

function formatCurrency(value: number | null | undefined) {
  if (typeof value !== 'number') {
    return 'A consultar';
  }

  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatDate(value: string | null) {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}...`;
}

function truncateMiddle(value: string, startLength = 8, endLength = 4) {
  if (value.length <= startLength + endLength + 3) {
    return value;
  }

  return `${value.slice(0, startLength)}...${value.slice(-endLength)}`;
}

function getStatusMeta(status: QuoteRecord['status']) {
  if (status === 'AWARDED') {
    return {
      label: 'Aceptada',
      className: 'bg-emerald-50 text-emerald-600',
    };
  }

  if (status === 'SUBMITTED') {
    return {
      label: 'Enviada',
      className: 'bg-emerald-50 text-emerald-600',
    };
  }

  if (status === 'REJECTED') {
    return {
      label: 'Rechazada',
      className: 'bg-rose-50 text-rose-600',
    };
  }

  if (status === 'DRAFT') {
    return {
      label: 'Borrador',
      className: 'bg-slate-100 text-slate-500',
    };
  }

  return {
    label: 'Vencida',
    className: 'bg-amber-50 text-amber-600',
  };
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

function isExpired(quote: QuoteRecord) {
  const dueDate = quote.request?.dueDate;
  if (!dueDate) {
    return false;
  }

  return new Date(dueDate).getTime() < Date.now() && quote.status !== 'AWARDED';
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

function LockIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 11V8a4 4 0 118 0v3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3z" stroke="currentColor" strokeWidth="2" />
      <path d="M9.5 12.5l1.5 1.5 3.5-3.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M3 8l9 6 9-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
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

function QuoteMetricIcon({ kind }: { kind: 'all' | 'draft' | 'submitted' | 'awarded' | 'rejected' }) {
  const baseClass =
    kind === 'all'
      ? 'text-[#6a58ff]'
      : kind === 'draft'
        ? 'text-[#8b94c7]'
        : kind === 'submitted'
          ? 'text-[#2d8fff]'
          : kind === 'awarded'
            ? 'text-[#45b97a]'
            : 'text-[#ff6f7d]';

  return (
    <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-[#f7f7ff] ${baseClass}`}>
      {kind === 'all' ? <ShieldIcon /> : kind === 'draft' ? <LockIcon /> : kind === 'submitted' ? <MailIcon /> : kind === 'awarded' ? <ShieldIcon /> : <MailIcon />}
    </div>
  );
}

function DonutChart({
  value,
  accepted,
  rejected,
  drafts,
}: {
  value: number;
  accepted: number;
  rejected: number;
  drafts: number;
}) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const sentShare = Math.max(0, Math.min(100, value));
  const acceptedShare = Math.max(0, Math.min(100, accepted));
  const rejectedShare = Math.max(0, Math.min(100, rejected));
  const draftsShare = Math.max(0, Math.min(100, drafts));

  return (
    <div className="relative flex h-[112px] w-[112px] items-center justify-center">
      <svg className="-rotate-90" height="112" viewBox="0 0 112 112" width="112">
        <circle cx="56" cy="56" fill="none" r={radius} stroke="#edf0fb" strokeWidth="12" />
        <circle
          cx="56"
          cy="56"
          fill="none"
          r={radius}
          stroke="#5d51ff"
          strokeDasharray={`${(sentShare / 100) * circumference} ${circumference}`}
          strokeLinecap="round"
          strokeWidth="12"
        />
        <circle
          cx="56"
          cy="56"
          fill="none"
          r={radius}
          stroke="#43c67a"
          strokeDasharray={`${(acceptedShare / 100) * circumference} ${circumference}`}
          strokeDashoffset={-((sentShare / 100) * circumference)}
          strokeLinecap="round"
          strokeWidth="12"
        />
        <circle
          cx="56"
          cy="56"
          fill="none"
          r={radius}
          stroke="#ff7080"
          strokeDasharray={`${(rejectedShare / 100) * circumference} ${circumference}`}
          strokeDashoffset={-(((sentShare + acceptedShare) / 100) * circumference)}
          strokeLinecap="round"
          strokeWidth="12"
        />
        <circle
          cx="56"
          cy="56"
          fill="none"
          r={radius}
          stroke="#9aa3cf"
          strokeDasharray={`${(draftsShare / 100) * circumference} ${circumference}`}
          strokeDashoffset={-(((sentShare + acceptedShare + rejectedShare) / 100) * circumference)}
          strokeLinecap="round"
          strokeWidth="12"
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-[24px] font-semibold text-[#242c63]">{value}%</p>
        <p className="text-[11px] text-[#8d95be]">Conversion</p>
      </div>
    </div>
  );
}

function MiniChart() {
  return (
    <svg aria-hidden="true" className="h-24 w-full" fill="none" viewBox="0 0 220 96">
      <path d="M8 76H212" stroke="#e7eaf7" strokeLinecap="round" strokeWidth="1.5" />
      <path d="M8 18V78" stroke="#eef1fb" strokeLinecap="round" strokeWidth="1.5" />
      <path d="M8 58C18 60 24 44 36 48C48 52 52 34 64 40C76 46 82 38 92 50C102 62 112 42 124 48C136 54 146 40 158 52C170 64 186 38 200 50C204 54 208 56 212 52" stroke="#5d51ff" strokeLinecap="round" strokeWidth="3" />
      <circle cx="36" cy="48" r="3.5" fill="white" stroke="#5d51ff" strokeWidth="2" />
      <circle cx="92" cy="50" r="3.5" fill="white" stroke="#5d51ff" strokeWidth="2" />
      <circle cx="158" cy="52" r="3.5" fill="white" stroke="#5d51ff" strokeWidth="2" />
    </svg>
  );
}

export default function SupplierQuotesPage() {
  const { session, myQuotes, loading, error } = useSupplierDashboardData();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<QuoteTab>('all');
  const [page, setPage] = useState(1);

  const metrics = useMemo(() => {
    const total = myQuotes.length;
    const draft = myQuotes.filter((quote) => quote.status === 'DRAFT').length;
    const submitted = myQuotes.filter((quote) => quote.status === 'SUBMITTED').length;
    const awarded = myQuotes.filter((quote) => quote.status === 'AWARDED').length;
    const rejected = myQuotes.filter((quote) => quote.status === 'REJECTED').length;
    const expired = myQuotes.filter((quote) => isExpired(quote)).length;
    const conversion = submitted + awarded === 0 ? 0 : Math.round((awarded / (submitted + awarded)) * 100);

    return { total, draft, submitted, awarded, rejected, expired, conversion };
  }, [myQuotes]);

  const filteredQuotes = useMemo(() => {
    const query = search.trim().toLowerCase();

    return myQuotes
      .filter((quote) => {
        if (activeTab === 'all') {
          return true;
        }

        if (activeTab === 'expired') {
          return isExpired(quote);
        }

        if (activeTab === 'draft') {
          return quote.status === 'DRAFT';
        }

        if (activeTab === 'submitted') {
          return quote.status === 'SUBMITTED';
        }

        if (activeTab === 'awarded') {
          return quote.status === 'AWARDED';
        }

        if (activeTab === 'rejected') {
          return quote.status === 'REJECTED';
        }

        return true;
      })
      .filter((quote) => {
        if (!query) {
          return true;
        }

        return (
          quote.id.toLowerCase().includes(query) ||
          (quote.request?.title ?? '').toLowerCase().includes(query) ||
          (quote.request?.buyerCompany?.name ?? '').toLowerCase().includes(query) ||
          (quote.request?.category ?? '').toLowerCase().includes(query)
        );
      })
      .sort(
        (left, right) =>
          new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
      );
  }, [activeTab, myQuotes, search]);

  const totalPages = Math.max(1, Math.ceil(filteredQuotes.length / PAGE_SIZE));
  const visibleQuotes = filteredQuotes.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const avgResponseHours = useMemo(() => {
    const withLeadTime = myQuotes.filter((quote) => typeof quote.leadTimeDays === 'number');
    if (withLeadTime.length === 0) {
      return '4h 32m';
    }

    const avgDays =
      withLeadTime.reduce((acc, quote) => acc + (quote.leadTimeDays ?? 0), 0) /
      withLeadTime.length;
    const avgHours = Math.max(1, Math.round(avgDays * 2.5));
    const hours = Math.floor(avgHours);
    const minutes = (avgHours % 1) * 60;
    return `${hours}h ${Math.round(minutes)}m`;
  }, [myQuotes]);

  const upcomingQuotes = useMemo(() => {
    return [...myQuotes]
      .filter((quote) => quote.request?.dueDate)
      .sort(
        (left, right) =>
          new Date(left.request!.dueDate!).getTime() - new Date(right.request!.dueDate!).getTime(),
      )
      .slice(0, 3);
  }, [myQuotes]);

  const tabs: Array<{ key: QuoteTab; label: string; count: number }> = [
    { key: 'all', label: 'Todas', count: metrics.total },
    { key: 'draft', label: 'Borradores', count: metrics.draft },
    { key: 'submitted', label: 'Enviadas', count: metrics.submitted },
    { key: 'awarded', label: 'Aceptadas', count: metrics.awarded },
    { key: 'rejected', label: 'Rechazadas', count: metrics.rejected },
    { key: 'expired', label: 'Vencidas', count: metrics.expired },
  ];

  return (
    <SupplierDashboardShell
      searchPlaceholder="Buscar solicitudes, pedidos, clientes..."
      session={session}
    >
      <section className="space-y-4">
        <div className="space-y-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="text-[24px] font-semibold tracking-[-0.03em] text-[#1f2373] sm:text-[32px]">
                Cotizaciones
              </h1>
              <p className="mt-1 text-sm text-[#7e85b2]">
                Gestiona y hace seguimiento de todas tus cotizaciones.
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
              <label className="flex h-10 min-w-[240px] items-center gap-2 rounded-xl border border-[#e7eaf3] bg-white px-3 text-sm text-[#7f86ad]">
                <SearchIcon />
                <input
                  className="w-full bg-transparent outline-none placeholder:text-[#a4aac9]"
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Buscar cotizaciones..."
                  value={search}
                />
              </label>
              <button
                className="inline-flex h-10 items-center justify-center rounded-xl bg-[#5546ff] px-4 text-sm font-semibold text-white transition hover:bg-[#4739ea]"
                type="button"
              >
                + Nueva cotizacion
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
            <article className="rounded-[24px] border border-[#e7eaf3] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
              <div className="flex items-start gap-3">
                <QuoteMetricIcon kind="all" />
                <div>
                  <p className="text-xs font-semibold text-[#8b92bc]">Todas</p>
                  <p className="mt-1 text-[22px] font-semibold text-[#1f2373] sm:text-[30px]">{metrics.total}</p>
                  <p className="mt-1 text-[11px] text-[#8d95be]">vs semana pasada</p>
                </div>
              </div>
            </article>
            <article className="rounded-[24px] border border-[#e7eaf3] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
              <div className="flex items-start gap-3">
                <QuoteMetricIcon kind="draft" />
                <div>
                  <p className="text-xs font-semibold text-[#8b92bc]">Borradores</p>
                  <p className="mt-1 text-[22px] font-semibold text-[#1f2373] sm:text-[30px]">{metrics.draft}</p>
                </div>
              </div>
            </article>
            <article className="rounded-[24px] border border-[#e7eaf3] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
              <div className="flex items-start gap-3">
                <QuoteMetricIcon kind="submitted" />
                <div>
                  <p className="text-xs font-semibold text-[#8b92bc]">Enviadas</p>
                  <p className="mt-1 text-[22px] font-semibold text-[#1f2373] sm:text-[30px]">{metrics.submitted}</p>
                  <p className="mt-1 text-[11px] text-[#45b97a]">+2 vs semana pasada</p>
                </div>
              </div>
            </article>
            <article className="rounded-[24px] border border-[#e7eaf3] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
              <div className="flex items-start gap-3">
                <QuoteMetricIcon kind="awarded" />
                <div>
                  <p className="text-xs font-semibold text-[#8b92bc]">Aceptadas</p>
                  <p className="mt-1 text-[22px] font-semibold text-[#1f2373] sm:text-[30px]">{metrics.awarded}</p>
                  <p className="mt-1 text-[11px] text-[#45b97a]">+1 vs semana pasada</p>
                </div>
              </div>
            </article>
            <article className="rounded-[24px] border border-[#e7eaf3] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
              <div className="flex items-start gap-3">
                <QuoteMetricIcon kind="rejected" />
                <div>
                  <p className="text-xs font-semibold text-[#8b92bc]">Rechazadas</p>
                  <p className="mt-1 text-[22px] font-semibold text-[#1f2373] sm:text-[30px]">{metrics.rejected}</p>
                </div>
              </div>
            </article>
          </div>

          {error ? (
            <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="overflow-hidden rounded-[24px] border border-[#e7eaf3] bg-white shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
            <div className="flex flex-wrap gap-5 border-b border-[#edf0fb] px-5 pt-4">
              {tabs.map((tab) => {
                const isActive = tab.key === activeTab;
                return (
                  <button
                    key={tab.key}
                    className={`relative pb-3 text-sm font-semibold ${
                      isActive ? 'text-[#5546ff]' : 'text-[#727ba9]'
                    }`}
                    onClick={() => {
                      setActiveTab(tab.key);
                      setPage(1);
                    }}
                    type="button"
                  >
                    {tab.label}
                    <span className="ml-2 text-xs text-[#9aa1c8]">{tab.count}</span>
                    {isActive ? (
                      <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[#5546ff]" />
                    ) : null}
                  </button>
                );
              })}
            </div>

            {loading ? (
              <div className="px-6 py-10 text-sm text-[#7e85b2]">Cargando cotizaciones...</div>
            ) : visibleQuotes.length === 0 ? (
              <div className="px-6 py-10 text-sm text-[#7e85b2]">
                No hay cotizaciones para este filtro.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] table-fixed">
                  <thead>
                    <tr className="border-b border-[#edf0fb] text-left text-[11px] uppercase tracking-[0.16em] text-[#9aa1c8]">
                      <th className="w-[20%] px-5 py-4 font-semibold">ID Cotizacion</th>
                      <th className="w-[20%] px-4 py-4 font-semibold">Solicitud</th>
                      <th className="w-[18%] px-4 py-4 font-semibold">Cliente</th>
                      <th className="w-[16%] px-4 py-4 font-semibold">Producto</th>
                      <th className="w-[12%] px-4 py-4 font-semibold">Monto</th>
                      <th className="w-[10%] px-4 py-4 font-semibold">Estado</th>
                      <th className="w-[12%] px-4 py-4 font-semibold">Vence</th>
                      <th className="px-5 py-4 font-semibold" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f2fa]">
                    {visibleQuotes.map((quote) => {
                      const statusMeta = getStatusMeta(isExpired(quote) ? 'WITHDRAWN' : quote.status);
                      const clientName = quote.request?.buyerCompany?.name ?? 'Cliente no informado';

                      return (
                        <tr key={quote.id} className="text-sm text-[#2c3567]">
                          <td className="px-5 py-4">
                            <div className="flex items-start gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f6f7ff] text-[#6a58ff]">
                                <LockIcon />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-[#33407a]">
                                  {truncateMiddle(quote.id, 10, 5)}
                                </p>
                                <button className="mt-1 text-xs font-semibold text-[#5546ff]" type="button">
                                  Ver detalle
                                </button>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <p className="truncate font-semibold text-[#33407a]">
                              {truncateMiddle(quote.request?.id ?? '-', 8, 4)}
                            </p>
                            <p className="mt-1 line-clamp-2 text-xs text-[#8d95be]">
                              {truncateText(quote.request?.title ?? 'Sin solicitud', 38)}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f4f6ff] text-[10px] font-bold text-[#4652a7]">
                                {getCompanyShort(clientName)}
                              </div>
                              <p className="truncate font-semibold text-[#33407a]">
                                {truncateText(clientName, 18)}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <p className="truncate font-semibold text-[#33407a]">
                              {truncateText(quote.request?.category ?? '-', 16)}
                            </p>
                            <p className="mt-1 text-xs text-[#8d95be]">
                              {quote.leadTimeDays ? `${quote.leadTimeDays} dias` : 'A coord.'}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <p className="font-semibold text-[#1f2373]">{formatCurrency(quote.amount)}</p>
                            <p className="mt-1 text-xs text-[#8d95be]">{quote.currency}</p>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusMeta.className}`}>
                              {statusMeta.label}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-[#6f77a7]">{formatDate(quote.request?.dueDate ?? null)}</td>
                          <td className="px-5 py-4 text-right">
                            <button
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#8f95b8] transition hover:bg-[#f7f8fe]"
                              type="button"
                            >
                              <DotsIcon />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex flex-col gap-3 border-t border-[#edf0fb] px-5 py-4 text-sm text-[#8d95be] md:flex-row md:items-center md:justify-between">
              <p>
                Mostrando {filteredQuotes.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} a{' '}
                {Math.min(page * PAGE_SIZE, filteredQuotes.length)} de {filteredQuotes.length}{' '}
                cotizaciones
              </p>
              <div className="flex items-center gap-2">
                <button
                  className="inline-flex h-9 items-center rounded-xl border border-[#e7eaf3] px-3 text-sm font-medium text-[#9aa1c8] disabled:opacity-50"
                  disabled={page === 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  type="button"
                >
                  Anterior
                </button>
                <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-xl bg-[#5546ff] px-3 text-sm font-semibold text-white">
                  {page}
                </span>
                <button
                  className="inline-flex h-9 items-center rounded-xl border border-[#e7eaf3] px-3 text-sm font-medium text-[#6b73a6] disabled:opacity-50"
                  disabled={page === totalPages}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  type="button"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        </div>

        <aside className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[24px] border border-[#e7eaf3] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#27305f]">Rendimiento</h2>
              <span className="rounded-full bg-[#f6f7ff] px-3 py-1 text-[11px] font-semibold text-[#7c84af]">
                Ultimos 30 dias
              </span>
            </div>
            <div className="mt-5 flex items-center gap-4">
              <DonutChart
                accepted={metrics.awarded}
                drafts={metrics.draft}
                rejected={metrics.rejected}
                value={metrics.conversion}
              />
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-2 text-[#7f86ad]">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#5d51ff]" />
                    Enviadas
                  </span>
                  <span className="font-semibold text-[#2c3567]">{metrics.submitted}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-2 text-[#7f86ad]">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#43c67a]" />
                    Aceptadas
                  </span>
                  <span className="font-semibold text-[#2c3567]">{metrics.awarded}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-2 text-[#7f86ad]">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ff7080]" />
                    Rechazadas
                  </span>
                  <span className="font-semibold text-[#2c3567]">{metrics.rejected}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-2 text-[#7f86ad]">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#9aa3cf]" />
                    Borradores
                  </span>
                  <span className="font-semibold text-[#2c3567]">{metrics.draft}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-[#e7eaf3] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
            <h2 className="text-sm font-semibold text-[#27305f]">Tiempo de respuesta</h2>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="text-[22px] font-semibold text-[#1f2373] sm:text-[30px]">{avgResponseHours}</p>
                <p className="mt-1 text-[11px] text-[#45b97a]">-18% vs 30 dias anteriores</p>
              </div>
            </div>
            <div className="mt-4">
              <MiniChart />
            </div>
          </div>

          <div className="rounded-[24px] border border-[#e7eaf3] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
            <h2 className="text-sm font-semibold text-[#27305f]">Proximas a vencer</h2>
            <div className="mt-4 space-y-3">
              {upcomingQuotes.map((quote) => {
                const clientName = quote.request?.buyerCompany?.name ?? 'Cliente';
                const daysLeft = quote.request?.dueDate
                  ? Math.max(
                      0,
                      Math.ceil(
                        (new Date(quote.request.dueDate).getTime() - Date.now()) /
                          (1000 * 60 * 60 * 24),
                      ),
                    )
                  : 0;

                return (
                  <article
                    key={quote.id}
                    className="rounded-[18px] border border-[#edf0fb] bg-[#fbfbff] px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f1f4ff] text-[10px] font-bold text-[#4652a7]">
                          {getCompanyShort(clientName)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-[#33407a]">
                            {truncateMiddle(quote.id, 8, 4)}
                          </p>
                          <p className="mt-1 truncate text-xs text-[#7e85b2]">
                            {truncateText(clientName, 16)}
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full bg-[#fff2d8] px-2 py-1 text-[10px] font-semibold text-[#e0911c]">
                        Vence en {daysLeft} dias
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
            <button
              className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl border border-[#e3e7f8] bg-white text-sm font-semibold text-[#5546ff] transition hover:bg-[#f7f6ff]"
              type="button"
            >
              Ver todas ({myQuotes.length})
            </button>
          </div>

          <div className="rounded-[24px] border border-[#eceafb] bg-[linear-gradient(180deg,#fbfaff_0%,#f5f2ff_100%)] p-5 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#5d51ff] shadow-sm">
                <ShieldIcon />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#27305f]">Mejora tu conversion</p>
                <p className="mt-2 text-sm leading-6 text-[#6c729f]">
                  El Asistente ATAR puede revisar tus cotizaciones y darte sugerencias.
                </p>
              </div>
            </div>
            <button
              className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl border border-[#d8d3ff] bg-white px-4 text-sm font-semibold text-[#5546ff] transition hover:bg-[#f7f6ff]"
              type="button"
            >
              Analizar mis cotizaciones
            </button>
          </div>
        </aside>
      </section>
    </SupplierDashboardShell>
  );
}
