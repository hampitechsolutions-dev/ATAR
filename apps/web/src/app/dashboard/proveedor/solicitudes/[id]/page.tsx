'use client';

import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import SupplierDashboardShell from '@/components/dashboard/supplier-dashboard-shell';
import { ApiError, atarApi, type CreateQuotePayload, type QuoteRecord, type RequestRecord } from '@/lib/atar-api';
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

type QuoteDraft = {
  amount: string;
  currency: string;
  minimumOrder: string;
  leadTimeDays: string;
  paymentTerms: string;
  validity: string;
  technicalComment: string;
};

function createDraft(quote?: QuoteRecord | null): QuoteDraft {
  return {
    amount: typeof quote?.amount === 'number' ? String(quote.amount) : '',
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

      const payload: CreateQuotePayload = {
        amount: draft.amount.trim() ? Number(draft.amount) : undefined,
        currency: draft.currency.trim() || 'ARS',
        leadTimeDays: draft.leadTimeDays.trim() ? Number(draft.leadTimeDays) : undefined,
        paymentTerms: draft.paymentTerms.trim() || undefined,
        technicalComment: notes || undefined,
      };

      if (payload.amount !== undefined && Number.isNaN(payload.amount)) {
        throw new ApiError('El precio debe ser numérico.', 400);
      }
      if (payload.leadTimeDays !== undefined && Number.isNaN(payload.leadTimeDays)) {
        throw new ApiError('El plazo debe ser numérico.', 400);
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

  const detailRows = request
    ? [
        { label: 'Producto', value: request.productName || request.title },
        {
          label: 'Cantidad',
          value: typeof request.quantityRequested === 'number' ? `${request.quantityRequested} unidades` : 'A definir',
        },
        { label: 'Especificaciones', value: request.description || 'Sin especificaciones' },
        { label: 'Material', value: request.category || 'No informado' },
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

            {/* Detalles */}
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-bold text-slate-950">Detalles de la solicitud</p>
              <dl className="mt-3 divide-y divide-slate-100">
                {detailRows.map((row) => (
                  <div key={row.label} className="flex items-start justify-between gap-4 py-2.5">
                    <dt className="shrink-0 text-xs text-slate-500">{row.label}</dt>
                    <dd className="text-right text-sm font-medium text-slate-900">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Formulario de cotización */}
            {showQuoteForm ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-bold text-slate-950">
                  {existingQuote ? 'Editar cotización' : 'Nueva cotización'}
                </p>
                <div className="mt-4 space-y-4">
                  <Field label="Precio unitario">
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
                  <Field label="Cantidad mínima">
                    <Input
                      value={draft.minimumOrder}
                      onChange={(value) => setDraft((current) => ({ ...current, minimumOrder: value }))}
                      placeholder="500 unidades"
                    />
                  </Field>
                  <Field label="Tiempo de entrega (días)">
                    <Input
                      value={draft.leadTimeDays}
                      onChange={(value) => setDraft((current) => ({ ...current, leadTimeDays: value }))}
                      placeholder="7"
                      inputMode="numeric"
                    />
                  </Field>
                  <Field label="Condiciones de pago">
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
            ) : null}
          </>
        )}
      </div>

      {/* Barra de acciones fija (mobile) */}
      {request ? (
        <div className="fixed inset-x-0 bottom-[68px] z-30 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:static lg:mt-6 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0">
          <div className="mx-auto flex w-full max-w-2xl gap-3">
            {existingQuote ? (
              <Link
                href={`/dashboard/proveedor/cotizaciones/${existingQuote.id}`}
                className="flex h-12 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700"
              >
                Ver cotización
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => router.back()}
                className="flex h-12 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700"
              >
                No estoy interesado
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowQuoteForm((open) => !open)}
              className="flex h-12 flex-[1.4] items-center justify-center rounded-xl bg-indigo-600 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              {showQuoteForm ? 'Ocultar formulario' : existingQuote ? 'Editar cotización' : 'Enviar cotización'}
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
