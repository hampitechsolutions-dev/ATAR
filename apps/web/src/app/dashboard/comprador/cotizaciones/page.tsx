'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardHero,
  DashboardShell,
  DashboardStatCard,
  dashboardInputClassName,
  dashboardSecondaryButtonClassName,
} from '@/components/dashboard/dashboard-ui';
import { atarApi, type QuoteRecord } from '@/lib/atar-api';
import {
  clearSession,
  getPrimaryMembershipRole,
  loadSession,
  saveSession,
  type WebSession,
} from '@/lib/session';

function formatCurrency(value: number | null | undefined, currency = 'ARS') {
  if (typeof value !== 'number') {
    return 'A consultar';
  }

  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return 'Sin fecha';
  }

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

function getStatusLabel(status: QuoteRecord['status']) {
  if (status === 'SUBMITTED') {
    return 'Pendiente';
  }

  if (status === 'AWARDED') {
    return 'Aceptada';
  }

  if (status === 'REJECTED') {
    return 'Rechazada';
  }

  return status;
}

function getStatusTone(status: QuoteRecord['status']) {
  if (status === 'AWARDED') {
    return 'bg-emerald-100 text-emerald-800';
  }

  if (status === 'REJECTED') {
    return 'bg-rose-100 text-rose-800';
  }

  return 'bg-amber-100 text-amber-800';
}

export default function BuyerQuotesPage() {
  const router = useRouter();
  const [session, setSession] = useState<WebSession | null>(null);
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'ALL' | QuoteRecord['status']>('ALL');

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const storedSession = loadSession();
      if (!storedSession) {
        router.replace('/acceso');
        return;
      }

      if (getPrimaryMembershipRole(storedSession.user) !== 'BUYER') {
        router.replace('/dashboard/proveedor');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const [user, buyerQuotes] = await Promise.all([
          atarApi.me(storedSession.accessToken),
          atarApi.getBuyerQuotes(storedSession.accessToken),
        ]);

        if (cancelled) {
          return;
        }

        const nextSession = {
          accessToken: storedSession.accessToken,
          user,
        };
        saveSession(nextSession);
        setSession(nextSession);
        setQuotes(buyerQuotes);
      } catch (bootstrapError) {
        clearSession();
        if (!cancelled) {
          setError(
            bootstrapError instanceof Error
              ? bootstrapError.message
              : 'No se pudo cargar la central de cotizaciones.',
          );
          router.replace('/acceso');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const filteredQuotes = useMemo(() => {
    const query = search.trim().toLowerCase();
    return quotes.filter((quote) => {
      const matchesStatus = status === 'ALL' || quote.status === status;
      const haystack = [
        quote.request?.title,
        quote.request?.productName,
        quote.supplierCompany?.name,
        quote.request?.category,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch = query.length === 0 || haystack.includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [quotes, search, status]);

  const pendingCount = useMemo(
    () => quotes.filter((quote) => quote.status === 'SUBMITTED').length,
    [quotes],
  );
  const acceptedCount = useMemo(
    () => quotes.filter((quote) => quote.status === 'AWARDED').length,
    [quotes],
  );
  const rejectedCount = useMemo(
    () => quotes.filter((quote) => quote.status === 'REJECTED').length,
    [quotes],
  );

  return (
    <DashboardShell role="buyer" session={session}>
      <DashboardHero
        actions={
          <Link className={dashboardSecondaryButtonClassName} href="/dashboard/comprador">
            Volver al dashboard
          </Link>
        }
        description="Centraliza en una sola vista todas las cotizaciones recibidas, con estado, monto, vencimiento y acceso directo al detalle comercial."
        eyebrow="Central de cotizaciones"
        title={
          <>
            Tus cotizaciones en <span className="text-indigo-600">un solo clic</span>
          </>
        }
      />

      {error ? (
        <div className="rounded-[1.5rem] bg-rose-100 px-5 py-4 text-sm text-rose-800">{error}</div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <DashboardStatCard helper="En revision" label="Pendientes" value={pendingCount} />
        <DashboardStatCard helper="Ganadas" label="Aceptadas" value={acceptedCount} />
        <DashboardStatCard helper="Descartadas" label="Rechazadas" value={rejectedCount} />
      </div>

      <DashboardCard>
        <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
          <input
            className={dashboardInputClassName}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por producto, solicitud, proveedor o categoria"
            value={search}
          />
          <select
            className={dashboardInputClassName}
            onChange={(event) => setStatus(event.target.value as 'ALL' | QuoteRecord['status'])}
            value={status}
          >
            <option value="ALL">Todos los estados</option>
            <option value="SUBMITTED">Pendiente</option>
            <option value="AWARDED">Aceptada</option>
            <option value="REJECTED">Rechazada</option>
          </select>
        </div>
      </DashboardCard>

      <div className="space-y-4">
        {loading ? (
          <DashboardEmptyState
            description="Estamos recopilando todas tus cotizaciones."
            title="Cargando cotizaciones..."
          />
        ) : filteredQuotes.length === 0 ? (
          <DashboardEmptyState
            description="No encontramos cotizaciones con esos filtros."
            title="Sin cotizaciones"
          />
        ) : (
          filteredQuotes.map((quote) => (
            <DashboardCard key={quote.id}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getStatusTone(
                        quote.status,
                      )}`}
                    >
                      {getStatusLabel(quote.status)}
                    </span>
                    <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      {quote.request?.category ?? 'Solicitud'}
                    </span>
                  </div>
                  <h2 className="text-xl font-semibold text-slate-950">
                    {quote.request?.productName ?? quote.request?.title ?? 'Cotizacion sin titulo'}
                  </h2>
                  <p className="text-sm text-slate-600">
                    Vendedor: {quote.supplierCompany?.name ?? 'Proveedor'}
                  </p>
                  <p className="text-sm text-slate-500">
                    Vencimiento: {formatDate(quote.request?.dueDate)}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[320px] lg:grid-cols-1">
                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Monto total</p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">
                      {formatCurrency(quote.amount, quote.currency)}
                    </p>
                  </div>
                  <Link
                    className="inline-flex items-center justify-center rounded-full border border-indigo-200 bg-indigo-50 px-5 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
                    href={`/dashboard/comprador/cotizaciones/${quote.id}`}
                  >
                    Ver detalle completo
                  </Link>
                </div>
              </div>
            </DashboardCard>
          ))
        )}
      </div>
    </DashboardShell>
  );
}
