'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
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
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-950">
        <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-5 shadow-sm">Cargando detalle...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 lg:px-10">
        <div className="flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-violet-600">Detalle de solicitud</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{request?.title ?? 'Solicitud no encontrada'}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{request?.description ?? 'No se pudo localizar esta solicitud dentro de tu cuenta.'}</p>
            {request?.awardedQuote ? (
              <p className="mt-4 inline-flex rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-800">
                {getRequestStatusLabel(request.status)} con {request.awardedQuote.supplierCompany?.name ?? 'proveedor seleccionado'}
              </p>
            ) : null}
          </div>
          <Link
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            href="/dashboard/comprador"
          >
            Volver al dashboard
          </Link>
        </div>

        {error ? <div className="rounded-[1.5rem] bg-rose-100 px-5 py-4 text-sm text-rose-800">{error}</div> : null}
        {message ? <div className="rounded-[1.5rem] bg-emerald-100 px-5 py-4 text-sm text-emerald-800">{message}</div> : null}

        <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
          <section className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-950">Resumen</h2>
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
                  <p className="text-sm text-slate-500">Mejor precio</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">{bestPrice ? formatCurrency(bestPrice.amount) : 'Sin datos'}</p>
                </div>
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Entrega mas rapida</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">{fastest?.leadTimeDays ? `${fastest.leadTimeDays} dias` : 'Sin datos'}</p>
                </div>
              </div>
            </div>
            {request?.awardedQuote ? (
              <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-emerald-900">Oferta adjudicada</h2>
                <p className="mt-3 text-sm leading-7 text-emerald-800">
                  Se selecciono a {request.awardedQuote.supplierCompany?.name ?? 'un proveedor'} por {formatCurrency(request.awardedQuote.amount)} con plazo estimado de{' '}
                  {request.awardedQuote.leadTimeDays ?? '-'} dias.
                </p>
                <p className="mt-3 text-sm text-emerald-800">
                  Condiciones: {request.awardedQuote.paymentTerms ?? 'No informadas'}
                </p>
                {request.order ? (
                  <div className="mt-4 rounded-[1.5rem] border border-emerald-200 bg-white/70 p-4">
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
                      className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={progressingAction !== null}
                      onClick={() => void handleProgress('START_NEGOTIATION')}
                      type="button"
                    >
                      {progressingAction === 'START_NEGOTIATION'
                        ? 'Iniciando negociacion...'
                        : 'Iniciar negociacion'}
                    </button>
                  ) : null}
                  {(request.status === 'AWARDED' || request.status === 'NEGOTIATING') ? (
                    <button
                      className="rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={progressingAction !== null}
                      onClick={() => void handleProgress('ISSUE_ORDER')}
                      type="button"
                    >
                      {progressingAction === 'ISSUE_ORDER' ? 'Emitiendo orden...' : 'Emitir orden'}
                    </button>
                  ) : null}
                  {request.status === 'ORDER_ISSUED' ? (
                    <span className="rounded-full bg-violet-100 px-4 py-2 text-sm font-semibold text-violet-800">
                      Orden comercial emitida
                    </span>
                  ) : null}
                </div>
              </div>
            ) : null}
            {request?.status === 'ORDER_ISSUED' ? (
              <div className="rounded-[2rem] border border-violet-200 bg-violet-50 p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-violet-950">Orden y seguimiento</h2>
                    <p className="mt-1 text-sm text-violet-800">
                      Carga los datos operativos de la orden emitida para compartir seguimiento con el proveedor.
                    </p>
                  </div>
                  {request.order ? (
                    <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-violet-800">
                      {request.order.orderNumber}
                    </span>
                  ) : null}
                </div>
                {request.order ? (
                  <div className="mt-4 flex flex-wrap gap-3">
                    <span
                      className={`rounded-full px-4 py-2 text-sm font-semibold ${getFulfillmentTone(request.order.fulfillmentStatus)}`}
                    >
                      {getFulfillmentLabel(request.order.fulfillmentStatus)}
                    </span>
                    <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-violet-800">
                      Fecha prometida: {formatDate(request.order.promisedDate)}
                    </span>
                  </div>
                ) : null}
                <form className="mt-5 space-y-4" onSubmit={handleSaveOrder}>
                  <label className="block space-y-2 text-sm">
                    <span className="text-violet-900">Numero de orden</span>
                    <input
                      className="w-full rounded-2xl border border-violet-200 bg-white px-4 py-3 outline-none transition focus:border-violet-400"
                      onChange={(event) => setOrderForm((current) => ({ ...current, orderNumber: event.target.value }))}
                      value={orderForm.orderNumber}
                    />
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block space-y-2 text-sm">
                      <span className="text-violet-900">Fecha prometida</span>
                      <input
                        className="w-full rounded-2xl border border-violet-200 bg-white px-4 py-3 outline-none transition focus:border-violet-400"
                        onChange={(event) => setOrderForm((current) => ({ ...current, promisedDate: event.target.value }))}
                        type="date"
                        value={orderForm.promisedDate}
                      />
                    </label>
                    <label className="block space-y-2 text-sm">
                      <span className="text-violet-900">Estado de cumplimiento</span>
                      <select
                        className="w-full rounded-2xl border border-violet-200 bg-white px-4 py-3 outline-none transition focus:border-violet-400"
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
                    <span className="text-violet-900">Notas operativas</span>
                    <textarea
                      className="min-h-28 w-full rounded-2xl border border-violet-200 bg-white px-4 py-3 outline-none transition focus:border-violet-400"
                      onChange={(event) => setOrderForm((current) => ({ ...current, notes: event.target.value }))}
                      placeholder="Condiciones logisticas, contacto, ventanas de entrega o notas comerciales."
                      value={orderForm.notes}
                    />
                  </label>
                  <button
                    className="rounded-full bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={savingOrder}
                    type="submit"
                  >
                    {savingOrder ? 'Guardando orden...' : 'Guardar orden'}
                  </button>
                </form>
              </div>
            ) : null}
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">Timeline</h2>
                  <p className="mt-1 text-sm text-slate-500">Historial comercial de la solicitud en orden cronologico inverso.</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                  {request?.events?.length ?? 0} eventos
                </span>
              </div>
              <div className="mt-5 space-y-4">
                {request?.events?.length ? (
                  request.events.map((event) => (
                    <article key={event.id} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${getEventStyles(event.type)}`}>
                              {event.type}
                            </span>
                            {event.actorCompanyName ? (
                              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                {event.actorCompanyName}
                              </span>
                            ) : null}
                          </div>
                          <h3 className="mt-3 text-base font-semibold text-slate-950">{event.title}</h3>
                          <p className="mt-1 text-sm leading-6 text-slate-600">{event.detail ?? 'Sin detalle adicional.'}</p>
                        </div>
                        <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                          {formatDateTime(event.createdAt)}
                        </span>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm text-slate-500">
                    Todavia no hay eventos registrados para esta solicitud.
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] bg-gradient-to-r from-sky-600 to-violet-600 p-6 text-white shadow-2xl shadow-sky-200/50">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Comparador de cotizaciones</h2>
                <p className="mt-2 text-sm leading-7 text-sky-50">Las propuestas se ordenan por precio estimado y mantienen visibles plazo, pago y comentario tecnico.</p>
              </div>
              <div className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white">
                {sortedQuotes.length} propuestas
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-white/15 bg-white/10">
              <div className="grid grid-cols-[1.2fr_0.7fr_0.6fr_0.9fr] gap-3 border-b border-white/15 px-5 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-sky-100">
                <span>Proveedor</span>
                <span>Precio</span>
                <span>Plazo</span>
                <span>Pago</span>
              </div>
              {sortedQuotes.length === 0 ? (
                <div className="px-5 py-8 text-sm text-sky-50">Todavia no hay cotizaciones cargadas para esta solicitud.</div>
              ) : (
                sortedQuotes.map((quote, index) => (
                  <div key={quote.id} className="border-b border-white/10 px-5 py-5 last:border-b-0">
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.2fr_0.7fr_0.6fr_0.9fr] lg:items-center">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-white">{quote.supplierCompany?.name ?? 'Proveedor'}</p>
                          <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${getQuoteStatusStyles(quote.status)}`}>
                            {quote.status}
                          </span>
                          {request?.awardedQuoteId === quote.id ? (
                            <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-100">
                              Ganadora
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-sky-50">{quote.technicalComment ?? 'Sin comentario tecnico.'}</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-white">{formatCurrency(quote.amount)}</p>
                        {index === 0 && request?.awardedQuoteId !== quote.id ? (
                          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-emerald-200">Mejor precio</p>
                        ) : null}
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-white">{quote.leadTimeDays ?? '-'}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-sky-100">dias</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{quote.paymentTerms ?? 'No informado'}</p>
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
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
