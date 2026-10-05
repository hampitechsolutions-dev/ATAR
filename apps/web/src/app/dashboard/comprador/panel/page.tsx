'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { OrderFulfillmentStatus, RequestRecord } from '@/lib/atar-api';
import { PageLoader } from '@/components/ui/spinner';
import { useBuyerDashboardData } from '@/lib/dashboard-hooks';
import { loadBuyerFavorites } from '@/lib/dashboard-local';
import { FALLBACK_REQUEST_CATEGORIES } from '@/lib/request-catalog-fallback';
import { getUserFirstName } from '@/lib/session';
import ToneRow, { type Tone } from '@/components/dashboard/tone-row';

type IconName = 'file' | 'box' | 'building' | 'hourglass' | 'bell' | 'arrow' | 'check';

const ICON_PATHS: Record<IconName, React.ReactNode> = {
  file: <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5zM14 3v5h5M9 13h6M9 17h4" />,
  box: <path d="M21 16V8l-9-5-9 5v8l9 5 9-5zM3.3 7.3L12 12l8.7-4.7M12 22V12" />,
  building: <path d="M4 21V4h11v17M15 9h5v12M2 21h20M8 8h3M8 12h3M8 16h3M18 13h0M18 17h0" />,
  hourglass: <path d="M6 3h12M6 21h12M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9" />,
  bell: <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
};

function Icon({ name, size = 'h-4 w-4' }: { name: IconName; size?: string }) {
  return (
    <svg aria-hidden="true" className={size} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      {ICON_PATHS[name]}
    </svg>
  );
}

const panelCard = 'overflow-hidden rounded-[12px] border border-slate-300 bg-white shadow-[0_2px_6px_rgba(15,23,42,0.06)]';

function PanelSeeAll({ href, label = 'Ver todas' }: { href: string; label?: string }) {
  return (
    <Link className="inline-flex shrink-0 items-center gap-1.5 text-[14px] font-semibold text-[#1847ff] hover:underline" href={href}>
      {label}
      <Icon name="arrow" />
    </Link>
  );
}

/** Encabezado de cada bloque del panel: banda con título, separada del contenido. */
function PanelHeader({ title, badge, children }: { title: string; badge?: number; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-300 bg-[#f1f4fa] px-4 py-3 lg:px-5">
      <div className="flex items-center gap-2.5">
        <h2 className="text-[16px] font-bold text-slate-950 lg:text-[17px]">{title}</h2>
        {badge ? (
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-rose-600 px-1.5 text-[12px] font-semibold text-white">
            {badge}
          </span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

const ORDER_STEPS: { status: OrderFulfillmentStatus; label: string }[] = [
  { status: 'ISSUED', label: 'Orden emitida' },
  { status: 'CONFIRMED', label: 'Confirmada' },
  { status: 'IN_PRODUCTION', label: 'En producción' },
  { status: 'DISPATCHED', label: 'Despachado' },
  { status: 'DELIVERED', label: 'Entregado' },
];

type TaskTone = 'red' | 'amber' | 'blue';

function startOfDay(value: number) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/** "Hoy", "Ayer" o "Hace N días". */
function formatRelativeDay(value: string) {
  const diff = Math.round((startOfDay(Date.now()) - startOfDay(new Date(value).getTime())) / 86400000);
  if (diff <= 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  return `Hace ${diff} días`;
}

/** "Hoy, 10:24", "Ayer, 16:03" o "19/09/2026". */
function formatDayTime(value: string) {
  const date = new Date(value);
  const time = new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date);
  const day = formatRelativeDay(value);
  if (day === 'Hoy' || day === 'Ayer') return `${day}, ${time}`;
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

function requestImage(request: RequestRecord) {
  const labels = [request.items?.[0]?.category, request.category].filter(Boolean);
  for (const label of labels) {
    const match = FALLBACK_REQUEST_CATEGORIES.find((category) => category.label === label);
    if (match?.imageSrc) return match.imageSrc;
  }
  return '/logoatar.png';
}

/** Estado de la solicitud tal como le importa al comprador. */
function buyerRequestStatus(request: RequestRecord) {
  const quotes = request._count?.quotes ?? 0;
  if (['AWARDED', 'ORDER_ISSUED', 'COMPLETED'].includes(request.status) || request.awardedQuoteId) {
    return { label: 'Cerrada', tone: 'bg-slate-100 text-slate-600' };
  }
  if (request.status === 'CANCELLED') return { label: 'Cancelada', tone: 'bg-rose-100 text-rose-600' };
  if (request.status === 'DRAFT') return { label: 'Borrador', tone: 'bg-slate-100 text-slate-600' };
  if (request.status === 'NEGOTIATING') return { label: 'Cotizando', tone: 'bg-[#eef3ff] text-[#1f5bff]' };
  if (quotes > 0) return { label: 'Recibidas', tone: 'bg-emerald-100 text-emerald-600' };
  return { label: 'Sin cotizaciones', tone: 'bg-amber-100 text-amber-600' };
}

export default function DashboardCompradorPanelPage() {
  const { session, requests, loading, error } = useBuyerDashboardData();
  // Los favoritos viven en el navegador (ver dashboard-local).
  const [favoritesCount] = useState(() => loadBuyerFavorites().length);

  const kpis = useMemo(() => {
    const activeStatuses = ['DRAFT', 'PUBLISHED', 'REVIEWING', 'NEGOTIATING'];
    const orderStatuses = ['AWARDED', 'ORDER_ISSUED'];

    return [
      {
        label: 'Solicitudes activas',
        value: requests.filter((request) => activeStatuses.includes(request.status)).length,
      },
      {
        label: 'Cotizaciones recibidas',
        value: requests.reduce((sum, request) => sum + (request._count?.quotes ?? 0), 0),
      },
      {
        label: 'Pedidos en curso',
        value: requests.filter((request) => orderStatuses.includes(request.status) || Boolean(request.order)).length,
      },
    ];
  }, [requests]);

  const recentRequests = useMemo(() => {
    return [...requests]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 4);
  }, [requests]);

  // "Requieren tu atención": responde "¿qué tengo que hacer ahora?" surgiendo las
  // acciones pendientes reales (comparar/adjudicar, confirmar recepción,
  // vencimientos, solicitudes sin respuesta). Solo aparece lo que aplica.
  const attention = useMemo(() => {
    const items: { key: string; label: string; hint: string; at: string; href: string; tone: TaskTone }[] = [];
    const latest = (list: RequestRecord[]) =>
      list.map((r) => r.updatedAt).sort((x, y) => new Date(y).getTime() - new Date(x).getTime())[0];
    const now = Date.now();
    const open = (r: RequestRecord) => r.status === 'PUBLISHED' || r.status === 'REVIEWING';

    const toReview = requests.filter((r) => (r._count?.quotes ?? 0) > 0 && open(r) && !r.awardedQuoteId);
    if (toReview.length) {
      items.push({
        key: 'review',
        label:
          toReview.length === 1
            ? '1 solicitud con nuevas cotizaciones'
            : `${toReview.length} solicitudes con nuevas cotizaciones`,
        hint: 'Revisá y compará propuestas.',
        at: latest(toReview),
        href: '/dashboard/comprador/solicitudes',
        tone: 'red',
      });
    }

    const toConfirm = requests.filter((r) => r.order?.fulfillmentStatus === 'DELIVERED' && r.status !== 'COMPLETED');
    if (toConfirm.length) {
      items.push({
        key: 'confirm',
        label:
          toConfirm.length === 1
            ? '1 pedido espera confirmación de recepción'
            : `${toConfirm.length} pedidos esperan confirmación de recepción`,
        hint: 'Confirmá cuando recibas la mercadería.',
        at: latest(toConfirm),
        href: '/dashboard/comprador/pedidos',
        tone: 'amber',
      });
    }

    const dueSoon = requests.filter((r) => {
      if (!r.dueDate || !open(r) || r.awardedQuoteId) return false;
      const t = new Date(r.dueDate).getTime();
      return t >= now && t - now < 7 * 86_400_000;
    });
    if (dueSoon.length) {
      items.push({
        key: 'due',
        label:
          dueSoon.length === 1
            ? '1 solicitud vence en los próximos 7 días'
            : `${dueSoon.length} solicitudes vencen en los próximos 7 días`,
        hint: 'Revisá las propuestas antes del cierre.',
        at: latest(dueSoon),
        href: '/dashboard/comprador/solicitudes',
        tone: 'amber',
      });
    }

    const noQuotes = requests.filter((r) => (r._count?.quotes ?? 0) === 0 && open(r));
    if (noQuotes.length) {
      items.push({
        key: 'noquotes',
        label:
          noQuotes.length === 1
            ? '1 solicitud sin cotizaciones'
            : `${noQuotes.length} solicitudes sin cotizaciones`,
        hint: 'Considerá revisar las especificaciones o contactar proveedores.',
        at: latest(noQuotes),
        href: '/dashboard/comprador/solicitudes',
        tone: 'blue',
      });
    }

    return items;
  }, [requests]);

  // Embudo real de las solicitudes: en qué etapa está cada una.
  const stages = useMemo(() => {
    const quotes = (r: RequestRecord) => r._count?.quotes ?? 0;
    const open = (r: RequestRecord) => r.status === 'PUBLISHED' || r.status === 'REVIEWING';
    const count = (test: (r: RequestRecord) => boolean) => requests.filter(test).length;
    return [
      { label: 'Borradores', hint: 'Sin enviar a proveedores', value: count((r) => r.status === 'DRAFT'), bar: 'bg-slate-500' },
      { label: 'Esperando cotizaciones', hint: 'Enviadas, todavía sin respuesta', value: count((r) => open(r) && quotes(r) === 0), bar: 'bg-amber-500' },
      { label: 'Con cotizaciones', hint: 'Listas para comparar y decidir', value: count((r) => (open(r) && quotes(r) > 0) || r.status === 'NEGOTIATING'), bar: 'bg-[#1847ff]' },
      { label: 'Adjudicadas', hint: 'Con proveedor elegido o pedido en curso', value: count((r) => r.status === 'AWARDED' || r.status === 'ORDER_ISSUED'), bar: 'bg-violet-600' },
      { label: 'Completadas', hint: 'Recepción confirmada', value: count((r) => r.status === 'COMPLETED'), bar: 'bg-emerald-600' },
    ];
  }, [requests]);

  const activeOrders = useMemo(
    () =>
      requests
        .filter((r) => r.status === 'AWARDED' || r.status === 'ORDER_ISSUED' || (r.order && r.status !== 'COMPLETED' && r.status !== 'CANCELLED'))
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 3),
    [requests],
  );

  if (loading) {
    return (
      <PageLoader label="Preparando tu panel…" />
    );
  }

  const firstName = session ? getUserFirstName(session.user) : '';
  const todayText = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
  const today = todayText.charAt(0).toUpperCase() + todayText.slice(1);
  const maxStage = Math.max(1, ...stages.map((stage) => stage.value));

  const statCards = [
    { label: 'Solicitudes activas', value: kpis[0].value, href: '/dashboard/comprador/solicitudes', icon: 'file' as const, tone: 'bg-[#dbe6ff] text-[#1238d6]', line: 'border-t-[#1847ff]' },
    { label: 'Cotizaciones recibidas', value: kpis[1].value, href: '/dashboard/comprador/cotizaciones', icon: 'hourglass' as const, tone: 'bg-[#ffe6bd] text-amber-700', line: 'border-t-amber-500' },
    { label: 'Pedidos en curso', value: kpis[2].value, href: '/dashboard/comprador/pedidos', icon: 'box' as const, tone: 'bg-[#e9dcff] text-violet-700', line: 'border-t-violet-600' },
    { label: 'Proveedores guardados', value: favoritesCount, href: '/dashboard/comprador/favoritos', icon: 'building' as const, tone: 'bg-[#cdefdf] text-emerald-700', line: 'border-t-emerald-600' },
  ];

  return (
    <main className="w-full space-y-4 px-4 py-4 pb-24 lg:space-y-5 lg:py-5 lg:pb-8 xl:px-6">
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-100 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      {/* ==================== TÍTULO ==================== */}
      {/* El panel es la vista de gestión: sin buscador ni categorías, que viven en el Inicio. */}
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight text-slate-950 lg:text-[30px]">Panel de compras</h1>
          <p className="mt-0.5 text-[14px] text-slate-600 lg:text-[15px]">
            {firstName ? `Hola, ${firstName}. ` : ''}Así están hoy tus solicitudes, cotizaciones y pedidos.
          </p>
        </div>
        <p className="text-[13px] font-medium text-slate-600">{today}</p>
      </div>

      {/* ==================== INDICADORES ==================== */}
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4" data-tour="panel-kpis">
        {statCards.map((card) => (
          <Link
            key={card.label}
            className={`group flex items-center gap-3 rounded-[12px] border border-t-4 border-slate-300 bg-white px-3.5 py-3.5 shadow-[0_2px_6px_rgba(15,23,42,0.06)] transition hover:shadow-[0_8px_20px_rgba(15,23,42,0.12)] sm:gap-4 sm:px-5 sm:py-4 ${card.line}`}
            href={card.href}
          >
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] sm:h-12 sm:w-12 ${card.tone}`}>
              <Icon name={card.icon} size="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[26px] font-bold leading-none tracking-tight text-slate-950 sm:text-[30px]">{card.value}</span>
              <span className="mt-1.5 block text-[13px] leading-4 text-slate-700 sm:text-[14px]">{card.label}</span>
            </span>
            <span className="hidden text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-[#1847ff] sm:block">
              <Icon name="arrow" />
            </span>
          </Link>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-4 lg:gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        {/* ==================== REQUIEREN TU ATENCIÓN ==================== */}
        <section className={panelCard} data-tour="panel-attention">
          <PanelHeader badge={attention.length} title="Requieren tu atención" />
          <div className="space-y-2.5 p-4 lg:p-5">
            {attention.length === 0 ? (
              <p className="flex items-center justify-center gap-2 rounded-[12px] border border-emerald-300 bg-[#ecfaf3] px-4 py-8 text-center text-sm font-semibold text-emerald-800">
                <Icon name="check" size="h-5 w-5" />
                No tenés tareas pendientes. Todo al día.
              </p>
            ) : (
              attention.map((item) => {
                const tone: Tone = item.tone === 'red' ? 'rose' : item.tone === 'amber' ? 'amber' : 'blue';
                return (
                  <ToneRow
                    key={item.key}
                    detail={item.hint}
                    highlight={item.tone !== 'blue'}
                    href={item.href}
                    icon={<Icon name={item.tone === 'blue' ? 'file' : 'bell'} size="h-5 w-5" />}
                    meta={formatRelativeDay(item.at)}
                    title={item.label}
                    tone={tone}
                  />
                );
              })
            )}
          </div>
        </section>

        {/* ==================== SOLICITUDES POR ETAPA ==================== */}
        <section className={panelCard} data-tour="panel-stages">
          <PanelHeader title="Tus solicitudes por etapa">
            <PanelSeeAll href="/dashboard/comprador/solicitudes" />
          </PanelHeader>
          <ul className="divide-y divide-slate-200">
            {stages.map((stage) => (
              <li key={stage.label} className="flex items-center gap-3 px-4 py-2.5 even:bg-[#f4f6fb] lg:px-5">
                <span className="w-8 shrink-0 text-right text-[22px] font-bold leading-none text-slate-950">{stage.value}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="text-[14px] font-semibold text-slate-900">{stage.label}</span>
                    <span className="hidden truncate text-[12px] text-slate-600 sm:block">{stage.hint}</span>
                  </span>
                  <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-slate-200">
                    <span
                      className={`block h-full rounded-full ${stage.bar}`}
                      style={{ width: stage.value === 0 ? '0%' : `${Math.max(6, (stage.value / maxStage) * 100)}%` }}
                    />
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
        {/* ==================== SOLICITUDES RECIENTES ==================== */}
        <section className={panelCard}>
          <PanelHeader title="Últimos movimientos">
            <PanelSeeAll href="/dashboard/comprador/solicitudes" />
          </PanelHeader>
          {/* Mobile: lista. Desde md, la tabla completa. */}
          <ul className="divide-y divide-slate-200 md:hidden [&>li]:px-4 [&>li:nth-child(even)]:bg-[#eef1f7]">
            {recentRequests.length === 0 ? (
              <li className="py-6 text-center text-[13px] text-slate-600">Todavía no creaste solicitudes.</li>
            ) : (
              recentRequests.map((request) => {
                const item = request.items?.[0];
                const quantity = item?.quantity ?? request.quantityRequested ?? null;
                const status = buyerRequestStatus(request);
                const quotes = request._count?.quotes ?? 0;
                return (
                  <li key={request.id}>
                    <Link className="flex items-center gap-3 py-3" href={`/dashboard/comprador/solicitudes/${request.id}`}>
                      <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                        <Image alt="" className="object-cover" fill sizes="44px" src={requestImage(request)} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-semibold text-slate-900">{item?.productName ?? request.title}</span>
                        <span className="block truncate text-[12px] text-slate-600">
                          {quantity !== null ? `${quantity.toLocaleString('es-AR')} ${item?.unit ?? 'un.'}` : 'A definir'} · {quotes} cotizaci{quotes === 1 ? 'ón' : 'ones'}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium ${status.tone}`}>{status.label}</span>
                        <span className="mt-0.5 block text-[11px] text-slate-500">{formatDayTime(request.updatedAt)}</span>
                      </span>
                    </Link>
                  </li>
                );
              })
            )}
          </ul>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[600px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-slate-300 text-[12px] uppercase tracking-[0.06em] text-slate-600">
                  <th className="px-5 py-2.5 font-semibold">Producto</th>
                  <th className="px-3 py-2.5 font-semibold">Cantidad</th>
                  <th className="px-3 py-2.5 font-semibold">Actualizada</th>
                  <th className="px-3 py-2.5 font-semibold">Estado</th>
                  <th className="px-2 py-2.5 text-center font-semibold">Cotizaciones</th>
                  <th className="px-5 py-2.5 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {recentRequests.length === 0 ? (
                  <tr>
                    <td className="px-3 py-8 text-center text-slate-600" colSpan={6}>
                      Todavía no creaste solicitudes.
                    </td>
                  </tr>
                ) : (
                  recentRequests.map((request) => {
                    const item = request.items?.[0];
                    const quantity = item?.quantity ?? request.quantityRequested ?? null;
                    const status = buyerRequestStatus(request);
                    return (
                      <tr key={request.id} className="text-slate-700 even:bg-[#eef1f7]">
                        <td className="px-5 py-2.5">
                          <div className="flex items-center gap-3">
                            <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                              <Image alt="" className="object-cover" fill sizes="40px" src={requestImage(request)} />
                            </span>
                            <span className="max-w-[220px] truncate font-semibold text-slate-900 min-[1700px]:max-w-[320px]" title={item?.productName ?? request.title}>{item?.productName ?? request.title}</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5">
                          {quantity !== null ? `${quantity.toLocaleString('es-AR')} ${item?.unit ?? 'un.'}` : 'A definir'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5">{formatDayTime(request.updatedAt)}</td>
                        <td className="px-3 py-2.5">
                          <span className={`inline-flex whitespace-nowrap rounded-md px-2 py-1 text-[12px] font-medium ${status.tone}`}>{status.label}</span>
                        </td>
                        <td className="px-3 py-2.5 text-center font-semibold text-slate-900">{request._count?.quotes ?? 0}</td>
                        <td className="px-5 py-2.5 text-right">
                          <Link
                            className="inline-flex h-8 items-center whitespace-nowrap rounded-[8px] border border-[#1847ff] bg-[#eef2ff] px-3 text-[13px] font-semibold text-[#1238d6] transition hover:bg-[#dbe6ff]"
                            href={`/dashboard/comprador/solicitudes/${request.id}`}
                          >
                            Ver detalle
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

        {/* ==================== PEDIDOS EN CURSO ==================== */}
        <section className={panelCard} data-tour="panel-orders">
          <PanelHeader title="Pedidos en curso">
            <PanelSeeAll href="/dashboard/comprador/pedidos" label="Ver pedidos" />
          </PanelHeader>
          {activeOrders.length === 0 ? (
            <p className="px-4 py-8 text-center text-[13px] text-slate-600 lg:px-5">
              No tenés pedidos en curso. Cuando adjudiques una cotización, vas a seguir la entrega desde acá.
            </p>
          ) : (
            <ul className="divide-y divide-slate-200">
              {activeOrders.map((request) => {
                const current = request.order ? ORDER_STEPS.findIndex((step) => step.status === request.order?.fulfillmentStatus) : -1;
                const supplierName = request.awardedQuote?.supplierCompany?.name ?? 'Proveedor asignado';
                return (
                  <li key={request.id} className="even:bg-[#f4f6fb]">
                    <Link className="block px-4 py-3.5 transition hover:bg-[#eef2ff] lg:px-5" href="/dashboard/comprador/pedidos">
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="truncate text-[14px] font-bold text-slate-950">{request.title}</span>
                        <span className="shrink-0 text-[12px] font-medium text-slate-600">{request.order?.orderNumber ?? 'Sin orden emitida'}</span>
                      </span>
                      <span className="mt-0.5 block truncate text-[13px] text-slate-600">{supplierName}</span>
                      {/* Avance de la entrega: un tramo por etapa. */}
                      <span className="mt-2.5 flex gap-1" role="img" aria-label={current >= 0 ? `Etapa: ${ORDER_STEPS[current].label}` : 'Sin orden emitida'}>
                        {ORDER_STEPS.map((step, index) => (
                          <span key={step.status} className={`h-2 flex-1 rounded-full ${index <= current ? 'bg-[#1847ff]' : 'bg-slate-300'}`} />
                        ))}
                      </span>
                      <span className="mt-1.5 flex items-center justify-between gap-3 text-[12px]">
                        <span className="font-semibold text-[#1238d6]">{current >= 0 ? ORDER_STEPS[current].label : 'Adjudicada'}</span>
                        {request.order?.promisedDate ? (
                          <span className="text-slate-600">
                            Entrega {new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short' }).format(new Date(request.order.promisedDate))}
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
