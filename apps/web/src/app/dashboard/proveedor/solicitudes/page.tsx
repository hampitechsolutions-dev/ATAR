'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import SupplierDashboardShell from '@/components/dashboard/supplier-dashboard-shell';
import { ApiError, atarApi, type CreateQuotePayload, type QuoteRecord, type RequestRecord } from '@/lib/atar-api';
import { useSupplierDashboardData } from '@/lib/dashboard-hooks';

type QuoteDraft = {
  amount: string;
  currency: string;
  leadTimeDays: string;
  paymentTerms: string;
  technicalComment: string;
};

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

function formatDate(value: string | null) {
  if (!value) {
    return 'Sin fecha limite';
  }

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function formatRelative(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const hours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));

  if (hours < 24) {
    return `Hace ${hours} h`;
  }

  return `Hace ${Math.round(hours / 24)} d`;
}

function getBuyerLocation(request: RequestRecord) {
  const city = request.buyerCompany?.city?.trim();
  const country = request.buyerCompany?.country?.trim();
  return city && country ? `${city}, ${country}` : city || country || 'Ubicacion no informada';
}

function createDraft(quote?: QuoteRecord | null): QuoteDraft {
  return {
    amount: typeof quote?.amount === 'number' ? String(quote.amount) : '',
    currency: quote?.currency ?? 'ARS',
    leadTimeDays: typeof quote?.leadTimeDays === 'number' ? String(quote.leadTimeDays) : '',
    paymentTerms: quote?.paymentTerms ?? '',
    technicalComment: quote?.technicalComment ?? '',
  };
}

export default function SupplierRequestsPage() {
  const { session, openRequests, myQuotes, loading, error, refresh } = useSupplierDashboardData();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'quoted' | 'private'>('all');
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [draft, setDraft] = useState<QuoteDraft>(() => createDraft());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const quoteByRequestId = useMemo(() => {
    return new Map(myQuotes.map((quote) => [quote.requestId, quote] as const));
  }, [myQuotes]);

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...openRequests]
      .filter((request) => {
        const quote = quoteByRequestId.get(request.id);

        if (statusFilter === 'quoted' && !quote) {
          return false;
        }

        if (statusFilter === 'open' && quote) {
          return false;
        }

        if (statusFilter === 'private' && !request.privateRequest) {
          return false;
        }

        if (!query) {
          return true;
        }

        return [
          request.title,
          request.category,
          request.description,
          request.buyerCompany?.name ?? '',
          request.preferredSupplierName ?? '',
        ]
          .join(' ')
          .toLowerCase()
          .includes(query);
      })
      .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
  }, [openRequests, quoteByRequestId, search, statusFilter]);

  useEffect(() => {
    if (activeRequestId && filteredRequests.some((request) => request.id === activeRequestId)) {
      return;
    }

    const firstRequest = filteredRequests[0];
    const nextRequestId = firstRequest?.id ?? null;
    setActiveRequestId(nextRequestId);
    setDraft(createDraft(nextRequestId ? quoteByRequestId.get(nextRequestId) : null));
  }, [activeRequestId, filteredRequests, quoteByRequestId]);

  const activeRequest = filteredRequests.find((request) => request.id === activeRequestId) ?? null;
  const activeQuote = activeRequest ? quoteByRequestId.get(activeRequest.id) ?? null : null;

  useEffect(() => {
    if (!activeRequestId) {
      return;
    }

    setDraft(createDraft(quoteByRequestId.get(activeRequestId) ?? null));
    setSubmitError(null);
  }, [activeRequestId, quoteByRequestId]);

  async function handleSubmitQuote() {
    if (!session?.accessToken || !activeRequest) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setMessage(null);

    try {
      const payload: CreateQuotePayload = {
        amount: draft.amount.trim() ? Number(draft.amount) : undefined,
        currency: draft.currency.trim() || 'ARS',
        leadTimeDays: draft.leadTimeDays.trim() ? Number(draft.leadTimeDays) : undefined,
        paymentTerms: draft.paymentTerms.trim() || undefined,
        technicalComment: draft.technicalComment.trim() || undefined,
      };

      if (payload.amount !== undefined && Number.isNaN(payload.amount)) {
        throw new ApiError('El monto debe ser numerico.', 400);
      }

      if (payload.leadTimeDays !== undefined && Number.isNaN(payload.leadTimeDays)) {
        throw new ApiError('El plazo debe ser numerico.', 400);
      }

      await atarApi.createQuote(activeRequest.id, payload, session.accessToken);
      await refresh();
      setMessage(activeQuote ? 'Cotizacion actualizada.' : 'Cotizacion enviada.');
    } catch (submitQuoteError) {
      setSubmitError(
        submitQuoteError instanceof Error
          ? submitQuoteError.message
          : 'No se pudo guardar la cotizacion.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  const summary = useMemo(() => {
    const quoted = filteredRequests.filter((request) => quoteByRequestId.has(request.id)).length;
    const privateRequests = filteredRequests.filter((request) => request.privateRequest).length;

    return {
      total: filteredRequests.length,
      quoted,
      pending: Math.max(0, filteredRequests.length - quoted),
      privateRequests,
    };
  }, [filteredRequests, quoteByRequestId]);

  return (
    <SupplierDashboardShell
      searchPlaceholder="Buscar solicitudes por comprador, categoria o descripcion"
      session={session}
    >
      <section className="space-y-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm text-slate-500">Pipeline de oportunidades</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                Solicitudes de compradores
              </h1>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Esta vista ahora trabaja sobre solicitudes reales abiertas. Desde aca podes
                responder, actualizar tu propuesta y entrar al detalle de la cotizacion enviada.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-[1.25rem] bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Visibles</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.total}</p>
              </div>
              <div className="rounded-[1.25rem] bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Cotizadas</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.quoted}</p>
              </div>
              <div className="rounded-[1.25rem] bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Pendientes</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.pending}</p>
              </div>
              <div className="rounded-[1.25rem] bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Privadas</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.privateRequests}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
            <input
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-400"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por comprador, producto o descripcion"
              value={search}
            />
            <select
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
              onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
              value={statusFilter}
            >
              <option value="all">Todas</option>
              <option value="open">Sin cotizar</option>
              <option value="quoted">Ya cotizadas</option>
              <option value="private">Solo privadas</option>
            </select>
          </div>
        </div>

        {error ? (
          <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {submitError ? (
          <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {submitError}
          </div>
        ) : null}

        {message ? (
          <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
            {message}
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
            {loading ? (
              <div className="rounded-[1.5rem] bg-slate-50 px-4 py-8 text-sm text-slate-500">
                Cargando solicitudes...
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                No hay solicitudes disponibles para este filtro.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRequests.map((request) => {
                  const quote = quoteByRequestId.get(request.id);
                  const selected = request.id === activeRequestId;

                  return (
                    <button
                      key={request.id}
                      className={`w-full rounded-[1.5rem] border px-4 py-4 text-left transition ${
                        selected
                          ? 'border-slate-950 bg-slate-950 text-white'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                      onClick={() => setActiveRequestId(request.id)}
                      type="button"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className={`text-xs uppercase tracking-[0.16em] ${selected ? 'text-slate-300' : 'text-slate-500'}`}>
                            {request.category}
                          </p>
                          <p className="mt-2 line-clamp-2 text-base font-semibold">
                            {request.title}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            quote
                              ? selected
                                ? 'bg-white/10 text-white'
                                : 'bg-emerald-50 text-emerald-700'
                              : selected
                                ? 'bg-white/10 text-white'
                                : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {quote ? 'Cotizada' : 'Pendiente'}
                        </span>
                      </div>
                      <p className={`mt-3 text-sm ${selected ? 'text-slate-300' : 'text-slate-600'}`}>
                        {request.buyerCompany?.name ?? 'Comprador'} · {getBuyerLocation(request)}
                      </p>
                      <div className={`mt-3 flex flex-wrap gap-2 text-xs ${selected ? 'text-slate-300' : 'text-slate-500'}`}>
                        <span>Actualizada {formatRelative(request.updatedAt)}</span>
                        <span>•</span>
                        <span>Cierra {formatDate(request.dueDate)}</span>
                        {request.privateRequest ? (
                          <>
                            <span>•</span>
                            <span>Privada</span>
                          </>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-4">
            {activeRequest ? (
              <>
                <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          {activeRequest.category}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          {activeRequest.privateRequest ? 'Solicitud privada' : 'Solicitud abierta'}
                        </span>
                        {activeQuote ? (
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            Tu cotizacion: {activeQuote.status}
                          </span>
                        ) : null}
                      </div>
                      <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
                        {activeRequest.title}
                      </h2>
                      <p className="mt-3 text-sm leading-7 text-slate-600">
                        {activeRequest.description}
                      </p>
                    </div>

                    {activeQuote ? (
                      <Link
                        className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        href={`/dashboard/proveedor/cotizaciones/${activeQuote.id}`}
                      >
                        Ver cotizacion
                      </Link>
                    ) : null}
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-[1.25rem] bg-slate-50 px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Comprador</p>
                      <p className="mt-2 text-sm font-semibold text-slate-950">
                        {activeRequest.buyerCompany?.name ?? 'No informado'}
                      </p>
                    </div>
                    <div className="rounded-[1.25rem] bg-slate-50 px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Ubicacion</p>
                      <p className="mt-2 text-sm font-semibold text-slate-950">
                        {getBuyerLocation(activeRequest)}
                      </p>
                    </div>
                    <div className="rounded-[1.25rem] bg-slate-50 px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Fecha limite</p>
                      <p className="mt-2 text-sm font-semibold text-slate-950">
                        {formatDate(activeRequest.dueDate)}
                      </p>
                    </div>
                    <div className="rounded-[1.25rem] bg-slate-50 px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Tu estado</p>
                      <p className="mt-2 text-sm font-semibold text-slate-950">
                        {activeQuote ? activeQuote.status : 'Sin cotizar'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-sm text-slate-500">
                        {activeQuote ? 'Actualiza tu propuesta comercial' : 'Envia una nueva cotizacion'}
                      </p>
                      <h3 className="mt-1 text-xl font-semibold text-slate-950">
                        {activeQuote ? 'Editar cotizacion' : 'Responder solicitud'}
                      </h3>
                    </div>
                    {activeQuote?.amount ? (
                      <p className="text-sm text-slate-500">
                        Ultimo monto enviado:{' '}
                        <span className="font-semibold text-slate-950">
                          {formatCurrency(activeQuote.amount, activeQuote.currency)}
                        </span>
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">Monto</span>
                      <input
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-400"
                        onChange={(event) => setDraft((current) => ({ ...current, amount: event.target.value }))}
                        placeholder="1200000"
                        type="number"
                        value={draft.amount}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">Moneda</span>
                      <input
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-400"
                        maxLength={8}
                        onChange={(event) => setDraft((current) => ({ ...current, currency: event.target.value.toUpperCase() }))}
                        placeholder="ARS"
                        value={draft.currency}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">Plazo en dias</span>
                      <input
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-400"
                        onChange={(event) => setDraft((current) => ({ ...current, leadTimeDays: event.target.value }))}
                        placeholder="15"
                        type="number"
                        value={draft.leadTimeDays}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">Condiciones de pago</span>
                      <input
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-400"
                        onChange={(event) => setDraft((current) => ({ ...current, paymentTerms: event.target.value }))}
                        placeholder="30 dias fecha factura"
                        value={draft.paymentTerms}
                      />
                    </label>
                  </div>

                  <label className="mt-4 block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Comentario tecnico</span>
                    <textarea
                      className="min-h-[150px] w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-400"
                      onChange={(event) => setDraft((current) => ({ ...current, technicalComment: event.target.value }))}
                      placeholder="Detalle materiales, capacidad instalada, condiciones de entrega o aclaraciones tecnicas."
                      value={draft.technicalComment}
                    />
                  </label>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-slate-500">
                      {activeRequest.privateRequest
                        ? 'Esta solicitud es privada y ya fue habilitada para tu empresa.'
                        : 'La solicitud esta abierta para multiples proveedores.'}
                    </div>
                    <button
                      className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={submitting}
                      onClick={() => void handleSubmitQuote()}
                      type="button"
                    >
                      {submitting ? 'Guardando...' : activeQuote ? 'Actualizar cotizacion' : 'Enviar cotizacion'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white px-6 py-10 text-sm text-slate-500 shadow-sm">
                Selecciona una solicitud para ver el detalle y responderla.
              </div>
            )}
          </div>
        </div>
      </section>
    </SupplierDashboardShell>
  );
}
