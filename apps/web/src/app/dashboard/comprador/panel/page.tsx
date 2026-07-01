'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';
import { useBuyerDashboardData } from '@/lib/dashboard-hooks';
import { providerDirectory } from '@/lib/provider-directory';

const HERO_DASH_IMAGE_SRC = '/herodashc.png?v=20260625-2';

type CategoryTile = {
  label: string;
  subtitle: string;
  href: string;
  imageSrc?: string;
};

type ActionTile = {
  label: string;
  subtitle: string;
  href: string;
  icon: 'plus' | 'file' | 'box' | 'users' | 'heart' | 'chat';
  badge?: number;
};

function Icon({ name }: { name: ActionTile['icon'] | 'bell' | 'msg' | 'chev-down' | 'chev-right' | 'eye' }) {
  const cls = 'h-4 w-4';

  if (name === 'chev-down') {
    return (
      <svg aria-hidden="true" className={cls} fill="none" viewBox="0 0 24 24">
        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }

  if (name === 'chev-right') {
    return (
      <svg aria-hidden="true" className={cls} fill="none" viewBox="0 0 24 24">
        <path d="M9 18l6-6-6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }

  if (name === 'msg') {
    return (
      <svg aria-hidden="true" className={cls} fill="none" viewBox="0 0 24 24">
        <path d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4v8z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }

  if (name === 'bell') {
    return (
      <svg aria-hidden="true" className={cls} fill="none" viewBox="0 0 24 24">
        <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }

  if (name === 'eye') {
    return (
      <svg aria-hidden="true" className={cls} fill="none" viewBox="0 0 24 24">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }

  if (name === 'plus') {
    return (
      <svg aria-hidden="true" className={cls} fill="none" viewBox="0 0 24 24">
        <path d="M12 5v14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="M5 12h14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }

  if (name === 'file') {
    return (
      <svg aria-hidden="true" className={cls} fill="none" viewBox="0 0 24 24">
        <path d="M14 2H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V8l-5-6z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="M14 2v6h6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }

  if (name === 'box') {
    return (
      <svg aria-hidden="true" className={cls} fill="none" viewBox="0 0 24 24">
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="M3.29 7L12 12l8.71-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }

  if (name === 'users') {
    return (
      <svg aria-hidden="true" className={cls} fill="none" viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="M9 11a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }

  if (name === 'heart') {
    return (
      <svg aria-hidden="true" className={cls} fill="none" viewBox="0 0 24 24">
        <path d="M12 21s-7-4.35-7-10a4 4 0 017-2.65A4 4 0 0119 11c0 5.65-7 10-7 10z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className={cls} fill="none" viewBox="0 0 24 24">
      <path d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4v8z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function CategoryIcon({ imageSrc }: { imageSrc?: string }) {
  if (imageSrc) {
    return (
      <div className="relative h-full w-full overflow-hidden">
        <Image alt="" className="object-contain p-3" fill sizes="220px" src={imageSrc} />
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center text-[#4f46ff]">
      <Icon name="plus" />
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function shortenId(value: string) {
  if (value.length <= 10) {
    return value;
  }
  return `${value.slice(0, 6)}-${value.slice(-4)}`;
}

export default function DashboardCompradorPanelPage() {
  const { requests, loading, error } = useBuyerDashboardData();

  const categories: CategoryTile[] = [
    { label: 'Big Bags', subtitle: 'FIBC 500 - 2000 kg', href: '/dashboard/comprador/solicitudes/nueva?category=Big%20Bags', imageSrc: '/bigbag.png' },
    { label: 'Bolsas PP', subtitle: 'Tejidas y laminadas', href: '/dashboard/comprador/solicitudes/nueva?category=Bolsas%20PP', imageSrc: '/bolsapp.png' },
  { label: 'Polipropileno', subtitle: 'Tejidos, rafia y laminados', href: '/dashboard/comprador/solicitudes/nueva?category=Polipropileno', imageSrc: '/rollo.png' },
  { label: 'Polietileno', subtitle: 'Films, mangas y bobinas', href: '/dashboard/comprador/solicitudes/nueva?category=Polietileno', imageSrc: '/bolsapp.png' },
    { label: 'Rollos y Telas', subtitle: 'Polipropileno y otros', href: '/dashboard/comprador/solicitudes/nueva?category=Rollos%20y%20Telas', imageSrc: '/rollo.png' },
    { label: 'Sacos', subtitle: 'De papel, rafia y mas', href: '/dashboard/comprador/solicitudes/nueva?category=Sacos', imageSrc: '/saco.png' },
    { label: 'A medida', subtitle: 'Desarrollos especiales', href: '/dashboard/comprador/solicitudes/nueva?category=A%20medida', imageSrc: '/amedida.png' },
  { label: 'Tintas', subtitle: 'Flexografia e impresion industrial', href: '/dashboard/comprador/solicitudes/nueva?category=Tintas', imageSrc: '/amedida.png' },
  ];

  const quickActions: ActionTile[] = [
    { label: 'Nueva solicitud', subtitle: 'Iniciar una cotizacion', href: '/dashboard/comprador/solicitudes/nueva', icon: 'plus' },
    { label: 'Mis solicitudes', subtitle: 'Ver estado y propuestas', href: '/dashboard/comprador/solicitudes', icon: 'file' },
    { label: 'Mis pedidos', subtitle: 'Seguimiento de compras', href: '/dashboard/comprador/pedidos', icon: 'box' },
    { label: 'Proveedores', subtitle: 'Explorar y contactar', href: '/dashboard/comprador/proveedores', icon: 'users' },
    { label: 'Favoritos', subtitle: 'Productos y proveedores', href: '/dashboard/comprador/favoritos', icon: 'heart' },
    { label: 'Mensajes', subtitle: 'Comunicaciones', href: '/dashboard/comprador/mensajes', icon: 'chat', badge: 2 },
  ];

  const featuredProviders = useMemo(() => providerDirectory.slice(0, 4), []);

  const kpis = useMemo(() => {
    const activeStatuses = ['DRAFT', 'PUBLISHED', 'REVIEWING', 'NEGOTIATING'];
    const orderStatuses = ['AWARDED', 'ORDER_ISSUED'];

    const solicitudesActivas = requests.filter((request) => activeStatuses.includes(request.status)).length;
    const cotizacionesRecibidas = requests.reduce((sum, request) => sum + (request._count?.quotes ?? 0), 0);
    const pedidosEnCurso = requests.filter(
      (request) => orderStatuses.includes(request.status) || Boolean(request.order),
    ).length;

    return [
      { label: 'Solicitudes activas', value: solicitudesActivas, hint: 'En proceso de cotización', icon: 'file' as const },
      { label: 'Cotizaciones recibidas', value: cotizacionesRecibidas, hint: 'Propuestas de proveedores', icon: 'msg' as const },
      { label: 'Pedidos en curso', value: pedidosEnCurso, hint: 'Compras adjudicadas', icon: 'box' as const },
      { label: 'Proveedores disponibles', value: providerDirectory.length, hint: 'Verificados en la red', icon: 'users' as const },
    ];
  }, [requests]);

  const recentRequests = useMemo(() => {
    return [...requests]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 4)
      .map((request) => {
        const quoteCount = request._count?.quotes ?? 0;
        const product = request.productName?.trim() || request.title;
        const statusLabel =
          quoteCount === 0
            ? 'Sin propuestas'
            : quoteCount === 1
              ? '1 propuesta recibida'
              : `${quoteCount} propuestas recibidas`;

        const statusTone =
          quoteCount === 0 ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-700';

        return {
          id: request.id,
          code: shortenId(request.id),
          product,
          date: formatDate(request.createdAt),
          quotes: quoteCount,
          statusLabel,
          statusTone,
        };
      });
  }, [requests]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 text-sm text-slate-600">
        Cargando panel...
      </div>
    );
  }

  return (
    <>
      <section className="relative overflow-hidden bg-[linear-gradient(135deg,#050816_0%,#0f172a_35%,#111a52_100%)] text-white shadow-[0_30px_90px_rgba(2,6,23,0.32)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_14%,rgba(79,70,255,0.35),transparent_35%),radial-gradient(circle_at_72%_64%,rgba(37,99,235,0.18),transparent_42%)]" />
        <div className="relative mx-auto max-w-[1320px] px-4 pt-8 lg:pt-0">
          <div className="grid gap-6 lg:min-h-[380px] lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div className="max-w-[520px] pb-8 pt-6 lg:pb-12 lg:pt-12">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Panel administrativo</p>
              <h1 className="mt-3 text-[28px] font-semibold leading-[1.05] tracking-[-0.04em] sm:text-[36px]">
                Cotizá lo que necesitás.
                <br />
                Recibí <span className="text-[#4f46ff]">múltiples propuestas.</span>
                <br />
                Elegí lo mejor.
              </h1>
              <p className="mt-4 max-w-[420px] text-sm leading-7 text-white/70">
                Gestioná tus solicitudes, cotizaciones y pedidos desde un solo lugar.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-[#4f46ff] px-5 text-sm font-semibold text-white shadow-[0_14px_35px_rgba(79,70,255,0.35)]"
                  href="/dashboard/comprador/solicitudes/nueva"
                >
                  Nueva solicitud de cotización
                </Link>
                <Link
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-white/25 px-5 text-sm font-semibold text-white hover:bg-white/10"
                  href="/dashboard/comprador/solicitudes"
                >
                  Ver mis solicitudes
                </Link>
              </div>
            </div>

            <div className="relative hidden h-full lg:block">
              <Image
                alt="Hero ATAR"
                className="pointer-events-none absolute bottom-[-60px] right-0 h-auto w-[520px] max-w-none object-contain drop-shadow-[0_44px_120px_rgba(2,6,23,0.64)]"
                key={HERO_DASH_IMAGE_SRC}
                priority
                src={HERO_DASH_IMAGE_SRC}
                width={880}
                height={880}
              />
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1320px] space-y-6 px-4 py-6">
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eef2ff] text-[#4f46ff]">
                <Icon name={kpi.icon} />
              </span>
              <p className="mt-4 text-[28px] font-semibold leading-none tracking-[-0.03em] text-slate-950">
                {kpi.value}
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-950">{kpi.label}</p>
              <p className="mt-1 text-xs text-slate-500">{kpi.hint}</p>
            </div>
          ))}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-950">Cotizá por categoría</h2>
            <Link className="inline-flex items-center gap-2 text-xs font-semibold text-[#4f46ff]" href="/dashboard/comprador/solicitudes/nueva">
              Ver todas las categorías
              <Icon name="chev-right" />
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.label}
                className="group flex min-h-[268px] flex-col rounded-[18px] border border-slate-200 bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(15,23,42,0.08)]"
                href={category.href}
              >
                <div className="relative flex min-h-[180px] flex-1 items-center justify-center">
                  <CategoryIcon imageSrc={category.imageSrc} />
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold tracking-[-0.02em] text-slate-950">{category.label}</p>
                  </div>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full text-[#2563ff] transition group-hover:translate-x-0.5">
                    <Icon name="chev-right" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-950">Acciones rápidas</h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                className="relative rounded-[18px] border border-slate-200 bg-white px-4 py-4 shadow-sm transition hover:bg-slate-50"
                href={action.href}
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#eef2ff] text-[#4f46ff]">
                    <Icon name={action.icon} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-950">{action.label}</p>
                    <p className="mt-1 text-[11px] text-slate-500">{action.subtitle}</p>
                  </div>
                </div>
                {typeof action.badge === 'number' && action.badge > 0 ? (
                  <span className="absolute right-3 top-3 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#4f46ff] px-1.5 text-[11px] font-semibold text-white">
                    {action.badge}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-[22px] font-semibold tracking-[-0.03em] text-slate-950">Proveedores destacados</h2>
            <Link className="text-xs font-semibold text-[#4f46ff]" href="/dashboard/comprador/proveedores">
              Ver todos
            </Link>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {featuredProviders.map((provider, index) => {
              const accent = [
                'bg-[#eef2ff] text-[#3053ff]',
                'bg-[#eefbf4] text-[#1b8f48]',
                'bg-[#edf9f2] text-[#1e8b4f]',
                'bg-[#fff4ef] text-[#d44d1f]',
              ][index % 4];

              const tags = provider.tags?.slice(0, 3).join(', ') ?? provider.category;

              return (
                <article key={provider.id} className="rounded-[18px] border border-[#edf0f7] bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-xs font-bold ${accent}`}>
                        {provider.name.slice(0, 2).toUpperCase()}
                      </div>
                      <p className="text-[18px] font-semibold tracking-[-0.03em] text-[#24305f]">{provider.name}</p>
                    </div>
                    <button className="text-[#b0b6d1]" type="button">
                      •••
                    </button>
                  </div>

                  <div className="mt-4 inline-flex items-center gap-2 text-[11px] font-semibold text-[#1ba84c]">
                    <span className="h-2 w-2 rounded-full bg-[#21c15d]" />
                    Verificado
                  </div>
                  <p className="mt-3 min-h-[34px] text-xs leading-5 text-[#6f77a3]">{tags}</p>
                  <div className="mt-4 flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#f0a11e]">★ {provider.rating}</span>
                    <Link className="font-semibold text-[#4f46ff]" href="/dashboard/comprador/proveedores">
                      Ver perfil
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-[22px] font-semibold tracking-[-0.03em] text-slate-950">Mis solicitudes recientes</h2>
            <Link className="text-xs font-semibold text-[#4f46ff]" href="/dashboard/comprador/solicitudes">
              Ver todas
            </Link>
          </div>

          <div className="mt-4 overflow-hidden rounded-[18px] border border-slate-200">
            <div className="grid grid-cols-[1.2fr_0.7fr_0.8fr_0.6fr_0.9fr_52px] gap-0 bg-slate-50 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              <span>Solicitud</span>
              <span>Productos</span>
              <span>Fecha</span>
              <span>Propuestas</span>
              <span>Estado</span>
              <span className="text-right">Acc.</span>
            </div>
            {recentRequests.length === 0 ? (
              <div className="px-4 py-6 text-sm text-slate-500">Todavía no tenés solicitudes.</div>
            ) : (
              recentRequests.map((row) => (
                <div
                  key={row.id}
                  className="grid grid-cols-[1.2fr_0.7fr_0.8fr_0.6fr_0.9fr_52px] items-center gap-0 border-t border-slate-200 px-4 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-950">#{row.code}</p>
                  </div>
                  <p className="truncate text-xs text-slate-600">{row.product}</p>
                  <p className="text-xs text-slate-600">{row.date}</p>
                  <p className="text-xs font-semibold text-slate-700">{row.quotes}</p>
                  <span className={`inline-flex w-fit rounded-full px-3 py-1 text-[11px] font-semibold ${row.statusTone}`}>
                    {row.statusLabel}
                  </span>
                  <div className="flex justify-end">
                    <Link
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      href="/dashboard/comprador/solicitudes"
                    >
                      <Icon name="eye" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_0.8fr]">
          <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eef2ff] text-[#4f46ff]">
                <Icon name="msg" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-950">¿Necesitás ayuda para cotizar?</p>
                <p className="mt-1 text-xs text-slate-500">Nuestro equipo está listo para acompañarte.</p>
              </div>
            </div>
            <button className="mt-4 inline-flex h-9 items-center justify-center rounded-xl bg-[#4f46ff] px-4 text-xs font-semibold text-white" type="button">
              Contactar asesor
            </button>
          </div>

          {[
            { title: 'Amplia red', text: '+1.200 proveedores verificados' },
            { title: 'Ahorro de tiempo', text: 'Cotizás una vez, recibís múltiples ofertas' },
            { title: 'Mejores decisiones', text: 'Compará precio, calidad y tiempos de entrega' },
            { title: 'Seguridad', text: 'Transacciones protegidas y confidenciales' },
          ].map((item) => (
            <div key={item.title} className="rounded-[22px] border border-slate-200 bg-white px-5 py-5 shadow-sm">
              <p className="text-xs font-semibold text-slate-950">{item.title}</p>
              <p className="mt-2 text-xs leading-5 text-slate-500">{item.text}</p>
            </div>
          ))}
        </section>
      </main>
    </>
  );
}
