'use client';

import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import SupplierDashboardShell from '@/components/dashboard/supplier-dashboard-shell';
import {
  ApiError,
  atarApi,
  type CreateQuotePayload,
  type QuoteItemAvailability,
  type QuoteRecord,
  type RequestRecord,
  type SupplierProfileRecord,
} from '@/lib/atar-api';
import { useSupplierDashboardData } from '@/lib/dashboard-hooks';

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
    return 'A coordinar';
  }

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function getBuyerLocation(request: RequestRecord) {
  const city = request.buyerCompany?.city?.trim();
  const country = request.buyerCompany?.country?.trim();
  return city && country ? `${city}, ${country}` : city || country || 'No informada';
}

// Parte las specs guardadas de un producto ("Label: value" por linea) en filas.
function parseSpecRows(text: string | null | undefined) {
  return (text ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf(':');
      return idx === -1
        ? { label: 'Detalle', value: line }
        : { label: line.slice(0, idx).trim(), value: line.slice(idx + 1).trim() };
    });
}

type QuoteDraft = {
  // Fallback para solicitudes sin items (legacy): un total unico.
  amount: string;
  // Precio unitario por producto, indexado por RequestItem.id.
  unitPrices: Record<string, string>;
  // Disponibilidad por producto (cotizo / no disponible / alternativa).
  availabilities: Record<string, QuoteItemAvailability>;
  // Nota por producto (motivo de no disponible, detalle del reemplazo, consejo).
  itemNotes: Record<string, string>;
  currency: string;
  minimumOrder: string;
  leadTimeDays: string;
  paymentTerms: string;
  validity: string;
  technicalComment: string;
};

function createDraft(quote?: QuoteRecord | null): QuoteDraft {
  const unitPrices: Record<string, string> = {};
  const availabilities: Record<string, QuoteItemAvailability> = {};
  const itemNotes: Record<string, string> = {};
  for (const item of quote?.items ?? []) {
    unitPrices[item.requestItemId] = item.unitPrice != null ? String(item.unitPrice) : '';
    availabilities[item.requestItemId] = item.availability ?? 'QUOTED';
    itemNotes[item.requestItemId] = item.note ?? '';
  }
  return {
    amount: typeof quote?.amount === 'number' ? String(quote.amount) : '',
    unitPrices,
    availabilities,
    itemNotes,
    currency: quote?.currency ?? 'ARS',
    minimumOrder: '',
    leadTimeDays: typeof quote?.leadTimeDays === 'number' ? String(quote.leadTimeDays) : '',
    paymentTerms: quote?.paymentTerms ?? '',
    validity: '',
    technicalComment: quote?.technicalComment ?? '',
  };
}

export default function SupplierRequestDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const requestId = typeof params.id === 'string' ? params.id : '';

  const { session, openRequests, myQuotes, loading, error, refresh } = useSupplierDashboardData();
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [openingChat, setOpeningChat] = useState(false);
  const [draft, setDraft] = useState<QuoteDraft>(() => createDraft());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const existingQuote = useMemo(
    () => myQuotes.find((quote) => quote.requestId === requestId) ?? null,
    [myQuotes, requestId],
  );

  const request = useMemo<RequestRecord | null>(() => {
    const fromOpen = openRequests.find((item) => item.id === requestId);
    if (fromOpen) {
      return fromOpen;
    }
    const fromQuote = myQuotes.find((quote) => quote.requestId === requestId)?.request;
    return (fromQuote as RequestRecord | undefined) ?? null;
  }, [openRequests, myQuotes, requestId]);

  useEffect(() => {
    setDraft(createDraft(existingQuote));
  }, [existingQuote]);

  const [profile, setProfile] = useState<SupplierProfileRecord | null>(null);

  useEffect(() => {
    if (!session?.accessToken) {
      return;
    }
    let cancelled = false;
    atarApi
      .getOwnSupplierProfile(session.accessToken)
      .then((data) => {
        if (!cancelled) {
          setProfile(data);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [session?.accessToken]);

  // Pre-carga desde el perfil del proveedor (mínimo, plazo, condiciones) solo en
  // cotización nueva y sin pisar lo que el usuario ya escribió. Son opcionales.
  useEffect(() => {
    const sp = profile?.supplierProfile;
    if (!sp || existingQuote) {
      return;
    }
    setDraft((current) => ({
      ...current,
      leadTimeDays: current.leadTimeDays || (sp.leadTimeDays != null ? String(sp.leadTimeDays) : ''),
      minimumOrder: current.minimumOrder || (sp.minimumOrder != null ? String(sp.minimumOrder) : ''),
      paymentTerms: current.paymentTerms || (sp.financingSummary ?? ''),
    }));
  }, [profile, existingQuote]);

  const requestItems = request?.items ?? [];
  const quoteTotal = requestItems.reduce((sum, item) => {
    const availability = draft.availabilities[item.id] ?? 'QUOTED';
    if (availability === 'UNAVAILABLE') {
      return sum;
    }
    const price = Number(draft.unitPrices[item.id] ?? '');
    const qty = item.quantity ?? 0;
    return Number.isFinite(price) ? sum + price * qty : sum;
  }, 0);

  /** Abre (o crea) el chat de la solicitud para consultar antes de cotizar. */
  async function handleOpenChat() {
    if (!session?.accessToken || !request) {
      return;
    }

    try {
      setOpeningChat(true);
      setSubmitError(null);
      const conversation = await atarApi.getOrCreateRequestConversation(
        request.id,
        session.accessToken,
      );
      router.push(`/dashboard/proveedor/mensajes/${conversation.id}`);
    } catch (chatError) {
      setSubmitError(
        chatError instanceof Error ? chatError.message : 'No se pudo abrir el chat con el comprador.',
      );
    } finally {
      setOpeningChat(false);
    }
  }

  async function handleSubmitQuote() {
    if (!session?.accessToken || !request) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setMessage(null);

    try {
      const notes = [
        draft.minimumOrder.trim() ? `Cantidad mínima: ${draft.minimumOrder.trim()}` : '',
        draft.validity.trim() ? `Validez de la oferta: ${draft.validity.trim()}` : '',
        draft.technicalComment.trim(),
      ]
        .filter(Boolean)
        .join('\n');

      const leadTimeDays = draft.leadTimeDays.trim() ? Number(draft.leadTimeDays) : undefined;
      if (leadTimeDays !== undefined && Number.isNaN(leadTimeDays)) {
        throw new ApiError('El plazo debe ser numérico.', 400);
      }

      const payload: CreateQuotePayload = {
        currency: draft.currency.trim() || 'ARS',
        leadTimeDays,
        paymentTerms: draft.paymentTerms.trim() || undefined,
        technicalComment: notes || undefined,
      };

      if (requestItems.length > 0) {
        // Respuesta por producto: precio + disponibilidad + nota. El total lo
        // calcula el backend (solo suma lo que tiene precio).
        const items = requestItems
          .map((item) => {
            const availability = draft.availabilities[item.id] ?? 'QUOTED';
            const priceNum = Number(draft.unitPrices[item.id] ?? '');
            const hasPrice = Number.isFinite(priceNum) && priceNum > 0;
            const note = (draft.itemNotes[item.id] ?? '').trim();
            return { id: item.id, availability, priceNum, hasPrice, note };
          })
          // Se incluye una línea si el vendedor la respondió: cotizó con precio,
          // la marcó no disponible, u ofrece una alternativa (precio y/o nota).
          .filter(
            (l) =>
              (l.availability === 'QUOTED' && l.hasPrice) ||
              l.availability === 'UNAVAILABLE' ||
              (l.availability === 'ALTERNATIVE' && (l.hasPrice || l.note)),
          )
          .map((l) => ({
            requestItemId: l.id,
            availability: l.availability,
            unitPrice: l.availability !== 'UNAVAILABLE' && l.hasPrice ? l.priceNum : undefined,
            note: l.note || undefined,
          }));
        if (items.length === 0) {
          throw new ApiError(
            'Respondé al menos un producto: ingresá un precio, marcalo como no disponible u ofrecé una alternativa.',
            400,
          );
        }
        payload.items = items;
      } else {
        const amount = draft.amount.trim() ? Number(draft.amount) : undefined;
        if (amount !== undefined && Number.isNaN(amount)) {
          throw new ApiError('El precio debe ser numérico.', 400);
        }
        payload.amount = amount;
      }

      await atarApi.createQuote(request.id, payload, session.accessToken);
      await refresh();
      setMessage(existingQuote ? 'Cotización actualizada.' : 'Cotización enviada.');
      setShowQuoteForm(false);
    } catch (quoteError) {
      setSubmitError(quoteError instanceof Error ? quoteError.message : 'No se pudo guardar la cotización.');
    } finally {
      setSubmitting(false);
    }
  }

  // Datos a nivel solicitud (los productos se muestran aparte, uno por uno).
  const detailRows: { label: string; value: string }[] = request
    ? [
        { label: 'Entrega estimada', value: formatDate(request.dueDate) },
        { label: 'Ubicación de entrega', value: getBuyerLocation(request) },
        {
          label: 'Presupuesto estimado',
          value: formatCurrency(request.estimatedTotalCost ?? request.referenceUnitPrice),
        },
      ]
    : [];

  return (
    <SupplierDashboardShell session={session}>
      <div className="mx-auto w-full max-w-2xl pb-32 lg:pb-0">
        {/* Encabezado */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Volver"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700"
          >
            <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-500">Detalle de solicitud</p>
            <h1 className="truncate text-lg font-bold tracking-tight text-slate-950">
              {request?.title ?? 'Solicitud'}
            </h1>
          </div>
          {existingQuote ? (
            <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-600">
              Cotizada
            </span>
          ) : (
            <span className="shrink-0 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-600">
              Nueva
            </span>
          )}
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : null}
        {submitError ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {submitError}
          </div>
        ) : null}
        {message ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        ) : null}

        {loading && !request ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
            Cargando solicitud...
          </div>
        ) : !request ? (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
            No se encontró la solicitud o ya no está disponible.
          </div>
        ) : (
          <>
            {/* Comprador */}
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-xs font-bold text-white">
                {(request.buyerCompany?.name ?? 'CL').slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-950">
                  {request.buyerCompany?.name ?? 'Comprador'}
                </p>
                <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-emerald-600">
                  <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                  Comprador verificado
                </p>
              </div>
            </div>

            {/* Productos solicitados (uno por uno, con su detalle) */}
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-bold text-slate-950">
                Productos solicitados{requestItems.length > 0 ? ` (${requestItems.length})` : ''}
              </p>
              {requestItems.length > 0 ? (
                <div className="mt-3 space-y-3">
                  {requestItems.map((item, index) => {
                    const specRows = parseSpecRows(item.specifications);
                    return (
                      <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-indigo-600">
                              Producto {index + 1}
                            </p>
                            <p className="mt-0.5 text-sm font-semibold text-slate-950">{item.productName}</p>
                            {item.category ? <p className="text-[11px] text-slate-500">{item.category}</p> : null}
                          </div>
                          <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200">
                            {item.quantity ? `${item.quantity} ${item.unit ?? 'u.'}` : 'Cant. a definir'}
                          </span>
                        </div>
                        {specRows.length ? (
                          <dl className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                            {specRows.map((row, rowIndex) => (
                              <div key={`${row.label}-${rowIndex}`} className="rounded-lg bg-white px-2.5 py-1.5 ring-1 ring-slate-100">
                                <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">{row.label}</dt>
                                <dd className="mt-0.5 text-xs font-medium text-slate-900">{row.value || '-'}</dd>
                              </div>
                            ))}
                          </dl>
                        ) : (
                          <p className="mt-2 text-[11px] text-slate-400">Sin especificaciones adicionales.</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {request.description || 'Sin especificaciones.'}
                </p>
              )}
            </div>

            {/* Entrega y condiciones (a nivel solicitud) */}
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-bold text-slate-950">Entrega y condiciones</p>
              <dl className="mt-3 divide-y divide-slate-200">
                {detailRows.map((row) => (
                  <div key={row.label} className="flex items-start justify-between gap-4 py-2.5">
                    <dt className="shrink-0 text-xs text-slate-500">{row.label}</dt>
                    <dd className="text-right text-sm font-medium text-slate-900">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Formulario de cotización (bottom sheet flotante) */}
            {showQuoteForm ? (
              <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
                <div className="absolute inset-0 bg-slate-950/50" onClick={() => setShowQuoteForm(false)} />
                <div className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[88vh] w-full max-w-2xl flex-col rounded-t-3xl bg-white shadow-[0_-20px_60px_rgba(2,6,23,0.28)]">
                  <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                    <p className="text-base font-bold text-slate-950">
                      {existingQuote ? 'Editar cotización' : 'Nueva cotización'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowQuoteForm(false)}
                      aria-label="Cerrar"
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500"
                    >
                      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                      </svg>
                    </button>
                  </div>
                  <div className="overflow-y-auto px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-4">
                    <div className="space-y-4">
                  {requestItems.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-600">Precio unitario por producto</span>
                        <label className="flex items-center gap-1 text-xs text-slate-400">
                          Moneda
                          <input
                            className="w-16 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-center text-xs uppercase text-slate-700 outline-none focus:border-indigo-400"
                            maxLength={4}
                            onChange={(event) =>
                              setDraft((current) => ({ ...current, currency: event.target.value.toUpperCase() }))
                            }
                            value={draft.currency}
                          />
                        </label>
                      </div>

                      {requestItems.map((item) => {
                        const availability = draft.availabilities[item.id] ?? 'QUOTED';
                        const price = Number(draft.unitPrices[item.id] ?? '');
                        const subtotal =
                          availability !== 'UNAVAILABLE' && Number.isFinite(price) && item.quantity
                            ? price * item.quantity
                            : null;
                        const options: { value: QuoteItemAvailability; label: string }[] = [
                          { value: 'QUOTED', label: 'Cotizo' },
                          { value: 'ALTERNATIVE', label: 'Alternativa' },
                          { value: 'UNAVAILABLE', label: 'No disponible' },
                        ];
                        const setAvailability = (value: QuoteItemAvailability) =>
                          setDraft((current) => ({
                            ...current,
                            availabilities: { ...current.availabilities, [item.id]: value },
                          }));
                        return (
                          <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-900">{item.productName}</p>
                                <p className="text-[11px] text-slate-500">
                                  {item.quantity ? `${item.quantity} ${item.unit ?? 'u.'}` : 'Cantidad a definir'}
                                </p>
                              </div>
                              {subtotal != null ? (
                                <p className="shrink-0 text-xs font-semibold text-slate-700">
                                  {formatCurrency(subtotal, draft.currency)}
                                </p>
                              ) : null}
                            </div>

                            {/* Disponibilidad de este producto */}
                            <div className="mt-2 grid grid-cols-3 gap-1 rounded-lg bg-white p-1 ring-1 ring-slate-200">
                              {options.map((opt) => {
                                const active = availability === opt.value;
                                return (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setAvailability(opt.value)}
                                    className={`rounded-md px-2 py-1.5 text-[11px] font-semibold transition ${
                                      active
                                        ? opt.value === 'UNAVAILABLE'
                                          ? 'bg-rose-500 text-white'
                                          : opt.value === 'ALTERNATIVE'
                                            ? 'bg-amber-500 text-white'
                                            : 'bg-indigo-600 text-white'
                                        : 'text-slate-500 hover:bg-slate-50'
                                    }`}
                                  >
                                    {opt.label}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Precio (oculto si el producto no está disponible) */}
                            {availability !== 'UNAVAILABLE' ? (
                              <div className="mt-2 flex items-stretch overflow-hidden rounded-lg border border-slate-200 bg-white focus-within:border-indigo-400">
                                <span className="flex items-center px-3 text-sm text-slate-400">$</span>
                                <input
                                  className="w-full bg-transparent py-2.5 pr-3 text-sm outline-none"
                                  inputMode="decimal"
                                  onChange={(event) =>
                                    setDraft((current) => ({
                                      ...current,
                                      unitPrices: { ...current.unitPrices, [item.id]: event.target.value },
                                    }))
                                  }
                                  placeholder={
                                    availability === 'ALTERNATIVE'
                                      ? 'Precio de la alternativa (opcional)'
                                      : 'Precio por unidad'
                                  }
                                  value={draft.unitPrices[item.id] ?? ''}
                                />
                              </div>
                            ) : null}

                            {/* Nota: motivo de no disponible o detalle del reemplazo */}
                            {availability !== 'QUOTED' ? (
                              <textarea
                                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
                                rows={2}
                                onChange={(event) =>
                                  setDraft((current) => ({
                                    ...current,
                                    itemNotes: { ...current.itemNotes, [item.id]: event.target.value },
                                  }))
                                }
                                placeholder={
                                  availability === 'UNAVAILABLE'
                                    ? 'Motivo / cuándo lo tendrías (opcional)'
                                    : 'Detalle del reemplazo que ofrecés'
                                }
                                value={draft.itemNotes[item.id] ?? ''}
                              />
                            ) : null}
                          </div>
                        );
                      })}

                      <div className="flex items-center justify-between rounded-xl bg-indigo-50 px-3 py-2.5">
                        <span className="text-xs font-semibold text-indigo-700">Total de la cotización</span>
                        <span className="text-sm font-bold text-indigo-700">
                          {formatCurrency(quoteTotal, draft.currency)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <Field label="Precio total">
                      <div className="flex items-stretch overflow-hidden rounded-xl border border-slate-200 bg-slate-50 focus-within:border-indigo-400">
                        <span className="flex items-center px-3 text-sm text-slate-400">$</span>
                        <input
                          className="w-full bg-transparent py-3 pr-3 text-sm outline-none"
                          inputMode="decimal"
                          onChange={(event) => setDraft((current) => ({ ...current, amount: event.target.value }))}
                          placeholder="26000"
                          value={draft.amount}
                        />
                        <input
                          className="w-16 border-l border-slate-200 bg-transparent px-2 text-center text-xs uppercase outline-none"
                          maxLength={4}
                          onChange={(event) =>
                            setDraft((current) => ({ ...current, currency: event.target.value.toUpperCase() }))
                          }
                          value={draft.currency}
                        />
                      </div>
                    </Field>
                  )}
                  <p className="text-[11px] text-slate-400">
                    Estos datos vienen de tu perfil. Podés dejarlos como están o ajustarlos para esta cotización.
                  </p>
                  <Field label="Cantidad mínima (opcional)">
                    <Input
                      value={draft.minimumOrder}
                      onChange={(value) => setDraft((current) => ({ ...current, minimumOrder: value }))}
                      placeholder="500 unidades"
                    />
                  </Field>
                  <Field label="Tiempo de entrega en días (opcional)">
                    <Input
                      value={draft.leadTimeDays}
                      onChange={(value) => setDraft((current) => ({ ...current, leadTimeDays: value }))}
                      placeholder="7"
                      inputMode="numeric"
                    />
                  </Field>
                  <Field label="Condiciones de pago (opcional)">
                    <Input
                      value={draft.paymentTerms}
                      onChange={(value) => setDraft((current) => ({ ...current, paymentTerms: value }))}
                      placeholder="30 días"
                    />
                  </Field>
                  <Field label="Validez de la oferta">
                    <Input
                      value={draft.validity}
                      onChange={(value) => setDraft((current) => ({ ...current, validity: value }))}
                      placeholder="15 días"
                    />
                  </Field>
                  <Field label="Observaciones (opcional)">
                    <textarea
                      className="min-h-24 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition focus:border-indigo-400"
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, technicalComment: event.target.value }))
                      }
                      placeholder="Incluye flete a destino. Calidad premium garantizada."
                      value={draft.technicalComment}
                    />
                  </Field>
                </div>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleSubmitQuote()}
                  className="mt-5 flex h-12 w-full items-center justify-center rounded-xl bg-indigo-600 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
                >
                  {submitting ? 'Enviando...' : existingQuote ? 'Actualizar cotización' : 'Enviar cotización'}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>

      {/* Barra de acciones fija (mobile) */}
      {request ? (
        <div className="fixed inset-x-0 bottom-[68px] z-30 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:static lg:mt-6 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0">
          <div className="mx-auto flex w-full max-w-2xl gap-3">
            {/* Chat con el comprador antes de cotizar. */}
            <button
              type="button"
              disabled={openingChat}
              onClick={() => void handleOpenChat()}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 disabled:opacity-60"
            >
              <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                <path d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4v8z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
              {openingChat ? 'Abriendo...' : 'Consultar'}
            </button>
            <button
              type="button"
              onClick={() => setShowQuoteForm(true)}
              className="flex h-12 flex-[1.4] items-center justify-center rounded-xl bg-indigo-600 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              {existingQuote ? 'Editar cotización' : 'Enviar cotización'}
            </button>
          </div>
        </div>
      ) : null}
    </SupplierDashboardShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputMode?: 'text' | 'numeric' | 'decimal';
}) {
  return (
    <input
      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition focus:border-indigo-400"
      inputMode={inputMode}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      value={value}
    />
  );
}
