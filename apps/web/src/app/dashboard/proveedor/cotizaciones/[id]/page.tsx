'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ConversationPanel from '@/components/chat/conversation-panel';
import { LoadingState } from '@/components/ui/spinner';
import SupplierDashboardShell from '@/components/dashboard/supplier-dashboard-shell';
import { atarApi, type QuoteRecord } from '@/lib/atar-api';
import {
  canAccessDashboard,
  clearSession,
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

// El API devuelve el estado en inglés (enum); acá se traduce para mostrarlo.
const QUOTE_STATUS: Record<QuoteRecord['status'], { label: string; tone: string }> = {
  DRAFT: { label: 'Borrador', tone: 'bg-amber-100 text-amber-600' },
  SUBMITTED: { label: 'Enviada', tone: 'bg-indigo-100 text-indigo-600' },
  AWARDED: { label: 'Aceptada', tone: 'bg-emerald-100 text-emerald-600' },
  REJECTED: { label: 'Rechazada', tone: 'bg-rose-100 text-rose-600' },
  WITHDRAWN: { label: 'Retirada', tone: 'bg-slate-100 text-slate-600' },
};

// Parte las especificaciones guardadas ("Etiqueta: valor" por línea) en filas.
function parseSpecRows(text: string | null | undefined) {
  return (text ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf(':');
      return idx === -1 ? { label: 'Detalle', value: line } : { label: line.slice(0, idx).trim(), value: line.slice(idx + 1).trim() };
    });
}

const card = 'rounded-[18px] border border-slate-300 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.07)]';

export default function SupplierQuoteDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [session, setSession] = useState<WebSession | null>(null);
  const [quote, setQuote] = useState<QuoteRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const storedSession = loadSession();
      if (!storedSession) {
        router.replace('/acceso');
        return;
      }

      if (!canAccessDashboard(storedSession.user, 'SUPPLIER')) {
        router.replace('/dashboard/comprador');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const [user, detail] = await Promise.all([
          atarApi.me(storedSession.accessToken),
          atarApi.getQuoteDetail(typeof params.id === 'string' ? params.id : '', storedSession.accessToken),
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
        setQuote(detail);
      } catch (detailError) {
        clearSession();
        if (!cancelled) {
          setError(detailError instanceof Error ? detailError.message : 'No se pudo cargar la cotizacion.');
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
  }, [params.id, router]);

  // Lo que se cotizó, producto por producto. Las cotizaciones viejas (sin
  // detalle por producto) muestran una sola línea con el total.
  const requestItems = quote?.request?.items ?? [];
  const lines = (quote?.items ?? []).map((line) => {
    const item = line.requestItem ?? requestItems.find((candidate) => candidate.id === line.requestItemId) ?? null;
    const quantity = item?.quantity ?? null;
    const unavailable = line.availability === 'UNAVAILABLE';
    return {
      id: line.id,
      name: item?.productName ?? 'Producto',
      quantity: quantity ? `${quantity.toLocaleString('es-AR')} ${item?.unit ?? 'u.'}` : 'Cantidad a definir',
      unitPrice: unavailable ? null : line.unitPrice,
      subtotal: !unavailable && quantity != null && line.unitPrice != null ? line.unitPrice * quantity : null,
      availability: line.availability,
      note: line.note,
    };
  });
  // Lo que pidió el comprador. Las solicitudes viejas no tienen productos
  // cargados uno por uno: se arma una sola fila con los datos generales.
  const request = quote?.request ?? null;
  const requested =
    requestItems.length > 0
      ? requestItems.map((item) => ({
          id: item.id,
          name: item.productName,
          category: item.category,
          quantity: item.quantity ? `${item.quantity.toLocaleString('es-AR')} ${item.unit ?? 'u.'}` : 'Cantidad a definir',
          specs: parseSpecRows(item.specifications),
        }))
      : request
        ? [
            {
              id: request.id,
              name: request.productName ?? request.title,
              category: request.category,
              quantity: request.quantityRequested ? `${request.quantityRequested.toLocaleString('es-AR')} unidades` : 'Cantidad a definir',
              specs: parseSpecRows(request.description),
            },
          ]
        : [];
  const deliveryPlace = [request?.deliveryCity, request?.deliveryProvince].filter(Boolean).join(', ');
  const delivery = [
    request?.dueDate ? `Entrega: ${new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(request.dueDate))}` : null,
    deliveryPlace ? `Lugar: ${deliveryPlace}` : null,
  ].filter(Boolean);

  // Mientras no esté adjudicada, rechazada ni retirada, se puede corregir.
  const editable = quote ? quote.status === 'SUBMITTED' || quote.status === 'DRAFT' : false;

  const status = quote ? QUOTE_STATUS[quote.status] ?? { label: 'Enviada', tone: 'bg-indigo-100 text-indigo-600' } : null;

  // Mismo contenedor que el resto del panel del proveedor: en mobile usa la
  // navegación inferior en vez de desplegar el menú lateral completo.
  return (
    <SupplierDashboardShell session={session}>
      {/* Desde xl la vista ocupa justo el alto disponible: el resumen a la
          izquierda y el chat a la derecha, sin scroll de página. */}
      <div className="xl:flex xl:h-full xl:flex-col">
      <Link className="inline-flex items-center gap-2 text-[13px]" href="/dashboard/proveedor/cotizaciones">
        <span className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800">
          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
            <path d="M19 12H5M11 18l-6-6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
          Volver a cotizaciones
        </span>
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-[26px] font-bold leading-tight tracking-[-0.03em] text-slate-900 lg:text-[32px]">
          {quote?.request?.productName ?? quote?.request?.title ?? 'Cotización'}
        </h1>
        {status ? <span className={`rounded-md px-2.5 py-1 text-[12px] font-medium ${status.tone}`}>{status.label}</span> : null}
      </div>
      <p className="mt-1 text-[14px] text-slate-500">Revisá la propuesta enviada y respondé al comprador desde una sola vista.</p>

      {error ? <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-100 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      {loading ? (
        <div className={`${card} mt-5`}>
          <LoadingState label="Cargando detalle de cotización..." />
        </div>
      ) : quote && status ? (
        <div className="mt-5 space-y-5 xl:grid xl:min-h-0 xl:flex-1 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] xl:gap-5 xl:space-y-0">
          <section className={`${card} xl:overflow-y-auto`}>
            <div className="grid grid-cols-2 gap-3 [&>div]:rounded-[12px] [&>div]:border [&>div]:border-slate-300 [&>div]:bg-seller-surface [&>div]:px-4 [&>div]:py-3">
              <div>
                <p className="text-[13px] text-slate-500">Comprador</p>
                <p className="mt-1 text-[16px] font-semibold text-slate-950">{quote.request?.buyerCompany?.name ?? 'Comprador'}</p>
              </div>
              <div>
                <p className="text-[13px] text-slate-500">Monto total</p>
                <p className="mt-1 text-[16px] font-semibold text-slate-950">{formatCurrency(quote.amount, quote.currency)}</p>
              </div>
              <div>
                <p className="text-[13px] text-slate-500">Plazo</p>
                <p className="mt-1 text-[16px] font-semibold text-slate-950">
                  {typeof quote.leadTimeDays === 'number' ? `${quote.leadTimeDays} días` : 'A convenir'}
                </p>
              </div>
              <div>
                <p className="text-[13px] text-slate-500">Estado</p>
                <p className="mt-1 text-[16px] font-semibold text-slate-950">{status.label}</p>
              </div>
              {quote.paymentTerms ? (
                <div>
                  <p className="text-[13px] text-slate-500">Condiciones de pago</p>
                  <p className="mt-1 text-[16px] font-semibold text-slate-950">{quote.paymentTerms}</p>
                </div>
              ) : null}
              {quote.validUntil ? (
                <div>
                  <p className="text-[13px] text-slate-500">Válida hasta</p>
                  <p className="mt-1 text-[16px] font-semibold text-slate-950">
                    {new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(quote.validUntil))}
                  </p>
                </div>
              ) : null}
            </div>
            {/* Qué pidió el comprador */}
            <h2 className="mt-5 text-[15px] font-bold text-slate-950">Lo que pidió el cliente</h2>
            <ul className="mt-2 space-y-2">
              {requested.map((item) => (
                <li key={item.id} className="rounded-[12px] border border-slate-300 bg-seller-surface p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-slate-950">{item.name}</p>
                      {item.category ? <p className="text-[12px] text-slate-600">{item.category}</p> : null}
                    </div>
                    <span className="shrink-0 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[12px] font-semibold text-slate-800">{item.quantity}</span>
                  </div>
                  {item.specs.length > 0 ? (
                    <dl className="mt-2 grid grid-cols-2 gap-1.5 2xl:grid-cols-3">
                      {item.specs.map((row, index) => (
                        <div key={`${row.label}-${index}`} className={`rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 ${item.specs.length === 1 ? 'col-span-full' : ''}`}>
                          <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">{row.label}</dt>
                          <dd className="mt-0.5 text-[12px] font-medium text-slate-900">{row.value || '-'}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}
                </li>
              ))}
            </ul>
            {delivery.length > 0 ? <p className="mt-2 text-[12px] text-slate-600">{delivery.join(' · ')}</p> : null}

            {/* Qué se cotizó */}
            <h2 className="mt-5 text-[15px] font-bold text-slate-950">Lo que cotizaste</h2>
            {lines.length > 0 ? (
              <ul className="mt-2 overflow-hidden rounded-[12px] border border-slate-300">
                {lines.map((line) => (
                  <li key={line.id} className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-3 last:border-b-0 even:bg-seller-surface">
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-slate-950">{line.name}</p>
                      <p className="text-[12px] text-slate-600">{line.quantity}</p>
                      {line.availability === 'ALTERNATIVE' ? (
                        <span className="mt-1 inline-flex rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">Alternativa</span>
                      ) : null}
                      {line.note ? <p className="mt-1 text-[12px] leading-5 text-slate-600">{line.note}</p> : null}
                    </div>
                    {line.availability === 'UNAVAILABLE' ? (
                      <span className="shrink-0 rounded-md bg-rose-100 px-2 py-0.5 text-[12px] font-semibold text-rose-700">No disponible</span>
                    ) : (
                      <div className="shrink-0 text-right">
                        <p className="text-[14px] font-bold text-slate-950">{formatCurrency(line.subtotal, quote.currency)}</p>
                        <p className="text-[12px] text-slate-600">{formatCurrency(line.unitPrice, quote.currency)} c/u</p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-2 flex items-start justify-between gap-4 rounded-[12px] border border-slate-300 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-slate-950">{quote.request?.productName ?? quote.request?.title ?? 'Solicitud'}</p>
                  <p className="text-[12px] text-slate-600">
                    {quote.request?.quantityRequested ? `${quote.request.quantityRequested.toLocaleString('es-AR')} unidades · ` : ''}Precio total de la propuesta
                  </p>
                </div>
                <p className="shrink-0 text-[14px] font-bold text-slate-950">{formatCurrency(quote.amount, quote.currency)}</p>
              </div>
            )}
            <div className="mt-2 flex items-center justify-between rounded-[12px] bg-indigo-100 px-4 py-3">
              <span className="text-[13px] font-semibold text-indigo-700">Total de la cotización</span>
              <span className="text-[16px] font-bold text-indigo-700">{formatCurrency(quote.amount, quote.currency)}</span>
            </div>

            <h2 className="mt-5 text-[15px] font-bold text-slate-950">Observaciones</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">{quote.technicalComment ?? 'Sin comentario técnico adicional.'}</p>

            {/* Editar: reutiliza el formulario del detalle de la solicitud, que
                ya abre con los datos de esta cotización cargados. */}
            {editable ? (
              <Link
                className="mt-5 flex h-11 items-center justify-center gap-2 rounded-[12px] bg-indigo-600 text-[14px] font-semibold text-white transition hover:bg-indigo-700"
                href={`/dashboard/proveedor/solicitudes/${quote.requestId}`}
              >
                <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
                Editar cotización
              </Link>
            ) : (
              <p className="mt-5 rounded-[12px] bg-seller-surface px-4 py-3 text-[13px] text-slate-600">
                Esta cotización ya está {status.label.toLowerCase()} y no se puede editar.
              </p>
            )}
          </section>

          <div className="overflow-hidden rounded-[18px] border border-slate-300 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.07)] xl:h-full xl:min-h-0">
            <ConversationPanel mode="quote" quoteId={quote.id} session={session} title="Chat sobre esta cotización" />
          </div>
        </div>
      ) : null}
      </div>
    </SupplierDashboardShell>
  );
}
