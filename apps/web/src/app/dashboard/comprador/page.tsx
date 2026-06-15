'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  DashboardCard,
  DashboardDarkCard,
  DashboardEmptyState,
  DashboardHero,
  DashboardSectionHeading,
  DashboardShell,
  DashboardStatCard,
  dashboardInputClassName,
  dashboardPrimaryButtonClassName,
  dashboardSecondaryButtonClassName,
  dashboardTextareaClassName,
} from '@/components/dashboard/dashboard-ui';
import { atarApi, type QuoteRecord, type RequestRecord } from '@/lib/atar-api';
import {
  clearSession,
  getPrimaryMembershipRole,
  loadSession,
  saveSession,
  type WebSession,
} from '@/lib/session';

const initialForm = {
  title: '',
  productName: '',
  category: '',
  description: '',
  quantityRequested: '1',
  referenceUnitPrice: '',
  preferredSupplierName: '',
  dueDate: '',
  privateRequest: false,
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value);
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

function getRequestStatusStyles(status: RequestRecord['status']) {
  if (status === 'ORDER_ISSUED') {
    return 'bg-violet-400/15 text-violet-700';
  }

  if (status === 'NEGOTIATING') {
    return 'bg-amber-400/15 text-amber-700';
  }

  if (status === 'AWARDED') {
    return 'bg-emerald-400/15 text-emerald-700';
  }

  if (status === 'REVIEWING') {
    return 'bg-amber-400/15 text-amber-700';
  }

  return 'bg-sky-400/15 text-sky-700';
}

function getQuoteStatusStyles(status: QuoteRecord['status']) {
  if (status === 'AWARDED') {
    return 'bg-emerald-400/15 text-emerald-700';
  }

  if (status === 'REJECTED') {
    return 'bg-rose-400/15 text-rose-700';
  }

  return 'bg-slate-200 text-slate-700';
}

export default function DashboardCompradorPage() {
  const router = useRouter();
  const [session, setSession] = useState<WebSession | null>(null);
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const storedSession = loadSession();
      if (!storedSession) {
        router.replace('/acceso');
        return;
      }

      if (getPrimaryMembershipRole(storedSession.user) !== 'BUYER') {
        router.replace('/dashboard/proveedor');
        return;
      }

      try {
        setLoading(true);
        const [user, buyerRequests] = await Promise.all([
          atarApi.me(storedSession.accessToken),
          atarApi.getBuyerRequests(storedSession.accessToken),
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
        setRequests(buyerRequests);

        const nextSelectedRequestId = buyerRequests[0]?.id ?? null;
        setSelectedRequestId(nextSelectedRequestId);

        if (nextSelectedRequestId) {
          const requestQuotes = await atarApi.getRequestQuotes(nextSelectedRequestId, storedSession.accessToken);
          if (!cancelled) {
            setQuotes(requestQuotes);
          }
        }
      } catch (bootstrapError) {
        clearSession();
        if (!cancelled) {
          setError(bootstrapError instanceof Error ? bootstrapError.message : 'No se pudo cargar el dashboard.');
          router.replace('/acceso');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    async function loadSelectedQuotes() {
      if (!session?.accessToken || !selectedRequestId) {
        setQuotes([]);
        return;
      }

      try {
        const nextQuotes = await atarApi.getRequestQuotes(selectedRequestId, session.accessToken);
        if (!cancelled) {
          setQuotes(nextQuotes);
        }
      } catch (quotesError) {
        if (!cancelled) {
          setError(quotesError instanceof Error ? quotesError.message : 'No se pudieron cargar las cotizaciones.');
        }
      }
    }

    loadSelectedQuotes();

    return () => {
      cancelled = true;
    };
  }, [selectedRequestId, session?.accessToken]);

  const totalQuotes = useMemo(() => {
    return requests.reduce((accumulator, request) => accumulator + (request._count?.quotes ?? 0), 0);
  }, [requests]);

  const activeRequests = useMemo(() => {
    return requests.filter((request) =>
      ['PUBLISHED', 'REVIEWING', 'AWARDED', 'NEGOTIATING'].includes(request.status),
    ).length;
  }, [requests]);

  const requestsWithProposals = useMemo(() => {
    return requests.filter((request) => (request._count?.quotes ?? 0) > 0).length;
  }, [requests]);

  const bestQuotedAmount = useMemo(() => {
    const amounts = quotes.map((quote) => quote.amount).filter((amount): amount is number => typeof amount === 'number');
    if (amounts.length === 0) {
      return 0;
    }

    return Math.min(...amounts);
  }, [quotes]);

  const estimatedRequestTotal = useMemo(() => {
    const quantity = Number(form.quantityRequested);
    const unitPrice = Number(form.referenceUnitPrice);

    if (!Number.isFinite(quantity) || quantity < 1 || !Number.isFinite(unitPrice) || unitPrice < 0) {
      return 0;
    }

    return quantity * unitPrice;
  }, [form.quantityRequested, form.referenceUnitPrice]);

  async function refreshRequests(token: string, nextSelectedRequestId?: string | null) {
    const buyerRequests = await atarApi.getBuyerRequests(token);
    setRequests(buyerRequests);

    const candidateRequestId = nextSelectedRequestId ?? selectedRequestId ?? buyerRequests[0]?.id ?? null;
    setSelectedRequestId(candidateRequestId);

    if (candidateRequestId) {
      const requestQuotes = await atarApi.getRequestQuotes(candidateRequestId, token);
      setQuotes(requestQuotes);
    } else {
      setQuotes([]);
    }
  }

  async function handleCreateRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setMessage(null);
      const createdRequest = await atarApi.createRequest(
        {
          title: form.title,
          productName: form.productName || undefined,
          category: form.category,
          description: form.description,
          quantityRequested: Number(form.quantityRequested) || undefined,
          referenceUnitPrice: Number(form.referenceUnitPrice) || undefined,
          estimatedTotalCost: estimatedRequestTotal || undefined,
          preferredSupplierName: form.preferredSupplierName || undefined,
          dueDate: form.dueDate || undefined,
          privateRequest: form.privateRequest,
          status: 'PUBLISHED',
        },
        session.accessToken,
      );

      setForm(initialForm);
      await refreshRequests(session.accessToken, createdRequest.id);
      setMessage('Solicitud creada correctamente y publicada para proveedores.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo crear la solicitud.');
    } finally {
      setSubmitting(false);
    }
  }

  const selectedRequest = requests.find((request) => request.id === selectedRequestId) ?? null;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-950">
        <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-5 shadow-sm">
          Cargando dashboard comprador...
        </div>
      </main>
    );
  }

  return (
    <DashboardShell role="buyer" session={session}>
      <DashboardHero
        actions={
          <>
            <Link className={dashboardPrimaryButtonClassName} href="/proveedores">
              Ver proveedores
            </Link>
            <Link className={dashboardSecondaryButtonClassName} href="/dashboard/comprador/cotizaciones">
              Ver cotizaciones
            </Link>
            <Link className={dashboardSecondaryButtonClassName} href="/dashboard/comprador/solicitudes">
              Ver todas mis solicitudes
            </Link>
          </>
        }
        aside={
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-[1.5rem] border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
              <p className="text-xs uppercase tracking-[0.18em] text-indigo-600">
                Comprador activo
              </p>
              <p className="mt-2 font-semibold">{session?.user.firstName}</p>
            </div>
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Decision</p>
              <p className="mt-2 font-semibold text-slate-950">
                {requestsWithProposals} solicitudes comparables
              </p>
            </div>
          </div>
        }
        description="Centraliza solicitudes, cotizaciones y decisiones de compra con la misma identidad visual del sitio publico y foco en una operacion clara, rapida y escalable."
        eyebrow="Panel comprador"
        title={
          <>
            Gestiona compras con <span className="text-indigo-600">trazabilidad total</span>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard helper="En seguimiento" label="Solicitudes activas" value={activeRequests} />
        <DashboardStatCard helper="Visibilidad total" label="Cotizaciones recibidas" value={totalQuotes} />
        <DashboardStatCard
          helper="Con comparador"
          label="Solicitudes con propuestas"
          value={requestsWithProposals}
        />
        <DashboardStatCard
          helper="Mejor propuesta"
          label="Oferta visible"
          value={bestQuotedAmount > 0 ? formatCurrency(bestQuotedAmount) : 'Sin cotizacion'}
        />
      </div>

      {error ? <div className="rounded-[1.5rem] bg-rose-100 px-5 py-4 text-sm text-rose-800">{error}</div> : null}
      {message ? <div className="rounded-[1.5rem] bg-emerald-100 px-5 py-4 text-sm text-emerald-800">{message}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <DashboardCard>
          <DashboardSectionHeading
            description="Publica un pedido con el mismo criterio visual y operativo del resto del panel."
            title="Nueva solicitud"
          />

          <form className="mt-5 space-y-4" onSubmit={handleCreateRequest}>
            <label className="block space-y-2 text-sm">
              <span className="text-slate-700">Titulo</span>
              <input
                className={dashboardInputClassName}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Ej. Bobinas de polipropileno"
                required
                value={form.title}
              />
            </label>
            <label className="block space-y-2 text-sm">
              <span className="text-slate-700">Producto o referencia</span>
              <input
                className={dashboardInputClassName}
                onChange={(event) => setForm((current) => ({ ...current, productName: event.target.value }))}
                placeholder="Ej. Bobina laminada industrial 120 micrones"
                value={form.productName}
              />
            </label>
            <label className="block space-y-2 text-sm">
              <span className="text-slate-700">Categoria</span>
              <input
                className={dashboardInputClassName}
                onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                placeholder="Packaging, quimicos, maquinaria..."
                required
                value={form.category}
              />
            </label>
            <label className="block space-y-2 text-sm">
              <span className="text-slate-700">Descripcion tecnica</span>
              <textarea
                className={dashboardTextareaClassName}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Detalla requerimientos, volumen, especificaciones y condiciones."
                required
                value={form.description}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2 text-sm">
                <span className="text-slate-700">Cantidad solicitada</span>
                <input
                  className={dashboardInputClassName}
                  min="1"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, quantityRequested: event.target.value }))
                  }
                  required
                  type="number"
                  value={form.quantityRequested}
                />
              </label>
              <label className="block space-y-2 text-sm">
                <span className="text-slate-700">Precio unitario referencial</span>
                <input
                  className={dashboardInputClassName}
                  min="0"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, referenceUnitPrice: event.target.value }))
                  }
                  placeholder="2500"
                  step="0.01"
                  type="number"
                  value={form.referenceUnitPrice}
                />
              </label>
            </div>
            <label className="block space-y-2 text-sm">
              <span className="text-slate-700">Proveedor preferido</span>
              <input
                className={dashboardInputClassName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, preferredSupplierName: event.target.value }))
                }
                placeholder="Opcional: nombre del proveedor o fabricante"
                value={form.preferredSupplierName}
              />
            </label>
            <div className="rounded-[1.5rem] border border-indigo-200 bg-indigo-50 px-4 py-4 text-sm text-indigo-900">
              <p className="text-xs uppercase tracking-[0.18em] text-indigo-600">Estimacion</p>
              <p className="mt-2 text-lg font-semibold">
                {estimatedRequestTotal > 0 ? formatCurrency(estimatedRequestTotal) : 'Completa cantidad y precio referencial'}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-[0.7fr_0.3fr]">
              <label className="block space-y-2 text-sm">
                <span className="text-slate-700">Fecha limite</span>
                <input
                  className={dashboardInputClassName}
                  onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
                  type="date"
                  value={form.dueDate}
                />
              </label>
              <label className="mt-8 flex items-center gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <input
                  checked={form.privateRequest}
                  onChange={(event) => setForm((current) => ({ ...current, privateRequest: event.target.checked }))}
                  type="checkbox"
                />
                Pedido privado
              </label>
            </div>
            <button
              className={`w-full ${dashboardPrimaryButtonClassName}`}
              disabled={submitting}
              type="submit"
            >
              {submitting ? 'Publicando...' : 'Publicar solicitud'}
            </button>
          </form>
        </DashboardCard>

        <DashboardCard>
          <DashboardSectionHeading
            action={
              <button
                className={dashboardSecondaryButtonClassName}
                onClick={() => {
                  if (session) {
                    void refreshRequests(session.accessToken);
                  }
                }}
                type="button"
              >
                Actualizar
              </button>
            }
            description="Selecciona una solicitud para revisar sus cotizaciones y pasar al comparador."
            title="Mis solicitudes"
          />

          <div className="mt-5 space-y-4">
            {requests.length === 0 ? (
              <DashboardEmptyState
                description="Todavia no tienes solicitudes creadas. Usa el formulario para publicar la primera."
                title="Sin solicitudes"
              />
            ) : (
              requests.map((request) => (
                <button
                  key={request.id}
                  className={`w-full rounded-[1.5rem] border p-4 text-left transition ${
                    selectedRequestId === request.id
                      ? 'border-indigo-300 bg-indigo-50 shadow-[0_12px_24px_rgba(99,102,241,0.12)]'
                      : 'border-slate-200 bg-slate-50/80 hover:border-slate-300 hover:bg-white'
                  }`}
                  onClick={() => setSelectedRequestId(request.id)}
                  type="button"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{request.category}</p>
                      <h3 className="mt-2 text-lg font-semibold text-slate-950">{request.title}</h3>
                      <p className="mt-1 text-sm text-slate-500">Fecha limite: {formatDate(request.dueDate)}</p>
                    </div>
                    <div className="flex flex-col items-start gap-2 lg:items-end">
                      {request.awardedQuoteId ? (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                          Adjudicada
                        </span>
                      ) : null}
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${getRequestStatusStyles(request.status)}`}
                      >
                        {request.status}
                      </span>
                      <span className="text-sm text-slate-500">{request._count?.quotes ?? 0} cotizaciones</span>
                      <Link
                        className="text-sm font-semibold text-indigo-700"
                        href={`/dashboard/comprador/solicitudes/${request.id}`}
                        onClick={(event) => event.stopPropagation()}
                      >
                        Ver comparador
                      </Link>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </DashboardCard>
      </div>

      <DashboardDarkCard>
        <DashboardSectionHeading
          action={
            selectedRequest ? (
              <div className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white">
                {selectedRequest.title}
              </div>
            ) : null
          }
          description={
            selectedRequest
              ? selectedRequest.description
              : 'Selecciona una solicitud para ver las propuestas recibidas.'
          }
          title={<span className="text-white">Cotizaciones de la solicitud seleccionada</span>}
        />

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {quotes.length === 0 ? (
            <div className="rounded-[1.5rem] border border-white/15 bg-white/10 p-4 text-sm text-sky-50 md:col-span-2 xl:col-span-3">
              No hay cotizaciones cargadas para esta solicitud todavia.
            </div>
          ) : (
            quotes.map((quote) => (
              <article key={quote.id} className="rounded-[1.5rem] border border-white/15 bg-white/10 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-sky-100">{quote.supplierCompany?.name ?? 'Proveedor'}</p>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${getQuoteStatusStyles(quote.status)}`}
                  >
                    {quote.status}
                  </span>
                  {selectedRequest?.awardedQuoteId === quote.id ? (
                    <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-100">
                      Ganadora
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 text-2xl font-semibold text-white">
                  {quote.amount ? formatCurrency(quote.amount) : 'A consultar'}
                </p>
                <p className="mt-2 text-sm text-sky-50">Plazo: {quote.leadTimeDays ?? '-'} dias</p>
                <p className="mt-1 text-sm text-sky-50">Pago: {quote.paymentTerms ?? 'No informado'}</p>
                <p className="mt-3 text-sm leading-6 text-sky-50">
                  {quote.technicalComment ?? 'Sin comentario tecnico.'}
                </p>
              </article>
            ))
          )}
        </div>
      </DashboardDarkCard>
    </DashboardShell>
  );
}
