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

type StatusFilter = 'all' | 'visible' | 'pending' | 'private';

const HIDDEN_STORAGE_KEY = 'atar:supplier:hidden-requests';
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
  | 'eye-off'
  | 'dots'
  | 'chevron-left'
  | 'chevron-right'
  | 'arrow-left'
  | 'info'
  | 'help'
  | 'bulb'
  | 'activity'
  | 'chat'
  | 'close';

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
      {name === 'eye-off' ? (
        <>
          <path d="M3 3l18 18" {...common} />
          <path d="M10.6 5.2A9 9 0 0112 5c5 0 9 4.5 9 7a11 11 0 01-2.6 3.5" {...common} />
          <path d="M6.3 6.9C3.9 8.4 3 10.7 3 12c0 2.5 4 7 9 7 1.5 0 2.9-.4 4.1-1" {...common} />
          <path d="M9.9 9.9a3 3 0 004.2 4.2" {...common} />
        </>
      ) : null}
      {name === 'dots' ? (
        <>
          <circle cx="6" cy="12" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="18" cy="12" r="1.5" fill="currentColor" stroke="none" />
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
  const { session, openRequests, myQuotes, loading, error, refresh } = useSupplierDashboardData();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [mobileTab, setMobileTab] = useState<'nuevas' | 'evaluacion' | 'historial'>('nuevas');
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [detailClosed, setDetailClosed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [lastHiddenId, setLastHiddenId] = useState<string | null>(null);
  const [draft, setDraft] = useState<QuoteDraft>(() => createDraft());
  const [customTerms, setCustomTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(HIDDEN_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          setHiddenIds(parsed.filter((item): item is string => typeof item === 'string'));
        }
      }
    } catch {
      window.localStorage.removeItem(HIDDEN_STORAGE_KEY);
    }
  }, []);

  function persistHidden(next: string[]) {
    setHiddenIds(next);
    try {
      window.localStorage.setItem(HIDDEN_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // El almacenamiento local puede no estar disponible; el filtro sigue valiendo en memoria.
    }
  }

  function hideRequest(requestId: string) {
    persistHidden(Array.from(new Set([...hiddenIds, requestId])));
    setLastHiddenId(requestId);
    setMenuOpen(false);
  }

  function restoreLastHidden() {
    if (!lastHiddenId) {
      return;
    }

    persistHidden(hiddenIds.filter((item) => item !== lastHiddenId));
    setActiveRequestId(lastHiddenId);
    setDetailClosed(false);
    setLastHiddenId(null);
  }

  function openQuoteModal() {
    setSubmitError(null);
    setMessage(null);
    setMenuOpen(false);
    setQuoteModalOpen(true);
  }

  function closeQuoteModal() {
    setQuoteModalOpen(false);
  }

  // Cerrar el modal con Escape.
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

  const quoteByRequestId = useMemo(() => {
    return new Map(myQuotes.map((quote) => [quote.requestId, quote] as const));
  }, [myQuotes]);

  const categories = useMemo(() => {
    return Array.from(new Set(openRequests.map((request) => request.category).filter(Boolean))).sort((left, right) =>
      left.localeCompare(right, 'es'),
    );
  }, [openRequests]);

  // Solicitudes filtradas por busqueda y categoria (sin aplicar la pestana de estado).
  const baseRequests = useMemo(() => {
    const query = search.trim().toLowerCase();

    return openRequests
      .filter((request) => !hiddenIds.includes(request.id))
      .filter((request) => categoryFilter === 'all' || request.category === categoryFilter)
      .filter((request) => {
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
  }, [openRequests, hiddenIds, categoryFilter, search]);

  const tabCounts = useMemo(
    () => ({
      all: baseRequests.length,
      visible: baseRequests.filter((request) => !request.privateRequest).length,
      pending: baseRequests.filter((request) => !quoteByRequestId.has(request.id)).length,
      private: baseRequests.filter((request) => request.privateRequest).length,
    }),
    [baseRequests, quoteByRequestId],
  );

  const filteredRequests = useMemo(() => {
    return baseRequests.filter((request) => {
      if (statusFilter === 'visible') {
        return !request.privateRequest;
      }
      if (statusFilter === 'pending') {
        return !quoteByRequestId.has(request.id);
      }
      if (statusFilter === 'private') {
        return request.privateRequest;
      }
      return true;
    });
  }, [baseRequests, statusFilter, quoteByRequestId]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedRequests = useMemo(
    () => filteredRequests.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredRequests, currentPage],
  );

  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter, statusFilter]);

  useEffect(() => {
    if (detailClosed) {
      return;
    }

    if (activeRequestId && filteredRequests.some((request) => request.id === activeRequestId)) {
      return;
    }

    setActiveRequestId(filteredRequests[0]?.id ?? null);
  }, [activeRequestId, detailClosed, filteredRequests]);

  const activeRequest = detailClosed
    ? null
    : filteredRequests.find((request) => request.id === activeRequestId) ?? null;
  const activeQuote = activeRequest ? quoteByRequestId.get(activeRequest.id) ?? null : null;

  useEffect(() => {
    if (!activeRequestId) {
      return;
    }

    const quote = quoteByRequestId.get(activeRequestId) ?? null;
    setDraft(createDraft(quote));
    setCustomTerms(Boolean(quote?.paymentTerms) && !PAYMENT_TERMS.includes(quote?.paymentTerms ?? ''));
    setSubmitError(null);
    setMenuOpen(false);
    setQuoteModalOpen(false);
  }, [activeRequestId, quoteByRequestId]);

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

  // ----- Datos para la vista mobile (tabs Nuevas / En evaluación / Historial) -----
  const historyQuotes = useMemo(
    () =>
      [...myQuotes]
        .filter((quote) => quote.status === 'AWARDED' || quote.status === 'REJECTED')
        .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()),
    [myQuotes],
  );

  const mobileTabCounts = useMemo(() => {
    const nuevas = openRequests.filter((request) => !quoteByRequestId.has(request.id)).length;
    const evaluacion = openRequests.filter((request) => {
      const quote = quoteByRequestId.get(request.id);
      return quote && quote.status === 'SUBMITTED';
    }).length;

    return { nuevas, evaluacion, historial: historyQuotes.length };
  }, [openRequests, quoteByRequestId, historyQuotes]);

  const mobileItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    const matches = (request: RequestRecord) =>
      !query ||
      [request.title, request.category, request.description, request.buyerCompany?.name ?? '']
        .join(' ')
        .toLowerCase()
        .includes(query);

    type MobileItem = { request: RequestRecord; quote: QuoteRecord | null; badge: string; badgeClass: string };
    let items: MobileItem[] = [];

    if (mobileTab === 'nuevas') {
      items = openRequests
        .filter((request) => !quoteByRequestId.has(request.id))
        .map((request) => ({ request, quote: null, badge: 'Nueva', badgeClass: 'bg-indigo-50 text-indigo-600' }));
    } else if (mobileTab === 'evaluacion') {
      items = openRequests
        .filter((request) => {
          const quote = quoteByRequestId.get(request.id);
          return quote && quote.status === 'SUBMITTED';
        })
        .map((request) => ({
          request,
          quote: quoteByRequestId.get(request.id) ?? null,
          badge: 'En evaluación',
          badgeClass: 'bg-amber-50 text-amber-600',
        }));
    } else {
      items = historyQuotes
        .filter((quote) => quote.request)
        .map((quote) => ({
          request: quote.request as unknown as RequestRecord,
          quote,
          badge: quote.status === 'AWARDED' ? 'Ganada' : 'No seleccionada',
          badgeClass: quote.status === 'AWARDED' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600',
        }));
    }

    return items
      .filter((item) => matches(item.request))
      .sort(
        (left, right) =>
          new Date(right.request.updatedAt ?? right.request.createdAt).getTime() -
          new Date(left.request.updatedAt ?? left.request.createdAt).getTime(),
      );
  }, [mobileTab, openRequests, quoteByRequestId, historyQuotes, search]);

  const mobileTabs = [
    { key: 'nuevas' as const, label: 'Nuevas', count: mobileTabCounts.nuevas },
    { key: 'evaluacion' as const, label: 'En evaluación', count: mobileTabCounts.evaluacion },
    { key: 'historial' as const, label: 'Historial', count: mobileTabCounts.historial },
  ];

  const desktopTabs = [
    { key: 'all' as const, label: 'Todas', count: tabCounts.all },
    { key: 'visible' as const, label: 'Visibles', count: tabCounts.visible },
    { key: 'pending' as const, label: 'Pendientes', count: tabCounts.pending },
    { key: 'private' as const, label: 'Privadas', count: tabCounts.private },
  ];

  const fichaRows: DescriptionRow[] = activeRequest
    ? [
        { label: 'Producto solicitado', value: activeRequest.productName || activeRequest.title },
        { label: 'Comprador', value: activeRequest.buyerCompany?.name ?? 'No informado' },
        { label: 'Ubicación del comprador', value: getBuyerLocation(activeRequest) },
        ...parsedDescription.rows,
        ...(typeof activeRequest.quantityRequested === 'number'
          ? [{ label: 'Cantidad estimada', value: `${activeRequest.quantityRequested} unidades` }]
          : []),
        ...(typeof activeRequest.estimatedTotalCost === 'number' ||
        typeof activeRequest.referenceUnitPrice === 'number'
          ? [
              {
                label: 'Presupuesto estimado',
                value: formatCurrency(activeRequest.estimatedTotalCost ?? activeRequest.referenceUnitPrice),
              },
            ]
          : []),
      ]
    : [];

  return (
    <SupplierDashboardShell
      searchPlaceholder="Buscar solicitudes por comprador, categoria o descripcion"
      session={session}
    >
      {/* ==================== VISTA MOBILE ==================== */}
      <div className="lg:hidden">
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Solicitudes</h1>

        {/* Tabs */}
        <div className="mt-4 flex items-center gap-5 border-b border-slate-200">
          {mobileTabs.map((tab) => {
            const active = mobileTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setMobileTab(tab.key)}
                className={`relative -mb-px flex items-center gap-1.5 pb-3 text-sm font-semibold transition ${
                  active ? 'text-slate-950' : 'text-slate-400'
                }`}
              >
                {tab.label}
                {tab.count > 0 ? (
                  <span
                    className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${
                      active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {tab.count}
                  </span>
                ) : null}
                {active ? <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-indigo-600" /> : null}
              </button>
            );
          })}
        </div>

        {/* Buscador + filtros */}
        <div className="mt-4 flex items-center gap-2">
          <div className="relative flex-1">
            <svg aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24">
              <path d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-indigo-400"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar solicitud..."
              value={search}
            />
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-600"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
              <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
            Filtros
          </button>
        </div>

        {/* Lista */}
        <div className="mt-4 space-y-3 pb-4">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
              Cargando solicitudes...
            </div>
          ) : mobileItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
              No hay solicitudes en esta pestaña.
            </div>
          ) : (
            mobileItems.map(({ request, badge, badgeClass }) => (
              <Link
                key={request.id}
                href={`/dashboard/proveedor/solicitudes/${request.id}`}
                className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition active:bg-slate-50"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <path d="M14 2H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V8l-5-6z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      <path d="M14 2v6h6M9 13h6M9 17h4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </svg>
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-[15px] font-semibold text-slate-950">{request.title}</p>
                      <span className="shrink-0 text-[11px] text-slate-400">
                        {formatRelativeShort(request.updatedAt ?? request.createdAt)}
                      </span>
                    </div>

                    <p className="mt-1 truncate text-xs text-slate-500">
                      {typeof request.quantityRequested === 'number' ? `${request.quantityRequested} unidades · ` : ''}
                      {getBuyerLocation(request)}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Presupuesto:{' '}
                      <span className="font-semibold text-slate-700">
                        {formatCurrency(request.estimatedTotalCost ?? request.referenceUnitPrice)}
                      </span>
                    </p>

                    <div className="mt-2.5 flex items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${badgeClass}`}>{badge}</span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
                        Entrega: {request.dueDate ? formatDate(request.dueDate) : 'a coordinar'}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* ==================== VISTA DESKTOP ==================== */}
      <section className="hidden lg:block">
        <div className="grid items-start gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
          {/* ---------- Columna 1: listado ---------- */}
          <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs text-slate-500">Pipeline de oportunidades</p>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-950">Solicitudes de compradores</h1>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Gestioná solicitudes reales de empresas que están buscando productos.
            </p>

            <div className="relative mt-4">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Icon name="search" />
              </span>
              <input
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-xs outline-none transition placeholder:text-slate-400 focus:border-indigo-400"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por comprador, producto o descripción..."
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

            <div className="mt-4 flex items-stretch gap-1 border-b border-slate-200">
              {desktopTabs.map((tab) => {
                const active = statusFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setStatusFilter(tab.key)}
                    className={`relative -mb-px flex-1 pb-2 text-center transition ${
                      active ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <span className="block text-[11px] font-semibold">{tab.label}</span>
                    <span className="mt-0.5 block text-[11px] font-bold">{tab.count}</span>
                    {active ? <span className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-indigo-600" /> : null}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 space-y-2.5">
              {loading ? (
                <div className="rounded-xl bg-slate-50 px-4 py-8 text-center text-xs text-slate-500">
                  Cargando solicitudes...
                </div>
              ) : pagedRequests.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-xs text-slate-500">
                  No hay solicitudes para este filtro.
                </div>
              ) : (
                pagedRequests.map((request) => {
                  const quote = quoteByRequestId.get(request.id);
                  const selected = !detailClosed && request.id === activeRequestId;

                  return (
                    <button
                      key={request.id}
                      className={`w-full rounded-xl border px-3.5 py-3 text-left transition ${
                        selected
                          ? 'border-slate-950 bg-slate-950 text-white shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                      onClick={() => {
                        setActiveRequestId(request.id);
                        setDetailClosed(false);
                      }}
                      type="button"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`truncate text-[10px] font-semibold uppercase tracking-[0.14em] ${
                            selected ? 'text-slate-400' : 'text-slate-400'
                          }`}
                        >
                          {request.category}
                        </p>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            selected
                              ? 'bg-white/15 text-white'
                              : request.privateRequest
                                ? 'bg-indigo-50 text-indigo-600'
                                : quote
                                  ? 'bg-emerald-50 text-emerald-600'
                                  : 'bg-amber-50 text-amber-600'
                          }`}
                        >
                          {request.privateRequest ? 'Privada' : quote ? 'Cotizada' : 'Pendiente'}
                        </span>
                      </div>

                      <p className={`mt-1.5 line-clamp-2 text-[13px] font-semibold ${selected ? 'text-white' : 'text-slate-950'}`}>
                        {request.title}
                      </p>

                      <p className={`mt-1 truncate text-[11px] ${selected ? 'text-slate-400' : 'text-slate-500'}`}>
                        {request.buyerCompany?.name ?? 'Comprador'} · {request.buyerCompany?.country ?? 'AR'}
                      </p>

                      <p className={`mt-1.5 text-[10px] ${selected ? 'text-slate-500' : 'text-slate-400'}`}>
                        Actualizada {formatRelative(request.updatedAt).toLowerCase()} · {formatDueCountdown(request.dueDate)}
                      </p>
                    </button>
                  );
                })
              )}
            </div>

            {filteredRequests.length > 0 ? (
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
                    key={pageNumber}
                    className={`h-8 w-8 rounded-lg text-xs font-semibold transition ${
                      pageNumber === currentPage
                        ? 'border border-slate-950 bg-white text-slate-950'
                        : 'border border-transparent text-slate-400 hover:bg-slate-50'
                    }`}
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

          {/* ---------- Columnas 2 y 3: detalle + panel lateral ---------- */}
          <div className="min-w-0">
            {error ? (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
            ) : null}

            {message ? (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {message}
              </div>
            ) : null}

            {lastHiddenId ? (
              <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                <span>Ocultaste una solicitud de tu listado.</span>
                <button
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
                  onClick={restoreLastHidden}
                  type="button"
                >
                  Deshacer
                </button>
              </div>
            ) : null}

            {!activeRequest ? (
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

                      <div className="relative flex items-center gap-2">
                        <button
                          aria-label="Más acciones"
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                          onClick={() => setMenuOpen((current) => !current)}
                          type="button"
                        >
                          <Icon name="dots" />
                        </button>

                        <button
                          className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                          onClick={() => hideRequest(activeRequest.id)}
                          type="button"
                        >
                          <Icon name="eye-off" />
                          Ocultar solicitud
                        </button>

                        {menuOpen ? (
                          <>
                            <button
                              aria-label="Cerrar menú"
                              className="fixed inset-0 z-10 cursor-default"
                              onClick={() => setMenuOpen(false)}
                              type="button"
                            />
                            <div className="absolute right-0 top-11 z-20 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                              <Link
                                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                                href="/dashboard/proveedor/mensajes"
                                onClick={() => setMenuOpen(false)}
                              >
                                <Icon name="chat" />
                                Contactar al comprador
                              </Link>
                              {activeQuote ? (
                                <Link
                                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                                  href={`/dashboard/proveedor/cotizaciones/${activeQuote.id}`}
                                  onClick={() => setMenuOpen(false)}
                                >
                                  <Icon name="doc" />
                                  Ver mi cotización
                                </Link>
                              ) : null}
                              <Link
                                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                                href={`/dashboard/proveedor/solicitudes/${activeRequest.id}`}
                                onClick={() => setMenuOpen(false)}
                              >
                                <Icon name="file" />
                                Abrir en pantalla completa
                              </Link>
                            </div>
                          </>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-indigo-600">
                        {activeRequest.category}
                      </span>
                      <span
                        className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
                          activeRequest.privateRequest ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-600'
                        }`}
                      >
                        {activeRequest.privateRequest ? 'Solicitud privada' : 'Solicitud abierta'}
                      </span>
                    </div>

                    <div className="mt-3 flex items-start justify-between gap-4">
                      <h2 className="text-2xl font-bold tracking-tight text-slate-950">{activeRequest.title}</h2>
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
                          key={`${row.label}-${index}`}
                          className={`flex items-start gap-4 px-4 py-2.5 text-xs ${
                            index % 2 === 0 ? 'bg-slate-50/70' : 'bg-white'
                          }`}
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
                                key={fileName}
                                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5"
                              >
                                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${style.badge}`}>
                                  <Icon className="h-4 w-4" name="file" />
                                </span>
                                <div className="min-w-0">
                                  <p className="truncate text-xs font-semibold text-slate-900">{fileName}</p>
                                  <p className="text-[10px] text-slate-400">{style.label} · informado por el comprador</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* Acceso rápido a la cotización (el formulario vive en el modal) */}
                  <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-950">
                        {activeQuote ? 'Ya enviaste una cotización' : '¿Podés cubrir esta solicitud?'}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {activeQuote
                          ? `Monto enviado: ${formatCurrency(activeQuote.amount, activeQuote.currency)}. Podés actualizarla cuando quieras.`
                          : 'Cargá monto, plazo y condiciones de pago en un solo paso.'}
                      </p>
                    </div>
                    <button
                      className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
                      onClick={openQuoteModal}
                      type="button"
                    >
                      {activeQuote ? 'Editar cotización' : 'Cotizar'}
                      <Icon name="send" />
                    </button>
                  </div>
                </div>

                {/* ----- Panel lateral ----- */}
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">
                        <Icon className="h-3.5 w-3.5" name="activity" />
                      </span>
                      <p className="text-xs font-bold text-slate-950">Estado de la solicitud</p>
                    </div>

                    <span
                      className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        activeQuote ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${activeQuote ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      {activeQuote ? 'Cotizada' : 'Pendiente'}
                    </span>

                    <p className="mt-3 text-[11px] leading-5 text-slate-500">
                      {activeQuote
                        ? `Enviaste una cotización por ${formatCurrency(activeQuote.amount, activeQuote.currency)}.`
                        : 'Aún no enviaste una cotización.'}
                    </p>

                    {activeQuote ? (
                      <Link
                        className="mt-3 inline-flex text-[11px] font-semibold text-indigo-600 hover:text-indigo-500"
                        href={`/dashboard/proveedor/cotizaciones/${activeQuote.id}`}
                      >
                        Ver cotización
                      </Link>
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
                      <SummaryRow label="Tu cotización">{activeQuote ? 'Enviada' : 'Sin enviar'}</SummaryRow>
                      <SummaryRow label="Fecha límite">{formatDate(activeRequest.dueDate)}</SummaryRow>
                      <SummaryRow label="Última actividad">{formatRelative(activeRequest.updatedAt)}</SummaryRow>
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

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 text-slate-400">
                        <Icon className="h-3.5 w-3.5" name="help" />
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-950">¿Necesitás ayuda?</p>
                        <p className="mt-1 text-[11px] leading-5 text-slate-500">
                          Nuestro equipo está para acompañarte.
                        </p>
                      </div>
                    </div>
                    <Link
                      className="mt-3 inline-flex h-8 w-full items-center justify-center rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
                      href="/contacto"
                    >
                      Contactar soporte
                    </Link>
                  </div>

                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 text-indigo-600">
                        <Icon className="h-3.5 w-3.5" name="bulb" />
                      </span>
                      <div>
                        <p className="text-xs font-bold text-indigo-900">Consejo</p>
                        <p className="mt-1 text-[11px] leading-5 text-indigo-800">
                          Respondé con una cotización completa para aumentar tus chances de ser seleccionado.
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
        {quoteModalOpen && activeRequest ? (
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
              <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
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
                  <span className="mb-1.5 block text-[11px] font-medium text-slate-600">Comentario técnico (opcional)</span>
                  <textarea
                    className="min-h-[110px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none transition placeholder:text-slate-400 focus:border-indigo-400"
                    onChange={(event) => setDraft((current) => ({ ...current, technicalComment: event.target.value }))}
                    placeholder="Detallá materiales, capacidad instalada, condiciones de entrega o aclaraciones técnicas."
                    value={draft.technicalComment}
                  />
                </label>
              </div>

              <footer className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
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
