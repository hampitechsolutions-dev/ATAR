'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  DashboardCard,
  DashboardDarkCard,
  DashboardEmptyState,
  DashboardHero,
  DashboardSectionHeading,
  DashboardShell,
  DashboardStatCard,
  dashboardInputClassName,
  dashboardPrimaryButtonClassName,
  dashboardSecondaryButtonClassName,
  dashboardTextareaClassName,
} from '@/components/dashboard/dashboard-ui';
import {
  atarApi,
  type OrderFulfillmentStatus,
  type QuoteRecord,
  type RequestRecord,
} from '@/lib/atar-api';
import {
  clearSession,
  getPrimaryMembershipRole,
  loadSession,
  saveSession,
  type WebSession,
} from '@/lib/session';

const initialQuoteForm = {
  amount: '',
  currency: 'ARS',
  leadTimeDays: '',
  paymentTerms: '',
  technicalComment: '',
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) {
    return 'Sin fecha';
  }

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

function getQuoteStatusStyles(status: QuoteRecord['status']) {
  if (status === 'AWARDED') {
    return 'bg-emerald-400/15 text-emerald-300';
  }

  if (status === 'REJECTED') {
    return 'bg-rose-400/15 text-rose-300';
  }

  return 'bg-white/10 text-slate-200';
}

function getRequestStatusStyles(status: RequestRecord['status']) {
  if (status === 'ORDER_ISSUED') {
    return 'bg-violet-400/15 text-violet-700';
  }

  if (status === 'NEGOTIATING') {
    return 'bg-amber-400/15 text-amber-700';
  }

  if (status === 'AWARDED') {
    return 'bg-emerald-400/15 text-emerald-700';
  }

  if (status === 'REVIEWING') {
    return 'bg-sky-400/15 text-sky-700';
  }

  return 'bg-slate-200 text-slate-700';
}

function getFulfillmentLabel(status: OrderFulfillmentStatus) {
  if (status === 'IN_PRODUCTION') {
    return 'En produccion';
  }

  if (status === 'CONFIRMED') {
    return 'Confirmada';
  }

  if (status === 'DISPATCHED') {
    return 'Despachada';
  }

  if (status === 'DELIVERED') {
    return 'Entregada';
  }

  return 'Emitida';
}

function getNextFulfillmentAction(status: OrderFulfillmentStatus) {
  if (status === 'ISSUED') {
    return { action: 'CONFIRM_ORDER' as const, label: 'Confirmar orden' };
  }

  if (status === 'CONFIRMED') {
    return { action: 'START_PRODUCTION' as const, label: 'Iniciar produccion' };
  }

  if (status === 'IN_PRODUCTION') {
    return { action: 'MARK_DISPATCHED' as const, label: 'Marcar despacho' };
  }

  if (status === 'DISPATCHED') {
    return { action: 'MARK_DELIVERED' as const, label: 'Marcar entrega' };
  }

  return null;
}

export default function DashboardProveedorPage() {
  const router = useRouter();
  const [session, setSession] = useState<WebSession | null>(null);
  const [openRequests, setOpenRequests] = useState<RequestRecord[]>([]);
  const [myQuotes, setMyQuotes] = useState<QuoteRecord[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [form, setForm] = useState(initialQuoteForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingFulfillmentId, setUpdatingFulfillmentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const storedSession = loadSession();
      if (!storedSession) {
        router.replace('/acceso');
        return;
      }

      if (getPrimaryMembershipRole(storedSession.user) !== 'SUPPLIER') {
        router.replace('/dashboard/comprador');
        return;
      }

      try {
        setLoading(true);
        const [user, requests, quotes] = await Promise.all([
          atarApi.me(storedSession.accessToken),
          atarApi.getOpenRequests(storedSession.accessToken),
          atarApi.getSupplierQuotes(storedSession.accessToken),
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
        setOpenRequests(requests);
        setMyQuotes(quotes);
        setSelectedRequestId(requests[0]?.id ?? null);
      } catch (bootstrapError) {
        clearSession();
        if (!cancelled) {
          setError(bootstrapError instanceof Error ? bootstrapError.message : 'No se pudo cargar el dashboard.');
          router.replace('/acceso');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const sentQuotesCount = myQuotes.length;
  const responseRate = useMemo(() => {
    if (openRequests.length === 0) {
      return 0;
    }

    return Math.round((myQuotes.length / openRequests.length) * 100);
  }, [myQuotes.length, openRequests.length]);

  const quotedAmount = useMemo(() => {
    return myQuotes.reduce((accumulator, quote) => accumulator + (quote.amount ?? 0), 0);
  }, [myQuotes]);

  async function refreshData(token: string, nextSelectedRequestId?: string | null) {
    const [requests, quotes] = await Promise.all([
      atarApi.getOpenRequests(token),
      atarApi.getSupplierQuotes(token),
    ]);

    setOpenRequests(requests);
    setMyQuotes(quotes);
    setSelectedRequestId(nextSelectedRequestId ?? requests[0]?.id ?? null);
  }

  async function handleSubmitQuote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.accessToken || !selectedRequestId) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setMessage(null);
      await atarApi.createQuote(
        selectedRequestId,
        {
          amount: form.amount ? Number(form.amount) : undefined,
          currency: form.currency,
          leadTimeDays: form.leadTimeDays ? Number(form.leadTimeDays) : undefined,
          paymentTerms: form.paymentTerms || undefined,
          technicalComment: form.technicalComment || undefined,
        },
        session.accessToken,
      );

      setForm(initialQuoteForm);
      await refreshData(session.accessToken, selectedRequestId);
      setMessage('Cotizacion enviada correctamente.');
    } catch (quoteError) {
      setError(quoteError instanceof Error ? quoteError.message : 'No se pudo enviar la cotizacion.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateFulfillment(
    requestId: string,
    action: 'CONFIRM_ORDER' | 'START_PRODUCTION' | 'MARK_DISPATCHED' | 'MARK_DELIVERED',
  ) {
    if (!session?.accessToken) {
      return;
    }

    try {
      setUpdatingFulfillmentId(requestId);
      setError(null);
      setMessage(null);
      await atarApi.updateFulfillment(requestId, { action }, session.accessToken);
      await refreshData(session.accessToken, selectedRequestId);
      setMessage('Seguimiento operativo actualizado correctamente.');
    } catch (fulfillmentError) {
      setError(
        fulfillmentError instanceof Error
          ? fulfillmentError.message
          : 'No se pudo actualizar el seguimiento operativo.',
      );
    } finally {
      setUpdatingFulfillmentId(null);
    }
  }

  const selectedRequest = openRequests.find((request) => request.id === selectedRequestId) ?? null;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-950">
        <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-5 shadow-sm">
          Cargando dashboard proveedor...
        </div>
      </main>
    );
  }

  return (
    <DashboardShell role="supplier" session={session}>
      <DashboardHero
        actions={
          <>
            <Link className={dashboardPrimaryButtonClassName} href="/proveedores">
              Explorar directorio
            </Link>
            <Link className={dashboardSecondaryButtonClassName} href="/dashboard/proveedor/reportes">
              Ver reportes
            </Link>
          </>
        }
        aside={
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-[1.5rem] border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
              <p className="text-xs uppercase tracking-[0.18em] text-indigo-600">
                Cuenta activa
              </p>
              <p className="mt-2 font-semibold">{session?.user.firstName}</p>
            </div>
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Cobertura</p>
              <p className="mt-2 font-semibold text-slate-950">
                {openRequests.length} oportunidades abiertas
              </p>
            </div>
          </div>
        }
        description="Responde oportunidades, envia cotizaciones y da seguimiento a pedidos con una interfaz alineada a la identidad ATAR en todos los tamaños de pantalla."
        eyebrow="Panel proveedor"
        title={
          <>
            Convierte oportunidades en <span className="text-indigo-600">negocio recurrente</span>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard helper="Mercado abierto" label="Oportunidades abiertas" value={openRequests.length} />
        <DashboardStatCard helper="Actividad comercial" label="Cotizaciones enviadas" value={sentQuotesCount} />
        <DashboardStatCard helper="Cobertura" label="Tasa de respuesta" value={`${responseRate}%`} />
        <DashboardStatCard
          helper="Potencial facturado"
          label="Monto cotizado"
          value={quotedAmount > 0 ? formatCurrency(quotedAmount) : '$0'}
        />
      </div>

      {error ? <div className="rounded-[1.5rem] bg-rose-100 px-5 py-4 text-sm text-rose-800">{error}</div> : null}
      {message ? <div className="rounded-[1.5rem] bg-emerald-100 px-5 py-4 text-sm text-emerald-800">{message}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <DashboardCard>
          <DashboardSectionHeading
            action={
              <button
                className={dashboardSecondaryButtonClassName}
                onClick={() => {
                  if (session) {
                    void refreshData(session.accessToken, selectedRequestId);
                  }
                }}
                type="button"
              >
                Actualizar
              </button>
            }
            description="Solicitudes publicadas por compradores autenticados y listas para cotizar."
            title="Oportunidades abiertas"
          />

          <div className="mt-5 space-y-4">
            {openRequests.length === 0 ? (
              <DashboardEmptyState
                description="No hay oportunidades abiertas en este momento."
                title="Sin oportunidades"
              />
            ) : (
              openRequests.map((request) => (
                <button
                  key={request.id}
                  className={`w-full rounded-[1.5rem] border p-4 text-left transition ${
                    selectedRequestId === request.id
                      ? 'border-indigo-300 bg-indigo-50 shadow-[0_12px_24px_rgba(99,102,241,0.12)]'
                      : 'border-slate-200 bg-slate-50/80 hover:border-slate-300 hover:bg-white'
                  }`}
                  onClick={() => setSelectedRequestId(request.id)}
                  type="button"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{request.category}</p>
                      <h3 className="mt-2 text-lg font-semibold text-slate-950">{request.title}</h3>
                      <p className="mt-1 text-sm text-slate-500">Comprador: {request.buyerCompany?.name ?? 'No informado'}</p>
                    </div>
                    <div className="flex flex-col items-start gap-2 lg:items-end">
                      <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
                        {request.status}
                      </span>
                      <span className="text-sm text-slate-500">Fecha limite: {formatDate(request.dueDate)}</span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </DashboardCard>

        <DashboardCard>
          <DashboardSectionHeading
            description={
              selectedRequest
                ? selectedRequest.description
                : 'Selecciona una oportunidad para cotizar.'
            }
            title="Enviar cotizacion"
          />

          <form className="mt-5 space-y-4" onSubmit={handleSubmitQuote}>
            <label className="block space-y-2 text-sm">
              <span className="text-slate-700">Monto</span>
              <input
                className={dashboardInputClassName}
                min="0"
                onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                placeholder="1250000"
                step="0.01"
                type="number"
                value={form.amount}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2 text-sm">
                <span className="text-slate-700">Moneda</span>
                <input
                  className={dashboardInputClassName}
                  onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value }))}
                  value={form.currency}
                />
              </label>
              <label className="block space-y-2 text-sm">
                <span className="text-slate-700">Plazo (dias)</span>
                <input
                  className={dashboardInputClassName}
                  min="0"
                  onChange={(event) => setForm((current) => ({ ...current, leadTimeDays: event.target.value }))}
                  placeholder="7"
                  type="number"
                  value={form.leadTimeDays}
                />
              </label>
            </div>
            <label className="block space-y-2 text-sm">
              <span className="text-slate-700">Condiciones de pago</span>
              <input
                className={dashboardInputClassName}
                onChange={(event) => setForm((current) => ({ ...current, paymentTerms: event.target.value }))}
                placeholder="30 dias fecha factura"
                value={form.paymentTerms}
              />
            </label>
            <label className="block space-y-2 text-sm">
              <span className="text-slate-700">Comentario tecnico</span>
              <textarea
                className={dashboardTextareaClassName}
                onChange={(event) => setForm((current) => ({ ...current, technicalComment: event.target.value }))}
                placeholder="Incluye observaciones tecnicas, alcances y condiciones adicionales."
                value={form.technicalComment}
              />
            </label>
            <button
              className={`w-full ${dashboardPrimaryButtonClassName}`}
              disabled={submitting || !selectedRequestId}
              type="submit"
            >
              {submitting ? 'Enviando...' : 'Enviar cotizacion'}
            </button>
          </form>
        </DashboardCard>
      </div>

      <DashboardDarkCard>
        <DashboardSectionHeading
          action={
            <div className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-100">
              {myQuotes.length} propuestas cargadas
            </div>
          }
          description="Revisa el historial de propuestas enviadas desde este perfil proveedor."
          title={<span className="text-white">Cotizaciones enviadas</span>}
        />

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {myQuotes.length === 0 ? (
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 text-sm text-slate-300 md:col-span-2 xl:col-span-3">
              Todavia no enviaste cotizaciones desde esta cuenta.
            </div>
          ) : (
            myQuotes.map((quote) => {
              const nextFulfillmentAction = quote.request?.order
                ? getNextFulfillmentAction(quote.request.order.fulfillmentStatus)
                : null;

              return (
                <article key={quote.id} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{quote.request?.title ?? 'Solicitud'}</p>
                  <p className="mt-3 text-2xl font-semibold text-white">
                    {quote.amount ? formatCurrency(quote.amount) : 'A consultar'}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${getQuoteStatusStyles(quote.status)}`}
                    >
                      {quote.status}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${getRequestStatusStyles(quote.request?.status ?? 'DRAFT')}`}
                    >
                      Pedido: {quote.request?.status ?? '-'}
                    </span>
                  </div>
                  {quote.request?.order ? (
                    <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                      <p className="text-sm font-semibold text-white">
                        Orden: {quote.request.order.orderNumber}
                      </p>
                      <p className="mt-1 text-sm text-slate-300">
                        Cumplimiento: {getFulfillmentLabel(quote.request.order.fulfillmentStatus)}
                      </p>
                      <p className="mt-1 text-sm text-slate-300">
                        Fecha prometida: {formatDate(quote.request.order.promisedDate)}
                      </p>
                      <p className="mt-1 text-sm text-slate-300">
                        {quote.request.order.notes ?? 'Sin notas operativas.'}
                      </p>
                      {quote.status === 'AWARDED' ? (
                        <div className="mt-3">
                          {nextFulfillmentAction ? (
                            <button
                              className="rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                              disabled={updatingFulfillmentId === quote.requestId}
                              onClick={() =>
                                void handleUpdateFulfillment(
                                  quote.requestId,
                                  nextFulfillmentAction.action,
                                )
                              }
                              type="button"
                            >
                              {updatingFulfillmentId === quote.requestId
                                ? 'Actualizando...'
                                : nextFulfillmentAction.label}
                            </button>
                          ) : (
                            <span className="rounded-full bg-emerald-400/15 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
                              Cumplimiento completo
                            </span>
                          )}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  <p className="mt-1 text-sm text-slate-300">Pago: {quote.paymentTerms ?? 'No informado'}</p>
                  <p className="mt-1 text-sm text-slate-300">Plazo: {quote.leadTimeDays ?? '-'} dias</p>
                </article>
              );
            })
          )}
        </div>
      </DashboardDarkCard>
    </DashboardShell>
  );
}
