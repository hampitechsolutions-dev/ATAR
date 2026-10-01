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
  DRAFT: { label: 'Borrador', tone: 'bg-amber-50 text-amber-600' },
  SUBMITTED: { label: 'Enviada', tone: 'bg-indigo-50 text-indigo-600' },
  AWARDED: { label: 'Aceptada', tone: 'bg-emerald-50 text-emerald-600' },
  REJECTED: { label: 'Rechazada', tone: 'bg-rose-50 text-rose-600' },
  WITHDRAWN: { label: 'Retirada', tone: 'bg-slate-100 text-slate-600' },
};

const card = 'rounded-[18px] bg-white p-5 shadow-[0_10px_30px_rgba(40,28,110,0.05)]';

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

  const status = quote ? QUOTE_STATUS[quote.status] ?? { label: 'Enviada', tone: 'bg-indigo-50 text-indigo-600' } : null;

  // Mismo contenedor que el resto del panel del proveedor: en mobile usa la
  // navegación inferior en vez de desplegar el menú lateral completo.
  return (
    <SupplierDashboardShell session={session}>
      <Link className="inline-flex items-center gap-2 text-[13px]" href="/dashboard/proveedor/cotizaciones">
        <span className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800">
          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
            <path d="M19 12H5M11 18l-6-6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
          Volver a cotizaciones
        </span>
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-[26px] font-bold leading-tight tracking-[-0.03em] text-[#16123a] lg:text-[32px]">
          {quote?.request?.productName ?? quote?.request?.title ?? 'Cotización'}
        </h1>
        {status ? <span className={`rounded-md px-2.5 py-1 text-[12px] font-medium ${status.tone}`}>{status.label}</span> : null}
      </div>
      <p className="mt-1 text-[14px] text-slate-500">Revisá la propuesta enviada y respondé al comprador desde una sola vista.</p>

      {error ? <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      {loading ? (
        <div className={`${card} mt-5`}>
          <LoadingState label="Cargando detalle de cotización..." />
        </div>
      ) : quote && status ? (
        <div className="mt-5 space-y-5">
          <section className={card}>
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
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
            </div>
            <p className="mt-4 border-t border-slate-100 pt-4 text-sm leading-6 text-slate-600">
              {quote.technicalComment ?? 'Sin comentario técnico adicional.'}
            </p>
          </section>

          <ConversationPanel mode="quote" quoteId={quote.id} session={session} title="Chat sobre esta cotización" />
        </div>
      ) : null}
    </SupplierDashboardShell>
  );
}
