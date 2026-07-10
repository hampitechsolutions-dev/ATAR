'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { atarApi, type SupplierDirectoryRecord } from '@/lib/atar-api';
import { useBuyerDashboardData } from '@/lib/dashboard-hooks';
import { mapSupplierToProviderDirectoryItem } from '@/lib/provider-directory';

const HERO_DASH_IMAGE_SRC = '/herodashc.png?v=20260625-2';

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

function Icon({ name }: { name: 'plus' | 'file' | 'box' | 'users' | 'heart' | 'chat' | 'eye' }) {
  const cls = 'h-4 w-4';

  if (name === 'plus') {
    return (
      <svg aria-hidden="true" className={cls} fill="none" viewBox="0 0 24 24">
        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
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

  if (name === 'eye') {
    return (
      <svg aria-hidden="true" className={cls} fill="none" viewBox="0 0 24 24">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className={cls} fill="none" viewBox="0 0 24 24">
      <path d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4v8z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

export default function DashboardCompradorPanelPage() {
  const { session, requests, loading, error } = useBuyerDashboardData();
  const [suppliers, setSuppliers] = useState<SupplierDirectoryRecord[]>([]);

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

  const featuredProviders = useMemo(() => {
    return suppliers.map(mapSupplierToProviderDirectoryItem).slice(0, 4);
  }, [suppliers]);

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
      .slice(0, 5);
  }, [requests]);

  const quickActions = [
    { label: 'Nueva solicitud', href: '/dashboard/comprador/solicitudes/nueva', icon: 'plus' as const },
    { label: 'Mis solicitudes', href: '/dashboard/comprador/solicitudes', icon: 'file' as const },
    { label: 'Mis pedidos', href: '/dashboard/comprador/pedidos', icon: 'box' as const },
    { label: 'Proveedores', href: '/dashboard/comprador/proveedores', icon: 'users' as const },
    { label: 'Favoritos', href: '/dashboard/comprador/favoritos', icon: 'heart' as const },
    { label: 'Mensajes', href: '/dashboard/comprador/mensajes', icon: 'chat' as const },
  ];

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
        <div className="relative mx-auto max-w-[1320px] px-4 pt-8 lg:pt-0">
          <div className="grid gap-6 lg:min-h-[340px] lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div className="max-w-[520px] pb-8 pt-6 lg:pb-12 lg:pt-12">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Panel administrativo</p>
              <h1 className="mt-3 text-[28px] font-semibold leading-[1.05] tracking-[-0.04em] sm:text-[36px]">
                Gestioná tus compras con datos reales.
              </h1>
              <p className="mt-4 max-w-[420px] text-sm leading-7 text-white/70">
                Solicitudes, cotizaciones, pedidos y proveedores conectados a la base activa.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#4f46ff] px-5 text-sm font-semibold text-white sm:w-auto"
                  href="/dashboard/comprador/solicitudes/nueva"
                >
                  Nueva solicitud
                </Link>
                <Link
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-white/25 px-5 text-sm font-semibold text-white hover:bg-white/10 sm:w-auto"
                  href="/dashboard/comprador/proveedores"
                >
                  Ver proveedores
                </Link>
              </div>
            </div>

            <div className="relative hidden h-full lg:block">
              <Image
                alt="Hero ATAR"
                className="pointer-events-none absolute bottom-[-60px] right-0 h-auto w-[520px] max-w-none object-contain"
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

        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <p className="text-[24px] font-semibold leading-none tracking-[-0.03em] text-slate-950 sm:text-[28px]">
                {kpi.value}
              </p>
              <p className="mt-2 text-[13px] font-semibold text-slate-950 sm:text-sm">{kpi.label}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              className="rounded-[18px] border border-slate-200 bg-white px-4 py-4 shadow-sm transition hover:bg-slate-50"
              href={action.href}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#eef2ff] text-[#4f46ff]">
                <Icon name={action.icon} />
              </span>
              <p className="mt-3 text-sm font-semibold text-slate-950">{action.label}</p>
            </Link>
          ))}
        </section>

        <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-[22px] font-semibold tracking-[-0.03em] text-slate-950">Proveedores activos</h2>
            <Link className="text-xs font-semibold text-[#4f46ff]" href="/dashboard/comprador/proveedores">
              Ver todos
            </Link>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {featuredProviders.map((provider) => (
              <article key={provider.id} className="rounded-[18px] border border-[#edf0f7] bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[18px] font-semibold tracking-[-0.03em] text-[#24305f]">{provider.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{provider.city}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                    {provider.category}
                  </span>
                </div>

                {provider.description ? (
                  <p className="mt-3 min-h-[34px] text-xs leading-5 text-[#6f77a3]">{provider.description}</p>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  {provider.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex justify-end">
                  <Link className="text-xs font-semibold text-[#4f46ff]" href={`/productos/${provider.slug}`}>
                    Ver ficha
                  </Link>
                </div>
              </article>
            ))}
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
            {recentRequests.length === 0 ? (
              <div className="px-4 py-6 text-sm text-slate-500">Todavía no tenés solicitudes.</div>
            ) : (
              recentRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm first:border-t-0">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-950">{request.productName?.trim() || request.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      #{shortenId(request.id)} · {formatDate(request.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
                      {request._count?.quotes ?? 0} propuestas
                    </span>
                    <Link
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      href={`/dashboard/comprador/solicitudes/${request.id}`}
                    >
                      <Icon name="eye" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </>
  );
}
