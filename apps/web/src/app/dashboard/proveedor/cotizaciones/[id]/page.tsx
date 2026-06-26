'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ConversationPanel from '@/components/chat/conversation-panel';
import {
  DashboardCard,
  DashboardHero,
  DashboardShell,
  dashboardSecondaryButtonClassName,
} from '@/components/dashboard/dashboard-ui';
import { atarApi, type QuoteRecord } from '@/lib/atar-api';
import {
  clearSession,
  getPrimaryMembershipRole,
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

      if (getPrimaryMembershipRole(storedSession.user) !== 'SUPPLIER') {
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

  return (
    <DashboardShell role="supplier" session={session}>
      <DashboardHero
        actions={
          <Link className={dashboardSecondaryButtonClassName} href="/dashboard/proveedor/cotizaciones">
            Volver a cotizaciones
          </Link>
        }
        description="Revisa la propuesta enviada, mantén el contexto comercial y responde al comprador desde una sola vista."
        eyebrow="Detalle de cotizacion"
        title={
          <>
            {quote?.request?.productName ?? quote?.request?.title ?? 'Cotizacion'}{' '}
            <span className="text-indigo-600">y chat asociado</span>
          </>
        }
      />

      {error ? (
        <div className="rounded-[1.5rem] bg-rose-100 px-5 py-4 text-sm text-rose-800">{error}</div>
      ) : null}

      {loading ? (
        <DashboardCard>
          <p className="text-sm text-slate-500">Cargando detalle de cotizacion...</p>
        </DashboardCard>
      ) : quote ? (
        <div className="space-y-6">
          <DashboardCard>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <p className="text-sm text-slate-500">Comprador</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{quote.request?.buyerCompany?.name ?? 'Comprador'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Monto total</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{formatCurrency(quote.amount, quote.currency)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Plazo</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{quote.leadTimeDays ?? '-'} dias</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Estado</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{quote.status}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              {quote.technicalComment ?? 'Sin comentario tecnico adicional.'}
            </p>
          </DashboardCard>

          <ConversationPanel
            mode="quote"
            quoteId={quote.id}
            session={session}
            title="Chat sobre esta cotizacion"
          />
        </div>
      ) : null}
    </DashboardShell>
  );
}
