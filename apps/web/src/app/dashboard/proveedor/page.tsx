'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';
import SupplierAccountMenu from '@/components/dashboard/supplier-account-menu';
import DashboardSidebar from '@/components/dashboard/dashboard-sidebar';
import SupplierBottomNav from '@/components/dashboard/supplier-bottom-nav';
import WorkspaceSwitcher from '@/components/dashboard/workspace-switcher';
import { type OrderFulfillmentStatus, type RequestRecord } from '@/lib/atar-api';
import { useSupplierDashboardData, useSupplierWorkspaceCounters } from '@/lib/dashboard-hooks';
import { getPrimaryCompanyName } from '@/lib/session';

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
    return 'bg-indigo-50 text-indigo-600';
  }

  if (status === 'NEGOTIATING') {
    return 'bg-emerald-50 text-emerald-600';
  }

  if (status === 'ORDER_ISSUED') {
    return 'bg-sky-50 text-sky-600';
  }

  if (status === 'AWARDED') {
    return 'bg-violet-50 text-violet-600';
  }

  return 'bg-slate-100 text-slate-600';
}

function ProviderStatIcon({ kind }: { kind: 'requests' | 'quotes' | 'money' | 'sales' }) {
  if (kind === 'requests') {
    return (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path d="M14 2H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V8l-5-6z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="M14 2v6h6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }

  if (kind === 'quotes') {
    return (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path d="M14 2H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V8l-5-6z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="M14 2v6h6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="M9 13h6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="M9 17h4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }

  if (kind === 'money') {
    return (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="M15 9.5c0-1.4-1.34-2.5-3-2.5s-3 1.1-3 2.5 1.34 2.5 3 2.5 3 1.1 3 2.5S13.66 17 12 17s-3-1.1-3-2.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M18 20V10" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="M12 20V4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="M6 20v-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="M3 20h18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
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

function MiniLineChart() {
  return (
    <svg aria-hidden="true" className="h-24 w-full" fill="none" viewBox="0 0 220 96">
      <path d="M8 76H212" stroke="#E2E8F0" strokeLinecap="round" strokeWidth="1.5" />
      <path d="M8 56H212" stroke="#EEF2FF" strokeLinecap="round" strokeWidth="1" />
      <path d="M8 36H212" stroke="#EEF2FF" strokeLinecap="round" strokeWidth="1" />
      <path d="M8 66C20 64 29 60 40 58C51 56 61 72 74 68C88 64 102 44 116 40C128 36 140 24 154 30C168 36 182 52 212 40" stroke="#5B4BFF" strokeLinecap="round" strokeWidth="3" />
      <circle cx="40" cy="58" r="4" fill="white" stroke="#5B4BFF" strokeWidth="2" />
      <circle cx="74" cy="68" r="4" fill="white" stroke="#5B4BFF" strokeWidth="2" />
      <circle cx="116" cy="40" r="4" fill="white" stroke="#5B4BFF" strokeWidth="2" />
      <circle cx="154" cy="30" r="4" fill="white" stroke="#5B4BFF" strokeWidth="2" />
      <circle cx="212" cy="40" r="4" fill="white" stroke="#5B4BFF" strokeWidth="2" />
    </svg>
  );
}

function getProductionLabel(status: OrderFulfillmentStatus) {
  if (status === 'CONFIRMED') {
    return 'Pendientes';
  }

  if (status === 'IN_PRODUCTION') {
    return 'Produccion';
  }

  if (status === 'DISPATCHED') {
    return 'En transito';
  }

  if (status === 'DELIVERED') {
    return 'Entregados';
  }

  return 'Pendientes';
}

export default function DashboardProveedorPage() {
  const { session, openRequests, myQuotes, loading, error } = useSupplierDashboardData();
  const counters = useSupplierWorkspaceCounters({
    accessToken: session?.accessToken,
    openRequests,
    myQuotes,
  });

  const companyName = session ? getPrimaryCompanyName(session.user) : 'Tu empresa';

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
      totalSales,
      nextPromisedDate,
    };
  }, [myQuotes, openRequests]);

  const acceptanceRate =
    myQuotes.length === 0 ? 0 : Math.round((dashboardData.awardedQuotes.length / myQuotes.length) * 100);
  const donutAccepted = myQuotes.length === 0 ? 0 : Math.round((dashboardData.awardedQuotes.length / myQuotes.length) * 360);
  const donutPending = myQuotes.length === 0 ? 0 : Math.round((dashboardData.submittedQuotes.length / myQuotes.length) * 360);
  const todayLabel = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  const pendingTasks = [
    ...(dashboardData.openOpportunities.length > 0
      ? [{ label: `Responder ${dashboardData.openOpportunities.length} solicitudes abiertas`, due: 'Pendiente' }]
      : []),
    ...(dashboardData.submittedQuotes.length > 0
      ? [{ label: `Dar seguimiento a ${dashboardData.submittedQuotes.length} cotizaciones enviadas`, due: 'Pendiente' }]
      : []),
    ...(dashboardData.activeOrders.length > 0
      ? [{ label: `Actualizar ${dashboardData.activeOrders.length} pedidos en curso`, due: 'Operativo' }]
      : []),
  ];

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f7fb] text-slate-950">
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
          Cargando dashboard proveedor...
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen overflow-hidden bg-[#f5f7fb] text-slate-950">
      <div className="flex h-full">
        <div className="hidden h-full w-[264px] shrink-0 lg:block">
          <DashboardSidebar
            className="sticky top-0 h-screen"
            role="supplier"
            session={session}
            supplierCounters={counters}
          />
        </div>

        <section className="min-w-0 flex-1 overflow-hidden">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <Link href="/dashboard/proveedor" className="flex shrink-0 items-center gap-2 lg:hidden">
                  <Image alt="ATAR" height={26} src="/logoatar.png" width={26} />
                  <span className="text-base font-bold text-slate-950">ATAR</span>
                </Link>

                <div className="hidden min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm md:flex md:max-w-[460px] xl:max-w-[520px]">
                  <svg aria-hidden="true" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24">
                    <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    <path d="M11 19a8 8 0 100-16 8 8 0 000 16z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                  <input className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder="Buscar solicitudes, clientes, productos..." />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <WorkspaceSwitcher className="hidden sm:inline-flex" />
                <button className="hidden h-10 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 px-4 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 sm:inline-flex" type="button">
                  Invitar a un miembro
                </button>
                <Link
                  className="relative hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 sm:inline-flex"
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
                  className="relative hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 sm:inline-flex"
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
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
                <svg aria-hidden="true" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24">
                  <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  <path d="M11 19a8 8 0 100-16 8 8 0 000 16z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
                <input className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder="Buscar solicitudes, clientes, productos..." />
              </div>
            </div>
          </header>

          <div className="h-[calc(100dvh-121px)] overflow-y-auto overflow-x-hidden px-4 pb-24 pt-4 md:h-[calc(100dvh-73px)] lg:px-6 lg:pb-6">
            {error ? (
              <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="text-[1.85rem] font-semibold tracking-tight text-slate-950">
                  Hola, {companyName.split(' ')[0]}! 👋
                </h1>
                <p className="mt-1 text-sm text-slate-500">Este es el resumen de tu actividad de hoy.</p>
              </div>
              <button className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50" type="button">
                <svg aria-hidden="true" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24">
                  <path d="M8 2v4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  <path d="M16 2v4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  <path d="M3 10h18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  <rect height="18" rx="2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" width="18" x="3" y="4" />
                </svg>
                {todayLabel}
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_278px]">
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    { label: 'Solicitudes nuevas', value: openRequests.length, detail: `${dashboardData.privateRequests.length} privadas para tu empresa`, icon: 'requests' as const, tone: 'bg-indigo-50 text-indigo-600' },
                    { label: 'Cotizaciones aceptadas', value: dashboardData.awardedQuotes.length, detail: `${dashboardData.submittedQuotes.length} pendientes de respuesta`, icon: 'quotes' as const, tone: 'bg-emerald-50 text-emerald-600' },
                    { label: 'Oportunidades', value: dashboardData.openOpportunities.length, detail: `${Math.max(0, openRequests.length - dashboardData.openOpportunities.length)} ya respondidas`, icon: 'money' as const, tone: 'bg-amber-50 text-amber-600' },
                    { label: 'Ventas concretadas', value: formatCurrency(dashboardData.totalSales), detail: `${dashboardData.activeOrders.length} pedidos activos`, icon: 'sales' as const, tone: 'bg-sky-50 text-sky-600' },
                  ].map((card) => (
                    <article key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${card.tone}`}>
                        <ProviderStatIcon kind={card.icon} />
                      </span>
                      <p className="mt-4 text-[1.55rem] font-semibold tracking-tight text-slate-950">{card.value}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-950">{card.label}</p>
                      <p className="mt-2 text-[11px] text-slate-500">{card.detail}</p>
                    </article>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.05fr_0.95fr_0.95fr]">
                  <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-950">Solicitudes recientes</p>
                      <Link className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-500" href="/dashboard/proveedor/solicitudes">
                        Ver todas
                      </Link>
                    </div>
                    <div className="mt-3 space-y-3">
                      {dashboardData.recentRequests.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                          No hay solicitudes para mostrar.
                        </div>
                      ) : (
                        dashboardData.recentRequests.map((request) => (
                          <article key={request.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 px-3 py-3">
                            <div className="flex min-w-0 items-start gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                                <ProviderStatIcon kind="requests" />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-950">{request.title}</p>
                                <p className="mt-0.5 text-[11px] text-slate-500">
                                  {request.buyerCompany?.name ?? 'Cliente'}
                                </p>
                                <p className="mt-0.5 text-[11px] text-slate-400">
                                  {request.buyerCompany?.city ?? request.buyerCompany?.country ?? 'Sin ubicacion'}
                                </p>
                              </div>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-[11px] text-slate-400">{formatRelativeTime(request.updatedAt)}</p>
                              <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${getRequestTagClass(request.status)}`}>
                                {getRequestTag(request.status)}
                              </span>
                            </div>
                          </article>
                        ))
                      )}
                    </div>
                    <Link className="mt-3 inline-flex items-center gap-2 text-[11px] font-semibold text-indigo-600 hover:text-indigo-500" href="/dashboard/proveedor/solicitudes">
                      Ver todas las solicitudes
                      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <path d="M9 18l6-6-6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                    </Link>
                  </section>

                  <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-950">Pedidos activos</p>
                      <Link className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-500" href="/dashboard/proveedor/pedidos">
                        Ver todos
                      </Link>
                    </div>
                    <p className="mt-4 text-[2rem] font-semibold tracking-tight text-slate-950">
                      {dashboardData.activeOrders.length}
                    </p>
                    <p className="text-xs text-slate-500">Pedidos en proceso</p>
                    <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                      {Object.entries(dashboardData.stageCounts).map(([key, value]) => (
                        <div key={key} className="rounded-xl bg-slate-50 px-2 py-2">
                          <p className="text-base font-semibold text-slate-950">{value}</p>
                          <p className="mt-1 text-[10px] text-slate-500">
                            {getProductionLabel(
                              key === 'production'
                                ? 'IN_PRODUCTION'
                                : key === 'transit'
                                  ? 'DISPATCHED'
                                  : key === 'delivered'
                                    ? 'DELIVERED'
                                    : 'CONFIRMED',
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center justify-between rounded-2xl bg-indigo-50 px-3 py-3 text-[11px] text-indigo-700">
                      <span>{dashboardData.stageCounts.production} pedidos en produccion</span>
                      <Link className="font-semibold" href="/dashboard/proveedor/pedidos">
                        Revisar
                      </Link>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-950">Calendario operativo</p>
                      <Link className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-500" href="/dashboard/proveedor/pedidos">
                        Ver pedidos
                      </Link>
                    </div>
                    <div className="mt-6 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-xs text-slate-500">Proxima fecha comprometida</p>
                        <p className="mt-1 text-[2rem] font-semibold tracking-tight text-indigo-600">
                          {dashboardData.nextPromisedDate ? formatShortDate(dashboardData.nextPromisedDate) : '--'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-slate-400">Pedidos con fecha comprometida</p>
                        <p className="mt-1 text-lg font-semibold text-slate-950">
                          {dashboardData.activeOrders.filter((quote) => quote.request?.order?.promisedDate).length}
                        </p>
                      </div>
                    </div>
                    <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50 px-3 py-3">
                      <p className="text-[11px] text-slate-500">Pedidos en produccion</p>
                      <p className="mt-1 text-sm font-semibold text-slate-950">{dashboardData.stageCounts.production}</p>
                    </div>
                  </section>
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                  <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-950">Rendimiento de cotizaciones</p>
                      <button className="inline-flex h-8 items-center rounded-lg border border-slate-200 px-3 text-[11px] font-semibold text-slate-600" type="button">
                        Datos acumulados
                      </button>
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[210px_1fr] lg:items-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div
                          className="relative h-36 w-36 rounded-full"
                          style={{
                            background: `conic-gradient(#6EE7B7 0deg ${donutAccepted}deg, #FCD34D ${donutAccepted}deg ${donutAccepted + donutPending}deg, #FCA5A5 ${donutAccepted + donutPending}deg 360deg)`,
                          }}
                        >
                          <div className="absolute inset-[18px] flex flex-col items-center justify-center rounded-full bg-white">
                            <p className="text-[11px] text-slate-400">Total</p>
                            <p className="text-2xl font-semibold text-slate-950">{myQuotes.length}</p>
                            <p className="text-[11px] text-slate-500">cotizaciones</p>
                          </div>
                        </div>
                        <div className="w-full space-y-2 text-[11px] text-slate-500">
                          {[
                            { label: 'Aceptadas', value: dashboardData.awardedQuotes.length, tone: 'bg-emerald-400' },
                            { label: 'Pendientes', value: dashboardData.submittedQuotes.length, tone: 'bg-amber-400' },
                            { label: 'Rechazadas', value: dashboardData.rejectedQuotes.length, tone: 'bg-rose-400' },
                          ].map((item) => (
                            <div key={item.label} className="flex items-center justify-between gap-3">
                              <span className="flex items-center gap-2">
                                <span className={`h-2.5 w-2.5 rounded-full ${item.tone}`} />
                                {item.label}
                              </span>
                              <span className="font-semibold text-slate-700">{item.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-400">Tasa de aceptacion</p>
                        <div className="mt-1 flex items-baseline gap-2">
                          <p className="text-3xl font-semibold tracking-tight text-slate-950">{acceptanceRate}%</p>
                          <span className="text-xs text-slate-500">
                            {dashboardData.awardedQuotes.length} cotizaciones adjudicadas
                          </span>
                        </div>
                        <div className="mt-4">
                          <MiniLineChart />
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-950">Clientes destacados</p>
                      <Link className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-500" href="/dashboard/proveedor/reportes">
                        Ver todos
                      </Link>
                    </div>
                    <div className="mt-4 space-y-3">
                      {dashboardData.topClients.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-sm text-slate-500">
                          Aun no hay clientes destacados para mostrar.
                        </div>
                      ) : (
                        dashboardData.topClients.map((client) => (
                          <article key={client.name} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 px-3 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-xs font-semibold text-slate-700">
                                {client.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-950">{client.name}</p>
                                <p className="mt-0.5 text-[11px] text-slate-500">{client.orders} cotizaciones</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-semibold text-slate-950">{formatCurrency(client.amount)}</p>
                              <p className="mt-1 text-[11px] text-slate-500">{client.orders} cotizaciones</p>
                            </div>
                          </article>
                        ))
                      )}
                    </div>
                  </section>
                </div>

                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                        <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                        </svg>
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-950">Tip ATAR!</p>
                        <p className="text-xs text-slate-500">
                          Completa tu perfil de empresa al 100% y destaca tus certificaciones para ganar mas confianza.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button className="hidden h-9 items-center rounded-xl border border-indigo-200 bg-indigo-50 px-4 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 sm:inline-flex" type="button">
                        Completar perfil
                      </button>
                      <span className="rounded-full bg-indigo-100 px-3 py-1 text-[11px] font-semibold text-indigo-700">
                        Basado en tu actividad real
                      </span>
                    </div>
                  </div>
                </section>
              </div>

              <aside className="space-y-4">
                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-950">Actividad reciente</p>
                    <Link className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-500" href="/dashboard/proveedor/reportes">
                      Ver todo
                    </Link>
                  </div>
                  <div className="mt-4 space-y-3">
                    {dashboardData.recentActivity.map((item) => (
                      <article key={item.id} className="flex items-start gap-3">
                        <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl ${item.tone}`}>
                          {item.glyph === 'check' ? '✓' : item.glyph === 'quote' ? '✦' : '★'}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold leading-5 text-slate-950">{item.title}</p>
                          <p className="mt-0.5 text-[11px] text-slate-500">{item.detail}</p>
                        </div>
                        <span className="shrink-0 text-[11px] text-slate-400">{item.time}</span>
                      </article>
                    ))}
                  </div>
                  <Link className="mt-4 inline-flex items-center gap-2 text-[11px] font-semibold text-indigo-600 hover:text-indigo-500" href="/dashboard/proveedor/reportes">
                    Ver toda la actividad
                    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </svg>
                  </Link>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold text-slate-950">Tareas pendientes</p>
                  <div className="mt-4 space-y-3">
                    {pendingTasks.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                        No hay tareas pendientes generadas por tus pedidos y cotizaciones actuales.
                      </div>
                    ) : (
                      pendingTasks.map((task) => (
                        <div key={task.label} className="flex items-start gap-3 rounded-2xl border border-slate-200 px-3 py-3">
                          <span className="mt-0.5 h-4 w-4 rounded border border-slate-300 bg-white" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-slate-700">{task.label}</p>
                          </div>
                          <span className="shrink-0 text-[11px] text-slate-400">
                            {task.due}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                  <Link className="mt-4 inline-flex items-center gap-2 text-[11px] font-semibold text-indigo-600 hover:text-indigo-500" href="/dashboard/proveedor/solicitudes">
                    Ver todas las tareas
                    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </svg>
                  </Link>
                </section>
              </aside>
            </div>
          </div>
        </section>
      </div>

      <SupplierBottomNav />
    </main>
  );
}
