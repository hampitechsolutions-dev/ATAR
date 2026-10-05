'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import CompanySwitcher from '@/components/dashboard/company-switcher';
import SupplierAccountMenu from '@/components/dashboard/supplier-account-menu';
import DashboardSidebar from '@/components/dashboard/dashboard-sidebar';
import ToneRow, { TONES, type Tone } from '@/components/dashboard/tone-row';
import SupplierBottomNav from '@/components/dashboard/supplier-bottom-nav';
import WorkspaceSwitcher from '@/components/dashboard/workspace-switcher';
import { DashboardLoader } from '@/components/ui/spinner';
import { useWorkspace } from '@/components/auth/workspace-provider';
import { type QuoteRecord, type RequestRecord } from '@/lib/atar-api';
import { FALLBACK_REQUEST_CATEGORIES } from '@/lib/request-catalog-fallback';
import { useSupplierDashboardData, useSupplierWorkspaceCounters } from '@/lib/dashboard-hooks';
import { getPrimaryCompanyName, getUserFirstName } from '@/lib/session';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value);
}

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

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(value));
}

function getRequestTag(status: RequestRecord['status']) {
  if (status === 'REVIEWING') {
    return 'Nueva';
  }

  if (status === 'NEGOTIATING') {
    return 'Respondida';
  }

  if (status === 'ORDER_ISSUED') {
    return 'Activa';
  }

  if (status === 'AWARDED') {
    return 'Cerrada';
  }

  return 'Publicada';
}

function getRequestTagClass(status: RequestRecord['status']) {
  if (status === 'REVIEWING') {
    return 'bg-indigo-100 text-indigo-600';
  }

  if (status === 'NEGOTIATING') {
    return 'bg-emerald-100 text-emerald-600';
  }

  if (status === 'ORDER_ISSUED') {
    return 'bg-sky-100 text-sky-600';
  }

  if (status === 'AWARDED') {
    return 'bg-violet-100 text-violet-600';
  }

  return 'bg-slate-100 text-slate-600';
}

function HeaderActionIcon({ kind }: { kind: 'chat' | 'bell' }) {
  if (kind === 'chat') {
    return (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4v8z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

/* Inicio de escritorio ------------------------------------------------------ */

type HomeIconName = 'doc' | 'chart' | 'clipboard' | 'user' | 'clock' | 'chat' | 'send' | 'dollar' | 'box';

const HOME_ICON_PATHS: Record<HomeIconName, React.ReactNode> = {
  doc: <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5zM14 3v5h5M9 13h6M9 17h4" />,
  chart: <path d="M5 20V12M12 20V5M19 20v-9" />,
  clipboard: <path d="M9 4h6a1 1 0 011 1v1H8V5a1 1 0 011-1zM8 6H6a1 1 0 00-1 1v13a1 1 0 001 1h12a1 1 0 001-1V7a1 1 0 00-1-1h-2M9 12h6M9 16h4" />,
  user: <path d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0" />,
  clock: <path d="M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2" />,
  chat: <path d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12zM8.5 12h.01M12 12h.01M15.5 12h.01" />,
  send: <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />,
  dollar: <path d="M12 2v20M17 6.5C17 4.6 14.8 4 12 4S7 5 7 7.5 9.5 10.5 12 11s5 1.5 5 4-2.2 3.5-5 3.5-5-.6-5-2.5" />,
  box: <path d="M21 16V8l-9-5-9 5v8l9 5 9-5zM3.3 7.3L12 12l8.7-4.7M12 22V12" />,
};

function HomeIcon({ name, tone }: { name: HomeIconName; tone: string }) {
  return (
    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${tone}`}>
      <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" viewBox="0 0 24 24">
        {HOME_ICON_PATHS[name]}
      </svg>
    </span>
  );
}

function HomeArrow() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function HomePin() {
  return (
    <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
      <path d="M12 21s7-5.4 7-11a7 7 0 10-14 0c0 5.6 7 11 7 11z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function HomeSeeAll({ href }: { href: string }) {
  return (
    // globals.css fija `a { color: inherit }`: el color va en el hijo.
    <Link className="inline-flex shrink-0 items-center text-[13px] font-semibold" href={href}>
      <span className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-500">
        Ver todas
        <HomeArrow />
      </span>
    </Link>
  );
}

const homeCard = 'rounded-[18px] border border-slate-300 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.07)]';

/** "Hoy, 09:15", "Ayer, 16:03" o "12 sept". */
function formatDayTime(value: string) {
  const date = new Date(value);
  const time = new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((startOfToday.getTime() - new Date(value).setHours(0, 0, 0, 0)) / 86400000);
  if (diffDays <= 0) return `Hoy, ${time}`;
  if (diffDays === 1) return `Ayer, ${time}`;
  return formatShortDate(value);
}

function requestImage(request: RequestRecord) {
  const labels = [request.items?.[0]?.category, request.category].filter(Boolean);
  for (const label of labels) {
    const match = FALLBACK_REQUEST_CATEGORIES.find((category) => category.label === label);
    if (match?.imageSrc) return match.imageSrc;
  }
  return '/logoatar.png';
}

function quoteStatusMeta(status: QuoteRecord['status']) {
  if (status === 'AWARDED') return { label: 'Aceptada', tone: 'bg-emerald-100 text-emerald-600' };
  if (status === 'REJECTED') return { label: 'Rechazada', tone: 'bg-rose-100 text-rose-600' };
  if (status === 'WITHDRAWN') return { label: 'Retirada', tone: 'bg-slate-100 text-slate-600' };
  if (status === 'DRAFT') return { label: 'Borrador', tone: 'bg-amber-100 text-amber-600' };
  return { label: 'Enviada', tone: 'bg-indigo-100 text-indigo-600' };
}

function formatCompactCurrency(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toLocaleString('es-AR', { maximumFractionDigits: 1 })} M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000).toLocaleString('es-AR')} K`;
  return formatCurrency(value);
}

export default function DashboardProveedorPage() {
  const { session, openRequests, myQuotes, loading, error } = useSupplierDashboardData();
  const { activeWorkspace, hasMultipleWorkspaces, isSeller } = useWorkspace();
  const counters = useSupplierWorkspaceCounters({
    accessToken: session?.accessToken,
    openRequests,
    myQuotes,
  });

  // Se saluda a la persona, no a la empresa: el vendedor puede representar a
  // varias y la empresa activa se muestra aparte (y se cambia en el selector).
  const sellerName = session ? getUserFirstName(session.user) : 'Vendedor';
  const companyName =
    activeWorkspace?.company.name ?? (session ? getPrimaryCompanyName(session.user) : 'Tu empresa');

  const dashboardData = useMemo(() => {
    const sortedRequests = [...openRequests].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
    const sortedQuotes = [...myQuotes].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );

    const awardedQuotes = sortedQuotes.filter((quote) => quote.status === 'AWARDED');
    const submittedQuotes = sortedQuotes.filter((quote) => quote.status === 'SUBMITTED');
    const rejectedQuotes = sortedQuotes.filter((quote) => quote.status === 'REJECTED');
    const privateRequests = sortedRequests.filter((request) => request.privateRequest);
    const openOpportunities = sortedRequests.filter(
      (request) => !sortedQuotes.some((quote) => quote.requestId === request.id),
    );
    const activeOrders = awardedQuotes.filter((quote) => quote.request?.order);
    const stageCounts = {
      pending: activeOrders.filter((quote) => quote.request?.order?.fulfillmentStatus === 'CONFIRMED').length,
      production: activeOrders.filter((quote) => quote.request?.order?.fulfillmentStatus === 'IN_PRODUCTION').length,
      transit: activeOrders.filter((quote) => quote.request?.order?.fulfillmentStatus === 'DISPATCHED').length,
      delivered: activeOrders.filter((quote) => quote.request?.order?.fulfillmentStatus === 'DELIVERED').length,
    };

    const recentActivity = [
      ...sortedQuotes.slice(0, 4).map((quote) => ({
        id: `quote-${quote.id}`,
        title:
          quote.status === 'AWARDED'
            ? `${quote.request?.buyerCompany?.name ?? 'Cliente'} acepto tu cotizacion`
            : `Nueva cotizacion de ${quote.request?.buyerCompany?.name ?? 'cliente'}`,
        detail: quote.request?.title ?? 'Solicitud actualizada',
        time: formatRelativeTime(quote.updatedAt),
        tone:
          quote.status === 'AWARDED'
            ? 'bg-emerald-100 text-emerald-600'
            : 'bg-indigo-100 text-indigo-600',
        glyph: quote.status === 'AWARDED' ? 'check' : 'quote',
      })),
      ...sortedRequests.slice(0, 3).map((request) => ({
        id: `request-${request.id}`,
        title: `${request.buyerCompany?.name ?? 'Comprador'} publico una solicitud`,
        detail: request.title,
        time: formatRelativeTime(request.updatedAt),
        tone: 'bg-amber-100 text-amber-600',
        glyph: 'star',
      })),
    ].slice(0, 5);

    const clientMap = new Map<string, { name: string; orders: number; amount: number }>();
    sortedQuotes.forEach((quote) => {
      const clientName = quote.request?.buyerCompany?.name;
      if (!clientName) {
        return;
      }

      const current = clientMap.get(clientName) ?? { name: clientName, orders: 0, amount: 0 };
      current.orders += 1;
      current.amount += quote.amount ?? 0;
      clientMap.set(clientName, current);
    });

    const topClients = [...clientMap.values()].sort((a, b) => b.amount - a.amount).slice(0, 3);
    const totalSales = awardedQuotes.reduce((acc, quote) => acc + (quote.amount ?? 0), 0);
    const nextPromisedDate = activeOrders
      .map((quote) => quote.request?.order?.promisedDate)
      .filter((value): value is string => Boolean(value))
      .sort((left, right) => new Date(left).getTime() - new Date(right).getTime())[0] ?? null;

    // Contadores del mes en curso (datos reales por createdAt).
    const nowDate = new Date();
    const currentMonthKey = nowDate.getFullYear() * 12 + nowDate.getMonth();
    const inCurrentMonth = (value?: string | null) => {
      if (!value) {
        return false;
      }
      const date = new Date(value);
      return date.getFullYear() * 12 + date.getMonth() === currentMonthKey;
    };

    const requestsThisMonth = sortedRequests.filter((request) => inCurrentMonth(request.createdAt)).length;
    const quotesThisMonth = sortedQuotes.filter((quote) => inCurrentMonth(quote.createdAt)).length;
    const ordersThisMonth = activeOrders.filter((quote) => inCurrentMonth(quote.request?.order?.createdAt)).length;
    const salesThisMonth = awardedQuotes
      .filter((quote) => inCurrentMonth(quote.createdAt))
      .reduce((acc, quote) => acc + (quote.amount ?? 0), 0);

    return {
      awardedQuotes,
      submittedQuotes,
      rejectedQuotes,
      privateRequests,
      openOpportunities,
      activeOrders,
      stageCounts,
      recentRequests: sortedRequests.slice(0, 4),
      recentActivity,
      topClients,
      clientsCount: clientMap.size,
      totalSales,
      nextPromisedDate,
      requestsThisMonth,
      quotesThisMonth,
      ordersThisMonth,
      salesThisMonth,
    };
  }, [myQuotes, openRequests]);

  // --- Inicio de escritorio: tareas, resumen y listados ----------------------
  // Hora de referencia fija por render de la página (no se recalcula en cada
  // render para que los cálculos sean puros).
  const [nowMs] = useState(() => Date.now());
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buen día' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';
  const todayKey = new Date().toDateString();
  const dueTodayCount = dashboardData.openOpportunities.filter(
    (request) => request.dueDate && new Date(request.dueDate).toDateString() === todayKey,
  ).length;
  const staleQuotesCount = dashboardData.submittedQuotes.filter(
    (quote) => nowMs - new Date(quote.updatedAt).getTime() > 48 * 3600 * 1000,
  ).length;
  const homeTasks: { label: string; detail: string; count: number; icon: HomeIconName; tone: Tone; href: string }[] = [
    {
      label: 'Nuevas solicitudes de cotización',
      detail: dueTodayCount > 0 ? `${dueTodayCount} vencen hoy` : 'Todavía sin cotizar',
      count: dashboardData.openOpportunities.length,
      icon: 'doc',
      tone: 'indigo',
      href: '/dashboard/proveedor/solicitudes',
    },
    {
      label: 'Clientes esperan respuesta',
      detail: 'Mensajes sin leer',
      count: counters.unreadMessagesCount,
      icon: 'user',
      tone: 'sky',
      href: '/dashboard/proveedor/mensajes',
    },
    {
      label: 'Cotización sin respuesta',
      detail: 'Hace más de 48 horas',
      count: staleQuotesCount,
      icon: 'clock',
      tone: 'amber',
      href: '/dashboard/proveedor/cotizaciones',
    },
    {
      label: 'Notificaciones nuevas',
      detail: 'Sin leer',
      count: counters.unreadNotificationsCount,
      icon: 'chat',
      tone: 'violet',
      href: '/dashboard/proveedor/notificaciones',
    },
  ];
  const pendingTotal = homeTasks.reduce((sum, task) => sum + task.count, 0);
  const salesLast30 = dashboardData.awardedQuotes
    .filter((quote) => nowMs - new Date(quote.updatedAt).getTime() <= 30 * 86400000)
    .reduce((sum, quote) => sum + (quote.amount ?? 0), 0);
  const activityTiles: { label: string; value: string | number; trend: string | null; detail?: string; icon: HomeIconName; href: string }[] = [
    {
      label: 'Oportunidades activas',
      value: dashboardData.openOpportunities.length,
      trend: dashboardData.requestsThisMonth > 0 ? `${dashboardData.requestsThisMonth} este mes` : null,
      icon: 'doc',
      href: '/dashboard/proveedor/solicitudes',
    },
    {
      label: 'Cotizaciones enviadas',
      value: myQuotes.length,
      trend: dashboardData.quotesThisMonth > 0 ? `${dashboardData.quotesThisMonth} este mes` : null,
      icon: 'send',
      href: '/dashboard/proveedor/cotizaciones',
    },
    {
      label: 'Pedidos en curso',
      value: dashboardData.activeOrders.length,
      trend: dashboardData.ordersThisMonth > 0 ? `${dashboardData.ordersThisMonth} este mes` : null,
      icon: 'box',
      href: '/dashboard/proveedor/pedidos',
    },
    {
      label: 'Ventas cerradas',
      value: formatCompactCurrency(salesLast30),
      trend: null,
      detail: 'Últimos 30 días',
      icon: 'dollar',
      href: '/dashboard/proveedor/reportes',
    },
  ];
  const recentOpportunities = dashboardData.recentRequests;
  const recentQuotes = [...myQuotes]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4);
  const recentClients = (() => {
    const map = new Map<string, { name: string; activity: string; at: string; status: string; tone: string }>();
    const rank: Record<string, number> = { Nuevo: 0, Activo: 1, Cliente: 2 };
    const push = (name: string | undefined, activity: string, at: string, status: string, tone: string) => {
      if (!name) return;
      const current = map.get(name);
      const newer = !current || new Date(at) > new Date(current.at);
      // La actividad es la más reciente; el estado, el más avanzado.
      const best = !current || rank[status] >= rank[current.status] ? { status, tone } : { status: current.status, tone: current.tone };
      map.set(name, {
        name,
        activity: newer ? activity : current.activity,
        at: newer ? at : current.at,
        ...best,
      });
    };
    openRequests.forEach((request) =>
      push(request.buyerCompany?.name, 'Cotización solicitada', request.updatedAt, 'Nuevo', 'bg-rose-100 text-rose-600'),
    );
    myQuotes.forEach((quote) =>
      push(
        quote.request?.buyerCompany?.name,
        quote.status === 'AWARDED' ? 'Aceptó tu cotización' : 'Recibió tu cotización',
        quote.updatedAt,
        quote.status === 'AWARDED' ? 'Cliente' : 'Activo',
        quote.status === 'AWARDED' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600',
      ),
    );
    return [...map.values()].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 4);
  })();

  if (loading) {
    return <DashboardLoader />;
  }

  // Mismo contenido en mobile y escritorio; cambia solo el marco (header,
  // sidebar) y, en mobile, las tablas se muestran como tarjetas.
  const homeBody = (
    <>
            {/* Saludo. El vendedor lo ve en una banda verde suave, para que se lea de
                entrada que es su entorno; la empresa conserva el saludo simple. */}
            {isSeller ? (
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-[18px] border border-seller-200 bg-seller-50 px-5 py-4 shadow-[inset_5px_0_0_var(--color-seller-500)] lg:px-7 lg:py-5">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-seller-700">{greeting},</p>
                  <h1 className="mt-0.5 text-[1.9rem] font-bold leading-tight tracking-[-0.03em] text-slate-900 lg:text-[2.3rem]">
                    {sellerName} 👋
                  </h1>
                  <p className="mt-0.5 text-[14px] text-slate-600 lg:text-[15px]">Estas son tus tareas y oportunidades de hoy.</p>
                </div>
                <div className="rounded-[12px] border border-seller-200 bg-white px-4 py-2.5">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-seller-700">Panel de ventas</p>
                  <p className="text-[15px] font-bold text-slate-900">{companyName}</p>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-indigo-600">{greeting},</p>
                <h1 className="mt-0.5 text-[1.9rem] font-bold leading-tight tracking-[-0.03em] text-slate-900 lg:text-[2.3rem]">
                  {sellerName} 👋
                </h1>
                <p className="mt-0.5 text-[14px] text-slate-500 lg:text-[15px]">Estas son las tareas y oportunidades de hoy en {companyName}.</p>
              </div>
            )}

            <div className="mt-6 grid gap-5 xl:grid-cols-[1.15fr_1fr]">
              {/* Tareas pendientes */}
              <section className={homeCard} data-tour="sales-tasks">
                <div className="flex items-center justify-between gap-3 px-5 pt-5">
                  <div className="flex items-center gap-3">
                    <HomeIcon name="doc" tone="bg-indigo-100 text-indigo-600" />
                    <h2 className="text-[18px] font-bold text-slate-900">Tareas pendientes</h2>
                    {pendingTotal > 0 ? (
                      <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[12px] font-semibold text-white">
                        {pendingTotal}
                      </span>
                    ) : null}
                  </div>
                  <HomeSeeAll href="/dashboard/proveedor/solicitudes" />
                </div>
                {/* Cada tarea tiene su propio fondo; la que lleva tiempo sin
                    respuesta se marca con un borde de color. */}
                <ul className="mt-4 space-y-2.5 px-4 pb-4 sm:px-5 sm:pb-5">
                  {homeTasks.map((task) => (
                    <li key={task.label}>
                      <ToneRow
                        count={task.count}
                        detail={task.detail}
                        highlight={task.tone === 'amber' && task.count > 0}
                        href={task.href}
                        icon={
                          <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" viewBox="0 0 24 24">
                            {HOME_ICON_PATHS[task.icon]}
                          </svg>
                        }
                        title={task.label}
                        tone={task.tone}
                      />
                    </li>
                  ))}
                </ul>
              </section>

              {/* Resumen de actividad */}
              <section className={`${homeCard} flex flex-col p-5`} data-tour="sales-activity">
                <div className="flex items-center gap-3">
                  <HomeIcon name="chart" tone="bg-indigo-100 text-indigo-600" />
                  <h2 className="text-[18px] font-bold text-slate-900">Resumen de tu actividad</h2>
                </div>
                <div className="mt-4 grid flex-1 auto-rows-fr grid-cols-2 gap-3">
                  {activityTiles.map((tile, index) => {
                    const tone = TONES[(['indigo', 'violet', 'sky', 'amber'] as Tone[])[index % 4]];
                    return (
                    <Link
                      key={tile.label}
                      className={`group flex items-center rounded-2xl p-3.5 transition sm:p-4 ${tone.row}`}
                      href={tile.href}
                    >
                      <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
                        <HomeIcon name={tile.icon} tone={tone.icon} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[20px] font-bold leading-7 text-slate-900 sm:truncate sm:text-[22px]">{tile.value}</p>
                            {tile.trend ? (
                              <span className="shrink-0 rounded-full bg-white px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600">
                                ↑ {tile.trend}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-[12px] font-medium text-slate-700">{tile.label}</p>
                          {tile.detail ? <p className="text-[11px] text-slate-500">{tile.detail}</p> : null}
                        </div>
                      </div>
                    </Link>
                    );
                  })}
                </div>
              </section>
            </div>

            {/* Oportunidades recientes */}
            <section className={`${homeCard} mt-5`} data-tour="sales-opportunities">
              <div className="flex items-center justify-between gap-3 px-5 pt-5">
                <div className="flex items-center gap-3">
                  <HomeIcon name="clipboard" tone="bg-indigo-100 text-indigo-600" />
                  <h2 className="text-[18px] font-bold text-slate-900">Oportunidades recientes</h2>
                </div>
                <HomeSeeAll href="/dashboard/proveedor/solicitudes" />
              </div>
              {/* En mobile, tarjetas; desde md, la tabla completa. */}
              <ul className="mt-3 divide-y divide-slate-200 pb-3 md:hidden [&>li]:px-5 [&>li:nth-child(even)]:bg-seller-surface">
                {recentOpportunities.length === 0 ? (
                  <li className="py-6 text-center text-[13px] text-slate-500">Todavía no hay oportunidades para {companyName}.</li>
                ) : (
                  recentOpportunities.map((request) => {
                    const item = request.items?.[0];
                    const quantity = item?.quantity ?? request.quantityRequested ?? null;
                    const location = request.deliveryCity ?? request.buyerCompany?.city ?? '—';
                    const isNew = dashboardData.openOpportunities.some((open) => open.id === request.id);
                    return (
                      <li key={request.id}>
                        <Link className="flex items-center gap-3 py-3" href={`/dashboard/proveedor/solicitudes/${request.id}`}>
                          <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                            <Image alt="" className="object-cover" fill sizes="48px" src={requestImage(request)} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span className="truncate text-[14px] font-semibold text-slate-900">{item?.productName ?? request.title}</span>
                              <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-medium ${isNew ? 'bg-indigo-100 text-indigo-600' : 'bg-sky-100 text-sky-600'}`}>
                                {isNew ? 'Nueva' : 'Cotizada'}
                              </span>
                            </span>
                            <span className="block truncate text-[12px] text-slate-500">
                              {request.buyerCompany?.name ?? 'Comprador'} · {quantity !== null ? `${quantity.toLocaleString('es-AR')} ${item?.unit ?? 'un.'}` : 'A definir'}
                            </span>
                            <span className="block truncate text-[11px] text-slate-400">
                              {location} · {formatDayTime(request.updatedAt)}
                            </span>
                          </span>
                          <span className="text-indigo-600">
                            <HomeArrow />
                          </span>
                        </Link>
                      </li>
                    );
                  })
                )}
              </ul>
              <div className="mt-4 hidden overflow-x-auto px-3 pb-3 md:block">
                <table className="w-full min-w-[860px] text-left text-[13px]">
                  <thead>
                    <tr className="bg-seller-50 text-[12px] font-semibold text-slate-700">
                      <th className="rounded-l-lg px-3 py-2.5 font-medium">Producto</th>
                      <th className="px-3 py-2.5 font-medium">Cliente</th>
                      <th className="px-3 py-2.5 font-medium">Cantidad</th>
                      <th className="px-3 py-2.5 font-medium">Ubicación</th>
                      <th className="px-3 py-2.5 font-medium">Fecha</th>
                      <th className="px-3 py-2.5 font-medium">Estado</th>
                      <th className="rounded-r-lg px-3 py-2.5 font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 [&>tr:nth-child(even)]:bg-seller-surface">
                    {recentOpportunities.length === 0 ? (
                      <tr>
                        <td className="px-3 py-8 text-center text-slate-500" colSpan={7}>
                          Todavía no hay oportunidades para {companyName}.
                        </td>
                      </tr>
                    ) : (
                      recentOpportunities.map((request) => {
                        const item = request.items?.[0];
                        const quantity = item?.quantity ?? request.quantityRequested ?? null;
                        const location = request.deliveryCity ?? request.buyerCompany?.city ?? '—';
                        return (
                          <tr key={request.id} className="text-slate-600">
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-3">
                                <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                                  <Image alt="" className="object-cover" fill sizes="40px" src={requestImage(request)} />
                                </span>
                                <span className="truncate font-semibold text-slate-900">{item?.productName ?? request.title}</span>
                              </div>
                            </td>
                            <td className="px-3 py-2.5">{request.buyerCompany?.name ?? 'Comprador'}</td>
                            <td className="px-3 py-2.5">
                              {quantity !== null ? `${quantity.toLocaleString('es-AR')} ${item?.unit ?? 'un.'}` : 'A definir'}
                            </td>
                            <td className="px-3 py-2.5">
                              <span className="inline-flex items-center gap-1.5">
                                <span className="text-indigo-500">
                                  <HomePin />
                                </span>
                                {location}
                              </span>
                            </td>
                            <td className="px-3 py-2.5">{formatDayTime(request.updatedAt)}</td>
                            <td className="px-3 py-2.5">
                              {(() => {
                                // Para el vendedor, una solicitud que todavía no cotizó es "Nueva".
                                const status = dashboardData.openOpportunities.some((open) => open.id === request.id)
                                  ? { label: 'Nueva', tone: 'bg-indigo-100 text-indigo-600' }
                                  : request.status === 'PUBLISHED'
                                    ? { label: 'Cotizada', tone: 'bg-sky-100 text-sky-600' }
                                    : { label: getRequestTag(request.status), tone: getRequestTagClass(request.status) };
                                return (
                                  <span className={`inline-flex rounded-md px-2 py-1 text-[12px] font-medium ${status.tone}`}>{status.label}</span>
                                );
                              })()}
                            </td>
                            <td className="px-3 py-2.5">
                              <Link
                                className="inline-flex h-8 items-center rounded-lg border border-indigo-200 px-4 text-[12px] font-semibold transition hover:bg-indigo-50"
                                href={`/dashboard/proveedor/solicitudes/${request.id}`}
                              >
                                <span className="text-indigo-600">Ver detalle</span>
                              </Link>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="mt-5 grid gap-5 xl:grid-cols-2">
              {/* Mis cotizaciones */}
              <section className={homeCard}>
                <div className="flex items-center justify-between gap-3 px-5 pt-5">
                  <div className="flex items-center gap-3">
                    <HomeIcon name="doc" tone="bg-indigo-100 text-indigo-600" />
                    <h2 className="text-[18px] font-bold text-slate-900">Mis cotizaciones</h2>
                  </div>
                  <HomeSeeAll href="/dashboard/proveedor/cotizaciones" />
                </div>
                <ul className="mt-3 divide-y divide-slate-200 pb-3 md:hidden [&>li]:px-5 [&>li:nth-child(even)]:bg-seller-surface">
                  {recentQuotes.length === 0 ? (
                    <li className="py-6 text-center text-[13px] text-slate-500">Todavía no enviaste cotizaciones.</li>
                  ) : (
                    recentQuotes.map((quote) => {
                      const status = quoteStatusMeta(quote.status);
                      return (
                        <li key={quote.id}>
                          <Link className="flex items-center justify-between gap-3 py-3" href={`/dashboard/proveedor/cotizaciones/${quote.id}`}>
                            <span className="min-w-0">
                              <span className="block truncate text-[14px] font-semibold text-slate-900">{quote.request?.buyerCompany?.name ?? 'Cliente'}</span>
                              <span className="block truncate text-[12px] text-slate-500">{quote.request?.title ?? '—'}</span>
                            </span>
                            <span className="shrink-0 text-right">
                              <span className="block text-[13px] font-semibold text-slate-900">
                                {typeof quote.amount === 'number'
                                  ? `${quote.currency === 'USD' ? 'US$' : '$'} ${quote.amount.toLocaleString('es-AR')}`
                                  : 'A convenir'}
                              </span>
                              <span className={`mt-1 inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium ${status.tone}`}>{status.label}</span>
                            </span>
                          </Link>
                        </li>
                      );
                    })
                  )}
                </ul>
                <div className="mt-4 hidden px-3 pb-3 md:block">
                  <table className="w-full text-left text-[13px]">
                    <thead>
                      <tr className="bg-seller-50 text-[12px] font-semibold text-slate-700">
                        <th className="rounded-l-lg px-3 py-2 font-medium">Cliente</th>
                        <th className="px-3 py-2 font-medium">Producto</th>
                        <th className="px-3 py-2 font-medium">Monto</th>
                        <th className="rounded-r-lg px-3 py-2 font-medium">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 [&>tr:nth-child(even)]:bg-seller-surface">
                      {recentQuotes.length === 0 ? (
                        <tr>
                          <td className="px-3 py-6 text-center text-slate-500" colSpan={4}>
                            Todavía no enviaste cotizaciones.
                          </td>
                        </tr>
                      ) : (
                        recentQuotes.map((quote) => {
                          const status = quoteStatusMeta(quote.status);
                          return (
                            <tr key={quote.id} className="text-slate-600">
                              <td className="px-3 py-2.5 font-semibold text-slate-900">
                                <Link className="hover:underline" href={`/dashboard/proveedor/cotizaciones/${quote.id}`}>
                                  {quote.request?.buyerCompany?.name ?? 'Cliente'}
                                </Link>
                              </td>
                              <td className="max-w-[180px] truncate px-3 py-2.5">{quote.request?.title ?? '—'}</td>
                              <td className="px-3 py-2.5">
                                {typeof quote.amount === 'number'
                                  ? `${quote.currency === 'USD' ? 'US$' : '$'} ${quote.amount.toLocaleString('es-AR')}`
                                  : 'A convenir'}
                              </td>
                              <td className="px-3 py-2.5">
                                <span className={`inline-flex rounded-md px-2 py-1 text-[12px] font-medium ${status.tone}`}>{status.label}</span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Clientes recientes */}
              <section className={homeCard}>
                <div className="flex items-center justify-between gap-3 px-5 pt-5">
                  <div className="flex items-center gap-3">
                    <HomeIcon name="user" tone="bg-indigo-100 text-indigo-600" />
                    <h2 className="text-[18px] font-bold text-slate-900">Clientes recientes</h2>
                  </div>
                  <HomeSeeAll href="/dashboard/proveedor/clientes" />
                </div>
                <ul className="mt-3 divide-y divide-slate-200 pb-3 md:hidden [&>li]:px-5 [&>li:nth-child(even)]:bg-seller-surface">
                  {recentClients.length === 0 ? (
                    <li className="py-6 text-center text-[13px] text-slate-500">Todavía no hay clientes con actividad.</li>
                  ) : (
                    recentClients.map((client) => (
                      <li key={client.name} className="flex items-center justify-between gap-3 py-3">
                        <span className="min-w-0">
                          <span className="block truncate text-[14px] font-semibold text-slate-900">{client.name}</span>
                          <span className="block truncate text-[12px] text-slate-500">
                            {client.activity} · {formatDayTime(client.at)}
                          </span>
                        </span>
                        <span className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium ${client.tone}`}>{client.status}</span>
                      </li>
                    ))
                  )}
                </ul>
                <div className="mt-4 hidden px-3 pb-3 md:block">
                  <table className="w-full text-left text-[13px]">
                    <thead>
                      <tr className="bg-seller-50 text-[12px] font-semibold text-slate-700">
                        <th className="rounded-l-lg px-3 py-2 font-medium">Cliente</th>
                        <th className="px-3 py-2 font-medium">Última actividad</th>
                        <th className="rounded-r-lg px-3 py-2 font-medium">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 [&>tr:nth-child(even)]:bg-seller-surface">
                      {recentClients.length === 0 ? (
                        <tr>
                          <td className="px-3 py-6 text-center text-slate-500" colSpan={3}>
                            Todavía no hay clientes con actividad.
                          </td>
                        </tr>
                      ) : (
                        recentClients.map((client) => (
                          <tr key={client.name} className="text-slate-600">
                            <td className="px-3 py-2.5 font-semibold text-slate-900">{client.name}</td>
                            <td className="px-3 py-2.5">
                              {client.activity} · {formatDayTime(client.at)}
                            </td>
                            <td className="px-3 py-2.5">
                              <span className={`inline-flex rounded-md px-2 py-1 text-[12px] font-medium ${client.tone}`}>{client.status}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
    </>
  );

  return (
    <main className="bg-seller-canvas text-slate-950 lg:h-screen lg:overflow-hidden">
      {/* ==================== VISTA MOBILE ==================== */}
      <div className="lg:hidden">
        {error ? (
          <div className="mx-4 mt-4 rounded-2xl border border-rose-200 bg-rose-100 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="px-4 pb-28 pt-5">
          {/* En mobile el selector de empresa va arriba: no entra en el header. */}
          {hasMultipleWorkspaces ? <CompanySwitcher className="mb-4" /> : null}
          {homeBody}
        </div>
      </div>

      {/* ==================== VISTA DESKTOP ==================== */}
      <div className="hidden h-full lg:flex">
        <div className="hidden h-full w-[264px] shrink-0 lg:block">
          <DashboardSidebar
            className="sticky top-0 h-screen"
            role="supplier"
            session={session}
            supplierCounters={counters}
          />
        </div>

        <section className="min-w-0 flex-1 overflow-hidden">
          <header className="sticky top-0 z-30 border-b border-slate-300 bg-white/90 backdrop-blur">
            <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <Link href="/dashboard/proveedor" className="flex shrink-0 items-center gap-2 lg:hidden">
                  <Image alt="ATAR" height={26} src="/logoatar.png" width={26} />
                  <span className="text-base font-bold text-slate-950">ATAR</span>
                </Link>

                <div className="hidden min-w-0 items-center gap-3 rounded-xl border border-transparent bg-seller-surface px-4 py-2.5 transition focus-within:border-indigo-300 focus-within:bg-white md:flex md:w-[360px] xl:w-[480px]">
                  <svg aria-hidden="true" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24">
                    <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    <path d="M11 19a8 8 0 100-16 8 8 0 000 16z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                  <input className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder="Buscar solicitudes, clientes, productos..." />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <CompanySwitcher className="hidden lg:block" />
                <WorkspaceSwitcher className="hidden sm:inline-flex" />
                <button className="hidden h-10 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-100 px-4 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 sm:inline-flex" type="button">
                  Invitar a un miembro
                </button>
                <Link
                  className="relative hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50 sm:inline-flex"
                  href="/dashboard/proveedor/mensajes"
                >
                  <HeaderActionIcon kind="chat" />
                  {counters.unreadMessagesCount > 0 ? (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[10px] font-semibold text-white">
                      {counters.unreadMessagesCount}
                    </span>
                  ) : null}
                </Link>
                <Link
                  className="relative hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50 sm:inline-flex"
                  href="/dashboard/proveedor/notificaciones"
                >
                  <HeaderActionIcon kind="bell" />
                  {counters.unreadNotificationsCount > 0 ? (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[10px] font-semibold text-white">
                      {counters.unreadNotificationsCount}
                    </span>
                  ) : null}
                </Link>
                <SupplierAccountMenu session={session} />
              </div>
            </div>

            <div className="px-4 pb-3 md:hidden">
              <div className="flex items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-2.5 shadow-sm">
                <svg aria-hidden="true" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24">
                  <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  <path d="M11 19a8 8 0 100-16 8 8 0 000 16z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
                <input className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder="Buscar solicitudes, clientes, productos..." />
              </div>
            </div>
          </header>

          <div className="h-[calc(100dvh-121px)] overflow-y-auto overflow-x-hidden px-4 pb-24 pt-5 md:h-[calc(100dvh-73px)] lg:px-8 lg:pb-8">
            {error ? (
              <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-100 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            {homeBody}
          </div>
        </section>
      </div>

      <SupplierBottomNav />
    </main>
  );
}
