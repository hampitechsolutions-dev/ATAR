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

function formatCurrency(value: number | null, currency = 'ARS') {
  if (typeof value !== 'number') {
    return 'A consultar';
  }

  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
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

function getRequestStatusStyles(status: RequestRecord['status']) {
  if (status === 'ORDER_ISSUED') {
    return 'bg-indigo-100 text-indigo-700';
  }

  if (status === 'NEGOTIATING') {
    return 'bg-emerald-100 text-emerald-700';
  }

  if (status === 'AWARDED') {
    return 'bg-emerald-100 text-emerald-700';
  }

  if (status === 'REVIEWING') {
    return 'bg-amber-100 text-amber-700';
  }

  if (status === 'CANCELLED') {
    return 'bg-rose-100 text-rose-700';
  }

  if (status === 'COMPLETED') {
    return 'bg-emerald-100 text-emerald-700';
  }

  return 'bg-indigo-100 text-indigo-700';
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

  if (status === 'COMPLETED') {
    return 'Completada';
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

const FULFILLMENT_STEPS: OrderFulfillmentStatus[] = [
  'ISSUED',
  'CONFIRMED',
  'IN_PRODUCTION',
  'DISPATCHED',
  'DELIVERED',
];

function parseRequestDescription(description: string) {
  return description
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separatorIndex = line.indexOf(':');
      if (separatorIndex === -1) {
        return { label: 'Detalle', value: line };
      }

      return {
        label: line.slice(0, separatorIndex).trim(),
        value: line.slice(separatorIndex + 1).trim(),
      };
    });
}

function getDetailIcon(label: string) {
  const normalized = label.toLowerCase();

  if (normalized.includes('producto')) return 'package';
  if (normalized.includes('material')) return 'layers';
  if (normalized.includes('gramaje') || normalized.includes('cantidad')) return 'scale';
  if (normalized.includes('medidas') || normalized.includes('medida')) return 'ruler';
  if (normalized.includes('fuelle') || normalized.includes('laminado') || normalized.includes('micro') || normalized.includes('cierre')) return 'grid';
  if (normalized.includes('impres')) return 'printer';
  if (normalized.includes('entrega')) return 'pin';
  if (normalized.includes('fecha')) return 'calendar';
  if (normalized.includes('horario')) return 'clock';
  if (normalized.includes('contacto')) return 'user';
  if (normalized.includes('telefono')) return 'phone';
  if (normalized.includes('archivo') || normalized.includes('adjuntar')) return 'file';
  return 'dot';
}

function DetailIcon({ type }: { type: ReturnType<typeof getDetailIcon> }) {
  if (type === 'package') {
    return (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }
  if (type === 'layers') {
    return (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path d="M12 4l7 4-7 4-7-4 7-4zM5 12l7 4 7-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }
  if (type === 'scale') {
    return (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path d="M6 7h12M8 7l1.5 10h5L16 7M12 7V4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }
  if (type === 'ruler') {
    return (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path d="M4 8l4-4 12 12-4 4L4 8zM9 7l1.5 1.5M12 10l1.5 1.5M15 13l1.5 1.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }
  if (type === 'grid') {
    return (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }
  if (type === 'printer') {
    return (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path d="M7 8V4h10v4M7 17H5a2 2 0 01-2-2v-4a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2h-2M7 14h10v6H7z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }
  if (type === 'user') {
    return (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path d="M20 21a8 8 0 10-16 0M12 11a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }
  if (type === 'file') {
    return (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path d="M14 2H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V8l-5-6zM14 2v6h6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }
  if (type === 'dot') {
    return <span className="h-2.5 w-2.5 rounded-full bg-current" />;
  }
  if (type === 'pin') {
    return (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path d="M21 10c0 6-9 12-9 12S3 16 3 10a9 9 0 1118 0z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="M12 10a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }
  if (type === 'calendar') {
    return (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path d="M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }
  if (type === 'clock') {
    return (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <path d="M12 7v5l3 2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.86 19.86 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.86 19.86 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.12.9.33 1.77.62 2.6a2 2 0 01-.45 2.11L8.04 9.96a16 16 0 006 6l1.53-1.26a2 2 0 012.11-.45c.83.29 1.7.5 2.6.62A2 2 0 0122 16.92z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

export default function BuyerRequestDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { session, refreshSession, role } = useAuth();
  const [request, setRequest] = useState<RequestRecord | null>(null);
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [awardingQuoteId, setAwardingQuoteId] = useState<string | null>(null);
  const [progressingAction, setProgressingAction] = useState<
    'START_NEGOTIATION' | 'ISSUE_ORDER' | 'CONFIRM_RECEIPT' | null
  >(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [orderForm, setOrderForm] = useState({
    orderNumber: '',
    promisedDate: '',
    notes: '',
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

    const supplierName = selectedQuote.supplierCompany?.name ?? 'este proveedor';
    const amountLabel = formatCurrency(selectedQuote.amount, selectedQuote.currency);
    const confirmed = window.confirm(
      `Vas a asignarle la compra a ${supplierName} por ${amountLabel}.\n\nLas demas cotizaciones quedaran rechazadas y la solicitud se cerrara para nuevas propuestas.`,
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
      setMessage(`Le asignaste la compra a ${supplierName}. Ya recibio la notificacion.`);
    } catch (awardError) {
      setError(awardError instanceof Error ? awardError.message : 'No se pudo adjudicar la cotizacion.');
    } finally {
      setAwardingQuoteId(null);
    }
  }

  async function handleProgress(action: 'START_NEGOTIATION' | 'ISSUE_ORDER' | 'CONFIRM_RECEIPT') {
    if (!session?.accessToken || !request) {
      return;
    }

    const confirmations = {
      START_NEGOTIATION:
        'Vas a iniciar la negociacion con el proveedor adjudicado. El pedido quedara en seguimiento comercial.',
      ISSUE_ORDER:
        'Vas a emitir la orden de compra al proveedor adjudicado. Recien ahi el proveedor puede empezar a preparar el pedido.',
      CONFIRM_RECEIPT:
        'Vas a confirmar que recibiste el pedido. Esto cierra la operacion como completada.',
    } as const;

    const successMessages = {
      START_NEGOTIATION: 'La solicitud paso a negociacion correctamente.',
      ISSUE_ORDER: 'Orden emitida. El proveedor ya puede avanzar con el cumplimiento.',
      CONFIRM_RECEIPT: 'Confirmaste la recepcion. La operacion quedo completada.',
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
      setMessage(successMessages[action]);
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

  // Cotizaciones vigentes: las rechazadas quedan fuera de la comparacion.
  const comparableQuotes = useMemo(
    () => quotes.filter((quote) => quote.status !== 'REJECTED'),
    [quotes],
  );
  const bestPrice = useMemo(() => {
    return (
      comparableQuotes
        .filter((quote) => typeof quote.amount === 'number')
        .sort((a, b) => (a.amount ?? 0) - (b.amount ?? 0))[0] ?? null
    );
  }, [comparableQuotes]);
  const fastest = useMemo(() => {
    return (
      comparableQuotes
        .filter((quote) => typeof quote.leadTimeDays === 'number')
        .sort((a, b) => (a.leadTimeDays ?? 9999) - (b.leadTimeDays ?? 9999))[0] ?? null
    );
  }, [comparableQuotes]);
  const awardedQuote = useMemo(
    () => quotes.find((quote) => quote.id === request?.awardedQuoteId) ?? null,
    [quotes, request?.awardedQuoteId],
  );
  const canAward = Boolean(request) && !request?.awardedQuoteId && request?.status !== 'CANCELLED';
  const fulfillmentIndex = request?.order ? FULFILLMENT_STEPS.indexOf(request.order.fulfillmentStatus) : -1;
  const parsedDescription = useMemo(() => parseRequestDescription(request?.description ?? ''), [request?.description]);
  const attachmentItems = useMemo(
    () => parsedDescription.filter((item) => item.label.toLowerCase().includes('adjuntar') || item.label.toLowerCase().includes('archivo')),
    [parsedDescription],
  );
  const deliveryItems = useMemo(
    () =>
      parsedDescription.filter((item) => {
        const label = item.label.toLowerCase();
        return (
          label.includes('entrega') ||
          label.includes('fecha') ||
          label.includes('horario') ||
          label.includes('contacto') ||
          label.includes('telefono')
        );
      }),
    [parsedDescription],
  );
  const detailItems = useMemo(() => {
    const items = [
      { label: 'Producto', value: request?.category ?? '-' },
      ...parsedDescription.filter((item) => {
        const label = item.label.toLowerCase();
        return (
          !label.includes('entrega') &&
          !label.includes('fecha') &&
          !label.includes('horario') &&
          !label.includes('contacto') &&
          !label.includes('telefono') &&
          !label.includes('adjuntar') &&
          !label.includes('archivo')
        );
      }),
    ];

    const uniqueItems = items.filter((item, index) => index === items.findIndex((candidate) => candidate.label === item.label));
    return uniqueItems;
  }, [parsedDescription, request?.category]);
  const supplierCards = useMemo(() => {
    const map = new Map<string, { id: string; name: string; city: string; tag: string }>();

    for (const quote of sortedQuotes) {
      const company = quote.supplierCompany;
      if (!company) continue;

      if (!map.has(company.id)) {
        map.set(company.id, {
          id: company.id,
          name: company.name,
          city: [company.city, company.country].filter(Boolean).join(', '),
          tag: `Especialista en ${request?.category ?? 'solicitudes industriales'}`,
        });
      }
    }

    if (request?.awardedQuote?.supplierCompany && !map.has(request.awardedQuote.supplierCompany.id)) {
      map.set(request.awardedQuote.supplierCompany.id, {
        id: request.awardedQuote.supplierCompany.id,
        name: request.awardedQuote.supplierCompany.name,
        city: [request.awardedQuote.supplierCompany.city, request.awardedQuote.supplierCompany.country].filter(Boolean).join(', '),
        tag: `Especialista en ${request.category}`,
      });
    }

    return Array.from(map.values()).slice(0, 3);
  }, [request?.awardedQuote?.supplierCompany, request?.category, sortedQuotes]);
  const requestTimeline = useMemo(() => (request?.events ?? []).slice(0, 4), [request?.events]);
  const requestCreatedLabel = request ? formatDateTime(request.createdAt) : '-';
  const fileCardName =
    attachmentItems[0]?.value.split(',').map((item) => item.trim()).filter(Boolean)[0] ||
    `especificaciones_${(request?.category ?? 'solicitud').toLowerCase().replace(/\s+/g, '_')}.pdf`;
  const fileCardMeta = bestPrice ? `${formatCurrency(bestPrice.amount)} · Mejor oferta registrada` : 'PDF · Archivo adjunto';

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-950">
        <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-5 shadow-sm">Cargando detalle...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-950">
      <div className="mx-auto flex w-full max-w-[1720px] flex-col gap-5 px-3 py-4 sm:px-4 sm:py-5 lg:px-6 xl:px-8">
        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-700"
          href="/dashboard/comprador/solicitudes"
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
          Volver a solicitudes
        </Link>

        {error ? <div className="rounded-[18px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">{error}</div> : null}
        {message ? <div className="rounded-[18px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">{message}</div> : null}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.55fr)_360px] 2xl:grid-cols-[minmax(0,1.7fr)_380px]">
          <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_12px_36px_rgba(15,23,42,0.04)] sm:p-6">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#4f46ff]">Solicitud publicada</p>
                <h1 className="mt-3 text-[26px] font-semibold tracking-[-0.04em] text-slate-950 sm:text-[32px] lg:text-[40px] lg:tracking-[-0.05em]">{request?.title ?? 'Solicitud no encontrada'}</h1>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-[12px] text-slate-500">
                  <span>ID de solicitud: <span className="font-semibold text-[#6474a3]">#{requestId}</span></span>
                  <span className="h-1 w-1 rounded-full bg-slate-300" />
                  <span>Creada el {requestCreatedLabel}</span>
                  {request ? (
                    <>
                      <span className="h-1 w-1 rounded-full bg-slate-300" />
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getRequestStatusStyles(request.status)}`}>
                        {getRequestStatusLabel(request.status)}
                      </span>
                    </>
                  ) : null}
                </div>
              </div>
              <button
                className="inline-flex h-10 items-center gap-2 rounded-[14px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                type="button"
              >
                Acciones
                <svg aria-hidden="true" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24">
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </button>
            </div>

            <div className="space-y-6 pt-6">
              <section>
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#eef2ff] text-[#4f46ff]">
                    <DetailIcon type="file" />
                  </span>
                  <h2 className="min-w-0 text-[22px] font-semibold tracking-[-0.03em] text-slate-950">
                    Productos solicitados{(request?.items?.length ?? 0) > 0 ? ` (${request?.items?.length})` : ''}
                  </h2>
                </div>
                {(request?.items?.length ?? 0) > 0 ? (
                  <div className="mt-4 space-y-3">
                    {(request?.items ?? []).map((item, index) => {
                      const specRows = parseRequestDescription(item.specifications ?? '');
                      return (
                        <article key={item.id} className="rounded-[16px] border border-slate-200 bg-white p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#4f46ff]">Producto {index + 1}</p>
                              <h3 className="mt-0.5 text-[16px] font-semibold text-slate-950">{item.productName}</h3>
                              {item.category ? <p className="text-[12px] text-slate-500">{item.category}</p> : null}
                            </div>
                            <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-[12px] font-semibold text-slate-700">
                              {item.quantity ? `${item.quantity} ${item.unit ?? 'u.'}` : 'Cantidad a definir'}
                            </span>
                          </div>
                          {specRows.length ? (
                            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                              {specRows.map((row, rowIndex) => (
                                <div key={`${row.label}-${rowIndex}`} className="rounded-[12px] bg-slate-50 px-3 py-2">
                                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">{row.label}</p>
                                  <p className="mt-0.5 text-[13px] font-medium leading-5 text-slate-900">{row.value || '-'}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-3 text-[12px] text-slate-400">Sin especificaciones adicionales.</p>
                          )}
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
                    {detailItems.map((item) => (
                      <article key={`${item.label}-${item.value}`} className="rounded-[16px] border border-slate-200 bg-white px-4 py-4">
                        <div className="flex items-center gap-2 text-slate-400">
                          <DetailIcon type={getDetailIcon(item.label)} />
                          <p className="text-[11px] font-semibold text-slate-400">{item.label}</p>
                        </div>
                        <p className="mt-3 text-[15px] font-semibold leading-6 text-slate-950">{item.value || '-'}</p>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              {/* ==================== COTIZACIONES RECIBIDAS ==================== */}
              <section className="border-t border-slate-200 pt-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#eef2ff] text-[#4f46ff]">
                    <DetailIcon type="scale" />
                  </span>
                  <h2 className="min-w-0 text-[22px] font-semibold tracking-[-0.03em] text-slate-950">
                    Cotizaciones recibidas
                  </h2>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    {sortedQuotes.length}
                  </span>
                </div>

                {awardedQuote ? (
                  <div className="mt-4 flex items-start gap-3 rounded-[16px] border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                      <svg aria-hidden="true" className="h-3 w-3" fill="none" viewBox="0 0 24 24">
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                      </svg>
                    </span>
                    <p className="text-[13px] leading-6 text-emerald-800">
                      La compra ya fue asignada a{' '}
                      <span className="font-semibold">{awardedQuote.supplierCompany?.name ?? 'un proveedor'}</span> por{' '}
                      <span className="font-semibold">{formatCurrency(awardedQuote.amount, awardedQuote.currency)}</span>.
                    </p>
                  </div>
                ) : sortedQuotes.length ? (
                  <p className="mt-3 text-[13px] leading-6 text-slate-500">
                    Compará las propuestas y asignale la compra al proveedor que elijas. Al confirmar, el resto de las
                    cotizaciones quedan rechazadas y la solicitud se cierra.
                  </p>
                ) : null}

                <div className="mt-4 space-y-3">
                  {sortedQuotes.length ? (
                    sortedQuotes.map((quote) => {
                      const isAwarded = quote.id === request?.awardedQuoteId;
                      const isRejected = quote.status === 'REJECTED';
                      const isAwardable = canAward && quote.status === 'SUBMITTED';
                      const awarding = awardingQuoteId === quote.id;
                      const supplierName = quote.supplierCompany?.name ?? 'Proveedor';
                      const supplierCity = [quote.supplierCompany?.city, quote.supplierCompany?.country]
                        .filter(Boolean)
                        .join(', ');

                      return (
                        <article
                          key={quote.id}
                          className={`rounded-[18px] border p-4 transition ${
                            isAwarded
                              ? 'border-emerald-300 bg-emerald-50/60'
                              : isRejected
                                ? 'border-slate-200 bg-slate-50/70'
                                : 'border-slate-200 bg-white'
                          }`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="flex min-w-0 gap-3">
                              <span
                                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] text-sm font-bold ${
                                  isAwarded ? 'bg-emerald-100 text-emerald-700' : 'bg-[#eef2ff] text-[#4f46ff]'
                                }`}
                              >
                                {supplierName.slice(0, 2).toUpperCase()}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate text-[15px] font-semibold text-slate-950">{supplierName}</p>
                                <p className="mt-0.5 truncate text-[12px] text-slate-500">
                                  {supplierCity || 'Ubicación no informada'}
                                </p>
                                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                  {isAwarded ? (
                                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                                      Compra asignada
                                    </span>
                                  ) : isRejected ? (
                                    <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                                      No seleccionada
                                    </span>
                                  ) : quote.status === 'SUBMITTED' ? (
                                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold text-amber-700">
                                      En evaluación
                                    </span>
                                  ) : (
                                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
                                      Borrador
                                    </span>
                                  )}
                                  {!isRejected && bestPrice?.id === quote.id ? (
                                    <span className="rounded-full bg-[#eef2ff] px-2.5 py-1 text-[10px] font-semibold text-[#4f46ff]">
                                      Mejor precio
                                    </span>
                                  ) : null}
                                  {!isRejected && fastest?.id === quote.id ? (
                                    <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-semibold text-teal-700">
                                      Entrega más rápida
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <p className="text-[20px] font-semibold tracking-[-0.02em] text-slate-950">
                                {formatCurrency(quote.amount, quote.currency)}
                              </p>
                              <p className="mt-0.5 text-[11px] text-slate-400">
                                Enviada el {formatDate(quote.createdAt)}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="rounded-[14px] bg-slate-50 px-3 py-2.5">
                              <p className="text-[11px] font-semibold text-slate-400">Plazo de entrega</p>
                              <p className="mt-1 text-[13px] font-semibold text-slate-900">
                                {typeof quote.leadTimeDays === 'number' ? `${quote.leadTimeDays} días` : 'A convenir'}
                              </p>
                            </div>
                            <div className="rounded-[14px] bg-slate-50 px-3 py-2.5">
                              <p className="text-[11px] font-semibold text-slate-400">Condiciones de pago</p>
                              <p className="mt-1 text-[13px] font-semibold text-slate-900">
                                {quote.paymentTerms || 'A convenir'}
                              </p>
                            </div>
                          </div>

                          {quote.items && quote.items.length > 0 && (request?.items?.length ?? 0) > 1 ? (
                            <div className="mt-3 rounded-[14px] border border-slate-100 bg-slate-50/70 px-3 py-2.5">
                              <p className="text-[11px] font-semibold text-slate-400">Precio por producto</p>
                              <ul className="mt-1.5 space-y-1">
                                {quote.items.map((line) => {
                                  const reqItem = request?.items?.find((item) => item.id === line.requestItemId);
                                  const qty = reqItem?.quantity ?? null;
                                  const unavailable = line.availability === 'UNAVAILABLE';
                                  const alternative = line.availability === 'ALTERNATIVE';
                                  const subtotal =
                                    !unavailable && qty != null && line.unitPrice != null
                                      ? line.unitPrice * qty
                                      : null;
                                  return (
                                    <li key={line.id} className="flex items-start justify-between gap-3 text-[12px]">
                                      <span className="min-w-0">
                                        <span className="flex flex-wrap items-center gap-1.5">
                                          <span className="truncate text-slate-700">
                                            {reqItem?.productName ?? 'Producto'}
                                            {qty ? ` · ${qty} u.` : ''}
                                          </span>
                                          {unavailable ? (
                                            <span className="rounded-full bg-rose-50 px-1.5 py-0.5 text-[9px] font-semibold text-rose-600">
                                              No disp.
                                            </span>
                                          ) : alternative ? (
                                            <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-600">
                                              Alternativa
                                            </span>
                                          ) : null}
                                        </span>
                                        {line.note ? (
                                          <span className="mt-0.5 block text-[11px] leading-5 text-slate-500">{line.note}</span>
                                        ) : null}
                                      </span>
                                      <span className="shrink-0 text-right font-semibold text-slate-900">
                                        {unavailable || line.unitPrice == null
                                          ? '—'
                                          : `${formatCurrency(line.unitPrice, quote.currency)}/u${
                                              subtotal != null ? ` · ${formatCurrency(subtotal, quote.currency)}` : ''
                                            }`}
                                      </span>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          ) : null}

                          {quote.technicalComment ? (
                            <p className="mt-3 whitespace-pre-wrap rounded-[14px] bg-slate-50 px-3 py-2.5 text-[12px] leading-6 text-slate-600">
                              {quote.technicalComment}
                            </p>
                          ) : null}

                          <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                            <Link
                              className="inline-flex h-10 items-center justify-center rounded-[12px] border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50"
                              href={`/dashboard/comprador/cotizaciones/${quote.id}`}
                            >
                              Ver cotización
                            </Link>
                            {isAwardable ? (
                              <button
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-[12px] bg-[#1847ff] px-4 text-[13px] font-semibold text-white shadow-[0_12px_26px_rgba(24,71,255,0.22)] transition hover:bg-[#0f3ff5] disabled:cursor-not-allowed disabled:opacity-60"
                                disabled={Boolean(awardingQuoteId)}
                                onClick={() => void handleAward(quote.id)}
                                type="button"
                              >
                                {awarding ? (
                                  'Asignando...'
                                ) : (
                                  <>
                                    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                                      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                                    </svg>
                                    Asignar compra
                                  </>
                                )}
                              </button>
                            ) : null}
                          </div>
                        </article>
                      );
                    })
                  ) : (
                    <div className="rounded-[18px] border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                      Todavía no recibiste cotizaciones para esta solicitud.
                    </div>
                  )}
                </div>
              </section>

              {awardedQuote ? (
                <section className="border-t border-slate-200 pt-6">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#eef2ff] text-[#4f46ff]">
                      <DetailIcon type="file" />
                    </span>
                    <h2 className="min-w-0 text-[22px] font-semibold tracking-[-0.03em] text-slate-950">Orden y cumplimiento</h2>
                  </div>

                  {request?.status === 'AWARDED' || request?.status === 'NEGOTIATING' ? (
                    <div className="mt-4 rounded-[18px] border border-slate-200 bg-white p-4">
                      <p className="text-[13px] leading-6 text-slate-600">
                        Ya adjudicaste la compra a{' '}
                        <span className="font-semibold text-slate-900">{awardedQuote.supplierCompany?.name ?? 'el proveedor'}</span>. Emití la orden de compra para que el proveedor pueda empezar a preparar el pedido y puedas seguir su cumplimiento.
                      </p>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        {request?.status === 'AWARDED' ? (
                          <button
                            className="inline-flex h-10 items-center justify-center rounded-[12px] border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={Boolean(progressingAction)}
                            onClick={() => void handleProgress('START_NEGOTIATION')}
                            type="button"
                          >
                            {progressingAction === 'START_NEGOTIATION' ? 'Iniciando...' : 'Iniciar negociación'}
                          </button>
                        ) : null}
                        <button
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-[12px] bg-[#1847ff] px-4 text-[13px] font-semibold text-white shadow-[0_12px_26px_rgba(24,71,255,0.22)] transition hover:bg-[#0f3ff5] disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={Boolean(progressingAction)}
                          onClick={() => void handleProgress('ISSUE_ORDER')}
                          type="button"
                        >
                          {progressingAction === 'ISSUE_ORDER' ? 'Emitiendo...' : 'Emitir orden de compra'}
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {request?.status === 'ORDER_ISSUED' && request?.order ? (
                    <div className="mt-4 space-y-4">
                      <div className="rounded-[18px] border border-slate-200 bg-white p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Orden {request.order.orderNumber}</p>
                            <p className="mt-1 text-[13px] text-slate-600">Seguimiento del cumplimiento a cargo del proveedor.</p>
                          </div>
                          <span className={`inline-flex rounded-full px-3 py-1 text-[12px] font-semibold ${getFulfillmentTone(request.order.fulfillmentStatus)}`}>
                            {getFulfillmentLabel(request.order.fulfillmentStatus)}
                          </span>
                        </div>
                        <div className="mt-4 flex items-end gap-1.5">
                          {FULFILLMENT_STEPS.map((step, index) => {
                            const done = index <= fulfillmentIndex;
                            return (
                              <div key={step} className="flex flex-1 flex-col items-center gap-1.5">
                                <span className={`h-1.5 w-full rounded-full ${done ? 'bg-[#4f46ff]' : 'bg-slate-200'}`} />
                                <span className={`text-center text-[10px] font-semibold leading-tight ${done ? 'text-[#4f46ff]' : 'text-slate-400'}`}>
                                  {getFulfillmentLabel(step)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {request.order.fulfillmentStatus === 'DELIVERED' ? (
                        <div className="rounded-[18px] border border-emerald-200 bg-emerald-50 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-[13px] leading-6 text-emerald-800">
                              El proveedor marcó el pedido como <span className="font-semibold">entregado</span>. Confirmá la recepción para cerrar la operación.
                            </p>
                            <button
                              className="inline-flex h-10 items-center justify-center gap-2 rounded-[12px] bg-emerald-600 px-4 text-[13px] font-semibold text-white shadow-[0_12px_26px_rgba(5,150,105,0.22)] transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                              disabled={Boolean(progressingAction)}
                              onClick={() => void handleProgress('CONFIRM_RECEIPT')}
                              type="button"
                            >
                              {progressingAction === 'CONFIRM_RECEIPT' ? 'Confirmando...' : 'Confirmar recepción'}
                            </button>
                          </div>
                        </div>
                      ) : null}

                      <form className="rounded-[18px] border border-slate-200 bg-white p-4" onSubmit={handleSaveOrder}>
                        <p className="text-[14px] font-semibold text-slate-900">Datos de la orden</p>
                        <p className="mt-1 text-[12px] text-slate-500">Información operativa para tu registro y el del proveedor.</p>
                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <label className="block">
                            <span className="text-[11px] font-semibold text-slate-500">Número de orden</span>
                            <input
                              className="mt-1 w-full rounded-[12px] border border-slate-200 px-3 py-2 text-[13px] text-slate-900 outline-none transition focus:border-[#4f46ff]"
                              onChange={(event) => setOrderForm((form) => ({ ...form, orderNumber: event.target.value }))}
                              value={orderForm.orderNumber}
                            />
                          </label>
                          <label className="block">
                            <span className="text-[11px] font-semibold text-slate-500">Fecha prometida</span>
                            <input
                              className="mt-1 w-full rounded-[12px] border border-slate-200 px-3 py-2 text-[13px] text-slate-900 outline-none transition focus:border-[#4f46ff]"
                              onChange={(event) => setOrderForm((form) => ({ ...form, promisedDate: event.target.value }))}
                              type="date"
                              value={orderForm.promisedDate}
                            />
                          </label>
                        </div>
                        <label className="mt-3 block">
                          <span className="text-[11px] font-semibold text-slate-500">Notas</span>
                          <textarea
                            className="mt-1 w-full rounded-[12px] border border-slate-200 px-3 py-2 text-[13px] text-slate-900 outline-none transition focus:border-[#4f46ff]"
                            onChange={(event) => setOrderForm((form) => ({ ...form, notes: event.target.value }))}
                            rows={2}
                            value={orderForm.notes}
                          />
                        </label>
                        <div className="mt-3 flex justify-end">
                          <button
                            className="inline-flex h-10 items-center justify-center rounded-[12px] border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={savingOrder}
                            type="submit"
                          >
                            {savingOrder ? 'Guardando...' : 'Guardar datos de la orden'}
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : null}

                  {request?.status === 'COMPLETED' ? (
                    <div className="mt-4 rounded-[18px] border border-emerald-200 bg-emerald-50 p-4">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                          <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                            <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                          </svg>
                        </span>
                        <div>
                          <p className="text-[14px] font-semibold text-emerald-900">Operación completada</p>
                          <p className="mt-1 text-[13px] leading-6 text-emerald-800">
                            Confirmaste la recepción del pedido{request?.order?.orderNumber ? ` (${request.order.orderNumber})` : ''}. El ciclo de esta solicitud está cerrado.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </section>
              ) : null}

              <section className="border-t border-slate-200 pt-6">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#eef2ff] text-[#4f46ff]">
                    <DetailIcon type="pin" />
                  </span>
                  <h2 className="min-w-0 text-[22px] font-semibold tracking-[-0.03em] text-slate-950">Información de entrega y contacto</h2>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {deliveryItems.length ? (
                    deliveryItems.map((item) => (
                      <article key={`${item.label}-${item.value}`} className="rounded-[16px] border border-slate-200 bg-white px-4 py-4">
                        <div className="flex items-center gap-2 text-slate-400">
                          <DetailIcon type={getDetailIcon(item.label)} />
                          <p className="text-[11px] font-semibold text-slate-400">{item.label}</p>
                        </div>
                        <p className="mt-3 text-[15px] font-semibold leading-6 text-slate-950">{item.value || '-'}</p>
                      </article>
                    ))
                  ) : (
                    <article className="rounded-[16px] border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500 md:col-span-2 xl:col-span-3">
                      Aún no hay información de entrega cargada en esta solicitud.
                    </article>
                  )}
                </div>
              </section>

              <section className="border-t border-slate-200 pt-6">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#eef2ff] text-[#4f46ff]">
                    <DetailIcon type="file" />
                  </span>
                  <h2 className="min-w-0 text-[22px] font-semibold tracking-[-0.03em] text-slate-950">Archivos adjuntos</h2>
                </div>
                <div className="mt-4 rounded-[18px] border border-slate-200 bg-white p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-rose-50 text-[11px] font-bold text-rose-500">
                        PDF
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-semibold text-slate-950">{fileCardName}</p>
                        <p className="mt-1 text-[12px] text-slate-500">{fileCardMeta}</p>
                      </div>
                    </div>
                    <button className="inline-flex h-10 w-10 items-center justify-center rounded-[12px] border border-slate-200 text-slate-500 transition hover:bg-slate-50" type="button">
                      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <path d="M12 3v12M7 10l5 5 5-5M5 21h14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </section>

              <div className="rounded-[16px] bg-[#f5f7ff] px-4 py-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-white text-[#4f46ff] shadow-sm">
                    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <path d="M12 22s8-4 8-10V6l-8-3-8 3v6c0 6 8 10 8 10z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold text-[#243252]">Tu información está protegida</p>
                    <p className="mt-1 text-[12px] leading-5 text-[#6474a3]">Solo los proveedores seleccionados pueden ver los detalles completos de esta solicitud.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-5">
            <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_12px_36px_rgba(15,23,42,0.04)] sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-[22px] font-semibold tracking-[-0.03em] text-slate-950 sm:text-[28px] sm:tracking-[-0.04em]">Proveedores seleccionados</h2>
                  <p className="mt-1 text-[12px] leading-5 text-slate-500">Estos proveedores recibirán tu solicitud y podrán enviarte propuestas.</p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {supplierCards.length ? (
                  supplierCards.map((provider) => (
                    <article key={provider.id} className="rounded-[18px] border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 gap-3">
                          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[16px] bg-[#eef2ff] text-xl font-bold text-[#4f46ff]">
                            {provider.name.slice(0, 1)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-[15px] font-semibold text-slate-950">{provider.name}</p>
                            <p className="mt-1 truncate text-[12px] text-slate-500">{provider.city}</p>
                            <span className="mt-2 inline-flex rounded-full bg-[#eef2ff] px-2.5 py-1 text-[10px] font-semibold text-[#4f46ff]">
                              {provider.tag}
                            </span>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-emerald-600">
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100">
                            <svg aria-hidden="true" className="h-3 w-3" fill="none" viewBox="0 0 24 24">
                              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                            </svg>
                          </span>
                          Verificado
                        </span>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-[18px] border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                    Todavía no hay proveedores vinculados a esta solicitud.
                  </div>
                )}

                <button
                  className="flex w-full items-center justify-center gap-3 rounded-[16px] bg-slate-50 px-4 py-4 text-[13px] font-semibold text-[#4f46ff] transition hover:bg-[#f5f7ff]"
                  onClick={() => router.push(`/dashboard/comprador/solicitudes/nueva?category=${encodeURIComponent(request?.category ?? '')}&step=4`)}
                  type="button"
                >
                  <span className="text-lg leading-none">+</span>
                  Agregar más proveedores
                </button>
              </div>
            </section>

            <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_12px_36px_rgba(15,23,42,0.04)] sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-[22px] font-semibold tracking-[-0.03em] text-slate-950 sm:text-[28px] sm:tracking-[-0.04em]">Timeline</h2>
                  <p className="mt-1 text-[12px] leading-5 text-slate-500">Historial comercial de la solicitud en orden cronológico inverso.</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {requestTimeline.length} evento{requestTimeline.length === 1 ? '' : 's'}
                </span>
              </div>

              <div className="mt-5">
                {requestTimeline.length ? (
                  <div className="relative space-y-4 pl-6 before:absolute before:left-[9px] before:top-2 before:h-[calc(100%-18px)] before:w-px before:bg-slate-200">
                    {requestTimeline.map((event) => (
                      <div key={event.id} className="relative">
                        <span className="absolute -left-6 top-4 h-[10px] w-[10px] rounded-full bg-[#4f46ff] ring-4 ring-white" />
                        <article className="rounded-[18px] border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <h3 className="text-[15px] font-semibold text-slate-950">{event.title}</h3>
                              <p className="mt-1 text-[13px] leading-6 text-slate-500">{event.detail ?? 'La solicitud registró un cambio operativo.'}</p>
                              <p className="mt-3 text-[12px] font-semibold text-slate-500">{event.actorCompanyName ?? request?.buyerCompany?.name ?? 'Comprador'}</p>
                            </div>
                            <span className="shrink-0 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">
                              {formatDateTime(event.createdAt)}
                            </span>
                          </div>
                        </article>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[18px] border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                    Todavía no hay eventos registrados para esta solicitud.
                  </div>
                )}
              </div>
            </section>
          </aside>
        </div>

        <div className="flex flex-col gap-3 rounded-[20px] border border-slate-200 bg-white px-4 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.04)] sm:flex-row sm:items-center sm:justify-between">
          <Link
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            href="/dashboard/comprador/solicitudes"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
            Volver
          </Link>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] border border-slate-200 bg-white px-4 text-sm font-semibold text-[#4f46ff] transition hover:bg-[#f8f9ff]"
              onClick={() => setMessage('Borrador guardado localmente.')}
              type="button"
            >
              <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                <path d="M6 4h12l2 2v14H4V4h2zm2 0v5h8V4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
              Guardar borrador
            </button>
            {request && (request.status === 'DRAFT' || request.status === 'PUBLISHED') && (request.quotes?.length ?? 0) === 0 ? (
              <button
                className="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] bg-[#1847ff] px-5 text-sm font-semibold text-white shadow-[0_18px_34px_rgba(24,71,255,0.24)] transition hover:bg-[#0f3ff5]"
                onClick={() => router.push(`/dashboard/comprador/solicitudes/nueva?edit=${request.id}`)}
                type="button"
              >
                <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <path d="M12 20h9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  <path d="M16.5 3.5a2.1 2.1 0 113 3L7 19l-4 1 1-4 12.5-12.5z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
                Editar solicitud
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
