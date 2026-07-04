'use client';

import { useEffect, useMemo, useState } from 'react';
import SupplierDashboardShell from '@/components/dashboard/supplier-dashboard-shell';
import { type QuoteRecord, type RequestRecord } from '@/lib/atar-api';
import { useSupplierDashboardData } from '@/lib/dashboard-hooks';

type RequestStage = 'all' | 'new' | 'reviewing' | 'responded' | 'closed';
type SortMode = 'recent' | 'deadline';

type RequestCard = {
  quote: QuoteRecord;
  request: RequestRecord;
  stage: Exclude<RequestStage, 'all'>;
  stageLabel: string;
  accentClass: string;
  badgeClass: string;
  quoteLabel: string;
  quoteClass: string;
  requester: string;
  location: string;
  productLabel: string;
  updatedLabel: string;
  dueLabel: string;
  dueValue: number;
  amountValue: number | null;
};

const PAGE_SIZE = 6;

function formatRelativeTime(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60000));

  if (minutes < 60) {
    return `Hace ${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `Hace ${hours} h`;
  }

  const days = Math.floor(hours / 24);
  return `Hace ${days} d`;
}

function formatDate(value: string | null) {
  if (!value) {
    return 'Sin definir';
  }

  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function getStageMeta(quote: QuoteRecord, request: RequestRecord) {
  if (
    quote.status === 'AWARDED' ||
    request.status === 'AWARDED' ||
    request.status === 'ORDER_ISSUED'
  ) {
    return {
      stage: 'responded' as const,
      stageLabel: 'Respondida',
      accentClass: 'before:bg-emerald-400',
      badgeClass: 'bg-emerald-50 text-emerald-600',
    };
  }

  if (request.status === 'REVIEWING' || request.status === 'NEGOTIATING') {
    return {
      stage: 'reviewing' as const,
      stageLabel: 'En evaluacion',
      accentClass: 'before:bg-sky-400',
      badgeClass: 'bg-sky-50 text-sky-600',
    };
  }

  if (request.status === 'CANCELLED' || quote.status === 'REJECTED' || quote.status === 'WITHDRAWN') {
    return {
      stage: 'closed' as const,
      stageLabel: 'Cerrada',
      accentClass: 'before:bg-slate-300',
      badgeClass: 'bg-slate-100 text-slate-500',
    };
  }

  return {
    stage: 'new' as const,
    stageLabel: 'Nueva',
    accentClass: 'before:bg-violet-400',
    badgeClass: 'bg-violet-50 text-violet-600',
  };
}

function getQuoteMeta(quote: QuoteRecord) {
  if (quote.status === 'AWARDED') {
    return {
      quoteLabel: 'Cotizacion enviada',
      quoteClass: 'bg-emerald-50 text-emerald-600',
    };
  }

  if (quote.status === 'SUBMITTED') {
    return {
      quoteLabel: 'Cotizacion enviada',
      quoteClass: 'bg-emerald-50 text-emerald-600',
    };
  }

  if (quote.status === 'DRAFT') {
    return {
      quoteLabel: 'Borrador',
      quoteClass: 'bg-amber-50 text-amber-600',
    };
  }

  if (quote.status === 'REJECTED') {
    return {
      quoteLabel: 'Solicitud cerrada',
      quoteClass: 'bg-slate-100 text-slate-500',
    };
  }

  return {
    quoteLabel: 'Sin accion',
    quoteClass: 'bg-slate-100 text-slate-500',
  };
}

function getLocationLabel(request: RequestRecord) {
  const city = request.buyerCompany?.city?.trim();
  const country = request.buyerCompany?.country?.trim();

  if (city && country) {
    return `${city}, ${country}`;
  }

  return city || country || 'Ubicacion no informada';
}

function getProductLabel(request: RequestRecord) {
  const words = request.category
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');

  return words || request.title.slice(0, 2).toUpperCase();
}

function FiltersIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M4 6h16"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M7 12h10"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M10 18h4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 5h.01"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
      <path
        d="M12 12h.01"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
      <path
        d="M12 19h.01"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
    </svg>
  );
}

function ExportIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 3v12"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M8 11l4 4 4-4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M4 21h16"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export default function SupplierRequestsPage() {
  const { session, myQuotes, loading, error } = useSupplierDashboardData();
  const [activeStage, setActiveStage] = useState<RequestStage>('all');
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [statusFilter, setStatusFilter] = useState('Todos los estados');
  const [productFilter, setProductFilter] = useState('Todos los productos');
  const [locationFilter, setLocationFilter] = useState('Todas las ubicaciones');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  const cards = useMemo<RequestCard[]>(() => {
    const uniqueQuotes = myQuotes.reduce<QuoteRecord[]>((accumulator, quote) => {
      if (!quote.request || accumulator.some((item) => item.requestId === quote.requestId)) {
        return accumulator;
      }

      return [...accumulator, quote];
    }, []);

    return uniqueQuotes.map((quote) => {
      const request = quote.request!;
      const stageMeta = getStageMeta(quote, request);
      const quoteMeta = getQuoteMeta(quote);

      return {
        quote,
        request,
        ...stageMeta,
        ...quoteMeta,
        requester: request.buyerCompany?.name ?? 'Comprador no informado',
        location: getLocationLabel(request),
        productLabel: getProductLabel(request),
        updatedLabel: formatRelativeTime(request.updatedAt),
        dueLabel: formatDate(request.dueDate),
        dueValue: request.dueDate ? new Date(request.dueDate).getTime() : Number.MAX_SAFE_INTEGER,
        amountValue: quote.amount,
      };
    });
  }, [myQuotes]);

  const categories = useMemo(() => {
    return Array.from(new Set(cards.map((item) => item.request.category))).sort();
  }, [cards]);

  const locations = useMemo(() => {
    return Array.from(new Set(cards.map((item) => item.location))).sort();
  }, [cards]);

  const stageCounts = useMemo(() => {
    return {
      all: cards.length,
      new: cards.filter((item) => item.stage === 'new').length,
      reviewing: cards.filter((item) => item.stage === 'reviewing').length,
      responded: cards.filter((item) => item.stage === 'responded').length,
      closed: cards.filter((item) => item.stage === 'closed').length,
    };
  }, [cards]);

  const filteredCards = useMemo(() => {
    const min = minAmount ? Number(minAmount) : null;
    const max = maxAmount ? Number(maxAmount) : null;
    const from = fromDate ? new Date(fromDate).getTime() : null;
    const to = toDate ? new Date(toDate).getTime() : null;

    const nextCards = cards
      .filter((item) => activeStage === 'all' || item.stage === activeStage)
      .filter((item) => statusFilter === 'Todos los estados' || item.stageLabel === statusFilter)
      .filter(
        (item) =>
          productFilter === 'Todos los productos' || item.request.category === productFilter,
      )
      .filter(
        (item) =>
          locationFilter === 'Todas las ubicaciones' || item.location === locationFilter,
      )
      .filter((item) => selectedCategories.length === 0 || selectedCategories.includes(item.request.category))
      .filter((item) => min === null || (item.amountValue ?? 0) >= min)
      .filter((item) => max === null || (item.amountValue ?? 0) <= max)
      .filter((item) => from === null || item.dueValue >= from)
      .filter((item) => to === null || item.dueValue <= to);

    return [...nextCards].sort((left, right) => {
      if (sortMode === 'deadline') {
        return left.dueValue - right.dueValue;
      }

      return new Date(right.request.updatedAt).getTime() - new Date(left.request.updatedAt).getTime();
    });
  }, [
    activeStage,
    cards,
    fromDate,
    locationFilter,
    maxAmount,
    minAmount,
    productFilter,
    selectedCategories,
    sortMode,
    statusFilter,
    toDate,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredCards.length / PAGE_SIZE));
  const paginatedCards = filteredCards.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  function toggleCategory(category: string) {
    setPage(1);
    setSelectedCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category],
    );
  }

  function resetFilters() {
    setActiveStage('all');
    setSortMode('recent');
    setStatusFilter('Todos los estados');
    setProductFilter('Todos los productos');
    setLocationFilter('Todas las ubicaciones');
    setMinAmount('');
    setMaxAmount('');
    setFromDate('');
    setToDate('');
    setSelectedCategories([]);
    setPage(1);
  }

  const tabs: Array<{ key: RequestStage; label: string; count: number }> = [
    { key: 'all', label: 'Todas', count: stageCounts.all },
    { key: 'new', label: 'Nuevas', count: stageCounts.new },
    { key: 'reviewing', label: 'En evaluacion', count: stageCounts.reviewing },
    { key: 'responded', label: 'Respondidas', count: stageCounts.responded },
    { key: 'closed', label: 'Cerradas', count: stageCounts.closed },
  ];

  return (
    <SupplierDashboardShell
      searchPlaceholder="Buscar solicitudes por producto, empresa o ubicacion..."
      session={session}
    >
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">
          <div className="rounded-[28px] border border-[#e7eaf3] bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.04)]">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-[24px] font-semibold tracking-[-0.03em] text-[#1f2373] sm:text-[32px]">
                    Solicitudes
                  </h1>
                  <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#f0edff] px-2 text-xs font-semibold text-[#5546ff]">
                    {stageCounts.all}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[#7e85b2]">
                  Gestiona todas las solicitudes que recibiste de compradores.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#e7eaf3] bg-white px-4 text-sm font-semibold text-[#5f6795] transition hover:bg-[#f7f8fe]"
                  type="button"
                >
                  <ExportIcon />
                  Exportar
                </button>
                <button
                  className="inline-flex h-10 items-center rounded-xl bg-[#5546ff] px-4 text-sm font-semibold text-white transition hover:bg-[#4739ea]"
                  type="button"
                >
                  + Nueva solicitud
                </button>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap gap-5 border-b border-[#eef1fb] pb-3 xl:border-none xl:pb-0">
                {tabs.map((tab) => {
                  const isActive = activeStage === tab.key;
                  return (
                    <button
                      key={tab.key}
                      className={`relative inline-flex items-center gap-2 pb-2 text-sm font-semibold transition ${
                        isActive ? 'text-[#5546ff]' : 'text-[#6972a6] hover:text-[#2b3270]'
                      }`}
                      onClick={() => {
                        setActiveStage(tab.key);
                        setPage(1);
                      }}
                      type="button"
                    >
                      {tab.label}
                      <span className="text-xs text-[#9097bf]">{tab.count}</span>
                      {isActive ? (
                        <span className="absolute inset-x-0 -bottom-3 h-0.5 rounded-full bg-[#5546ff]" />
                      ) : null}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                <select
                  className="h-10 rounded-xl border border-[#e7eaf3] bg-white px-3 text-sm font-medium text-[#5f6795] outline-none"
                  onChange={(event) => {
                    setSortMode(event.target.value as SortMode);
                    setPage(1);
                  }}
                  value={sortMode}
                >
                  <option value="recent">Mas recientes</option>
                  <option value="deadline">Cierre estimado</option>
                </select>
                <button
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#e7eaf3] bg-white text-[#6e76a8]"
                  type="button"
                >
                  <FiltersIcon />
                </button>
              </div>
            </div>
          </div>

          {error ? (
            <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="overflow-hidden rounded-[28px] border border-[#e7eaf3] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.04)]">
            {loading ? (
              <div className="px-6 py-10 text-sm text-[#7e85b2]">Cargando solicitudes...</div>
            ) : paginatedCards.length === 0 ? (
              <div className="px-6 py-10 text-sm text-[#7e85b2]">
                No hay solicitudes que coincidan con los filtros aplicados.
              </div>
            ) : (
              <div className="divide-y divide-[#eef1fb]">
                {paginatedCards.map((item) => (
                  <article
                    key={item.request.id}
                    className={`relative px-5 py-4 before:absolute before:bottom-4 before:left-0 before:top-4 before:w-[3px] ${item.accentClass}`}
                  >
                    <div className="flex flex-col gap-3 xl:grid xl:grid-cols-[96px_minmax(0,1.5fr)_minmax(0,0.9fr)_90px_110px_126px_36px] xl:items-center xl:gap-4">
                      <div className="space-y-2">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${item.badgeClass}`}
                        >
                          {item.stageLabel}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-[#8d95be]">
                          <span className="h-2 w-2 rounded-full bg-current" />
                          Activa
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f6f7fd] text-sm font-bold text-[#6a6fd6]">
                          {item.productLabel}
                        </div>
                        <div className="min-w-0">
                          <h2 className="truncate text-[17px] font-semibold text-[#27305f]">
                            {item.request.title}
                          </h2>
                          <p className="mt-1 text-sm font-medium text-[#6670a1]">
                            {item.quote.leadTimeDays ? `${item.quote.leadTimeDays} dias de entrega` : 'Entrega a coordinar'}
                          </p>
                          <p className="mt-1 line-clamp-1 text-sm text-[#8d95be]">
                            {item.location}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 border-t border-[#eef1fb] pt-3 xl:contents xl:border-0 xl:pt-0">
                        <div className="min-w-0">
                          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#a1a8cc]">
                            Solicitado por
                          </p>
                          <p className="mt-1 truncate text-sm font-semibold text-[#27305f]">
                            {item.requester}
                          </p>
                          <p className="mt-1 truncate text-xs text-[#8d95be]">
                            {item.request.category}
                          </p>
                        </div>

                        <div>
                          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#a1a8cc]">
                            Fecha
                          </p>
                          <p className="mt-1 text-sm font-semibold text-[#27305f]">
                            {item.updatedLabel}
                          </p>
                        </div>

                        <div>
                          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#a1a8cc]">
                            Cierre estimado
                          </p>
                          <p className="mt-1 text-sm font-semibold text-[#27305f]">
                            {item.dueLabel}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-start gap-2 xl:items-end">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${item.quoteClass}`}
                        >
                          {item.quoteLabel}
                        </span>
                        <button
                          className="inline-flex h-9 w-full items-center justify-center rounded-xl border border-[#dfe3f5] px-4 text-sm font-semibold text-[#5546ff] transition hover:bg-[#f7f6ff] xl:w-auto"
                          type="button"
                        >
                          Ver detalle
                        </button>
                      </div>

                      <button
                        className="hidden h-9 w-9 items-center justify-center rounded-xl border border-[#e7eaf3] text-[#7c84af] transition hover:bg-[#f7f8fe] xl:inline-flex"
                        type="button"
                      >
                        <DotsIcon />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-3 border-t border-[#eef1fb] px-5 py-4 text-sm text-[#8d95be] md:flex-row md:items-center md:justify-between">
              <p>
                Mostrando {filteredCards.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} a{' '}
                {Math.min(page * PAGE_SIZE, filteredCards.length)} de {filteredCards.length}{' '}
                solicitudes
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

        <aside className="space-y-4">
          <div className="rounded-[28px] border border-[#e7eaf3] bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#27305f]">Filtros</h2>
              <button
                className="text-xs font-semibold text-[#8d95be] transition hover:text-[#5546ff]"
                onClick={resetFilters}
                type="button"
              >
                Limpiar
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold text-[#27305f]">Estado</span>
                <select
                  className="h-11 w-full rounded-xl border border-[#e7eaf3] bg-[#fbfbff] px-3 text-sm text-[#60689a] outline-none"
                  onChange={(event) => {
                    setStatusFilter(event.target.value);
                    setPage(1);
                  }}
                  value={statusFilter}
                >
                  <option>Todos los estados</option>
                  <option>Nueva</option>
                  <option>En evaluacion</option>
                  <option>Respondida</option>
                  <option>Cerrada</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold text-[#27305f]">Producto</span>
                <select
                  className="h-11 w-full rounded-xl border border-[#e7eaf3] bg-[#fbfbff] px-3 text-sm text-[#60689a] outline-none"
                  onChange={(event) => {
                    setProductFilter(event.target.value);
                    setPage(1);
                  }}
                  value={productFilter}
                >
                  <option>Todos los productos</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold text-[#27305f]">Ubicacion</span>
                <select
                  className="h-11 w-full rounded-xl border border-[#e7eaf3] bg-[#fbfbff] px-3 text-sm text-[#60689a] outline-none"
                  onChange={(event) => {
                    setLocationFilter(event.target.value);
                    setPage(1);
                  }}
                  value={locationFilter}
                >
                  <option>Todas las ubicaciones</option>
                  {locations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </label>

              <div>
                <span className="mb-2 block text-xs font-semibold text-[#27305f]">
                  Fecha de cierre estimada
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className="h-11 rounded-xl border border-[#e7eaf3] bg-[#fbfbff] px-3 text-sm text-[#60689a] outline-none"
                    onChange={(event) => {
                      setFromDate(event.target.value);
                      setPage(1);
                    }}
                    type="date"
                    value={fromDate}
                  />
                  <input
                    className="h-11 rounded-xl border border-[#e7eaf3] bg-[#fbfbff] px-3 text-sm text-[#60689a] outline-none"
                    onChange={(event) => {
                      setToDate(event.target.value);
                      setPage(1);
                    }}
                    type="date"
                    value={toDate}
                  />
                </div>
              </div>

              <div>
                <span className="mb-2 block text-xs font-semibold text-[#27305f]">
                  Importe estimado
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className="h-11 rounded-xl border border-[#e7eaf3] bg-[#fbfbff] px-3 text-sm text-[#60689a] outline-none"
                    inputMode="numeric"
                    onChange={(event) => {
                      setMinAmount(event.target.value);
                      setPage(1);
                    }}
                    placeholder="Minimo"
                    value={minAmount}
                  />
                  <input
                    className="h-11 rounded-xl border border-[#e7eaf3] bg-[#fbfbff] px-3 text-sm text-[#60689a] outline-none"
                    inputMode="numeric"
                    onChange={(event) => {
                      setMaxAmount(event.target.value);
                      setPage(1);
                    }}
                    placeholder="Maximo"
                    value={maxAmount}
                  />
                </div>
              </div>

              <div>
                <span className="mb-3 block text-xs font-semibold text-[#27305f]">Etiquetas</span>
                <div className="space-y-2">
                  {categories.map((category) => {
                    const checked = selectedCategories.includes(category);
                    return (
                      <label key={category} className="flex items-center gap-2 text-sm text-[#60689a]">
                        <input
                          checked={checked}
                          className="h-4 w-4 rounded border-[#cdd3ef] text-[#5546ff] focus:ring-[#5546ff]"
                          onChange={() => toggleCategory(category)}
                          type="checkbox"
                        />
                        {category}
                      </label>
                    );
                  })}
                </div>
              </div>

              <button
                className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#5546ff] text-sm font-semibold text-white transition hover:bg-[#4739ea]"
                type="button"
              >
                Aplicar filtros
              </button>
            </div>
          </div>

          <div className="rounded-[28px] border border-[#eceafb] bg-[linear-gradient(180deg,#fbfaff_0%,#f5f2ff_100%)] p-5 shadow-[0_20px_60px_rgba(15,23,42,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7c72ff]">
              Tip ATAR!
            </p>
            <p className="mt-3 text-sm leading-6 text-[#6c729f]">
              Responde rapido y aumenta tus chances de ser elegido. El 90% de los compradores
              elige proveedores que responden en menos de 24 h.
            </p>
            <button
              className="mt-4 inline-flex h-10 items-center justify-center rounded-xl border border-[#d8d3ff] bg-white px-4 text-sm font-semibold text-[#5546ff] transition hover:bg-[#f7f6ff]"
              type="button"
            >
              Ver estadisticas
            </button>
          </div>
        </aside>
      </section>
    </SupplierDashboardShell>
  );
}
