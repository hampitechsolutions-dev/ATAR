'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import SupplierDashboardShell from '@/components/dashboard/supplier-dashboard-shell';
import { type OrderFulfillmentStatus } from '@/lib/atar-api';
import { LoadingState } from '@/components/ui/spinner';
import { useSupplierDashboardData } from '@/lib/dashboard-hooks';
import { FALLBACK_REQUEST_CATEGORIES } from '@/lib/request-catalog-fallback';

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

function getStageLabel(status: OrderFulfillmentStatus) {
  if (status === 'CONFIRMED') {
    return 'Pendiente';
  }
  if (status === 'IN_PRODUCTION') {
    return 'En producción';
  }
  if (status === 'DISPATCHED') {
    return 'Despachado';
  }
  if (status === 'DELIVERED') {
    return 'Entregado';
  }
  return 'Emitido';
}

function getProgress(status: OrderFulfillmentStatus) {
  if (status === 'ISSUED') {
    return 10;
  }
  if (status === 'CONFIRMED') {
    return 30;
  }
  if (status === 'IN_PRODUCTION') {
    return 65;
  }
  if (status === 'DISPATCHED') {
    return 90;
  }
  return 100;
}

const STAGES: { status: OrderFulfillmentStatus; label: string }[] = [
  { status: 'ISSUED', label: 'Emitida' },
  { status: 'CONFIRMED', label: 'Confirmada' },
  { status: 'IN_PRODUCTION', label: 'En producción' },
  { status: 'DISPATCHED', label: 'Despachada' },
  { status: 'DELIVERED', label: 'Entregada' },
];

function stageTone(status: OrderFulfillmentStatus) {
  if (status === 'DELIVERED') return 'bg-emerald-50 text-emerald-600';
  if (status === 'DISPATCHED') return 'bg-sky-50 text-sky-600';
  if (status === 'IN_PRODUCTION') return 'bg-amber-50 text-amber-600';
  return 'bg-indigo-50 text-indigo-600';
}

function categoryImage(category?: string | null) {
  return FALLBACK_REQUEST_CATEGORIES.find((item) => item.label === category)?.imageSrc ?? '/logoatar.png';
}

type Filter = 'all' | 'pending' | 'active' | 'delivered';

const card = 'rounded-[18px] bg-white shadow-[0_10px_30px_rgba(40,28,110,0.05)]';

function KpiIcon({ name }: { name: Exclude<Filter, 'all'> }) {
  const paths = {
    pending: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2',
    active: 'M3 21V10l6 3v-3l6 3v-3l6 3v8H3zM9 21v-5M15 21v-4',
    delivered: 'M20 6L9 17l-5-5',
  } as const;
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path d={paths[name]} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

export default function SupplierProductionPage() {
  const { session, myQuotes, loading, error } = useSupplierDashboardData();
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  const productionRows = useMemo(() => {
    return myQuotes
      .filter((quote) => quote.status === 'AWARDED' && quote.request?.order)
      .map((quote) => {
        const order = quote.request!.order!;
        return {
          id: order.id,
          requestId: quote.request!.id,
          orderNumber: order.orderNumber,
          title: quote.request?.title ?? 'Orden sin título',
          company: quote.request?.buyerCompany?.name ?? 'Cliente',
          image: categoryImage(quote.request?.items?.[0]?.category ?? quote.request?.category),
          promisedDate: formatDate(order.promisedDate ?? null),
          status: order.fulfillmentStatus,
          stage: getStageLabel(order.fulfillmentStatus),
          progress: getProgress(order.fulfillmentStatus),
          notes: order.notes ?? '',
        };
      })
      .sort((left, right) => left.progress - right.progress);
  }, [myQuotes]);

  const metrics = useMemo(() => {
    return {
      pending: productionRows.filter((row) => row.progress <= 30).length,
      active: productionRows.filter((row) => row.progress > 30 && row.progress < 100).length,
      delivered: productionRows.filter((row) => row.progress === 100).length,
    };
  }, [productionRows]);

  const visibleRows = productionRows.filter((row) => {
    const inFilter =
      filter === 'all' ||
      (filter === 'pending' && row.progress <= 30) ||
      (filter === 'active' && row.progress > 30 && row.progress < 100) ||
      (filter === 'delivered' && row.progress === 100);
    const query = search.trim().toLowerCase();
    return inFilter && (!query || `${row.title} ${row.company} ${row.orderNumber} ${row.stage}`.toLowerCase().includes(query));
  });

  const kpis: { key: Exclude<Filter, 'all'>; label: string; value: number; tone: string }[] = [
    { key: 'pending', label: 'Pendientes', value: metrics.pending, tone: 'bg-indigo-50 text-indigo-600' },
    { key: 'active', label: 'En proceso', value: metrics.active, tone: 'bg-amber-50 text-amber-600' },
    { key: 'delivered', label: 'Entregadas', value: metrics.delivered, tone: 'bg-emerald-50 text-emerald-600' },
  ];

  return (
    <SupplierDashboardShell
      onSearchChange={setSearch}
      searchPlaceholder="Buscar órdenes, clientes o estado..."
      searchValue={search}
      session={session}
    >
      <h1 className="text-[26px] font-bold leading-tight tracking-[-0.03em] text-[#16123a] sm:text-[34px]">Producción</h1>
      <p className="mt-1 text-[13px] text-slate-500 sm:text-[15px]">Seguí el avance operativo de cada orden adjudicada.</p>

      {error ? <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      {/* Contadores: también filtran la lista. */}
      <div className="mt-4 grid grid-cols-3 gap-2.5 sm:mt-5 sm:gap-4">
        {kpis.map((kpi) => {
          const active = filter === kpi.key;
          return (
            <button
              key={kpi.key}
              aria-pressed={active}
              className={`${card} flex flex-col items-start gap-2 p-3 text-left transition sm:flex-row sm:items-center sm:gap-4 sm:p-5 ${
                active ? 'ring-2 ring-indigo-400' : 'hover:-translate-y-0.5'
              }`}
              onClick={() => setFilter(active ? 'all' : kpi.key)}
              type="button"
            >
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full sm:h-12 sm:w-12 ${kpi.tone}`}>
                <KpiIcon name={kpi.key} />
              </span>
              <span className="min-w-0">
                <span className="block text-[22px] font-bold leading-none text-[#16123a] sm:text-[28px]">{loading ? '—' : kpi.value}</span>
                <span className="mt-1 block truncate text-[12px] text-slate-600 sm:text-[14px]">{kpi.label}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="relative mt-4 lg:hidden">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
            <path d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
        </span>
        <input
          className="h-11 w-full rounded-[12px] border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-indigo-400"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar órdenes, clientes o estado..."
          type="search"
          value={search}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:mt-5 xl:grid-cols-2">
        {loading ? (
          <div className={`${card} col-span-full px-4 py-10`}>
            <LoadingState label="Cargando producción..." />
          </div>
        ) : visibleRows.length === 0 ? (
          <div className="col-span-full rounded-[18px] border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
            {productionRows.length === 0 ? 'Aún no hay órdenes en seguimiento productivo.' : 'No hay órdenes para este filtro.'}
          </div>
        ) : (
          visibleRows.map((row) => {
            const stageIndex = STAGES.findIndex((stage) => stage.status === row.status);
            return (
              <article key={row.id} className={`${card} p-4 sm:p-5`}>
                <div className="flex gap-3">
                  <span className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-[12px] bg-slate-100">
                    <Image alt="" className="object-cover" fill sizes="72px" src={row.image} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] ${stageTone(row.status)}`}>{row.stage}</span>
                      <span className="text-[11px] text-slate-400">{row.orderNumber}</span>
                    </div>
                    <h2 className="mt-1 line-clamp-2 text-[15px] font-bold leading-5 text-[#16123a] sm:text-[17px]">{row.title}</h2>
                    <p className="mt-0.5 truncate text-[12px] text-slate-500 sm:text-[13px]">{row.company}</p>
                  </div>
                </div>

                {/* Etapas de la orden */}
                <ol className="mt-4 flex items-start">
                  {STAGES.map((stage, index) => {
                    const done = index <= stageIndex;
                    return (
                      <li key={stage.status} className="relative flex flex-1 flex-col items-center text-center">
                        {index > 0 ? (
                          <span className={`absolute right-1/2 top-[9px] h-0.5 w-full ${done ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                        ) : null}
                        <span
                          className={`relative z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                            done ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white'
                          }`}
                        >
                          {done ? (
                            <svg aria-hidden="true" className="h-3 w-3" fill="none" viewBox="0 0 24 24">
                              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                            </svg>
                          ) : null}
                        </span>
                        <span className={`mt-1.5 text-[10px] leading-3 sm:text-[11px] ${index === stageIndex ? 'font-semibold text-indigo-700' : done ? 'text-slate-600' : 'text-slate-400'}`}>
                          {stage.label}
                        </span>
                      </li>
                    );
                  })}
                </ol>

                <div className="mt-4 flex items-center justify-between gap-3 rounded-[12px] bg-[#f7f6fd] px-3.5 py-2.5">
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-500">Entrega estimada</p>
                    <p className="text-[13px] font-semibold text-slate-900">{row.promisedDate}</p>
                  </div>
                  <Link
                    className="inline-flex h-9 shrink-0 items-center rounded-[10px] border border-indigo-200 bg-white px-3.5 text-[12px] font-semibold text-indigo-600"
                    href={`/dashboard/proveedor/solicitudes/${row.requestId}`}
                  >
                    Ver solicitud
                  </Link>
                </div>
                {row.notes ? <p className="mt-2.5 text-[12px] leading-5 text-slate-500">{row.notes}</p> : null}
              </article>
            );
          })
        )}
      </div>
    </SupplierDashboardShell>
  );
}
