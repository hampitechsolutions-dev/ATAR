'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';
import { LoadingState } from '@/components/ui/spinner';
import { useBuyerDashboardData } from '@/lib/dashboard-hooks';
import type { RequestRecord } from '@/lib/atar-api';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) {
    return 'Buen día';
  }
  if (hour < 19) {
    return 'Buenas tardes';
  }
  return 'Buenas noches';
}

function formatWhen(value: string) {
  const date = new Date(value);
  const now = new Date();
  const time = new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit' }).format(date);
  if (date.toDateString() === now.toDateString()) {
    return `Hoy, ${time}`;
  }
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short' }).format(date);
}

function getStatusBadge(status: RequestRecord['status']) {
  if (status === 'DRAFT') {
    return { label: 'Borrador', className: 'bg-slate-100 text-slate-500' };
  }
  if (status === 'AWARDED' || status === 'ORDER_ISSUED') {
    return { label: 'Adjudicada', className: 'bg-emerald-50 text-emerald-600' };
  }
  if (status === 'CANCELLED') {
    return { label: 'Cancelada', className: 'bg-rose-50 text-rose-600' };
  }
  return { label: 'En progreso', className: 'bg-blue-50 text-blue-600' };
}

const NUEVA_HREF = '/dashboard/comprador/solicitudes/nueva';

// `labels` = etiquetas reales del catálogo de solicitudes que agrupa cada botón.
// El botón lleva al paso 1 del wizard mostrando solo esos productos.
const CATEGORIES: { title: string; img: string; labels: string[] }[] = [
  { title: 'Polímeros', img: '/polimero.png', labels: ['Polipropileno', 'Polietileno'] },
  { title: 'Envases y embalajes', img: '/envasesweb.png', labels: ['Big Bags', 'Bolsas PP', 'Sacos'] },
  { title: 'Telas', img: '/telasweb.png', labels: ['Rollos y Telas', 'Telas Tubulares', 'Telas planas'] },
  {
    title: 'Hilos y cuerdas',
    img: '/hilosweb.png',
    labels: ['Cuerdas/Cordones', 'Cintas/Cintillas', 'Hilo multifilamento de PP', 'Hilo retorcido y Mallas'],
  },
  { title: 'Tintas', img: '/tintasweb.png', labels: ['Tintas'] },
];

function stepOneFilterHref(labels: string[]) {
  return `${NUEVA_HREF}?step=1&only=${encodeURIComponent(labels.join(','))}`;
}

function stepTwoHref(category: string) {
  return `${NUEVA_HREF}?step=2&category=${encodeURIComponent(category)}`;
}

function ChevronRight({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function ArrowRight({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

/* ---- Vista desktop ---- */

type DIconName =
  | 'cube'
  | 'box'
  | 'grid'
  | 'thread'
  | 'drop'
  | 'bag'
  | 'gear'
  | 'shield'
  | 'clock'
  | 'users'
  | 'star'
  | 'chat'
  | 'headset';

function DIcon({ name, className = 'h-5 w-5' }: { name: DIconName; className?: string }) {
  const p = {
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };
  const paths: Record<DIconName, React.ReactNode> = {
    cube: (
      <>
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" {...p} />
        <path d="M3.3 7.3L12 12l8.7-4.7M12 22V12" {...p} />
      </>
    ),
    box: (
      <>
        <path d="M20 8H4a1 1 0 00-1 1v9a2 2 0 002 2h14a2 2 0 002-2V9a1 1 0 00-1-1z" {...p} />
        <path d="M3 8l2.5-4h13L21 8M12 4v4M9 12h6" {...p} />
      </>
    ),
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" {...p} />
        <rect x="14" y="3" width="7" height="7" rx="1.5" {...p} />
        <rect x="3" y="14" width="7" height="7" rx="1.5" {...p} />
        <rect x="14" y="14" width="7" height="7" rx="1.5" {...p} />
      </>
    ),
    thread: <path d="M4 4v16M9 4c0 6 6 10 6 16M14 4c0 6-6 10-6 16M20 4v16" {...p} />,
    drop: <path d="M12 3s6 6.5 6 11a6 6 0 11-12 0c0-4.5 6-11 6-11z" {...p} />,
    bag: (
      <>
        <path d="M6 8h12l-1 12a1 1 0 01-1 1H8a1 1 0 01-1-1L6 8z" {...p} />
        <path d="M9 8V6a3 3 0 016 0v2" {...p} />
      </>
    ),
    gear: (
      <>
        <circle cx="12" cy="12" r="3" {...p} />
        <path d="M19 12a7 7 0 00-.1-1l2-1.5-2-3.4-2.3 1a7 7 0 00-1.7-1l-.3-2.5H10.4l-.3 2.5a7 7 0 00-1.7 1l-2.3-1-2 3.4 2 1.5a7 7 0 000 2l-2 1.5 2 3.4 2.3-1a7 7 0 001.7 1l.3 2.5h3.2l.3-2.5a7 7 0 001.7-1l2.3 1 2-3.4-2-1.5c.07-.33.1-.66.1-1z" {...p} />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" {...p} />
        <path d="M9 12l2 2 4-4" {...p} />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" {...p} />
        <path d="M12 7v5l3 2" {...p} />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z" {...p} />
        <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13A4 4 0 0116 11" {...p} />
      </>
    ),
    star: <path d="M12 3l2.9 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 7.1-1.01L12 3z" {...p} />,
    chat: <path d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4v8z" {...p} />,
    headset: (
      <>
        <path d="M4 13v-1a8 8 0 0116 0v1" {...p} />
        <rect x="3" y="13" width="4" height="6" rx="1.5" {...p} />
        <rect x="17" y="13" width="4" height="6" rx="1.5" {...p} />
        <path d="M21 19a4 4 0 01-4 4h-3" {...p} />
      </>
    ),
  };
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24">
      {paths[name]}
    </svg>
  );
}

const DESKTOP_CATEGORIES: { title: string; img: string; icon: DIconName; labels: string[] }[] = [
  { title: 'Polímeros', img: '/polimero.png', icon: 'cube', labels: ['Polipropileno', 'Polietileno'] },
  { title: 'Envases y embalajes', img: '/envasesweb.png', icon: 'box', labels: ['Big Bags', 'Sacos'] },
  { title: 'Telas y mallas', img: '/telasweb.png', icon: 'grid', labels: ['Rollos y Telas', 'Telas Tubulares', 'Telas planas'] },
  {
    title: 'Hilos y cuerdas',
    img: '/hilosweb.png',
    icon: 'thread',
    labels: ['Cuerdas/Cordones', 'Cintas/Cintillas', 'Hilo multifilamento de PP', 'Hilo retorcido y Mallas'],
  },
  { title: 'Tintas y aditivos', img: '/tintasweb.png', icon: 'drop', labels: ['Tintas'] },
  { title: 'Bolsas plásticas', img: '/bolsaspp.png', icon: 'bag', labels: ['Bolsas PP', 'Polietileno'] },
  { title: 'Maquinarias y equipos', img: '/maquinariaweb.png', icon: 'gear', labels: ['Maquinarias'] },
];

const HERO_TRUST: { icon: DIconName; text: string }[] = [
  { icon: 'shield', text: 'Transacciones seguras' },
  { icon: 'clock', text: 'Respuesta promedio 24 h' },
  { icon: 'users', text: '+350 proveedores' },
];

const DESKTOP_FEATURES: { icon: DIconName; title: string; text: string }[] = [
  { icon: 'shield', title: 'Plataforma segura', text: 'Tus datos siempre protegidos' },
  { icon: 'star', title: 'Múltiples proveedores', text: 'Compará y elegí la mejor opción' },
  { icon: 'chat', title: 'Cotizaciones rápidas', text: 'Recibí varias opciones en 24 h' },
  { icon: 'headset', title: 'Soporte especializado', text: 'Te acompañamos en todo el proceso' },
];

export default function DashboardCompradorPage() {
  const { session, requests, loading } = useBuyerDashboardData();

  const firstName = session?.user.firstName ?? '';
  const greeting = useMemo(() => getGreeting(), []);

  const recentRequests = useMemo(
    () =>
      [...requests]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 4),
    [requests],
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <LoadingState label="Cargando..." />
      </div>
    );
  }

  return (
    <>
    <main className="mx-auto w-full max-w-[720px] px-4 pb-8 pt-4 lg:hidden">
      {/* Hero */}
      <section className="pt-2">
        <h1 className="text-[2rem] font-extrabold leading-[1.05] tracking-tight text-slate-950">
          ¡{greeting}, <span className="text-blue-600">{firstName || 'de nuevo'}</span>!
        </h1>
        <p className="mt-2 text-[15px] leading-6 text-slate-500">¿Qué necesitás cotizar hoy?</p>
      </section>

      {/* Nueva cotización */}
      <Link
        href={NUEVA_HREF}
        className="mt-5 flex items-center gap-4 rounded-2xl bg-blue-600 p-4 text-white shadow-lg shadow-blue-600/25 transition active:scale-[0.99]"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600">
          <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold">Nueva cotización</p>
          <p className="mt-0.5 text-xs leading-4 text-white/80">
            Comenzá una nueva solicitud en menos de 2 minutos
          </p>
        </div>
        <ArrowRight className="h-5 w-5 shrink-0 text-white" />
      </Link>

      {/* Categorías */}
      <h2 className="mt-6 text-lg font-bold tracking-tight text-slate-950">Elegí una categoría</h2>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.title}
            href={stepOneFilterHref(cat.labels)}
            className="group relative h-28 overflow-hidden rounded-2xl bg-slate-100 shadow-sm"
          >
            <Image
              alt={cat.title}
              className="object-cover transition duration-300 group-hover:scale-105"
              fill
              sizes="(min-width:640px) 340px, 45vw"
              src={cat.img}
            />
            {/* Gradiente base para legibilidad */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/25 to-transparent" />
            {/* Oscurecido extra en hover */}
            <div className="absolute inset-0 bg-slate-950/0 transition-colors duration-300 group-hover:bg-slate-950/35" />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-3">
              <p className="text-sm font-bold leading-5 text-white drop-shadow-sm">{cat.title}</p>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition group-hover:bg-blue-600">
                <ChevronRight className="h-4 w-4" />
              </span>
            </div>
          </Link>
        ))}

        {/* Ver más → paso 1 (explorar todas las categorías) */}
        <Link
          href={NUEVA_HREF}
          className="flex h-28 flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-center shadow-sm transition active:bg-slate-50"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="5" cy="12" r="1.6" />
              <circle cx="12" cy="12" r="1.6" />
              <circle cx="19" cy="12" r="1.6" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-bold text-slate-950">Ver más</p>
            <p className="text-xs text-slate-500">categorías</p>
          </div>
        </Link>
      </div>

      {/* Producto personalizado → paso 2 (A medida) */}
      <Link
        href={stepTwoHref('A medida')}
        className="mt-4 flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 transition active:bg-blue-50"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
          <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
            <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            <path d="M3.3 7.3L12 12l8.7-4.7M12 22V12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-950">¿No encontrás el producto?</p>
          <p className="text-xs text-slate-500">Solicitá un producto personalizado</p>
        </div>
        <ArrowRight className="h-5 w-5 shrink-0 text-blue-600" />
      </Link>

      {/* Cotizaciones recientes */}
      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tight text-slate-950">Cotizaciones recientes</h2>
        <Link
          href="/dashboard/comprador/solicitudes"
          className="inline-flex items-center gap-0.5 text-sm font-semibold text-blue-600"
        >
          Ver todas
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-3 space-y-3">
        {recentRequests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
            Todavía no tenés cotizaciones. Empezá con una nueva.
          </div>
        ) : (
          recentRequests.map((request) => {
            const badge = getStatusBadge(request.status);
            const count = request._count?.quotes ?? request.quotes?.length ?? 0;
            return (
              <Link
                key={request.id}
                href={`/dashboard/comprador/solicitudes/${request.id}`}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition active:bg-slate-50"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <path d="M14 2H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V8l-5-6z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    <path d="M14 2v6h6M9 13h6M9 17h4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-bold text-slate-950">{request.title}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.className}`}>
                      {badge.label}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {request.category} • {count} {count === 1 ? 'cotización' : 'cotizaciones'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <span className="text-[11px] text-slate-400">{formatWhen(request.createdAt)}</span>
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </div>
              </Link>
            );
          })
        )}
      </div>
    </main>

    {/* ==================== VISTA DESKTOP ==================== */}
    <div className="hidden lg:block">
      {/* HERO */}
      <section className="border-b border-slate-200 bg-[linear-gradient(180deg,#f7f9ff_0%,#ffffff_100%)]">
        <div className="mx-auto grid max-w-[1320px] grid-cols-2 items-center gap-8 px-8 py-12 xl:px-10">
          <div>
            <h1 className="text-[2.6rem] font-extrabold leading-[1.05] tracking-tight text-slate-950">
              ¡{greeting}, <span className="text-blue-600">{firstName || 'de nuevo'}</span>!
            </h1>
            <p className="mt-3 text-xl text-slate-500">¿Qué necesitás cotizar hoy?</p>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              Miles de productos, múltiples proveedores, la mejor opción para tu industria.
            </p>

            <Link
              href={NUEVA_HREF}
              className="mt-7 flex max-w-xl items-center gap-4 rounded-2xl bg-blue-600 p-5 text-white shadow-xl shadow-blue-600/25 transition hover:bg-blue-700"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600">
                <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                </svg>
              </span>
              <div className="flex-1">
                <p className="text-lg font-bold">Nueva cotización</p>
                <p className="mt-0.5 text-sm text-white/85">Comenzá una nueva solicitud en menos de 2 minutos</p>
              </div>
              <ArrowRight className="h-6 w-6 shrink-0 text-white" />
            </Link>

            <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-slate-500">
              {HERO_TRUST.map((item) => (
                <span key={item.text} className="inline-flex items-center gap-2">
                  <DIcon name={item.icon} className="h-4 w-4 text-blue-600" />
                  {item.text}
                </span>
              ))}
            </div>
          </div>

          <div className="grid h-[380px] grid-cols-2 grid-rows-2 gap-3">
            <div className="relative row-span-2 overflow-hidden rounded-2xl bg-slate-100 shadow-sm">
              <Image alt="" className="object-cover" fill priority sizes="320px" src="/bigbags.png" />
            </div>
            <div className="relative overflow-hidden rounded-2xl bg-slate-100 shadow-sm">
              <Image alt="" className="object-cover" fill sizes="320px" src="/cuerdas.png" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative overflow-hidden rounded-2xl bg-slate-100 shadow-sm">
                <Image alt="" className="object-cover" fill sizes="160px" src="/tintas.png" />
              </div>
              <div className="relative overflow-hidden rounded-2xl bg-slate-100 shadow-sm">
                <Image alt="" className="object-cover" fill sizes="160px" src="/hiloretor.png" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORÍAS */}
      <section className="bg-[#f6f8fc]">
        <div className="mx-auto max-w-[1320px] px-8 py-10 xl:px-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">Elegí una categoría</h2>
            <Link
              href="/productos"
              className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Ver todas las categorías
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-4 gap-5">
            {DESKTOP_CATEGORIES.map((cat) => (
              <Link
                key={cat.title}
                href={stepOneFilterHref(cat.labels)}
                className="group relative h-36 overflow-hidden rounded-2xl bg-slate-100 shadow-sm ring-1 ring-slate-200/60 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <Image
                  alt={cat.title}
                  className="object-cover transition duration-300 group-hover:scale-105"
                  fill
                  sizes="300px"
                  src={cat.img}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 p-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-blue-600 shadow">
                    <DIcon name={cat.icon} className="h-4 w-4" />
                  </span>
                  <p className="flex-1 truncate text-sm font-semibold text-white drop-shadow">{cat.title}</p>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-slate-700 shadow transition group-hover:bg-blue-600 group-hover:text-white">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}

            {/* Ver más categorías */}
            <Link
              href={NUEVA_HREF}
              className="flex h-36 flex-col items-center justify-center gap-2 rounded-2xl border border-blue-100 bg-blue-50/50 text-center transition hover:bg-blue-50"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
                <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="5" cy="12" r="1.6" />
                  <circle cx="12" cy="12" r="1.6" />
                  <circle cx="19" cy="12" r="1.6" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-bold text-slate-900">Ver más categorías</p>
                <p className="text-xs text-blue-600">Explorá todas las opciones</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="bg-[#f6f8fc] pb-12">
        <div className="mx-auto max-w-[1320px] px-8 xl:px-10">
          <div className="grid grid-cols-4 gap-6 rounded-2xl border border-slate-200 bg-white px-8 py-6 shadow-sm">
            {DESKTOP_FEATURES.map((feature) => (
              <div key={feature.title} className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <DIcon name={feature.icon} className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-950">{feature.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{feature.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
    </>
  );
}
