'use client';

import { useMemo } from 'react';
import SupplierDashboardShell from '@/components/dashboard/supplier-dashboard-shell';
import { type QuoteRecord } from '@/lib/atar-api';
import { useSupplierDashboardData } from '@/lib/dashboard-hooks';

type MonthlyRow = {
  key: string;
  label: string;
  sales: number;
  quotes: number;
  orders: number;
  conversion: number;
  newClients: number;
};

const CATEGORY_COLORS = ['#5b4bff', '#62c68f', '#4ea5ff', '#f4a340', '#f26565'];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCompactCurrency(value: number) {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }

  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }

  return formatCurrency(value);
}

function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat('es-AR', {
    month: 'short',
  }).format(date);
}

function formatMonthLong(date: Date) {
  return new Intl.DateTimeFormat('es-AR', {
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(value));
}

function getQuoteTone(status: QuoteRecord['status']) {
  if (status === 'AWARDED') {
    return {
      label: 'Cotizacion ganada',
      dot: 'bg-emerald-400',
      icon: 'check' as const,
    };
  }

  if (status === 'SUBMITTED') {
    return {
      label: 'Cotizacion enviada',
      dot: 'bg-indigo-500',
      icon: 'arrow' as const,
    };
  }

  if (status === 'REJECTED') {
    return {
      label: 'Cotizacion rechazada',
      dot: 'bg-rose-400',
      icon: 'close' as const,
    };
  }

  return {
    label: 'Cotizacion en borrador',
    dot: 'bg-amber-400',
    icon: 'clock' as const,
  };
}

function StatIcon({ kind }: { kind: 'sales' | 'quotes' | 'orders' | 'rate' | 'clients' }) {
  if (kind === 'sales') {
    return (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <path d="M15 9.5c0-1.4-1.34-2.5-3-2.5s-3 1.1-3 2.5 1.34 2.5 3 2.5 3 1.1 3 2.5S13.66 17 12 17s-3-1.1-3-2.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }

  if (kind === 'quotes') {
    return (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path d="M21 5l-9 9-5-5-4 4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="M16 5h5v5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }

  if (kind === 'orders') {
    return (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path d="M14 2H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V8l-5-6z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="M14 2v6h6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }

  if (kind === 'rate') {
    return (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path d="M4 20h16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="M6 16l4-4 3 3 5-7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="M9 11a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function HeaderIcon({ kind }: { kind: 'calendar' | 'download' }) {
  if (kind === 'calendar') {
    return (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path d="M8 2v4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="M16 2v4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" />
        <path d="M3 10h18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M12 3v12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="M8 11l4 4 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="M4 21h16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function TrendLineChart({
  values,
  labels,
}: {
  values: number[];
  labels: string[];
}) {
  const width = 520;
  const height = 220;
  const paddingX = 26;
  const paddingTop = 24;
  const paddingBottom = 34;
  const max = Math.max(...values, 1);
  const min = 0;
  const stepX = (width - paddingX * 2) / Math.max(values.length - 1, 1);
  const getY = (value: number) =>
    height - paddingBottom - ((value - min) / (max - min || 1)) * (height - paddingTop - paddingBottom);

  const points = values.map((value, index) => ({
    x: paddingX + stepX * index,
    y: getY(value),
    value,
    label: labels[index],
  }));

  const path = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  const areaPath = `${path} L ${paddingX + stepX * (points.length - 1)} ${height - paddingBottom} L ${paddingX} ${height - paddingBottom} Z`;
  const activeIndex = Math.max(0, points.length - 3);
  const activePoint = points[activeIndex];

  return (
    <svg aria-hidden="true" className="h-[220px] w-full" viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id="sales-area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#5b4bff" stopOpacity="0.26" />
          <stop offset="100%" stopColor="#5b4bff" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {[0, 1, 2, 3, 4].map((row) => {
        const y = paddingTop + ((height - paddingTop - paddingBottom) / 4) * row;
        return <path key={row} d={`M ${paddingX} ${y} H ${width - paddingX}`} stroke="#edf0fb" strokeWidth="1" />;
      })}

      {points.map((point) => (
        <path
          key={`guide-${point.label}`}
          d={`M ${point.x} ${paddingTop} V ${height - paddingBottom}`}
          stroke="#f1f3fc"
          strokeDasharray="3 7"
          strokeWidth="1"
        />
      ))}

      <path d={areaPath} fill="url(#sales-area)" />
      <path d={path} fill="none" stroke="#5b4bff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />

      {points.map((point) => (
        <circle key={point.label} cx={point.x} cy={point.y} fill="#ffffff" r="4" stroke="#5b4bff" strokeWidth="2" />
      ))}

      {activePoint ? (
        <>
          <circle cx={activePoint.x} cy={activePoint.y} fill="#5b4bff" r="5" />
          <rect x={activePoint.x - 38} y={activePoint.y - 56} width="96" height="36" rx="10" fill="#ffffff" stroke="#eaedf8" />
          <text x={activePoint.x - 26} y={activePoint.y - 40} fill="#69729f" fontSize="8">
            {activePoint.label}
          </text>
          <text x={activePoint.x - 26} y={activePoint.y - 28} fill="#2b3268" fontSize="9" fontWeight="700">
            {formatCompactCurrency(activePoint.value)}
          </text>
        </>
      ) : null}

      {labels.map((label, index) => (
        <text
          key={label}
          x={paddingX + stepX * index}
          y={height - 12}
          fill="#8b92bc"
          fontSize="9"
          textAnchor="middle"
        >
          {label}
        </text>
      ))}
    </svg>
  );
}

function ComparisonBarChart({
  data,
}: {
  data: Array<{ label: string; quotes: number; orders: number }>;
}) {
  const max = Math.max(...data.flatMap((item) => [item.quotes, item.orders]), 1);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-4 text-[11px] text-[#7b84b1]">
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#5b4bff]" />
          Cotizaciones enviadas
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#65c78d]" />
          Pedidos recibidos
        </span>
      </div>

      <div className="grid h-[220px] grid-cols-6 items-end gap-4">
        {data.map((item) => (
          <div key={item.label} className="flex h-full flex-col justify-end">
            <div className="flex flex-1 items-end justify-center gap-2">
              <div
                className="w-4 rounded-t-[8px] bg-[#5b4bff]"
                style={{ height: `${(item.quotes / max) * 150}px` }}
              />
              <div
                className="w-4 rounded-t-[8px] bg-[#65c78d]"
                style={{ height: `${(item.orders / max) * 150}px` }}
              />
            </div>
            <p className="mt-3 text-center text-[11px] font-semibold text-[#8b92bc]">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DonutChart({
  segments,
  centerLabel,
  centerValue,
}: {
  segments: Array<{ color: string; value: number }>;
  centerLabel: string;
  centerValue: string;
}) {
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;
  let offset = 0;

  return (
    <div className="relative flex h-[160px] w-[160px] items-center justify-center">
      <svg className="-rotate-90" height="160" viewBox="0 0 160 160" width="160">
        <circle cx="80" cy="80" fill="none" r={radius} stroke="#eef1fb" strokeWidth="18" />
        {segments.map((segment, index) => {
          const dash = (segment.value / total) * circumference;
          const circle = (
            <circle
              key={segment.color}
              cx="80"
              cy="80"
              fill="none"
              r={radius}
              stroke={segment.color}
              strokeDasharray={`${dash} ${circumference}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              strokeWidth="18"
            />
          );
          offset += dash;
          return circle;
        })}
      </svg>
      <div className="absolute text-center">
        <p className="text-[24px] font-semibold text-[#242c63]">{centerValue}</p>
        <p className="text-[11px] text-[#8d95be]">{centerLabel}</p>
      </div>
    </div>
  );
}

function ActivityIcon({ kind }: { kind: 'check' | 'arrow' | 'close' | 'clock' }) {
  if (kind === 'check') {
    return (
      <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }

  if (kind === 'arrow') {
    return (
      <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
        <path d="M5 12h14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="M13 5l7 7-7 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }

  if (kind === 'close') {
    return (
      <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
        <path d="M18 6L6 18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="M6 6l12 12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

export default function SupplierReportsPage() {
  const { session, openRequests, myQuotes, loading, error } = useSupplierDashboardData();

  const analytics = useMemo(() => {
    const now = new Date();
    const quotes = [...myQuotes].sort(
      (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
    );
    const awardedQuotes = quotes.filter((quote) => quote.status === 'AWARDED');
    const submittedQuotes = quotes.filter((quote) => quote.status === 'SUBMITTED');
    const receivedOrders = awardedQuotes.filter((quote) => quote.request?.order);

    const totalSales = awardedQuotes.reduce((sum, quote) => sum + (quote.amount ?? 0), 0);
    const conversionRate =
      quotes.length === 0 ? 0 : Number(((awardedQuotes.length / quotes.length) * 100).toFixed(1));
    const uniqueClients = new Set(
      quotes
        .map((quote) => quote.request?.buyerCompany?.name)
        .filter((value): value is string => Boolean(value)),
    );
    const newClients = new Set(
      quotes
        .filter((quote) => new Date(quote.createdAt).getTime() >= now.getTime() - 30 * 24 * 60 * 60 * 1000)
        .map((quote) => quote.request?.buyerCompany?.name)
        .filter((value): value is string => Boolean(value)),
    );

    const monthlyRows: MonthlyRow[] = Array.from({ length: 6 }).map((_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;

      const monthQuotes = quotes.filter((quote) => {
        const quoteDate = new Date(quote.createdAt);
        return `${quoteDate.getFullYear()}-${quoteDate.getMonth()}` === monthKey;
      });

      const monthOrders = monthQuotes.filter((quote) => quote.request?.order);
      const monthSales = monthQuotes
        .filter((quote) => quote.status === 'AWARDED')
        .reduce((sum, quote) => sum + (quote.amount ?? 0), 0);
      const clientCount = new Set(
        monthQuotes
          .map((quote) => quote.request?.buyerCompany?.name)
          .filter((value): value is string => Boolean(value)),
      ).size;

      return {
        key: monthKey,
        label: formatMonthLong(date),
        sales: monthSales,
        quotes: monthQuotes.length,
        orders: monthOrders.length,
        conversion:
          monthQuotes.length === 0
            ? 0
            : Number(
                (
                  (monthQuotes.filter((quote) => quote.status === 'AWARDED').length /
                    monthQuotes.length) *
                  100
                ).toFixed(1),
              ),
        newClients: clientCount,
      };
    });

    const chartRows = monthlyRows.slice(-6);
    const salesTrend = chartRows.map((row) => row.sales);
    const salesLabels = chartRows.map((row) => row.label.split(' ')[0]);
    const quotesVsOrders = chartRows.map((row) => ({
      label: row.label.split(' ')[0].slice(0, 3),
      quotes: row.quotes,
      orders: row.orders,
    }));

    const categorySales = awardedQuotes.reduce<Map<string, number>>((map, quote) => {
      const key = quote.request?.category ?? 'Otros';
      map.set(key, (map.get(key) ?? 0) + (quote.amount ?? 0));
      return map;
    }, new Map());

    const categoryBreakdown = Array.from(categorySales.entries())
      .map(([category, total], index) => ({
        category,
        total,
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
        percentage: totalSales === 0 ? 0 : Math.round((total / totalSales) * 100),
      }))
      .sort((left, right) => right.total - left.total);

    const quoteOutcome = [
      {
        label: 'Ganadas',
        total: awardedQuotes.length,
        color: '#62c68f',
      },
      {
        label: 'Pendientes',
        total: submittedQuotes.length,
        color: '#f4a340',
      },
      {
        label: 'Perdidas',
        total: quotes.filter((quote) => quote.status === 'REJECTED').length,
        color: '#5b4bff',
      },
      {
        label: 'Canceladas',
        total: quotes.filter((quote) => quote.status === 'WITHDRAWN').length,
        color: '#f26565',
      },
    ];

    const topClients = Array.from(
      awardedQuotes.reduce<Map<string, number>>((map, quote) => {
        const key = quote.request?.buyerCompany?.name ?? 'Cliente';
        map.set(key, (map.get(key) ?? 0) + (quote.amount ?? 0));
        return map;
      }, new Map()),
    )
      .map(([name, total]) => ({ name, total }))
      .sort((left, right) => right.total - left.total)
      .slice(0, 5);

    const periodStart = chartRows[0]?.label ?? formatMonthLong(now);
    const periodEnd = chartRows[chartRows.length - 1]?.label ?? formatMonthLong(now);
    const salesPerDay = totalSales / 31;
    const quotesPerDay = quotes.length / 31;
    const ordersPerDay = receivedOrders.length / 31;

    const recentActivity = [...quotes]
      .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
      .slice(0, 4)
      .map((quote) => {
        const tone = getQuoteTone(quote.status);
        return {
          id: quote.id,
          title: tone.label,
          detail: `${quote.id} · ${quote.request?.buyerCompany?.name ?? 'Cliente'}`,
          time: formatShortDate(quote.updatedAt),
          dot: tone.dot,
          icon: tone.icon,
        };
      });

    return {
      totalSales,
      sentQuotes: quotes.length,
      receivedOrders: receivedOrders.length,
      conversionRate,
      newClients: newClients.size,
      activeClients: uniqueClients.size,
      salesTrend,
      salesLabels,
      quotesVsOrders,
      quoteOutcome,
      topClients,
      categoryBreakdown,
      monthlyRows: chartRows.reverse(),
      periodStart,
      periodEnd,
      salesPerDay,
      quotesPerDay,
      ordersPerDay,
      recentActivity,
    };
  }, [myQuotes]);

  return (
    <SupplierDashboardShell
      searchPlaceholder="Buscar solicitudes, pedidos, clientes, productos..."
      session={session}
    >
      <section className="space-y-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-[24px] font-semibold tracking-[-0.03em] text-[#1f2373] sm:text-[32px]">
              Estadisticas
            </h1>
            <p className="mt-1 text-sm text-[#7e85b2]">
              Analisis de tu rendimiento y actividad en la plataforma.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#e7eaf3] bg-white px-4 text-sm font-semibold text-[#6d739d]"
              type="button"
            >
              <HeaderIcon kind="calendar" />
              1 May, 2024 - 31 May, 2024
            </button>
            <button
              className="inline-flex h-10 items-center rounded-xl border border-[#e7eaf3] bg-white px-4 text-sm font-semibold text-[#6d739d]"
              type="button"
            >
              Ultimos 30 dias
            </button>
            <button
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#d9dbff] bg-white px-4 text-sm font-semibold text-[#5546ff]"
              type="button"
            >
              <HeaderIcon kind="download" />
              Exportar informe
            </button>
          </div>
        </div>

        {error ? (
          <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
          {[
            {
              title: 'Ventas totales',
              value: loading ? '-' : formatCurrency(analytics.totalSales),
              change: '+18%',
              note: 'vs periodo anterior',
              tone: 'text-emerald-500',
              icon: 'sales' as const,
            },
            {
              title: 'Cotizaciones enviadas',
              value: loading ? '-' : analytics.sentQuotes,
              change: '+12%',
              note: 'vs periodo anterior',
              tone: 'text-emerald-500',
              icon: 'quotes' as const,
            },
            {
              title: 'Pedidos recibidos',
              value: loading ? '-' : analytics.receivedOrders,
              change: '+20%',
              note: 'vs periodo anterior',
              tone: 'text-emerald-500',
              icon: 'orders' as const,
            },
            {
              title: 'Tasa de conversion',
              value: loading ? '-' : `${analytics.conversionRate}%`,
              change: '+6.3%',
              note: 'vs periodo anterior',
              tone: 'text-emerald-500',
              icon: 'rate' as const,
            },
            {
              title: 'Clientes nuevos',
              value: loading ? '-' : analytics.newClients,
              change: '+25%',
              note: 'vs periodo anterior',
              tone: 'text-emerald-500',
              icon: 'clients' as const,
            },
          ].map((card) => (
            <article
              key={card.title}
              className="rounded-[22px] border border-[#e7eaf3] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.04)]"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f7f7ff] text-[#5b4bff]">
                  <StatIcon kind={card.icon} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#8b92bc]">{card.title}</p>
                  <p className="mt-1 text-[22px] font-semibold text-[#1f2373] sm:text-[28px]">{card.value}</p>
                  <p className={`mt-1 text-[11px] ${card.tone}`}>
                    {card.change}{' '}
                    <span className="text-[#8d95be]">{card.note}</span>
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_310px]">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.05fr_0.95fr]">
              <article className="rounded-[24px] border border-[#e7eaf3] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-[#27305f]">Ventas totales</h2>
                    <p className="mt-2 text-[22px] font-semibold text-[#1f2373] sm:text-[28px]">
                      {loading ? '-' : formatCurrency(analytics.totalSales)}
                    </p>
                    <p className="mt-1 text-[11px] text-emerald-500">
                      +18% <span className="text-[#8d95be]">vs periodo anterior</span>
                    </p>
                  </div>
                  <button
                    className="inline-flex h-9 items-center rounded-xl border border-[#edf0fb] bg-white px-3 text-[11px] font-semibold text-[#7b84b1]"
                    type="button"
                  >
                    Mensual
                  </button>
                </div>

                <div className="mt-4">
                  <TrendLineChart values={analytics.salesTrend} labels={analytics.salesLabels} />
                </div>
              </article>

              <article className="rounded-[24px] border border-[#e7eaf3] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-[#27305f]">Cotizaciones vs Pedidos</h2>
                  </div>
                  <button
                    className="inline-flex h-9 items-center rounded-xl border border-[#edf0fb] bg-white px-3 text-[11px] font-semibold text-[#7b84b1]"
                    type="button"
                  >
                    Mensual
                  </button>
                </div>

                <div className="mt-4">
                  <ComparisonBarChart data={analytics.quotesVsOrders} />
                </div>
              </article>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[0.9fr_1.1fr]">
              <article className="rounded-[24px] border border-[#e7eaf3] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
                <h2 className="text-sm font-semibold text-[#27305f]">Rendimiento de cotizaciones</h2>
                <div className="mt-4 flex flex-col items-center gap-4 xl:flex-row xl:items-center">
                  <DonutChart
                    centerLabel="Total"
                    centerValue={String(analytics.sentQuotes)}
                    segments={analytics.quoteOutcome.map((item) => ({
                      color: item.color,
                      value: item.total,
                    }))}
                  />
                  <div className="w-full space-y-3">
                    {analytics.quoteOutcome.map((item) => (
                      <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
                        <span className="flex items-center gap-2 text-[#7b84b1]">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          {item.label}
                        </span>
                        <span className="font-semibold text-[#2c3567]">
                          {item.total} ({analytics.sentQuotes === 0 ? 0 : Math.round((item.total / analytics.sentQuotes) * 100)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </article>

              <article className="rounded-[24px] border border-[#e7eaf3] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-sm font-semibold text-[#27305f]">Principales clientes por ventas</h2>
                  <button
                    className="inline-flex h-9 items-center rounded-xl border border-[#edf0fb] bg-white px-3 text-[11px] font-semibold text-[#7b84b1]"
                    type="button"
                  >
                    Este periodo
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {analytics.topClients.map((client, index) => (
                    <div
                      key={client.name}
                      className="grid grid-cols-[22px_minmax(0,1fr)_auto_auto] items-center gap-3 rounded-[16px] bg-[#fbfbff] px-3 py-3"
                    >
                      <span className="text-xs font-semibold text-[#9aa1c8]">{index + 1}</span>
                      <span className="truncate text-sm font-semibold text-[#33407a]">{client.name}</span>
                      <span className="text-sm font-semibold text-[#33407a]">{formatCurrency(client.total)}</span>
                      <span className="text-xs font-semibold text-[#7b84b1]">
                        {analytics.totalSales === 0 ? 0 : Math.round((client.total / analytics.totalSales) * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </article>
            </div>

            <article className="rounded-[24px] border border-[#e7eaf3] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
              <h2 className="text-sm font-semibold text-[#27305f]">Evolucion mensual (ultimos 6 meses)</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[720px]">
                  <thead>
                    <tr className="border-b border-[#edf0fb] text-left text-[11px] uppercase tracking-[0.16em] text-[#9aa1c8]">
                      <th className="px-3 py-3 font-semibold">Mes</th>
                      <th className="px-3 py-3 font-semibold">Ventas totales</th>
                      <th className="px-3 py-3 font-semibold">Cotizaciones enviadas</th>
                      <th className="px-3 py-3 font-semibold">Pedidos recibidos</th>
                      <th className="px-3 py-3 font-semibold">Tasa de conversion</th>
                      <th className="px-3 py-3 font-semibold">Clientes nuevos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f2fa] text-sm text-[#33407a]">
                    {analytics.monthlyRows.map((row) => (
                      <tr key={row.key}>
                        <td className="px-3 py-3 font-semibold">{row.label}</td>
                        <td className="px-3 py-3">{formatCurrency(row.sales)}</td>
                        <td className="px-3 py-3">{row.quotes}</td>
                        <td className="px-3 py-3">{row.orders}</td>
                        <td className="px-3 py-3">{row.conversion}%</td>
                        <td className="px-3 py-3">{row.newClients}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                className="mt-4 text-sm font-semibold text-[#5546ff] transition hover:text-[#4336dc]"
                type="button"
              >
                Ver informe completo
              </button>
            </article>
          </div>

          <aside className="space-y-4">
            <article className="rounded-[24px] border border-[#e7eaf3] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
              <h2 className="text-sm font-semibold text-[#27305f]">Resumen del periodo</h2>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[#8d95be]">Periodo</span>
                  <span className="font-semibold text-[#2c3567]">
                    {analytics.periodStart} - {analytics.periodEnd}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[#8d95be]">Dias en el periodo</span>
                  <span className="font-semibold text-[#2c3567]">31 dias</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[#8d95be]">Ventas promedio por dia</span>
                  <span className="font-semibold text-[#2c3567]">{formatCurrency(Math.round(analytics.salesPerDay))}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[#8d95be]">Cotizaciones promedio por dia</span>
                  <span className="font-semibold text-[#2c3567]">{analytics.quotesPerDay.toFixed(1)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[#8d95be]">Pedidos promedio por dia</span>
                  <span className="font-semibold text-[#2c3567]">{analytics.ordersPerDay.toFixed(1)}</span>
                </div>
              </div>
            </article>

            <article className="rounded-[24px] border border-[#e7eaf3] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
              <h2 className="text-sm font-semibold text-[#27305f]">Ventas por categoria</h2>
              <div className="mt-4 flex flex-col items-center gap-4">
                <DonutChart
                  centerLabel="Total"
                  centerValue={formatCompactCurrency(analytics.totalSales)}
                  segments={analytics.categoryBreakdown.map((item) => ({
                    color: item.color,
                    value: item.total,
                  }))}
                />

                <div className="w-full space-y-3">
                  {analytics.categoryBreakdown.map((item) => (
                    <div key={item.category} className="flex items-center justify-between gap-4 text-sm">
                      <span className="flex items-center gap-2 text-[#7b84b1]">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        {item.category}
                      </span>
                      <span className="font-semibold text-[#2c3567]">{item.percentage}%</span>
                    </div>
                  ))}
                </div>

                <button
                  className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-[#e3e7f8] bg-white text-sm font-semibold text-[#5546ff] transition hover:bg-[#f7f6ff]"
                  type="button"
                >
                  Ver detalle de categorias
                </button>
              </div>
            </article>

            <article className="rounded-[24px] border border-[#e7eaf3] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
              <h2 className="text-sm font-semibold text-[#27305f]">Actividad reciente</h2>
              <div className="mt-4 space-y-4">
                {analytics.recentActivity.map((item) => (
                  <div key={item.id} className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-full text-white ${item.dot}`}>
                      <ActivityIcon kind={item.icon} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#33407a]">{item.title}</p>
                      <p className="mt-1 truncate text-xs text-[#8d95be]">{item.detail}</p>
                    </div>
                    <span className="text-[11px] font-semibold text-[#8d95be]">{item.time}</span>
                  </div>
                ))}
              </div>

              <button
                className="mt-5 text-sm font-semibold text-[#5546ff] transition hover:text-[#4336dc]"
                type="button"
              >
                Ver toda la actividad
              </button>
            </article>
          </aside>
        </div>
      </section>
    </SupplierDashboardShell>
  );
}
