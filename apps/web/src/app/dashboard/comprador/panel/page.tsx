'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { atarApi, type RequestRecord, type SupplierDirectoryRecord } from '@/lib/atar-api';
import { PageLoader } from '@/components/ui/spinner';
import { useBuyerDashboardData } from '@/lib/dashboard-hooks';
import { loadBuyerFavorites } from '@/lib/dashboard-local';
import { FALLBACK_REQUEST_CATEGORIES } from '@/lib/request-catalog-fallback';
import { getUserFirstName } from '@/lib/session';

type IconName = 'plus' | 'file' | 'box' | 'building' | 'hourglass' | 'bell' | 'search' | 'arrow' | 'chevron';

const ICON_PATHS: Record<IconName, React.ReactNode> = {
  plus: <path d="M12 5v14M5 12h14" />,
  file: <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5zM14 3v5h5M9 13h6M9 17h4" />,
  box: <path d="M21 16V8l-9-5-9 5v8l9 5 9-5zM3.3 7.3L12 12l8.7-4.7M12 22V12" />,
  building: <path d="M4 21V4h11v17M15 9h5v12M2 21h20M8 8h3M8 12h3M8 16h3M18 13h0M18 17h0" />,
  hourglass: <path d="M6 3h12M6 21h12M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9" />,
  bell: <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" />,
  search: <path d="M21 21l-4.3-4.3M11 19a8 8 0 100-16 8 8 0 000 16z" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  chevron: <path d="M9 6l6 6-6 6" />,
};

function Icon({ name, size = 'h-4 w-4' }: { name: IconName; size?: string }) {
  return (
    <svg aria-hidden="true" className={size} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      {ICON_PATHS[name]}
    </svg>
  );
}

const panelCard = 'rounded-[18px] border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]';

function PanelSeeAll({ href }: { href: string }) {
  // globals.css fija `a { color: inherit }`: el color va en el hijo.
  return (
    <Link className="inline-flex shrink-0 items-center text-[14px] font-semibold" href={href}>
      <span className="inline-flex items-center gap-1.5 text-[#1f5bff] hover:text-[#194ee6]">
        Ver todas
        <Icon name="arrow" />
      </span>
    </Link>
  );
}

/** Accesos a categorías: cada uno abre la solicitud con esa categoría del catálogo. */
const QUICK_CATEGORIES: { label: string; category: string; image: string; cutout: boolean }[] = [
  { label: 'Big Bags', category: 'Big Bags', image: '/bigbag.png', cutout: true },
  { label: 'Sacos', category: 'Sacos', image: '/bolsapp.png', cutout: true },
  { label: 'Rollos', category: 'Rollos y Telas', image: '/rollo.png', cutout: true },
  { label: 'Telas', category: 'Telas planas', image: '/amedida.png', cutout: true },
  { label: 'Hilos', category: 'Hilo multifilamento de PP', image: '/hilomulti.png', cutout: false },
  { label: 'Polímeros', category: 'Polipropileno', image: '/polimero.png', cutout: false },
];

const QUICK_ACCESS: { label: string; text: string; href: string; icon: IconName }[] = [
  { label: 'Comenzar cotización', text: 'Recibí propuestas en minutos.', href: '/dashboard/comprador/solicitudes/nueva', icon: 'plus' },
  { label: 'Buscar productos', text: 'Explorá por categoría y encontrá proveedores.', href: '/productos', icon: 'search' },
  { label: 'Ver proveedores', text: 'Descubrí empresas verificadas.', href: '/dashboard/comprador/proveedores', icon: 'building' },
  { label: 'Mis pedidos', text: 'Seguí el estado de tus compras.', href: '/dashboard/comprador/pedidos', icon: 'box' },
];

type TaskTone = 'red' | 'amber' | 'blue';

const TASK_TONES: Record<TaskTone, { border: string; soft: string; dot: string }> = {
  red: { border: 'border-l-rose-400', soft: 'bg-rose-50', dot: 'bg-rose-500' },
  amber: { border: 'border-l-amber-400', soft: 'bg-amber-50', dot: 'bg-amber-400' },
  blue: { border: 'border-l-[#1f5bff]', soft: 'bg-[#eef3ff]', dot: 'bg-[#1f5bff]' },
};

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
  if (request.status === 'CANCELLED') return { label: 'Cancelada', tone: 'bg-rose-50 text-rose-600' };
  if (request.status === 'DRAFT') return { label: 'Borrador', tone: 'bg-slate-100 text-slate-600' };
  if (request.status === 'NEGOTIATING') return { label: 'Cotizando', tone: 'bg-[#eef3ff] text-[#1f5bff]' };
  if (quotes > 0) return { label: 'Recibidas', tone: 'bg-emerald-50 text-emerald-600' };
  return { label: 'Sin cotizaciones', tone: 'bg-amber-50 text-amber-600' };
}

export default function DashboardCompradorPanelPage() {
  const { session, requests, loading, error } = useBuyerDashboardData();
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<SupplierDirectoryRecord[]>([]);
  const [search, setSearch] = useState('');
  // Los favoritos viven en el navegador (ver dashboard-local).
  const [favoritesCount] = useState(() => loadBuyerFavorites().length);

  useEffect(() => {
    if (!session?.accessToken) {
      return;
    }

    const accessToken = session.accessToken;
    let cancelled = false;

    async function loadSuppliers() {
      const response = await atarApi.getSuppliers(accessToken);
      if (!cancelled) {
        setSuppliers(response);
      }
    }

    void loadSuppliers();

    return () => {
      cancelled = true;
    };
  }, [session?.accessToken]);

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
      {
        label: 'Proveedores disponibles',
        value: suppliers.length,
      },
    ];
  }, [requests, suppliers.length]);

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

  if (loading) {
    return (
      <PageLoader label="Preparando tu panel…" />
    );
  }

  const firstName = session ? getUserFirstName(session.user) : '';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buen día' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = search.trim();
    router.push(`/dashboard/comprador/solicitudes/nueva${term ? `?only=${encodeURIComponent(term)}` : ''}`);
  }

  const statCards = [
    { label: 'Solicitudes activas', value: kpis[0].value, href: '/dashboard/comprador/solicitudes', icon: 'file' as const },
    { label: 'Cotizaciones recibidas', value: kpis[1].value, href: '/dashboard/comprador/cotizaciones', icon: 'hourglass' as const },
    { label: 'Pedidos en curso', value: kpis[2].value, href: '/dashboard/comprador/pedidos', icon: 'box' as const },
    { label: 'Proveedores guardados', value: favoritesCount, href: '/dashboard/comprador/favoritos', icon: 'building' as const },
  ];

  return (
    <main className="w-full space-y-5 px-4 py-5 pb-24 lg:pb-8 xl:px-6">
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      {/* ==================== CABECERA ==================== */}
      {/* Sin tarjeta: el saludo y el buscador van directo sobre el fondo. */}
      <section className="grid grid-cols-1 gap-6 pt-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)] lg:items-center lg:py-3">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">Panel comprador</p>
          <h1 className="mt-2 text-[34px] font-bold leading-tight tracking-[-0.04em] text-slate-950 sm:text-[40px]">
            {greeting}
            {firstName ? `, ${firstName}` : ''} 👋
          </h1>
          <p className="mt-1 text-[22px] font-bold tracking-[-0.02em] text-slate-900">¿Qué necesitás cotizar hoy?</p>
          <p className="mt-3 max-w-[480px] text-[15px] leading-6 text-slate-500">
            Buscá un producto o elegí una categoría para comenzar una solicitud y recibir propuestas de proveedores especializados.
          </p>
        </div>

        <div>
          <form className="flex flex-col gap-2 sm:flex-row" onSubmit={handleSearch} role="search">
            <label className="relative flex-1">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                <Icon name="search" />
              </span>
              <input
                aria-label="Buscar productos"
                className="h-12 w-full rounded-[12px] border border-slate-200 bg-white pl-11 pr-4 text-[15px] outline-none transition placeholder:text-slate-400 focus:border-[#1f5bff]"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar productos (ej. Big Bags, Sacos, Rollos...)"
                type="search"
                value={search}
              />
            </label>
            <button className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-[12px] bg-[#1f5bff] px-6 text-[15px] font-semibold text-white transition hover:bg-[#194ee6]" type="submit">
              Comenzar cotización
              <Icon name="arrow" />
            </button>
          </form>

          <div className="mt-5 grid grid-cols-4 gap-x-2 gap-y-4 sm:grid-cols-7">
            {/* En mobile una sola fila: 3 categorías y el "+" de ver todas. */}
            {QUICK_CATEGORIES.map((category, index) => (
              <Link
                key={category.label}
                className={`group flex-col items-center gap-2 text-center ${index >= 3 ? 'hidden sm:flex' : 'flex'}`}
                href={`/dashboard/comprador/solicitudes/nueva?category=${encodeURIComponent(category.category)}`}
              >
                <span className="relative block h-16 w-16 overflow-hidden rounded-full bg-white shadow-[0_6px_18px_rgba(15,23,42,0.07)] ring-1 ring-slate-200/70 transition group-hover:-translate-y-0.5 group-hover:ring-[#1f5bff]/50">
                  <Image
                    alt=""
                    className={category.cutout ? 'scale-[1.2] object-contain p-2.5' : 'object-cover'}
                    fill
                    sizes="80px"
                    src={category.image}
                  />
                </span>
                <span className="text-[13px] font-medium text-slate-800 group-hover:text-[#1f5bff]">{category.label}</span>
              </Link>
            ))}
            <Link className="group flex flex-col items-center gap-2 text-center" href="/dashboard/comprador/solicitudes/nueva">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e6edff] text-[#1f5bff] transition group-hover:-translate-y-0.5">
                <Icon name="plus" />
              </span>
              <span className="text-[13px] font-medium text-slate-800 group-hover:text-[#1f5bff]">Ver todas</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ==================== CONTADORES ==================== */}
      {/* Una sola franja con divisores, en vez de cuatro tarjetas. */}
      <section className={`${panelCard} grid grid-cols-2 divide-slate-100 max-xl:[&>*:nth-child(-n+2)]:border-b max-xl:[&>*:nth-child(odd)]:border-r xl:grid-cols-4 xl:divide-x`}>
        {statCards.map((card) => (
          <Link key={card.label} className="group flex items-center gap-3 border-slate-100 px-4 py-4 transition hover:bg-[#f8faff] sm:gap-4 sm:px-6 sm:py-5" href={card.href}>
            <span className="text-[#1f5bff]">
              <Icon name={card.icon} size="h-6 w-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[26px] font-bold leading-none tracking-tight text-slate-950 sm:text-[30px]">{card.value}</span>
              <span className="mt-1.5 block text-[13px] leading-4 text-slate-600 sm:text-[14px]">{card.label}</span>
            </span>
            <span className="hidden text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#1f5bff] sm:block">
              <Icon name="arrow" />
            </span>
          </Link>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        {/* ==================== TAREAS PENDIENTES ==================== */}
        <section className={`${panelCard} p-5`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <h2 className="text-[18px] font-bold text-slate-950">Tareas pendientes</h2>
              {attention.length > 0 ? (
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[12px] font-semibold text-white">
                  {attention.length}
                </span>
              ) : null}
            </div>
            <PanelSeeAll href="/dashboard/comprador/solicitudes" />
          </div>
          <div className="mt-2 divide-y divide-slate-100">
            {attention.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                No tenés tareas pendientes. ¡Todo al día!
              </p>
            ) : (
              attention.map((item) => (
                <Link
                  key={item.key}
                  className="group flex items-center gap-3.5 py-3.5"
                  href={item.href}
                >
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${TASK_TONES[item.tone].dot}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold text-slate-900 group-hover:text-[#1f5bff]">{item.label}</span>
                    <span className="block text-[13px] text-slate-500">{item.hint}</span>
                  </span>
                  <span className="shrink-0 text-[13px] text-slate-500">{formatRelativeDay(item.at)}</span>
                  <span className="text-slate-400 transition group-hover:translate-x-0.5">
                    <Icon name="chevron" />
                  </span>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* ==================== SOLICITUDES RECIENTES ==================== */}
        <section className={`${panelCard} p-5`}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[18px] font-bold text-slate-950">Solicitudes recientes</h2>
            <PanelSeeAll href="/dashboard/comprador/solicitudes" />
          </div>
          {/* Mobile: lista. Desde md, la tabla completa. */}
          <ul className="mt-3 divide-y divide-slate-100 md:hidden">
            {recentRequests.length === 0 ? (
              <li className="py-6 text-center text-[13px] text-slate-500">Todavía no creaste solicitudes.</li>
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
                        <span className="block truncate text-[12px] text-slate-500">
                          {quantity !== null ? `${quantity.toLocaleString('es-AR')} ${item?.unit ?? 'un.'}` : 'A definir'} · {quotes} cotizaci{quotes === 1 ? 'ón' : 'ones'}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium ${status.tone}`}>{status.label}</span>
                        <span className="mt-0.5 block text-[11px] text-slate-400">{formatDayTime(request.updatedAt)}</span>
                      </span>
                    </Link>
                  </li>
                );
              })
            )}
          </ul>
          <div className="mt-3 hidden overflow-x-auto md:block">
            <table className="w-full min-w-[600px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 text-[12px] text-slate-500">
                  <th className="px-3 py-2.5 font-medium">Producto</th>
                  <th className="px-3 py-2.5 font-medium">Cantidad</th>
                  <th className="px-3 py-2.5 font-medium">Fecha</th>
                  <th className="px-3 py-2.5 font-medium">Estado</th>
                  <th className="px-2 py-2.5 text-center font-medium">Cotizaciones</th>
                  <th className="px-3 py-2.5 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentRequests.length === 0 ? (
                  <tr>
                    <td className="px-3 py-8 text-center text-slate-500" colSpan={6}>
                      Todavía no creaste solicitudes.
                    </td>
                  </tr>
                ) : (
                  recentRequests.map((request) => {
                    const item = request.items?.[0];
                    const quantity = item?.quantity ?? request.quantityRequested ?? null;
                    const status = buyerRequestStatus(request);
                    return (
                      <tr key={request.id} className="text-slate-600">
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-3">
                            <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                              <Image alt="" className="object-cover" fill sizes="40px" src={requestImage(request)} />
                            </span>
                            <span className="max-w-[150px] truncate font-semibold text-slate-900 min-[1700px]:max-w-[260px]" title={item?.productName ?? request.title}>{item?.productName ?? request.title}</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5">
                          {quantity !== null ? `${quantity.toLocaleString('es-AR')} ${item?.unit ?? 'un.'}` : 'A definir'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5">{formatDayTime(request.updatedAt)}</td>
                        <td className="px-3 py-2.5">
                          <span className={`inline-flex whitespace-nowrap rounded-md px-2 py-1 text-[12px] font-medium ${status.tone}`}>{status.label}</span>
                        </td>
                        <td className="px-3 py-2.5 text-center">{request._count?.quotes ?? 0}</td>
                        <td className="px-3 py-2.5">
                          <Link
                            className="inline-flex h-8 items-center whitespace-nowrap text-[13px] font-semibold hover:underline"
                            href={`/dashboard/comprador/solicitudes/${request.id}`}
                          >
                            <span className="text-[#1f5bff]">Ver detalle</span>
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
      </div>

      {/* ==================== ACCESOS RÁPIDOS ==================== */}
      <section>
        <h2 className="text-[18px] font-bold text-slate-950">Accesos rápidos</h2>
        <div className="mt-3 grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2 xl:grid-cols-4">
          {QUICK_ACCESS.map((access) => (
            <Link key={access.label} className="group flex items-center gap-3.5 py-2.5" href={access.href}>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e6edff] text-[#1f5bff] transition group-hover:bg-[#1f5bff] group-hover:text-white">
                <Icon name={access.icon} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-slate-900 group-hover:text-[#1f5bff]">{access.label}</span>
                <span className="block text-[13px] leading-5 text-slate-500">{access.text}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
