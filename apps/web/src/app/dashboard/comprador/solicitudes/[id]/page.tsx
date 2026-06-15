'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import {
  DashboardCard,
  DashboardDarkCard,
  DashboardEmptyState,
  DashboardHero,
  DashboardInfoBadge,
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
  type QuoteStatus,
  type RequestEventRecord,
  type RequestRecord,
} from '@/lib/atar-api';

function formatCurrency(value: number | null) {
  if (typeof value !== 'number') {
    return 'A consultar';
  }

  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value);
}

function compareQuotes(a: QuoteRecord, b: QuoteRecord) {
  const amountA = a.amount ?? Number.MAX_SAFE_INTEGER;
  const amountB = b.amount ?? Number.MAX_SAFE_INTEGER;
  return amountA - amountB;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
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

function toDateInputValue(value: string | null | undefined) {
  if (!value) {
    return '';
  }

  return new Date(value).toISOString().slice(0, 10);
}

function getQuoteStatusStyles(status: QuoteStatus) {
  if (status === 'AWARDED') {
    return 'bg-emerald-400/15 text-emerald-100 border border-emerald-300/30';
  }

  if (status === 'REJECTED') {
    return 'bg-rose-400/15 text-rose-100 border border-rose-300/30';
  }

  return 'bg-white/10 text-sky-50 border border-white/15';
}

function getEventStyles(type: RequestEventRecord['type']) {
  if (type === 'REQUEST_AWARDED') {
    return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  }

  if (type === 'NEGOTIATION_STARTED') {
    return 'bg-amber-100 text-amber-800 border-amber-200';
  }

  if (type === 'ORDER_ISSUED') {
    return 'bg-violet-100 text-violet-800 border-violet-200';
  }

  if (type === 'ORDER_UPDATED') {
    return 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200';
  }

  if (type === 'ORDER_CONFIRMED') {
    return 'bg-indigo-100 text-indigo-800 border-indigo-200';
  }

  if (type === 'PRODUCTION_STARTED') {
    return 'bg-orange-100 text-orange-800 border-orange-200';
  }

  if (type === 'ORDER_DISPATCHED' || type === 'ORDER_DELIVERED') {
    return 'bg-teal-100 text-teal-800 border-teal-200';
  }

  if (type === 'QUOTE_SUBMITTED' || type === 'QUOTE_UPDATED') {
    return 'bg-sky-100 text-sky-800 border-sky-200';
  }

  return 'bg-slate-100 text-slate-700 border-slate-200';
}

function getRequestStatusLabel(status: RequestRecord['status']) {
  if (status === 'AWARDED') {
    return 'Adjudicada';
  }

  if (status === 'NEGOTIATING') {
    return 'En negociacion';
  }

  if (status === 'ORDER_ISSUED') {
    return 'Orden emitida';
  }

  return status;
}

function getFulfillmentLabel(status: OrderFulfillmentStatus) {
  if (status === 'IN_PRODUCTION') {
    return 'En produccion';
  }

  if (status === 'ISSUED') {
    return 'Emitida';
  }

  if (status === 'CONFIRMED') {
    return 'Confirmada';
  }

  if (status === 'DISPATCHED') {
    return 'Despachada';
  }

  return 'Entregada';
}

function getFulfillmentTone(status: OrderFulfillmentStatus) {
  if (status === 'CONFIRMED') {
    return 'bg-indigo-100 text-indigo-800';
  }

  if (status === 'IN_PRODUCTION') {
    return 'bg-orange-100 text-orange-800';
  }

  if (status === 'DISPATCHED') {
    return 'bg-teal-100 text-teal-800';
  }

  if (status === 'DELIVERED') {
    return 'bg-emerald-100 text-emerald-800';
  }

  return 'bg-violet-100 text-violet-800';
}

export default function BuyerRequestDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { session, refreshSession, role } = useAuth();
  const [request, setRequest] = useState<RequestRecord | null>(null);
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [awardingQuoteId, setAwardingQuoteId] = useState<string | null>(null);
  const [progressingAction, setProgressingAction] = useState<'START_NEGOTIATION' | 'ISSUE_ORDER' | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [orderForm, setOrderForm] = useState({
    orderNumber: '',
    promisedDate: '',
    notes: '',
    fulfillmentStatus: 'ISSUED' as OrderFulfillmentStatus,
  });

  const requestId = typeof params.id === 'string' ? params.id : '';

  const syncRequestState = useCallback(
    async (accessToken: string) => {
      const detail = await atarApi.getRequestDetail(requestId, accessToken);
      setRequest(detail);
      setQuotes(detail.quotes ?? []);
      return detail;
    },
    [requestId],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadDetail() {
      if (!session?.accessToken) {
        return;
      }

      if (role && role !== 'BUYER') {
        router.replace('/dashboard/proveedor');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const fresh = await refreshSession();
        if (!fresh || cancelled) {
          return;
        }

        if (cancelled) {
          return;
        }

        await syncRequestState(fresh.accessToken);
      } catch (detailError) {
        if (!cancelled) {
          setError(detailError instanceof Error ? detailError.message : 'No se pudo cargar el detalle.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDetail();

    return () => {
      cancelled = true;
    };
  }, [refreshSession, role, router, session?.accessToken, syncRequestState]);

  useEffect(() => {
    setOrderForm({
      orderNumber: request?.order?.orderNumber ?? '',
      promisedDate: toDateInputValue(request?.order?.promisedDate),
      notes: request?.order?.notes ?? '',
      fulfillmentStatus: request?.order?.fulfillmentStatus ?? 'ISSUED',
    });
  }, [request?.order]);

  async function handleAward(quoteId: string) {
    if (!session?.accessToken || !request) {
      return;
    }

    const selectedQuote = quotes.find((quote) => quote.id === quoteId);
    if (!selectedQuote) {
      return;
    }

    const confirmed = window.confirm(
      `Vas a adjudicar la solicitud a ${selectedQuote.supplierCompany?.name ?? 'este proveedor'}. Esta accion cerrara el pedido.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setAwardingQuoteId(quoteId);
      setError(null);
      setMessage(null);
      await atarApi.awardQuote(request.id, { quoteId }, session.accessToken);
      await syncRequestState(session.accessToken);
      setMessage('Cotizacion adjudicada correctamente. El pedido quedo cerrado para nuevas propuestas.');
    } catch (awardError) {
      setError(awardError instanceof Error ? awardError.message : 'No se pudo adjudicar la cotizacion.');
    } finally {
      setAwardingQuoteId(null);
    }
  }

  async function handleProgress(action: 'START_NEGOTIATION' | 'ISSUE_ORDER') {
    if (!session?.accessToken || !request) {
      return;
    }

    const confirmations = {
      START_NEGOTIATION:
        'Vas a iniciar la negociacion con el proveedor adjudicado. El pedido quedara en seguimiento comercial.',
      ISSUE_ORDER:
        'Vas a marcar la orden como emitida. Esta accion indica cierre comercial del pedido.',
    } as const;

    const confirmed = window.confirm(confirmations[action]);
    if (!confirmed) {
      return;
    }

    try {
      setProgressingAction(action);
      setError(null);
      setMessage(null);
      await atarApi.progressRequest(request.id, { action }, session.accessToken);
      await syncRequestState(session.accessToken);
      setMessage(
        action === 'START_NEGOTIATION'
          ? 'La solicitud paso a negociacion correctamente.'
          : 'La orden se marco como emitida correctamente.',
      );
    } catch (progressError) {
      setError(
        progressError instanceof Error
          ? progressError.message
          : 'No se pudo avanzar el estado comercial de la solicitud.',
      );
    } finally {
      setProgressingAction(null);
    }
  }

  async function handleSaveOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session?.accessToken || !request || request.status !== 'ORDER_ISSUED') {
      return;
    }

    try {
      setSavingOrder(true);
      setError(null);
      setMessage(null);
      await atarApi.upsertOrder(
        request.id,
        {
          orderNumber: orderForm.orderNumber || undefined,
          promisedDate: orderForm.promisedDate || undefined,
          notes: orderForm.notes || undefined,
          fulfillmentStatus: orderForm.fulfillmentStatus,
        },
        session.accessToken,
      );
      await syncRequestState(session.accessToken);
      setMessage('Orden y seguimiento actualizados correctamente.');
    } catch (orderError) {
      setError(orderError instanceof Error ? orderError.message : 'No se pudo actualizar la orden.');
    } finally {
      setSavingOrder(false);
    }
  }

  const sortedQuotes = useMemo(() => {
    return quotes.slice().sort((a, b) => {
      if (request?.awardedQuoteId && a.id === request.awardedQuoteId) {
        return -1;
      }

      if (request?.awardedQuoteId && b.id === request.awardedQuoteId) {
        return 1;
      }

      return compareQuotes(a, b);
    });
  }, [quotes, request?.awardedQuoteId]);

  const bestPrice = quotes.find((quote) => typeof quote.amount === 'number') ?? null;
  const fastest = useMemo(() => {
    return quotes
      .filter((quote) => typeof quote.leadTimeDays === 'number')
      .sort((a, b) => (a.leadTimeDays ?? 9999) - (b.leadTimeDays ?? 9999))[0] ?? null;
  }, [quotes]);

  if (loading) {
    return (
      <DashboardShell role="buyer" session={session}>
        <DashboardEmptyState
          description="Estamos preparando el comparador, el timeline y el seguimiento comercial."
          title="Cargando detalle..."
        />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="buyer" session={session}>
      <DashboardHero
        actions={
          <>
            <Link className={dashboardSecondaryButtonClassName} href="/dashboard/comprador/solicitudes">
              Volver a solicitudes
            </Link>
            <Link className={dashboardPrimaryButtonClassName} href="/dashboard/comprador">
              Volver al dashboard
            </Link>
          </>
        }
        aside={
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-[1.5rem] border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
              <p className="text-xs uppercase tracking-[0.18em] text-indigo-600">Cotizaciones</p>
              <p className="mt-2 font-semibold">{quotes.length} propuestas visibles</p>
            </div>
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Fecha limite</p>
              <p className="mt-2 font-semibold text-slate-950">{formatDate(request?.dueDate ?? null)}</p>
            </div>
          </div>
        }
        description={
          request?.description ?? 'No se pudo localizar esta solicitud dentro de tu cuenta.'
        }
        eyebrow="Detalle de solicitud"
        title={
          <>
            {request?.title ?? 'Solicitud no encontrada'}{' '}
            {request ? (
              <span className="text-indigo-600">
                {getRequestStatusLabel(request.status)}
              </span>
            ) : null}
          </>
        }
      />

      {request?.awardedQuote ? (
        <div className="flex flex-wrap gap-3">
          <DashboardInfoBadge tone="emerald">
            {getRequestStatusLabel(request.status)} con{' '}
            {request.awardedQuote.supplierCompany?.name ?? 'proveedor seleccionado'}
          </DashboardInfoBadge>
          {request.order ? (
            <DashboardInfoBadge tone="indigo">
              Orden {request.order.orderNumber}
            </DashboardInfoBadge>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[1.5rem] bg-rose-100 px-5 py-4 text-sm text-rose-800">{error}</div>
      ) : null}
      {message ? (
        <div className="rounded-[1.5rem] bg-emerald-100 px-5 py-4 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          helper="Categoria"
          label="Solicitud"
          value={request?.category ?? '-'}
        />
        <DashboardStatCard
          helper="Estado actual"
          label="Estado"
          value={request ? getRequestStatusLabel(request.status) : '-'}
        />
        <DashboardStatCard
          helper="Comparador"
          label="Mejor precio"
          value={bestPrice ? formatCurrency(bestPrice.amount) : 'Sin datos'}
        />
        <DashboardStatCard
          helper="Lead time"
          label="Entrega mas rapida"
          value={fastest?.leadTimeDays ? `${fastest.leadTimeDays} dias` : 'Sin datos'}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <section className="space-y-6">
          <DashboardCard>
            <DashboardSectionHeading
              description="Resumen comercial de la solicitud y su posicion actual dentro del flujo."
              title="Resumen"
            />
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Categoria</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{request?.category ?? '-'}</p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Estado</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {request ? getRequestStatusLabel(request.status) : '-'}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Cantidad de propuestas</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{quotes.length}</p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Fecha limite</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {formatDate(request?.dueDate ?? null)}
                </p>
              </div>
            </div>
          </DashboardCard>

          {request?.awardedQuote ? (
            <DashboardCard className="border-emerald-200 bg-emerald-50/80">
              <DashboardSectionHeading
                description="Proveedor seleccionado y proximo paso comercial."
                title="Oferta adjudicada"
              />
              <p className="mt-4 text-sm leading-7 text-emerald-900">
                Se selecciono a {request.awardedQuote.supplierCompany?.name ?? 'un proveedor'} por{' '}
                {formatCurrency(request.awardedQuote.amount)} con plazo estimado de{' '}
                {request.awardedQuote.leadTimeDays ?? '-'} dias.
              </p>
              <p className="mt-2 text-sm text-emerald-900">
                Condiciones: {request.awardedQuote.paymentTerms ?? 'No informadas'}
              </p>
              {request.order ? (
                <div className="mt-4 rounded-[1.5rem] border border-emerald-200 bg-white/80 p-4">
                  <p className="text-sm font-semibold text-emerald-900">Orden {request.order.orderNumber}</p>
                  <p className="mt-1 text-sm text-emerald-800">
                    Estado de cumplimiento: {getFulfillmentLabel(request.order.fulfillmentStatus)}
                  </p>
                  <p className="mt-1 text-sm text-emerald-800">
                    Fecha prometida: {formatDate(request.order.promisedDate)}
                  </p>
                </div>
              ) : null}
              <div className="mt-5 flex flex-wrap gap-3">
                {request.status === 'AWARDED' ? (
                  <button
                    className="inline-flex items-center justify-center rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={progressingAction !== null}
                    onClick={() => void handleProgress('START_NEGOTIATION')}
                    type="button"
                  >
                    {progressingAction === 'START_NEGOTIATION'
                      ? 'Iniciando negociacion...'
                      : 'Iniciar negociacion'}
                  </button>
                ) : null}
                {request.status === 'AWARDED' || request.status === 'NEGOTIATING' ? (
                  <button
                    className={dashboardPrimaryButtonClassName}
                    disabled={progressingAction !== null}
                    onClick={() => void handleProgress('ISSUE_ORDER')}
                    type="button"
                  >
                    {progressingAction === 'ISSUE_ORDER' ? 'Emitiendo orden...' : 'Emitir orden'}
                  </button>
                ) : null}
                {request.status === 'ORDER_ISSUED' ? (
                  <DashboardInfoBadge tone="indigo">Orden comercial emitida</DashboardInfoBadge>
                ) : null}
              </div>
            </DashboardCard>
          ) : null}

          {request?.status === 'ORDER_ISSUED' ? (
            <DashboardCard className="border-indigo-200 bg-indigo-50/70">
              <DashboardSectionHeading
                action={
                  request.order ? (
                    <DashboardInfoBadge tone="indigo">{request.order.orderNumber}</DashboardInfoBadge>
                  ) : null
                }
                description="Carga los datos operativos de la orden emitida para compartir seguimiento con el proveedor."
                title="Orden y seguimiento"
              />
              {request.order ? (
                <div className="mt-4 flex flex-wrap gap-3">
                  <span
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${getFulfillmentTone(request.order.fulfillmentStatus)}`}
                  >
                    {getFulfillmentLabel(request.order.fulfillmentStatus)}
                  </span>
                  <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-indigo-800">
                    Fecha prometida: {formatDate(request.order.promisedDate)}
                  </span>
                </div>
              ) : null}
              <form className="mt-5 space-y-4" onSubmit={handleSaveOrder}>
                <label className="block space-y-2 text-sm">
                  <span className="text-indigo-950">Numero de orden</span>
                  <input
                    className={dashboardInputClassName}
                    onChange={(event) =>
                      setOrderForm((current) => ({ ...current, orderNumber: event.target.value }))
                    }
                    value={orderForm.orderNumber}
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-2 text-sm">
                    <span className="text-indigo-950">Fecha prometida</span>
                    <input
                      className={dashboardInputClassName}
                      onChange={(event) =>
                        setOrderForm((current) => ({ ...current, promisedDate: event.target.value }))
                      }
                      type="date"
                      value={orderForm.promisedDate}
                    />
                  </label>
                  <label className="block space-y-2 text-sm">
                    <span className="text-indigo-950">Estado de cumplimiento</span>
                    <select
                      className={dashboardInputClassName}
                      onChange={(event) =>
                        setOrderForm((current) => ({
                          ...current,
                          fulfillmentStatus: event.target.value as OrderFulfillmentStatus,
                        }))
                      }
                      value={orderForm.fulfillmentStatus}
                    >
                      <option value="ISSUED">Emitida</option>
                      <option value="CONFIRMED">Confirmada</option>
                      <option value="IN_PRODUCTION">En produccion</option>
                      <option value="DISPATCHED">Despachada</option>
                      <option value="DELIVERED">Entregada</option>
                    </select>
                  </label>
                </div>
                <label className="block space-y-2 text-sm">
                  <span className="text-indigo-950">Notas operativas</span>
                  <textarea
                    className={dashboardTextareaClassName}
                    onChange={(event) =>
                      setOrderForm((current) => ({ ...current, notes: event.target.value }))
                    }
                    placeholder="Condiciones logisticas, contacto, ventanas de entrega o notas comerciales."
                    value={orderForm.notes}
                  />
                </label>
                <button
                  className={dashboardPrimaryButtonClassName}
                  disabled={savingOrder}
                  type="submit"
                >
                  {savingOrder ? 'Guardando orden...' : 'Guardar orden'}
                </button>
              </form>
            </DashboardCard>
          ) : null}

          <DashboardCard>
            <DashboardSectionHeading
              action={
                <DashboardInfoBadge>{request?.events?.length ?? 0} eventos</DashboardInfoBadge>
              }
              description="Historial comercial de la solicitud en orden cronologico inverso."
              title="Timeline"
            />
            <div className="mt-5 space-y-4">
              {request?.events?.length ? (
                request.events.map((event) => (
                  <article key={event.id} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${getEventStyles(event.type)}`}
                          >
                            {event.type}
                          </span>
                          {event.actorCompanyName ? (
                            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                              {event.actorCompanyName}
                            </span>
                          ) : null}
                        </div>
                        <h3 className="mt-3 text-base font-semibold text-slate-950">{event.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          {event.detail ?? 'Sin detalle adicional.'}
                        </p>
                      </div>
                      <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                        {formatDateTime(event.createdAt)}
                      </span>
                    </div>
                  </article>
                ))
              ) : (
                <DashboardEmptyState
                  description="Todavia no hay eventos registrados para esta solicitud."
                  title="Sin timeline"
                />
              )}
            </div>
          </DashboardCard>
        </section>

        <DashboardDarkCard>
          <DashboardSectionHeading
            action={
              <div className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white">
                {sortedQuotes.length} propuestas
              </div>
            }
            description="Las propuestas se ordenan por precio estimado y mantienen visibles plazo, pago y comentario tecnico."
            title={<span className="text-white">Comparador de cotizaciones</span>}
          />

          <div className="mt-5 space-y-4">
            {sortedQuotes.length === 0 ? (
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 px-5 py-8 text-sm text-sky-50">
                Todavia no hay cotizaciones cargadas para esta solicitud.
              </div>
            ) : (
              sortedQuotes.map((quote, index) => (
                <article
                  key={quote.id}
                  className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5"
                >
                  <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[1.2fr_0.7fr_0.6fr_0.9fr] xl:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-white">
                          {quote.supplierCompany?.name ?? 'Proveedor'}
                        </p>
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${getQuoteStatusStyles(quote.status)}`}
                        >
                          {quote.status}
                        </span>
                        {request?.awardedQuoteId === quote.id ? (
                          <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-100">
                            Ganadora
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-sky-50">
                        {quote.technicalComment ?? 'Sin comentario tecnico.'}
                      </p>
                    </div>
                    <div className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3 xl:border-0 xl:bg-transparent xl:px-0 xl:py-0">
                      <p className="text-xs uppercase tracking-[0.18em] text-sky-100 xl:hidden">Precio</p>
                      <p className="mt-1 text-lg font-semibold text-white xl:mt-0">
                        {formatCurrency(quote.amount)}
                      </p>
                      {index === 0 && request?.awardedQuoteId !== quote.id ? (
                        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-emerald-200">Mejor precio</p>
                      ) : null}
                    </div>
                    <div className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3 xl:border-0 xl:bg-transparent xl:px-0 xl:py-0">
                      <p className="text-xs uppercase tracking-[0.18em] text-sky-100 xl:hidden">Plazo</p>
                      <p className="mt-1 text-lg font-semibold text-white xl:mt-0">
                        {quote.leadTimeDays ?? '-'}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-sky-100">dias</p>
                    </div>
                    <div className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3 xl:border-0 xl:bg-transparent xl:px-0 xl:py-0">
                      <p className="text-xs uppercase tracking-[0.18em] text-sky-100 xl:hidden">Pago</p>
                      <p className="mt-1 text-sm font-medium text-white xl:mt-0">
                        {quote.paymentTerms ?? 'No informado'}
                      </p>
                      {!request?.awardedQuoteId &&
                      (request?.status === 'PUBLISHED' || request?.status === 'REVIEWING') ? (
                        <button
                          className="mt-3 rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-sky-700 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={awardingQuoteId !== null || quote.status !== 'SUBMITTED'}
                          onClick={() => void handleAward(quote.id)}
                          type="button"
                        >
                          {awardingQuoteId === quote.id ? 'Adjudicando...' : 'Adjudicar'}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </DashboardDarkCard>
      </div>
    </DashboardShell>
  );
}
