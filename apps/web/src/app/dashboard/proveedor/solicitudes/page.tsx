'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useWorkspace } from '@/components/auth/workspace-provider';
import AssignSellerDialog from '@/components/dashboard/assign-seller-dialog';
import SupplierDashboardShell from '@/components/dashboard/supplier-dashboard-shell';
import {
  ApiError,
  atarApi,
  type CreateQuotePayload,
  type QuoteRecord,
  type RequestAssignmentRecord,
} from '@/lib/atar-api';
import { useSupplierInbox } from '@/lib/dashboard-hooks';
import {
  INBOX_FILTERS,
  OPPORTUNITY_PIPELINE,
  OPPORTUNITY_STATUS_LABEL,
  OPPORTUNITY_STATUS_TONE,
  matchesInboxFilter,
  type InboxFilterKey,
} from '@/lib/opportunity-status';

type QuoteDraft = {
  amount: string;
  currency: string;
  leadTimeDays: string;
  paymentTerms: string;
  technicalComment: string;
};

const PAGE_SIZE = 6;

const CURRENCIES = [
  { code: 'ARS', label: 'ARS - Peso Argentino' },
  { code: 'USD', label: 'USD - Dolar estadounidense' },
  { code: 'EUR', label: 'EUR - Euro' },
  { code: 'BRL', label: 'BRL - Real brasileno' },
];

const PAYMENT_TERMS = [
  'Contado',
  '15 dias fecha factura',
  '30 dias fecha factura',
  '60 dias fecha factura',
  '50% anticipo / 50% contra entrega',
];

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

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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

function formatRelativeShort(value: string) {
  const minutes = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 60000));

  if (minutes < 60) {
    return `Hace ${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `Hace ${hours} h`;
  }

  return `Hace ${Math.floor(hours / 24)} d`;
}

function formatDueCountdown(value: string | null) {
  if (!value) {
    return 'Sin fecha limite';
  }

  const days = Math.ceil((new Date(value).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  if (Number.isNaN(days)) {
    return 'Sin fecha limite';
  }

  if (days < 0) {
    return 'Cerrada';
  }

  if (days === 0) {
    return 'Cierra hoy';
  }

  if (days === 1) {
    return 'Cierra manana';
  }

  return `Cierra en ${days} dias`;
}

function getBuyerLocation(request: RequestAssignmentRecord['request']) {
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

/* ============================ ICONOS ============================ */

type IconName =
  | 'search'
  | 'pin'
  | 'calendar'
  | 'clock'
  | 'user'
  | 'users'
  | 'phone'
  | 'box'
  | 'layers'
  | 'palette'
  | 'repeat'
  | 'tag'
  | 'doc'
  | 'file'
  | 'send'
  | 'chevron-left'
  | 'chevron-right'
  | 'arrow-left'
  | 'info'
  | 'help'
  | 'bulb'
  | 'activity'
  | 'chat'
  | 'close'
  | 'lock';

function Icon({ name, className = 'h-4 w-4' }: { name: IconName; className?: string }) {
  const common = {
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 1.8,
  };

  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      {name === 'search' ? (
        <>
          <path d="M21 21l-4.35-4.35" {...common} />
          <circle cx="11" cy="11" r="8" {...common} />
        </>
      ) : null}
      {name === 'pin' ? (
        <>
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1116 0z" {...common} />
          <circle cx="12" cy="10" r="3" {...common} />
        </>
      ) : null}
      {name === 'calendar' ? (
        <>
          <rect height="16" rx="2" width="18" x="3" y="5" {...common} />
          <path d="M3 10h18M8 3v4M16 3v4" {...common} />
        </>
      ) : null}
      {name === 'clock' ? (
        <>
          <circle cx="12" cy="12" r="9" {...common} />
          <path d="M12 7v5l3 2" {...common} />
        </>
      ) : null}
      {name === 'user' ? (
        <>
          <circle cx="12" cy="8" r="4" {...common} />
          <path d="M5 21c0-3.5 3-6 7-6s7 2.5 7 6" {...common} />
        </>
      ) : null}
      {name === 'users' ? (
        <>
          <circle cx="9" cy="8" r="3.5" {...common} />
          <path d="M3 20c0-3.2 2.7-5.5 6-5.5s6 2.3 6 5.5" {...common} />
          <path d="M16 5.5a3.5 3.5 0 010 6.5M18 20c0-2.4-.9-4.2-2.4-5.3" {...common} />
        </>
      ) : null}
      {name === 'phone' ? (
        <path
          d="M4 5c0-.6.4-1 1-1h2.4c.5 0 .9.3 1 .8l.8 3c.1.4 0 .8-.4 1L7.4 10a12 12 0 006.6 6.6l1.2-1.4c.2-.3.6-.4 1-.3l3 .8c.5.1.8.5.8 1V19c0 .6-.4 1-1 1A15 15 0 014 5z"
          {...common}
        />
      ) : null}
      {name === 'box' ? (
        <>
          <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" {...common} />
          <path d="M3 8l9 5 9-5M12 13v8" {...common} />
        </>
      ) : null}
      {name === 'layers' ? (
        <>
          <path d="M12 3l9 5-9 5-9-5 9-5z" {...common} />
          <path d="M3 13l9 5 9-5" {...common} />
        </>
      ) : null}
      {name === 'palette' ? (
        <>
          <path d="M12 3a9 9 0 100 18c1.1 0 2-.9 2-2 0-1.6 1.3-2 2.5-2H18a3 3 0 003-3c0-5-4.9-8-9-8z" {...common} />
          <circle cx="8" cy="11" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="12" cy="8" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="16" cy="11" r="1.2" fill="currentColor" stroke="none" />
        </>
      ) : null}
      {name === 'repeat' ? (
        <>
          <path d="M17 2l4 4-4 4" {...common} />
          <path d="M3 12V10a4 4 0 014-4h14" {...common} />
          <path d="M7 22l-4-4 4-4" {...common} />
          <path d="M21 12v2a4 4 0 01-4 4H3" {...common} />
        </>
      ) : null}
      {name === 'tag' ? (
        <>
          <path d="M3 12V4a1 1 0 011-1h8l9 9-9 9-9-9z" {...common} />
          <circle cx="7.5" cy="7.5" r="1.3" fill="currentColor" stroke="none" />
        </>
      ) : null}
      {name === 'doc' || name === 'file' ? (
        <>
          <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z" {...common} />
          <path d="M14 3v5h5" {...common} />
        </>
      ) : null}
      {name === 'send' ? (
        <>
          <path d="M21 3L10.5 13.5" {...common} />
          <path d="M21 3l-6.5 18-4-8-8-4L21 3z" {...common} />
        </>
      ) : null}
      {name === 'chevron-left' ? <path d="M15 18l-6-6 6-6" {...common} /> : null}
      {name === 'chevron-right' ? <path d="M9 6l6 6-6 6" {...common} /> : null}
      {name === 'arrow-left' ? <path d="M19 12H5M11 18l-6-6 6-6" {...common} /> : null}
      {name === 'info' ? (
        <>
          <circle cx="12" cy="12" r="9" {...common} />
          <path d="M12 11v5" {...common} />
          <circle cx="12" cy="8" r="1" fill="currentColor" stroke="none" />
        </>
      ) : null}
      {name === 'help' ? (
        <>
          <circle cx="12" cy="12" r="9" {...common} />
          <path d="M9.5 9.5a2.5 2.5 0 114 2c-.9.6-1.5 1.2-1.5 2.2" {...common} />
          <circle cx="12" cy="17" r="1" fill="currentColor" stroke="none" />
        </>
      ) : null}
      {name === 'bulb' ? (
        <>
          <path d="M9 18h6M10 21h4" {...common} />
          <path d="M12 3a6 6 0 00-3.5 10.9c.5.4.8 1 .8 1.6V16h5.4v-.5c0-.6.3-1.2.8-1.6A6 6 0 0012 3z" {...common} />
        </>
      ) : null}
      {name === 'activity' ? <path d="M3 12h4l3 8 4-16 3 8h4" {...common} /> : null}
      {name === 'chat' ? (
        <path d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4v8z" {...common} />
      ) : null}
      {name === 'close' ? <path d="M18 6L6 18M6 6l12 12" {...common} /> : null}
      {name === 'lock' ? (
        <>
          <rect height="10" rx="2" width="14" x="5" y="11" {...common} />
          <path d="M8 11V8a4 4 0 118 0v3" {...common} />
        </>
      ) : null}
    </svg>
  );
}

/* ==================== PARSEO DE LA DESCRIPCION ==================== */

type DescriptionRow = { label: string; value: string };

type ParsedDescription = {
  rows: DescriptionRow[];
  notes: string[];
  attachments: string[];
};

// Compara etiquetas sin depender de acentos (las descripciones vienen del wizard del comprador).
function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFC')
    .replace(/[áàâä]/g, 'a')
    .replace(/[éèêë]/g, 'e')
    .replace(/[íìîï]/g, 'i')
    .replace(/[óòôö]/g, 'o')
    .replace(/[úùûü]/g, 'u');
}

function looksLikeFile(value: string) {
  return /\.(pdf|xlsx?|csv|docx?|png|jpe?g|dwg|zip|ai|cdr)$/i.test(value.trim());
}

function parseDescription(description: string): ParsedDescription {
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

    const normalizedLabel = normalize(label);
    const files = value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => looksLikeFile(item));

    if (
      files.length > 0 ||
      normalizedLabel.includes('adjunt') ||
      normalizedLabel.includes('archivo') ||
      normalizedLabel.includes('plano')
    ) {
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

function getFileStyle(fileName: string) {
  const extension = fileName.split('.').pop()?.toLowerCase() ?? '';

  if (extension === 'pdf') {
    return { badge: 'bg-rose-50 text-rose-600', label: 'PDF' };
  }
  if (['xlsx', 'xls', 'csv'].includes(extension)) {
    return { badge: 'bg-emerald-50 text-emerald-600', label: extension.toUpperCase() };
  }
  if (['doc', 'docx'].includes(extension)) {
    return { badge: 'bg-sky-50 text-sky-600', label: extension.toUpperCase() };
  }
  if (['png', 'jpg', 'jpeg'].includes(extension)) {
    return { badge: 'bg-violet-50 text-violet-600', label: extension.toUpperCase() };
  }

  return { badge: 'bg-slate-100 text-slate-500', label: extension ? extension.toUpperCase() : 'ARCHIVO' };
}

/* ============================ PAGINA ============================ */

export default function SupplierRequestsPage() {
  const router = useRouter();
  const { isManager } = useWorkspace();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [filter, setFilter] = useState<InboxFilterKey>('all');
  const [page, setPage] = useState(1);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [detailClosed, setDetailClosed] = useState(false);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [openingChat, setOpeningChat] = useState(false);
  const [draft, setDraft] = useState<QuoteDraft>(() => createDraft());
  const [customTerms, setCustomTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const { session, assignments, team, loading, error, refresh } = useSupplierInbox();

  function openQuoteModal() {
    // Unificado: la cotizacion se carga en el form completo (precio unitario por
    // producto + pre-carga del perfil), no en un modal aparte con total unico.
    setSubmitError(null);
    setMessage(null);
    if (activeAssignment) {
      router.push(`/dashboard/proveedor/solicitudes/${activeAssignment.requestId}`);
    }
  }

  function closeQuoteModal() {
    setQuoteModalOpen(false);
  }

  useEffect(() => {
    if (!quoteModalOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setQuoteModalOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [quoteModalOpen]);

  const categories = useMemo(() => {
    return Array.from(
      new Set(assignments.map((assignment) => assignment.request.category).filter(Boolean)),
    ).sort((left, right) => left.localeCompare(right, 'es'));
  }, [assignments]);

  // Filtrado por busqueda y categoria (sin aplicar la pestana de pipeline).
  const baseAssignments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return assignments
      .filter(
        (assignment) =>
          categoryFilter === 'all' || assignment.request.category === categoryFilter,
      )
      .filter((assignment) => {
        if (!query) {
          return true;
        }

        return [
          assignment.request.title,
          assignment.request.category,
          assignment.request.description,
          assignment.request.buyerCompany?.name ?? '',
          assignment.seller?.name ?? '',
        ]
          .join(' ')
          .toLowerCase()
          .includes(query);
      });
  }, [assignments, categoryFilter, search]);

  const filterCounts = useMemo(() => {
    const counts = {} as Record<InboxFilterKey, number>;
    for (const item of INBOX_FILTERS) {
      counts[item.key] = baseAssignments.filter((assignment) =>
        matchesInboxFilter(item.key, assignment),
      ).length;
    }

    return counts;
  }, [baseAssignments]);

  const filteredAssignments = useMemo(
    () => baseAssignments.filter((assignment) => matchesInboxFilter(filter, assignment)),
    [baseAssignments, filter],
  );

  const totalPages = Math.max(1, Math.ceil(filteredAssignments.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedAssignments = useMemo(
    () => filteredAssignments.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredAssignments, currentPage],
  );

  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter, filter]);

  useEffect(() => {
    if (detailClosed) {
      return;
    }

    if (
      activeRequestId &&
      filteredAssignments.some((assignment) => assignment.requestId === activeRequestId)
    ) {
      return;
    }

    setActiveRequestId(filteredAssignments[0]?.requestId ?? null);
  }, [activeRequestId, detailClosed, filteredAssignments]);

  const activeAssignment = detailClosed
    ? null
    : filteredAssignments.find((assignment) => assignment.requestId === activeRequestId) ?? null;
  const activeRequest = activeAssignment?.request ?? null;
  const activeQuote = activeAssignment?.quote ?? null;

  useEffect(() => {
    if (!activeAssignment) {
      return;
    }

    setDraft(createDraft(activeAssignment.quote));
    setCustomTerms(
      Boolean(activeAssignment.quote?.paymentTerms) &&
        !PAYMENT_TERMS.includes(activeAssignment.quote?.paymentTerms ?? ''),
    );
    setSubmitError(null);
    setQuoteModalOpen(false);
    setAssignDialogOpen(false);
  }, [activeAssignment]);

  const parsedDescription = useMemo(
    () => parseDescription(activeRequest?.description ?? ''),
    [activeRequest?.description],
  );

  const invitedSuppliers = useMemo(() => {
    if (!activeRequest?.preferredSupplierName) {
      return [] as string[];
    }

    return activeRequest.preferredSupplierName
      .split('|')
      .map((item) => item.trim())
      .filter(Boolean);
  }, [activeRequest?.preferredSupplierName]);

  async function handleAssign(sellerUserId: string | null) {
    if (!session?.accessToken || !activeAssignment) {
      return;
    }

    try {
      setAssigning(true);
      setSubmitError(null);
      await atarApi.assignRequest(activeAssignment.requestId, { sellerUserId }, session.accessToken);
      await refresh();
      setMessage(
        sellerUserId
          ? 'Solicitud asignada. El vendedor recibio la notificacion.'
          : 'La solicitud volvio a la bandeja sin asignar.',
      );
      setAssignDialogOpen(false);
    } catch (assignError) {
      setSubmitError(
        assignError instanceof Error ? assignError.message : 'No se pudo asignar la solicitud.',
      );
    } finally {
      setAssigning(false);
    }
  }

  /** Chat con el comprador desde la solicitud, antes de cotizar. */
  async function handleOpenChat(requestId: string) {
    if (!session?.accessToken) {
      return;
    }

    try {
      setOpeningChat(true);
      setSubmitError(null);
      const conversation = await atarApi.getOrCreateRequestConversation(
        requestId,
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
    if (!session?.accessToken || !activeAssignment) {
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

      await atarApi.createQuote(activeAssignment.requestId, payload, session.accessToken);
      await refresh();
      setMessage(activeQuote ? 'Cotización actualizada.' : 'Cotización enviada.');
      setQuoteModalOpen(false);
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

  const fichaRows: DescriptionRow[] = activeRequest
    ? [
        { label: 'Producto solicitado', value: activeRequest.productName || activeRequest.title },
        { label: 'Comprador', value: activeRequest.buyerCompany?.name ?? 'No informado' },
        { label: 'Ubicación del comprador', value: getBuyerLocation(activeRequest) },
        ...parsedDescription.rows,
        ...(typeof activeRequest.quantityRequested === 'number'
          ? [{ label: 'Cantidad estimada', value: `${activeRequest.quantityRequested} unidades` }]
          : []),
      ]
    : [];

  return (
    <SupplierDashboardShell
      searchPlaceholder="Buscar solicitudes por comprador, categoria o vendedor"
      session={session}
    >
      {/* ==================== VISTA MOBILE ==================== */}
      <div className="lg:hidden">
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Solicitudes</h1>
        <p className="mt-1 text-xs text-slate-500">
          {isManager ? 'Bandeja comercial de la empresa.' : 'Las oportunidades asignadas a vos.'}
        </p>

        {/* Filtros del pipeline */}
        <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {INBOX_FILTERS.map((item) => {
            const active = filter === item.key;
            return (
              <button
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  active ? 'bg-slate-950 text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200'
                }`}
                key={item.key}
                onClick={() => setFilter(item.key)}
                type="button"
              >
                {item.label}
                <span className={active ? 'text-white/70' : 'text-slate-400'}>
                  {filterCounts[item.key] ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative mt-3">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon name="search" />
          </span>
          <input
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-indigo-400"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar solicitud..."
            value={search}
          />
        </div>

        <div className="mt-4 space-y-3 pb-4">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
              Cargando solicitudes...
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
              No hay solicitudes en este filtro.
            </div>
          ) : (
            filteredAssignments.map((assignment) => (
              <div
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                key={assignment.id}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    {assignment.request.category}
                  </p>
                  <span className="shrink-0 text-[11px] text-slate-400">
                    {formatRelativeShort(assignment.request.updatedAt ?? assignment.request.createdAt)}
                  </span>
                </div>

                <Link
                  className="mt-1 block text-[15px] font-semibold text-slate-950"
                  href={`/dashboard/proveedor/solicitudes/${assignment.requestId}`}
                >
                  {assignment.request.title}
                </Link>

                <p className="mt-1 truncate text-xs text-slate-500">
                  {assignment.request.buyerCompany?.name ?? 'Comprador'} ·{' '}
                  {getBuyerLocation(assignment.request)}
                  {typeof assignment.request.quantityRequested === 'number'
                    ? ` · ${assignment.request.quantityRequested} u.`
                    : ''}
                </p>

                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      OPPORTUNITY_STATUS_TONE[assignment.status]
                    }`}
                  >
                    {OPPORTUNITY_STATUS_LABEL[assignment.status]}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
                    {assignment.seller ? assignment.seller.name : 'Sin vendedor'}
                  </span>
                  {assignment.request.privateRequest ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-600">
                      <Icon className="h-3 w-3" name="lock" />
                      Privada
                    </span>
                  ) : null}
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 transition active:bg-slate-50"
                    disabled={openingChat}
                    onClick={() => void handleOpenChat(assignment.requestId)}
                    type="button"
                  >
                    <Icon className="h-3.5 w-3.5" name="chat" />
                    Consultar
                  </button>
                  {isManager ? (
                    <button
                      className="inline-flex h-9 flex-1 items-center justify-center rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 transition active:bg-slate-50"
                      onClick={() => {
                        setActiveRequestId(assignment.requestId);
                        setDetailClosed(false);
                        setAssignDialogOpen(true);
                      }}
                      type="button"
                    >
                      {assignment.seller ? 'Reasignar' : 'Asignar'}
                    </button>
                  ) : null}
                  <Link
                    className="inline-flex h-9 flex-1 items-center justify-center rounded-xl bg-slate-950 text-xs font-semibold text-white"
                    href={`/dashboard/proveedor/solicitudes/${assignment.requestId}`}
                  >
                    Cotizar
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ==================== VISTA DESKTOP ==================== */}
      <section className="hidden lg:block">
        <div className="grid items-start gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
          {/* ---------- Columna 1: bandeja ---------- */}
          <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs text-slate-500">Pipeline de oportunidades</p>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
              Solicitudes de compradores
            </h1>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              {isManager
                ? 'Asigná cada solicitud a un vendedor y seguí el estado comercial.'
                : 'Estas son las oportunidades que te asignaron.'}
            </p>

            <div className="relative mt-4">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Icon name="search" />
              </span>
              <input
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-xs outline-none transition placeholder:text-slate-400 focus:border-indigo-400"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Comprador, producto o vendedor..."
                value={search}
              />
            </div>

            <select
              className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 outline-none transition focus:border-indigo-400"
              onChange={(event) => setCategoryFilter(event.target.value)}
              value={categoryFilter}
            >
              <option value="all">Todas las categorías</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {INBOX_FILTERS.map((item) => {
                const active = filter === item.key;
                return (
                  <button
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition ${
                      active
                        ? 'bg-slate-950 text-white'
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                    }`}
                    key={item.key}
                    onClick={() => setFilter(item.key)}
                    type="button"
                  >
                    {item.label}
                    <span className={active ? 'text-white/60' : 'text-slate-400'}>
                      {filterCounts[item.key] ?? 0}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 space-y-2.5">
              {loading ? (
                <div className="rounded-xl bg-slate-50 px-4 py-8 text-center text-xs text-slate-500">
                  Cargando solicitudes...
                </div>
              ) : pagedAssignments.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-xs text-slate-500">
                  No hay solicitudes para este filtro.
                </div>
              ) : (
                pagedAssignments.map((assignment) => {
                  const selected = !detailClosed && assignment.requestId === activeRequestId;

                  return (
                    <button
                      className={`w-full rounded-xl border px-3.5 py-3 text-left transition ${
                        selected
                          ? 'border-slate-950 bg-slate-950 text-white shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                      key={assignment.id}
                      onClick={() => {
                        setActiveRequestId(assignment.requestId);
                        setDetailClosed(false);
                      }}
                      type="button"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          {assignment.request.category}
                        </p>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            selected ? 'bg-white/15 text-white' : OPPORTUNITY_STATUS_TONE[assignment.status]
                          }`}
                        >
                          {OPPORTUNITY_STATUS_LABEL[assignment.status]}
                        </span>
                      </div>

                      <p
                        className={`mt-1.5 line-clamp-2 text-[13px] font-semibold ${
                          selected ? 'text-white' : 'text-slate-950'
                        }`}
                      >
                        {assignment.request.title}
                      </p>

                      <p className={`mt-1 truncate text-[11px] ${selected ? 'text-slate-400' : 'text-slate-500'}`}>
                        {assignment.request.buyerCompany?.name ?? 'Comprador'} ·{' '}
                        {assignment.request.buyerCompany?.country ?? 'AR'}
                        {typeof assignment.request.quantityRequested === 'number'
                          ? ` · ${assignment.request.quantityRequested} u.`
                          : ''}
                      </p>

                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] ${
                            selected ? 'text-slate-400' : 'text-slate-500'
                          }`}
                        >
                          <Icon className="h-3 w-3" name="user" />
                          {assignment.seller ? assignment.seller.name : 'Sin vendedor'}
                        </span>
                        {assignment.request.privateRequest ? (
                          <span className={`inline-flex items-center gap-1 text-[10px] ${selected ? 'text-slate-400' : 'text-indigo-500'}`}>
                            <Icon className="h-3 w-3" name="lock" />
                            Privada
                          </span>
                        ) : null}
                      </div>

                      <p className={`mt-1.5 text-[10px] ${selected ? 'text-slate-500' : 'text-slate-400'}`}>
                        Actualizada {formatRelative(assignment.request.updatedAt).toLowerCase()} ·{' '}
                        {formatDueCountdown(assignment.request.dueDate)}
                      </p>
                    </button>
                  );
                })
              )}
            </div>

            {filteredAssignments.length > 0 ? (
              <div className="mt-5 flex items-center justify-center gap-2">
                <button
                  aria-label="Página anterior"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={currentPage <= 1}
                  onClick={() => setPage(currentPage - 1)}
                  type="button"
                >
                  <Icon name="chevron-left" />
                </button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                  <button
                    className={`h-8 w-8 rounded-lg text-xs font-semibold transition ${
                      pageNumber === currentPage
                        ? 'border border-slate-950 bg-white text-slate-950'
                        : 'border border-transparent text-slate-400 hover:bg-slate-50'
                    }`}
                    key={pageNumber}
                    onClick={() => setPage(pageNumber)}
                    type="button"
                  >
                    {pageNumber}
                  </button>
                ))}
                <button
                  aria-label="Página siguiente"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage(currentPage + 1)}
                  type="button"
                >
                  <Icon name="chevron-right" />
                </button>
              </div>
            ) : null}
          </aside>

          {/* ---------- Detalle + panel lateral ---------- */}
          <div className="min-w-0">
            {/* Vendedor que se registro y todavia no fue aprobado por la empresa. */}
            {session?.user.status === 'INVITED' ? (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Tu acceso está pendiente de aprobación. Cuando el administrador de la empresa te
                habilite vas a empezar a recibir solicitudes asignadas.
              </div>
            ) : null}

            {error ? (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            {submitError ? (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {submitError}
              </div>
            ) : null}

            {message ? (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {message}
              </div>
            ) : null}

            {!activeAssignment || !activeRequest ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-sm text-slate-500 shadow-sm">
                Seleccioná una solicitud del listado para ver el detalle y responderla.
              </div>
            ) : (
              <div className="grid min-w-0 gap-4 2xl:grid-cols-[minmax(0,1fr)_248px]">
                {/* ----- Detalle ----- */}
                <div className="min-w-0 space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <button
                        className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 transition hover:text-indigo-500"
                        onClick={() => {
                          setDetailClosed(true);
                          setActiveRequestId(null);
                        }}
                        type="button"
                      >
                        <Icon name="arrow-left" />
                        Volver al listado
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                          disabled={openingChat}
                          onClick={() => void handleOpenChat(activeAssignment.requestId)}
                          type="button"
                        >
                          <Icon name="chat" />
                          {openingChat ? 'Abriendo...' : 'Consultar comprador'}
                        </button>

                        {isManager ? (
                          <button
                            className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                            onClick={() => setAssignDialogOpen(true)}
                            type="button"
                          >
                            <Icon name="users" />
                            {activeAssignment.seller ? 'Reasignar' : 'Asignar vendedor'}
                          </button>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-indigo-600">
                        {activeRequest.category}
                      </span>
                      <span
                        className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
                          OPPORTUNITY_STATUS_TONE[activeAssignment.status]
                        }`}
                      >
                        {OPPORTUNITY_STATUS_LABEL[activeAssignment.status]}
                      </span>
                      <span
                        className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
                          activeRequest.privateRequest
                            ? 'bg-slate-100 text-slate-500'
                            : 'bg-emerald-50 text-emerald-600'
                        }`}
                      >
                        {activeRequest.privateRequest ? 'Solicitud privada' : 'Solicitud abierta'}
                      </span>
                    </div>

                    <div className="mt-3 flex items-start justify-between gap-4">
                      <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                        {activeRequest.title}
                      </h2>
                      <button
                        className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                        onClick={openQuoteModal}
                        type="button"
                      >
                        <Icon name="send" />
                        {activeQuote ? 'Editar cotización' : 'Cotizar'}
                      </button>
                    </div>
                  </div>

                  {/* Ficha de la solicitud */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">
                        <Icon name="doc" />
                      </span>
                      <h3 className="text-sm font-bold text-slate-950">Ficha de la solicitud</h3>
                    </div>

                    <dl className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                      {fichaRows.map((row, index) => (
                        <div
                          className={`flex items-start gap-4 px-4 py-2.5 text-xs ${
                            index % 2 === 0 ? 'bg-slate-50/70' : 'bg-white'
                          }`}
                          key={`${row.label}-${index}`}
                        >
                          <dt className="w-40 shrink-0 text-slate-500">{row.label}</dt>
                          <dd className="min-w-0 flex-1 font-medium text-slate-900">{row.value}</dd>
                        </div>
                      ))}
                    </dl>

                    {parsedDescription.notes.length > 0 ? (
                      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                        <p className="text-[11px] font-semibold text-slate-500">Descripción adicional</p>
                        <p className="mt-1.5 whitespace-pre-wrap text-xs leading-6 text-slate-700">
                          {parsedDescription.notes.join('\n')}
                        </p>
                      </div>
                    ) : null}

                    {parsedDescription.attachments.length > 0 ? (
                      <div className="mt-4">
                        <p className="text-[11px] font-semibold text-slate-500">Documentos adjuntos</p>
                        <div className="mt-2 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                          {parsedDescription.attachments.map((fileName) => {
                            const style = getFileStyle(fileName);
                            return (
                              <div
                                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5"
                                key={fileName}
                              >
                                <span
                                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${style.badge}`}
                                >
                                  <Icon className="h-4 w-4" name="file" />
                                </span>
                                <div className="min-w-0">
                                  <p className="truncate text-xs font-semibold text-slate-900">{fileName}</p>
                                  <p className="text-[10px] text-slate-400">
                                    {style.label} · informado por el comprador
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* Acciones del vendedor */}
                  <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-950">
                        {activeQuote ? 'Ya enviaste una cotización' : '¿Podés cubrir esta solicitud?'}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {activeQuote
                          ? `Monto enviado: ${formatCurrency(activeQuote.amount, activeQuote.currency)}. Podés actualizarla cuando quieras.`
                          : 'Consultá al comprador o cargá la cotización en un solo paso.'}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                        disabled={openingChat}
                        onClick={() => void handleOpenChat(activeAssignment.requestId)}
                        type="button"
                      >
                        <Icon name="chat" />
                        Consultar
                      </button>
                      <button
                        className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
                        onClick={openQuoteModal}
                        type="button"
                      >
                        {activeQuote ? 'Editar cotización' : 'Cotizar'}
                        <Icon name="send" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* ----- Panel lateral ----- */}
                <div className="space-y-4">
                  {/* Pipeline comercial */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">
                        <Icon className="h-3.5 w-3.5" name="activity" />
                      </span>
                      <p className="text-xs font-bold text-slate-950">Estado comercial</p>
                    </div>

                    <ol className="mt-3 space-y-2">
                      {OPPORTUNITY_PIPELINE.map((step) => {
                        const currentIndex = OPPORTUNITY_PIPELINE.indexOf(activeAssignment.status);
                        const stepIndex = OPPORTUNITY_PIPELINE.indexOf(step);
                        const isLost = activeAssignment.status === 'LOST';
                        const done = !isLost && currentIndex >= 0 && stepIndex <= currentIndex;
                        const current = activeAssignment.status === step;

                        return (
                          <li className="flex items-center gap-2" key={step}>
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                current ? 'bg-indigo-600' : done ? 'bg-indigo-300' : 'bg-slate-200'
                              }`}
                            />
                            <span
                              className={`text-[11px] ${
                                current
                                  ? 'font-semibold text-slate-950'
                                  : done
                                    ? 'text-slate-500'
                                    : 'text-slate-400'
                              }`}
                            >
                              {OPPORTUNITY_STATUS_LABEL[step]}
                            </span>
                          </li>
                        );
                      })}
                      {activeAssignment.status === 'LOST' ? (
                        <li className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                          <span className="text-[11px] font-semibold text-rose-600">Perdida</span>
                        </li>
                      ) : null}
                    </ol>
                  </div>

                  {/* Vendedor asignado */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-bold text-slate-950">Vendedor asignado</p>

                    {activeAssignment.seller ? (
                      <div className="mt-3 flex items-center gap-2.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-[11px] font-bold text-indigo-600">
                          {activeAssignment.seller.name.slice(0, 2).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[12px] font-semibold text-slate-950">
                            {activeAssignment.seller.name}
                          </p>
                          <p className="truncate text-[10px] text-slate-500">
                            {activeAssignment.assignedAt
                              ? `Desde ${formatDate(activeAssignment.assignedAt)}`
                              : 'Asignación reciente'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 text-[11px] leading-5 text-slate-500">
                        Todavía no tiene vendedor asignado.
                      </p>
                    )}

                    {isManager ? (
                      <button
                        className="mt-3 inline-flex h-8 w-full items-center justify-center rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
                        onClick={() => setAssignDialogOpen(true)}
                        type="button"
                      >
                        {activeAssignment.seller ? 'Reasignar' : 'Asignar vendedor'}
                      </button>
                    ) : null}
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-bold text-slate-950">Resumen de interés</p>
                    <dl className="mt-3 space-y-2.5">
                      <SummaryRow label="Alcance">
                        {activeRequest.privateRequest
                          ? `${invitedSuppliers.length || 1} proveedor(es) invitados`
                          : 'Abierta a proveedores'}
                      </SummaryRow>
                      <SummaryRow label="Tu cotización">
                        {activeQuote ? 'Enviada' : 'Sin enviar'}
                      </SummaryRow>
                      <SummaryRow label="Fecha límite">{formatDate(activeRequest.dueDate)}</SummaryRow>
                      <SummaryRow label="Última actividad">
                        {formatRelative(activeRequest.updatedAt)}
                      </SummaryRow>
                      <SummaryRow label="Creada">{formatDateTime(activeRequest.createdAt)}</SummaryRow>
                    </dl>
                  </div>

                  {activeRequest.privateRequest ? (
                    <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 text-sky-600">
                          <Icon className="h-3.5 w-3.5" name="info" />
                        </span>
                        <div>
                          <p className="text-xs font-bold text-sky-900">Solicitud privada</p>
                          <p className="mt-1 text-[11px] leading-5 text-sky-800">
                            Esta solicitud es privada y solo los proveedores invitados pueden verla.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 text-indigo-600">
                        <Icon className="h-3.5 w-3.5" name="bulb" />
                      </span>
                      <div>
                        <p className="text-xs font-bold text-indigo-900">Consejo</p>
                        <p className="mt-1 text-[11px] leading-5 text-indigo-800">
                          Consultá al comprador antes de cotizar: las propuestas con dudas resueltas
                          se ganan más seguido.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ---------- Modal flotante de cotización ---------- */}
        {quoteModalOpen && activeAssignment && activeRequest ? (
          <div
            aria-labelledby="quote-modal-title"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            role="dialog"
          >
            <button
              aria-label="Cerrar formulario de cotización"
              className="absolute inset-0 cursor-default bg-slate-950/50"
              onClick={closeQuoteModal}
              type="button"
            />

            <div className="relative z-10 flex max-h-[86vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_70px_rgba(2,6,23,0.35)]">
              <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
                <div className="flex min-w-0 items-start gap-2">
                  <span className="mt-0.5 text-slate-500">
                    <Icon name="send" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-950" id="quote-modal-title">
                      {activeQuote ? 'Actualizar cotización' : 'Responder solicitud'}
                    </h3>
                    <p className="mt-0.5 truncate text-[11px] text-slate-500">{activeRequest.title}</p>
                  </div>
                </div>

                <button
                  aria-label="Cerrar"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                  onClick={closeQuoteModal}
                  type="button"
                >
                  <Icon className="h-3.5 w-3.5" name="close" />
                </button>
              </header>

              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                {submitError ? (
                  <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
                    {submitError}
                  </div>
                ) : null}

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-medium text-slate-600">Monto total</span>
                    <div className="flex items-stretch overflow-hidden rounded-xl border border-slate-200 bg-white transition focus-within:border-indigo-400">
                      <span className="flex items-center border-r border-slate-200 px-3 text-xs text-slate-400">$</span>
                      <input
                        autoFocus
                        className="w-full bg-transparent px-3 py-2.5 text-xs outline-none"
                        inputMode="decimal"
                        onChange={(event) => setDraft((current) => ({ ...current, amount: event.target.value }))}
                        placeholder="1.200.000"
                        type="number"
                        value={draft.amount}
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-medium text-slate-600">Moneda</span>
                    <select
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 outline-none transition focus:border-indigo-400"
                      onChange={(event) => setDraft((current) => ({ ...current, currency: event.target.value }))}
                      value={draft.currency}
                    >
                      {CURRENCIES.map((currency) => (
                        <option key={currency.code} value={currency.code}>
                          {currency.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-medium text-slate-600">Plazo de entrega</span>
                    <div className="flex items-stretch overflow-hidden rounded-xl border border-slate-200 bg-white transition focus-within:border-indigo-400">
                      <input
                        className="w-full bg-transparent px-3 py-2.5 text-xs outline-none"
                        inputMode="numeric"
                        onChange={(event) => setDraft((current) => ({ ...current, leadTimeDays: event.target.value }))}
                        placeholder="15"
                        type="number"
                        value={draft.leadTimeDays}
                      />
                      <span className="flex items-center border-l border-slate-200 px-3 text-xs text-slate-400">días</span>
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-medium text-slate-600">Condiciones de pago</span>
                    <select
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 outline-none transition focus:border-indigo-400"
                      onChange={(event) => {
                        const value = event.target.value;
                        if (value === '__custom') {
                          setCustomTerms(true);
                          setDraft((current) => ({ ...current, paymentTerms: '' }));
                          return;
                        }

                        setCustomTerms(false);
                        setDraft((current) => ({ ...current, paymentTerms: value }));
                      }}
                      value={customTerms ? '__custom' : draft.paymentTerms}
                    >
                      <option value="">Seleccioná una condición</option>
                      {PAYMENT_TERMS.map((term) => (
                        <option key={term} value={term}>
                          {term}
                        </option>
                      ))}
                      <option value="__custom">Otra condición...</option>
                    </select>
                    {customTerms ? (
                      <input
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none transition focus:border-indigo-400"
                        onChange={(event) => setDraft((current) => ({ ...current, paymentTerms: event.target.value }))}
                        placeholder="Detallá la condición de pago"
                        value={draft.paymentTerms}
                      />
                    ) : null}
                  </label>
                </div>

                <label className="mt-4 block">
                  <span className="mb-1.5 block text-[11px] font-medium text-slate-600">
                    Comentario técnico (opcional)
                  </span>
                  <textarea
                    className="min-h-[110px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none transition placeholder:text-slate-400 focus:border-indigo-400"
                    onChange={(event) => setDraft((current) => ({ ...current, technicalComment: event.target.value }))}
                    placeholder="Detallá materiales, capacidad instalada, condiciones de entrega o aclaraciones técnicas."
                    value={draft.technicalComment}
                  />
                </label>
              </div>

              <footer className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
                <button
                  className="inline-flex h-11 items-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  onClick={closeQuoteModal}
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={submitting}
                  onClick={() => void handleSubmitQuote()}
                  type="button"
                >
                  {submitting ? 'Guardando...' : activeQuote ? 'Actualizar cotización' : 'Enviar cotización'}
                  <Icon name="send" />
                </button>
              </footer>
            </div>
          </div>
        ) : null}
      </section>

      {/* Asignación de vendedor (desktop y mobile) */}
      {assignDialogOpen && activeAssignment ? (
        <AssignSellerDialog
          assignment={activeAssignment}
          onAssign={(sellerUserId) => void handleAssign(sellerUserId)}
          onClose={() => setAssignDialogOpen(false)}
          submitting={assigning}
          team={team}
        />
      ) : null}
    </SupplierDashboardShell>
  );
}

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-[11px] text-slate-500">{label}</dt>
      <dd className="text-right text-[11px] font-semibold text-slate-900">{children}</dd>
    </div>
  );
}
