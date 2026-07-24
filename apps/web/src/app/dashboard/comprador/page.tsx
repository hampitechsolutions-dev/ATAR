'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';
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
const CATEGORIES: { title: string; subtitle: string; img: string; labels: string[] }[] = [
  { title: 'Big Bags', subtitle: 'y FIBC', img: '/bigbags.png', labels: ['Big Bags'] },
  { title: 'Bolsas', subtitle: 'Plásticas', img: '/bolsaspp.png', labels: ['Bolsas PP'] },
  { title: 'Sacos', subtitle: 'PP / PE', img: '/sacos.png', labels: ['Sacos'] },
  { title: 'Polímeros', subtitle: 'y Resinas', img: '/polimerosweb.png', labels: ['Polipropileno', 'Polietileno'] },
  { title: 'Telas', subtitle: 'y Mallas', img: '/telasweb.png', labels: ['Rollos y Telas', 'Telas Tubulares', 'Telas planas'] },
  { title: 'Tintas', subtitle: 'y Aditivos', img: '/tintasweb.png', labels: ['Tintas'] },
  { title: 'Máquinas', subtitle: 'y Equipos', img: '/maquinariaweb.png', labels: ['Maquinarias'] },
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
      <div className="flex min-h-[60vh] items-center justify-center px-4 text-sm text-slate-600">
        Cargando...
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[720px] px-4 pb-8 pt-4">
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
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white drop-shadow-sm">{cat.title}</p>
                <p className="truncate text-xs text-white/85 drop-shadow-sm">{cat.subtitle}</p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-white" />
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
                className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition active:bg-slate-50"
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
  );
}
