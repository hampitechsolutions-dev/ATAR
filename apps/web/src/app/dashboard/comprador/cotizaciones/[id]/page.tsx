'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import ConversationPanel from '@/components/chat/conversation-panel';
import { atarApi, type QuoteRecord, type QuoteStatus } from '@/lib/atar-api';
import { FALLBACK_REQUEST_CATEGORIES } from '@/lib/request-catalog-fallback';

/* ============================ HELPERS ============================ */

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
    return '—';
  }

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return '—';
  }

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function daysUntil(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const days = Math.ceil((new Date(value).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return Number.isNaN(days) ? null : days;
}

function getStatusTone(status: QuoteStatus) {
  if (status === 'AWARDED') {
    return { label: 'Adjudicada', text: 'text-emerald-600', dot: 'bg-emerald-500', helper: 'Compra asignada' };
  }

  if (status === 'REJECTED') {
    return { label: 'No seleccionada', text: 'text-rose-600', dot: 'bg-rose-500', helper: 'Cerrada' };
  }

  if (status === 'SUBMITTED') {
    return { label: 'Enviada', text: 'text-[#4f46ff]', dot: 'bg-[#4f46ff]', helper: 'En evaluación' };
  }

  return { label: 'Borrador', text: 'text-slate-500', dot: 'bg-slate-400', helper: 'Sin enviar' };
}

function getCategoryImage(category: string | undefined) {
  if (!category) {
    return '/rollo.png';
  }

  const normalized = category.trim().toLowerCase();
  const match = FALLBACK_REQUEST_CATEGORIES.find(
    (item) => item.label.toLowerCase() === normalized || normalized.includes(item.label.toLowerCase()),
  );

  return match?.imageSrc ?? '/rollo.png';
}

type DescriptionRow = { label: string; value: string };

function looksLikeFile(value: string) {
  return /\.(pdf|xlsx?|csv|docx?|png|jpe?g|dwg|zip|ai|cdr|step)$/i.test(value.trim());
}

function parseDescription(description: string) {
  const rows: DescriptionRow[] = [];
  const notes: string[] = [];
  const attachments: string[] = [];

  for (const rawLine of (description ?? '').split('\n')) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    const separatorIndex = line.indexOf(':');
    if (separatorIndex === -1) {
      notes.push(line);
      continue;
    }

    const label = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (!value) {
      continue;
    }

    const normalizedLabel = label.toLowerCase();
    const files = value
      .split(',')
      .map((item) => item.trim())
      .filter(looksLikeFile);

    if (files.length > 0 || normalizedLabel.includes('adjunt') || normalizedLabel.includes('archivo')) {
      attachments.push(...(files.length > 0 ? files : [value]));
      continue;
    }

    if (normalizedLabel.includes('observacion') || normalizedLabel === 'detalle') {
      notes.push(value);
      continue;
    }

    rows.push({ label, value });
  }

  return { rows, notes, attachments };
}

function getFileTone(fileName: string) {
  const extension = fileName.split('.').pop()?.toLowerCase() ?? '';

  if (['xlsx', 'xls', 'csv'].includes(extension)) {
    return { badge: 'bg-emerald-50 text-emerald-600', label: extension.toUpperCase() };
  }
  if (['doc', 'docx'].includes(extension)) {
    return { badge: 'bg-sky-50 text-sky-600', label: extension.toUpperCase() };
  }
  if (['png', 'jpg', 'jpeg'].includes(extension)) {
    return { badge: 'bg-violet-50 text-violet-600', label: extension.toUpperCase() };
  }

  return { badge: 'bg-rose-50 text-rose-500', label: extension ? extension.toUpperCase() : 'ARCHIVO' };
}

/* ============================ ICONOS ============================ */

type IconName =
  | 'arrow-left'
  | 'users'
  | 'money'
  | 'truck'
  | 'doc'
  | 'calendar'
  | 'check'
  | 'file'
  | 'info'
  | 'arrow-right';

function Icon({ name, className = 'h-4 w-4' }: { name: IconName; className?: string }) {
  const common = {
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 1.8,
  };

  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      {name === 'arrow-left' ? <path d="M19 12H5M11 18l-6-6 6-6" {...common} /> : null}
      {name === 'arrow-right' ? <path d="M5 12h14M13 6l6 6-6 6" {...common} /> : null}
      {name === 'users' ? (
        <>
          <circle cx="9" cy="8" r="3.5" {...common} />
          <path d="M3 20c0-3.2 2.7-5.5 6-5.5s6 2.3 6 5.5" {...common} />
          <path d="M16 5.5a3.5 3.5 0 010 6.5M18 20c0-2.4-.9-4.2-2.4-5.3" {...common} />
        </>
      ) : null}
      {name === 'money' ? (
        <>
          <circle cx="12" cy="12" r="9" {...common} />
          <path d="M14.5 9.2c-.5-.8-1.5-1.2-2.6-1.2-1.5 0-2.4.7-2.4 1.8 0 2.6 5.2 1.3 5.2 4 0 1.2-1 2-2.7 2-1.2 0-2.2-.4-2.8-1.3M12 6.5v11" {...common} />
        </>
      ) : null}
      {name === 'truck' ? (
        <>
          <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7" {...common} />
          <circle cx="7" cy="18" r="1.6" {...common} />
          <circle cx="17" cy="18" r="1.6" {...common} />
        </>
      ) : null}
      {name === 'doc' || name === 'file' ? (
        <>
          <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z" {...common} />
          <path d="M14 3v5h5" {...common} />
        </>
      ) : null}
      {name === 'calendar' ? (
        <>
          <rect height="16" rx="2" width="18" x="3" y="5" {...common} />
          <path d="M3 10h18M8 3v4M16 3v4" {...common} />
        </>
      ) : null}
      {name === 'check' ? <path d="M20 6L9 17l-5-5" {...common} /> : null}
      {name === 'info' ? (
        <>
          <circle cx="12" cy="12" r="9" {...common} />
          <path d="M12 11v5" {...common} />
          <circle cx="12" cy="8" fill="currentColor" r="1" stroke="none" />
        </>
      ) : null}
    </svg>
  );
}

/* ============================ PAGINA ============================ */

export default function BuyerQuoteDetailPage() {
  const params = useParams<{ id: string }>();
  const { session } = useAuth();
  const quoteId = typeof params.id === 'string' ? params.id : '';

  const [quote, setQuote] = useState<QuoteRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [awarding, setAwarding] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadQuote() {
      if (!session?.accessToken || !quoteId) {
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const detail = await atarApi.getQuoteDetail(quoteId, session.accessToken);
        if (!cancelled) {
          setQuote(detail);
        }
      } catch (detailError) {
        if (!cancelled) {
          setError(detailError instanceof Error ? detailError.message : 'No se pudo cargar la cotización.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadQuote();

    return () => {
      cancelled = true;
    };
  }, [quoteId, session?.accessToken]);

  const request = quote?.request ?? null;
  const parsed = useMemo(() => parseDescription(request?.description ?? ''), [request?.description]);
  const statusTone = getStatusTone(quote?.status ?? 'DRAFT');
  const productName = request?.productName || request?.title || 'Cotización';
  const [productHead, ...productRest] = productName.split(' - ');
  const dueInDays = daysUntil(request?.dueDate);
  const canAward = Boolean(
    quote && request && quote.status === 'SUBMITTED' && !request.awardedQuoteId && request.status !== 'CANCELLED',
  );

  async function handleAward() {
    if (!session?.accessToken || !quote || !request) {
      return;
    }

    const supplierName = quote.supplierCompany?.name ?? 'este proveedor';
    const confirmed = window.confirm(
      `Vas a asignarle la compra a ${supplierName} por ${formatCurrency(quote.amount, quote.currency)}.\n\nLas demás cotizaciones de la solicitud quedarán rechazadas.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setAwarding(true);
      setError(null);
      setMessage(null);
      await atarApi.awardQuote(request.id, { quoteId: quote.id }, session.accessToken);
      const detail = await atarApi.getQuoteDetail(quote.id, session.accessToken);
      setQuote(detail);
      setMessage(`Le asignaste la compra a ${supplierName}. Ya recibió la notificación.`);
    } catch (awardError) {
      setError(awardError instanceof Error ? awardError.message : 'No se pudo asignar la compra.');
    } finally {
      setAwarding(false);
    }
  }

  const timeline = useMemo(() => {
    if (!quote || !request) {
      return [] as { label: string; date: string | null; done: boolean; current: boolean }[];
    }

    const negotiating = ['NEGOTIATING', 'AWARDED', 'ORDER_ISSUED'].includes(request.status);
    const accepted = quote.status === 'AWARDED';

    return [
      { label: 'Solicitud enviada', date: request.createdAt, done: true, current: false },
      { label: 'Enviada al proveedor', date: request.createdAt, done: true, current: false },
      { label: 'Propuesta recibida', date: quote.createdAt, done: true, current: !negotiating && !accepted },
      {
        label: 'En negociación',
        date: negotiating ? quote.updatedAt : null,
        done: negotiating,
        current: negotiating && !accepted,
      },
      { label: 'Aceptada', date: accepted ? quote.updatedAt : null, done: accepted, current: accepted },
    ];
  }, [quote, request]);

  return (
    <div className="w-full">
      <div className="min-w-0 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <Link
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#4f46ff] transition hover:text-[#3f39d6]"
            href="/dashboard/comprador/cotizaciones"
          >
            <Icon name="arrow-left" />
            Volver a cotizaciones
          </Link>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">{error}</div>
        ) : null}

        {message ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
            {message}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-500">
            Cargando detalle de cotización...
          </div>
        ) : !quote ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-sm text-slate-500">
            No encontramos esta cotización o ya no está disponible.
          </div>
        ) : (
          <>
            {/* ---------- Hero ---------- */}
            <section className="relative isolate overflow-hidden rounded-3xl border border-slate-200 bg-[linear-gradient(110deg,#eef0ff_0%,#f4f5ff_42%,#fafaff_60%,#ffffff_100%)]">
              <div className="absolute inset-y-0 right-0 hidden w-[38%] lg:block">
                <Image
                  alt=""
                  className="object-cover"
                  fill
                  sizes="40vw"
                  src={getCategoryImage(request?.category)}
                />
                <div className="absolute inset-0 bg-[linear-gradient(90deg,#eef0ff_0%,rgba(238,240,255,0.7)_18%,rgba(238,240,255,0)_60%)]" />
              </div>

              <div className="relative z-10 max-w-2xl px-7 py-8">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#4f46ff]">
                  Detalle de cotización
                </p>
                <h1 className="mt-3 text-[34px] font-bold leading-tight tracking-[-0.03em] text-slate-950">
                  {productHead}
                  {productRest.length ? (
                    <>
                      {' - '}
                      <span className="text-[#4f46ff]">{productRest.join(' - ')}</span>
                    </>
                  ) : null}
                </h1>
                <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
                  Revisá la propuesta completa y conversá con el proveedor sin salir del detalle comercial.
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200">
                    Solicitud #{request?.id.slice(0, 8) ?? '—'}
                  </span>
                  <span className="rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200">
                    Creada el {formatDateTime(request?.createdAt)}
                  </span>
                </div>
              </div>
            </section>

            {/* ---------- Métricas ---------- */}
            <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <MetricCard icon="users" label="Proveedor">
                <p className="text-[17px] font-bold text-slate-950">{quote.supplierCompany?.name ?? 'Proveedor'}</p>
                <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                  <Icon className="h-3 w-3" name="check" />
                  Verificado
                </span>
              </MetricCard>

              <MetricCard icon="money" label="Monto total">
                <p className="text-[20px] font-bold tracking-[-0.02em] text-slate-950">
                  {formatCurrency(quote.amount, quote.currency)}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">{quote.currency} · IVA no discriminado</p>
              </MetricCard>

              <MetricCard icon="truck" label="Plazo de entrega">
                <p className="text-[20px] font-bold tracking-[-0.02em] text-slate-950">
                  {typeof quote.leadTimeDays === 'number' ? `${quote.leadTimeDays} días` : 'A convenir'}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">Desde la confirmación</p>
              </MetricCard>

              <MetricCard icon="doc" label="Estado">
                <p className={`flex items-center gap-2 text-[18px] font-bold ${statusTone.text}`}>
                  {statusTone.label}
                  <span className={`h-2 w-2 rounded-full ${statusTone.dot}`} />
                </p>
                <p className="mt-1 text-[11px] text-slate-400">{statusTone.helper}</p>
              </MetricCard>

              <MetricCard highlight icon="calendar" label="Cierre de la solicitud">
                <p className="text-[18px] font-bold text-slate-950">{formatDate(request?.dueDate)}</p>
                <p className="mt-1 text-[11px] text-slate-400">
                  {typeof dueInDays === 'number'
                    ? dueInDays >= 0
                      ? `Quedan ${dueInDays} días`
                      : 'Plazo vencido'
                    : 'Sin fecha límite'}
                </p>
              </MetricCard>
            </section>

            {/* ---------- Propuesta + chat ---------- */}
            <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_440px]">
              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-[17px] font-bold tracking-[-0.02em] text-slate-950">Propuesta del proveedor</h2>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Cotización en línea
                  </span>
                </div>

                <dl className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                  <SpecRow index={0} label="Producto">
                    {request?.productName || request?.title || '—'}
                  </SpecRow>
                  {parsed.rows.map((row, index) => (
                    <SpecRow index={index + 1} key={`${row.label}-${index}`} label={row.label}>
                      {row.value}
                    </SpecRow>
                  ))}
                  <SpecRow index={parsed.rows.length + 1} label="Condiciones de pago">
                    {quote.paymentTerms || 'A convenir'}
                  </SpecRow>
                </dl>

                {quote.items && quote.items.length > 0 && (request?.items?.length ?? 0) > 1 ? (
                  <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                    <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-2.5">
                      <p className="text-[11px] font-semibold text-slate-500">Precio por producto</p>
                    </div>
                    <ul className="divide-y divide-slate-100">
                      {quote.items.map((line) => {
                        const reqItem = request?.items?.find((item) => item.id === line.requestItemId);
                        const qty = reqItem?.quantity ?? null;
                        const unavailable = line.availability === 'UNAVAILABLE';
                        const alternative = line.availability === 'ALTERNATIVE';
                        const subtotal =
                          !unavailable && qty != null && line.unitPrice != null ? line.unitPrice * qty : null;
                        return (
                          <li key={line.id} className="flex items-start justify-between gap-3 px-4 py-2.5 text-[13px]">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="truncate font-semibold text-slate-900">{reqItem?.productName ?? 'Producto'}</p>
                                {unavailable ? (
                                  <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-600">
                                    No disponible
                                  </span>
                                ) : alternative ? (
                                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
                                    Alternativa
                                  </span>
                                ) : null}
                              </div>
                              {!unavailable && line.unitPrice != null ? (
                                <p className="text-[11px] text-slate-400">
                                  {qty
                                    ? `${qty} u. × ${formatCurrency(line.unitPrice, quote.currency)}`
                                    : `${formatCurrency(line.unitPrice, quote.currency)}/u`}
                                </p>
                              ) : null}
                              {line.note ? (
                                <p className="mt-0.5 text-[11px] leading-5 text-slate-500">{line.note}</p>
                              ) : null}
                            </div>
                            <span className="shrink-0 font-semibold text-slate-900">
                              {subtotal != null ? formatCurrency(subtotal, quote.currency) : '—'}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                    <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/70 px-4 py-2.5">
                      <span className="text-[12px] font-semibold text-slate-600">Total</span>
                      <span className="text-[14px] font-bold text-slate-950">
                        {formatCurrency(quote.amount, quote.currency)}
                      </span>
                    </div>
                  </div>
                ) : null}

                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                  <p className="text-[11px] font-semibold text-slate-500">Comentario técnico</p>
                  <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-6 text-slate-700">
                    {quote.technicalComment || 'El proveedor no dejó comentarios técnicos.'}
                  </p>
                </div>

                {parsed.attachments.length ? (
                  <div className="mt-4">
                    <p className="text-[11px] font-semibold text-slate-500">Documentos adjuntos</p>
                    <div className="mt-2 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {parsed.attachments.map((fileName) => {
                        const tone = getFileTone(fileName);
                        return (
                          <div
                            key={fileName}
                            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5"
                          >
                            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone.badge}`}>
                              <Icon name="file" />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-[12px] font-semibold text-slate-900">{fileName}</p>
                              <p className="text-[10px] text-slate-400">{tone.label} · informado en la solicitud</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                <div className="mt-5 flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-4">
                  {quote.status === 'AWARDED' ? (
                    <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-[13px] font-semibold text-emerald-700">
                      <Icon className="h-4 w-4" name="check" />
                      Le asignaste la compra a este proveedor
                    </span>
                  ) : quote.status === 'REJECTED' ? (
                    <span className="inline-flex items-center rounded-xl bg-slate-100 px-4 py-2.5 text-[13px] font-semibold text-slate-500">
                      Esta cotización no fue seleccionada
                    </span>
                  ) : null}

                  <Link
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50"
                    href={request ? `/dashboard/comprador/solicitudes/${request.id}` : '/dashboard/comprador/solicitudes'}
                  >
                    Ver solicitud completa
                  </Link>

                  {canAward ? (
                    <button
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#4f46ff] px-5 text-[13px] font-semibold text-white shadow-[0_14px_30px_rgba(79,70,255,0.24)] transition hover:bg-[#3f39d6] disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={awarding}
                      onClick={() => void handleAward()}
                      type="button"
                    >
                      <Icon className="h-4 w-4" name="check" />
                      {awarding ? 'Asignando...' : 'Asignar compra'}
                    </button>
                  ) : null}
                </div>
              </section>

              <section className="flex h-[620px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <ConversationPanel
                  mode="quote"
                  quoteId={quote.id}
                  session={session}
                  title="Chat con el proveedor"
                />
              </section>
            </div>

            {/* ---------- Timeline + consejo ---------- */}
            <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_440px]">
              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="text-[17px] font-bold tracking-[-0.02em] text-slate-950">Estado de la cotización</h2>

                <div className="mt-6 flex items-start">
                  {timeline.map((step, index) => (
                    <div className="relative flex min-w-0 flex-1 flex-col items-center text-center" key={step.label}>
                      {index > 0 ? (
                        <span
                          className={`absolute right-1/2 top-[11px] h-0.5 w-full ${
                            step.done ? 'bg-[#4f46ff]' : 'bg-slate-200'
                          }`}
                        />
                      ) : null}

                      <span
                        className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 bg-white ${
                          step.done
                            ? step.current
                              ? 'border-[#4f46ff] text-[#4f46ff]'
                              : 'border-[#4f46ff] bg-[#4f46ff] text-white'
                            : 'border-slate-300 text-transparent'
                        }`}
                      >
                        {step.done && !step.current ? <Icon className="h-3 w-3" name="check" /> : null}
                        {!step.done ? <span className="h-2 w-2 rounded-full bg-slate-300" /> : null}
                      </span>

                      <p
                        className={`mt-3 px-1 text-[12px] font-semibold ${
                          step.done ? 'text-slate-950' : 'text-slate-400'
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {step.date ? formatDateTime(step.date) : '—'}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-indigo-100 bg-[#f5f6ff] p-5">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-[#4f46ff]">
                    <Icon name="info" />
                  </span>
                  <div>
                    <p className="text-[13px] font-bold text-[#3b3a7a]">Consejo ATAR</p>
                    <p className="mt-1 text-[12px] leading-6 text-[#5a5a94]">
                      Compará esta cotización con las otras propuestas de la solicitud antes de asignar la compra.
                    </p>
                  </div>
                </div>

                <Link
                  className="mt-4 inline-flex items-center gap-2 text-[12px] font-bold text-[#4f46ff] transition hover:text-[#3f39d6]"
                  href={request ? `/dashboard/comprador/solicitudes/${request.id}` : '/dashboard/comprador/solicitudes'}
                >
                  Ver otras cotizaciones
                  <Icon className="h-3.5 w-3.5" name="arrow-right" />
                </Link>
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  highlight = false,
  children,
}: {
  icon: IconName;
  label: string;
  highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-xl px-4 py-3.5 ${
        highlight ? 'bg-[#f5f6ff]' : 'bg-white'
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          highlight ? 'bg-white text-[#4f46ff]' : 'bg-slate-50 text-[#4f46ff]'
        }`}
      >
        <Icon name={icon} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-slate-400">{label}</p>
        <div className="mt-0.5">{children}</div>
      </div>
    </div>
  );
}

function SpecRow({
  index,
  label,
  children,
}: {
  index: number;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex items-start gap-4 px-4 py-2.5 text-[13px] ${index % 2 === 0 ? 'bg-slate-50/70' : 'bg-white'}`}
    >
      <dt className="w-44 shrink-0 text-slate-500">{label}</dt>
      <dd className="min-w-0 flex-1 font-medium text-slate-900">{children}</dd>
    </div>
  );
}
