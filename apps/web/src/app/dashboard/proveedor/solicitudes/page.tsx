'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useWorkspace } from '@/components/auth/workspace-provider';
import AssignSellerDialog from '@/components/dashboard/assign-seller-dialog';
import SupplierDashboardShell from '@/components/dashboard/supplier-dashboard-shell';
import {
  atarApi,
  type RequestAssignmentRecord,
} from '@/lib/atar-api';
import { LoadingState } from '@/components/ui/spinner';
import { useSupplierInbox } from '@/lib/dashboard-hooks';
import { formatRequestCode } from '@/lib/request-code';
import { FALLBACK_REQUEST_CATEGORIES } from '@/lib/request-catalog-fallback';
import {
  OPPORTUNITY_STATUS_LABEL,
  OPPORTUNITY_STATUS_TONE,
  matchesInboxFilter,
  type InboxFilterKey,
} from '@/lib/opportunity-status';





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

function getBuyerLocation(request: RequestAssignmentRecord['request']) {
  const city = request.buyerCompany?.city?.trim();
  const country = request.buyerCompany?.country?.trim();
  return city && country ? `${city}, ${country}` : city || country || 'Ubicacion no informada';
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

/* ============================ VISTA DESKTOP ============================ */

type StageKey = 'all' | 'new' | 'review' | 'answered';

const STAGE_TABS: { key: StageKey; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'new', label: 'Nuevas' },
  { key: 'review', label: 'En revisión' },
  { key: 'answered', label: 'Respondidas' },
];

/** Etapas pensadas para el vendedor: ¿ya la respondí o no? */
function matchesStage(stage: StageKey, assignment: RequestAssignmentRecord) {
  const answered = Boolean(assignment.quote) || ['QUOTED', 'NEGOTIATING', 'WON', 'LOST'].includes(assignment.status);
  if (stage === 'answered') return answered;
  if (stage === 'review') return !answered && assignment.status === 'IN_RESPONSE';
  if (stage === 'new') return !answered && assignment.status !== 'IN_RESPONSE';
  return true;
}

function requestImage(request: RequestAssignmentRecord['request']) {
  const labels = [request.items?.[0]?.category, request.category].filter(Boolean);
  for (const label of labels) {
    const match = FALLBACK_REQUEST_CATEGORIES.find((category) => category.label === label);
    if (match?.imageSrc) return match.imageSrc;
  }
  return '/logoatar.png';
}

function requestQuantity(request: RequestAssignmentRecord['request']) {
  const item = request.items?.[0];
  const quantity = item?.quantity ?? request.quantityRequested ?? null;
  if (quantity === null || quantity === undefined) {
    const row = parseDescription(request.description ?? '').rows.find((entry) => normalize(entry.label).startsWith('cantidad'));
    if (!row) return 'A definir';
    // El wizard guarda la cantidad como texto ("1000"): se le da formato.
    return /^\d+$/.test(row.value) ? `${Number(row.value).toLocaleString('es-AR')} un.` : row.value;
  }
  return `${quantity.toLocaleString('es-AR')} ${item?.unit ?? 'un.'}`;
}

/** Primera observación del comprador, para el resumen de la tarjeta. */
function requestSummary(request: RequestAssignmentRecord['request']) {
  const parsed = parseDescription(request.description ?? '');
  return parsed.notes[0] ?? request.deliveryNotes ?? '';
}

/** "Hoy, 10:24", "Ayer, 16:03" o "19/09/2026". */
function formatDeadline(value: string | null) {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((startOf(new Date()) - startOf(date)) / 86400000);
  const time = new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date);
  if (diff === 0) return `Hoy, ${time}`;
  if (diff === 1) return `Ayer, ${time}`;
  if (diff === -1) return `Mañana, ${time}`;
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

function answerState(assignment: RequestAssignmentRecord) {
  if (assignment.status === 'WON') return { label: 'Ganada', tone: 'text-emerald-600' };
  if (assignment.status === 'LOST') return { label: 'Perdida', tone: 'text-slate-500' };
  if (assignment.quote || assignment.status === 'QUOTED' || assignment.status === 'NEGOTIATING') {
    return { label: 'Cotizada', tone: 'text-indigo-600' };
  }
  if (assignment.status === 'IN_RESPONSE') return { label: 'En respuesta', tone: 'text-amber-600' };
  return { label: 'Sin cotizar', tone: 'text-rose-500' };
}

/* ============================ PAGINA ============================ */

export default function SupplierRequestsPage() {
  const router = useRouter();
  const { isManager } = useWorkspace();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  // El filtro de bandeja quedó fijo en 'all': la vista usa las etapas.
  const [filter] = useState<InboxFilterKey>('all');
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [detailClosed, setDetailClosed] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [openingChat, setOpeningChat] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [stage, setStage] = useState<StageKey>('all');
  const [detailMenuOpen, setDetailMenuOpen] = useState(false);

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

  const filteredAssignments = useMemo(
    () => baseAssignments.filter((assignment) => matchesInboxFilter(filter, assignment)),
    [baseAssignments, filter],
  );

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

    setSubmitError(null);
    setAssignDialogOpen(false);
  }, [activeAssignment]);

  const parsedDescription = useMemo(
    () => parseDescription(activeRequest?.description ?? ''),
    [activeRequest?.description],
  );

  // Vista desktop: pestañas por etapa de respuesta y panel de detalle.
  const stageCounts = useMemo(() => {
    const counts = {} as Record<StageKey, number>;
    for (const tab of STAGE_TABS) {
      counts[tab.key] = baseAssignments.filter((assignment) => matchesStage(tab.key, assignment)).length;
    }
    return counts;
  }, [baseAssignments]);
  const stageAssignments = useMemo(
    () => baseAssignments.filter((assignment) => matchesStage(stage, assignment)),
    [baseAssignments, stage],
  );
  const detailNotes = [...parsedDescription.notes, activeRequest?.deliveryNotes ?? '']
    .map((note) => note.trim())
    .filter(Boolean)
    .filter((note, index, all) => all.indexOf(note) === index)
    .join('\n');
  const detailRows: DescriptionRow[] = (() => {
    if (!activeRequest) return [];
    const itemRows = parseDescription(activeRequest.items?.[0]?.specifications ?? '').rows;
    const rows = [
      { label: 'Cantidad solicitada', value: requestQuantity(activeRequest) },
      ...itemRows,
      ...parsedDescription.rows,
    ];
    const seen = new Set<string>();
    return rows.filter((row) => {
      const key = normalize(row.label);
      if (seen.has(key) || key.startsWith('cantidad') && row.label !== 'Cantidad solicitada') return false;
      seen.add(key);
      return true;
    });
  })();

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


  return (
    <SupplierDashboardShell
      onSearchChange={setSearch}
      searchPlaceholder="Buscar solicitudes por comprador, producto o ubicación..."
      searchValue={search}
      session={session}
    >
      {/* ==================== VISTA MOBILE ==================== */}
      {/* Mismo diseño que escritorio (etapas, tarjetas con imagen y datos),
          apilado; el detalle se abre en su propia página. */}
      <div className="pb-4 lg:hidden">
        <h1 className="text-[26px] font-bold leading-tight tracking-[-0.03em] text-[#16123a]">Solicitudes recibidas</h1>
        <p className="mt-1 text-[13px] text-slate-500">
          {isManager
            ? 'Revisá las solicitudes de cotización y respondé a las que te interesen.'
            : 'Estas son las solicitudes que te asignaron.'}
        </p>

        <div className="relative mt-4">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon name="search" />
          </span>
          <input
            className="h-11 w-full rounded-[12px] border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-indigo-400"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por comprador, producto o ubicación..."
            value={search}
          />
        </div>

        <div className="-mx-4 mt-1.5 flex gap-2 overflow-x-auto px-4 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {STAGE_TABS.map((tab) => {
            const active = stage === tab.key;
            return (
              <button
                key={tab.key}
                className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-[10px] px-3.5 text-[13px] font-semibold transition ${
                  active ? 'bg-indigo-600 text-white shadow-[0_8px_18px_rgba(100,64,232,0.28)]' : 'bg-white text-slate-600 ring-1 ring-slate-200'
                }`}
                onClick={() => setStage(tab.key)}
                type="button"
              >
                {tab.label}
                <span
                  className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] ${
                    active ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {stageCounts[tab.key]}
                </span>
              </button>
            );
          })}
        </div>

        {categories.length > 1 ? (
          <select
            aria-label="Categoría"
            className="mt-2 h-10 w-full rounded-[10px] border-0 bg-white px-3 text-[13px] font-medium text-slate-600 ring-1 ring-slate-200 outline-none focus:ring-indigo-300"
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
        ) : null}

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : null}

        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="rounded-[18px] bg-white px-4 py-10 shadow-sm">
              <LoadingState label="Cargando solicitudes..." />
            </div>
          ) : stageAssignments.length === 0 ? (
            <div className="rounded-[18px] border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
              No hay solicitudes para este filtro.
            </div>
          ) : (
            stageAssignments.map((assignment) => {
              const request = assignment.request;
              const answer = answerState(assignment);
              return (
                <article key={assignment.id} className="rounded-[18px] bg-white p-3.5 shadow-[0_6px_20px_rgba(40,28,110,0.05)]">
                  <Link className="flex gap-3" href={`/dashboard/proveedor/solicitudes/${assignment.requestId}`}>
                    <span className="relative h-[84px] w-[84px] shrink-0 overflow-hidden rounded-[12px] bg-slate-100">
                      <Image alt="" className="object-cover" fill sizes="84px" src={requestImage(request)} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-indigo-600">
                          {request.category}
                        </span>
                        <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] ${OPPORTUNITY_STATUS_TONE[assignment.status]}`}>
                          {OPPORTUNITY_STATUS_LABEL[assignment.status]}
                        </span>
                        {request.privateRequest ? <Icon className="h-3.5 w-3.5 text-indigo-500" name="lock" /> : null}
                      </span>
                      <span className="mt-1 block truncate text-[16px] font-bold tracking-[-0.01em] text-[#16123a]">
                        {request.productName || request.title}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5 text-[12px] text-slate-600">
                        <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" name="users" />
                        <span className="truncate">{request.buyerCompany?.name ?? 'Comprador'}</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-[12px] text-slate-600">
                        <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" name="pin" />
                        <span className="truncate">{getBuyerLocation(request)}</span>
                      </span>
                    </span>
                  </Link>

                  <div className="mt-3 grid grid-cols-3 divide-x divide-slate-100 rounded-[12px] bg-[#f7f6fd] py-2 text-center">
                    <span className="px-1">
                      <span className="block text-[10px] text-slate-500">Cantidad</span>
                      <span className="block truncate text-[12px] font-semibold text-slate-900">{requestQuantity(request)}</span>
                    </span>
                    <span className="px-1">
                      <span className="block text-[10px] text-slate-500">Fecha límite</span>
                      <span className="block truncate text-[12px] font-semibold text-slate-900">{formatDeadline(request.dueDate)}</span>
                    </span>
                    <span className="px-1">
                      <span className="block text-[10px] text-slate-500">Estado</span>
                      <span className={`block truncate text-[12px] font-semibold ${answer.tone}`}>{answer.label}</span>
                    </span>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-slate-200 text-xs font-semibold text-slate-700 transition active:bg-slate-50"
                      disabled={openingChat}
                      onClick={() => void handleOpenChat(assignment.requestId)}
                      type="button"
                    >
                      <Icon className="h-3.5 w-3.5" name="chat" />
                      Consultar
                    </button>
                    {isManager ? (
                      <button
                        className="inline-flex h-9 flex-1 items-center justify-center rounded-[10px] border border-slate-200 text-xs font-semibold text-slate-700 transition active:bg-slate-50"
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
                    {/* globals.css fija `a { color: inherit }`: el color va en el span. */}
                    <Link
                      className="inline-flex h-9 flex-1 items-center justify-center rounded-[10px] bg-indigo-600 text-xs font-semibold shadow-[0_8px_18px_rgba(100,64,232,0.25)]"
                      href={`/dashboard/proveedor/solicitudes/${assignment.requestId}`}
                    >
                      <span className="text-white">Cotizar</span>
                    </Link>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>

      {/* ==================== VISTA DESKTOP ==================== */}
      <section className="hidden lg:block">
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(400px,0.62fr)]">
          {/* ---------- Lista ---------- */}
          <div className="min-w-0">
            <Link className="inline-flex items-center gap-2 text-[13px]" href="/dashboard/proveedor">
              <span className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800">
                <Icon name="arrow-left" />
                Solicitudes de compra
              </span>
            </Link>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-[34px] font-bold leading-tight tracking-[-0.035em] text-[#16123a]">Solicitudes recibidas</h1>
                <p className="mt-1 text-[14px] text-slate-500">
                  {isManager
                    ? 'Revisá las solicitudes de cotización y respondé a las que te interesen.'
                    : 'Estas son las solicitudes que te asignaron. Respondé a las que te interesen.'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {STAGE_TABS.map((tab) => {
                  const active = stage === tab.key;
                  return (
                    <button
                      key={tab.key}
                      className={`inline-flex h-9 items-center gap-2 rounded-[10px] px-3.5 text-[13px] font-semibold transition ${
                        active
                          ? 'bg-indigo-600 text-white shadow-[0_8px_18px_rgba(100,64,232,0.28)]'
                          : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-indigo-200'
                      }`}
                      onClick={() => {
                        setStage(tab.key);
                        setDetailClosed(false);
                        setActiveRequestId(baseAssignments.find((assignment) => matchesStage(tab.key, assignment))?.requestId ?? null);
                      }}
                      type="button"
                    >
                      {tab.label}
                      <span
                        className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] ${
                          active ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {stageCounts[tab.key]}
                      </span>
                    </button>
                  );
                })}
                {categories.length > 1 ? (
                  <select
                    aria-label="Categoría"
                    className="h-9 rounded-[10px] border-0 bg-white px-3 text-[13px] font-medium text-slate-600 ring-1 ring-slate-200 outline-none focus:ring-indigo-300"
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
                ) : null}
              </div>
            </div>

            {error ? (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
            ) : null}

            <div className="mt-5 space-y-3">
              {loading ? (
                <div className="rounded-[18px] bg-white px-4 py-10 shadow-sm">
                  <LoadingState label="Cargando solicitudes..." />
                </div>
              ) : stageAssignments.length === 0 ? (
                <div className="rounded-[18px] border border-dashed border-slate-300 bg-white px-4 py-12 text-center text-sm text-slate-500">
                  No hay solicitudes para este filtro.
                </div>
              ) : (
                stageAssignments.map((assignment) => {
                  const request = assignment.request;
                  const selected = !detailClosed && assignment.requestId === activeRequestId;
                  const summary = requestSummary(request);
                  const answer = answerState(assignment);
                  return (
                    <button
                      key={assignment.id}
                      className={`group grid w-full grid-cols-[112px_minmax(0,1fr)_230px_40px] items-center gap-5 rounded-[18px] border bg-white p-4 text-left transition ${
                        selected
                          ? 'border-indigo-400 shadow-[0_0_0_1px_var(--color-indigo-400),0_14px_32px_rgba(100,64,232,0.12)]'
                          : 'border-transparent shadow-[0_6px_20px_rgba(40,28,110,0.05)] hover:border-indigo-200'
                      }`}
                      onClick={() => {
                        setDetailClosed(false);
                        setActiveRequestId(assignment.requestId);
                      }}
                      type="button"
                    >
                      <span className="relative h-[104px] w-[112px] overflow-hidden rounded-[12px] bg-slate-100">
                        <Image alt="" className="object-cover" fill sizes="112px" src={requestImage(request)} />
                      </span>
                      <span className="min-w-0">
                        <span className="flex flex-wrap gap-1.5">
                          <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-indigo-600">
                            {request.category}
                          </span>
                          <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] ${OPPORTUNITY_STATUS_TONE[assignment.status]}`}>
                            {OPPORTUNITY_STATUS_LABEL[assignment.status]}
                          </span>
                        </span>
                        <span className="mt-1.5 block truncate text-[19px] font-bold tracking-[-0.02em] text-[#16123a]">
                          {request.productName || request.title}
                        </span>
                        <span className="mt-1 flex items-center gap-2 text-[13px] text-slate-600">
                          <Icon className="h-3.5 w-3.5 text-slate-400" name="users" />
                          <span className="truncate">{request.buyerCompany?.name ?? 'Comprador'}</span>
                        </span>
                        <span className="mt-0.5 flex items-center gap-2 text-[13px] text-slate-600">
                          <Icon className="h-3.5 w-3.5 text-slate-400" name="pin" />
                          <span className="truncate">{getBuyerLocation(request)}</span>
                        </span>
                        {summary ? <span className="mt-1 block truncate text-[12px] text-slate-500">{summary}</span> : null}
                      </span>
                      <span className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2.5 border-l border-slate-100 pl-5 text-[13px]">
                        <Icon className="h-4 w-4 text-slate-400" name="calendar" />
                        <span className="flex justify-between gap-2">
                          <span className="text-slate-500">Cantidad</span>
                          <span className="font-semibold text-slate-900">{requestQuantity(request)}</span>
                        </span>
                        <Icon className="h-4 w-4 text-slate-400" name="clock" />
                        <span className="flex justify-between gap-2">
                          <span className="text-slate-500">Fecha límite</span>
                          <span className="font-semibold text-slate-900">{formatDeadline(request.dueDate)}</span>
                        </span>
                        <Icon className="h-4 w-4 text-slate-400" name="tag" />
                        <span className="flex justify-between gap-2">
                          <span className="text-slate-500">Estado</span>
                          <span className={`font-semibold ${answer.tone}`}>{answer.label}</span>
                        </span>
                      </span>
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 transition group-hover:translate-x-0.5">
                        <Icon name="chevron-right" />
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* ---------- Detalle ---------- */}
          <aside className="sticky top-0 rounded-[18px] bg-white p-5 shadow-[0_10px_30px_rgba(40,28,110,0.06)]">
            {submitError ? (
              <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{submitError}</div>
            ) : null}
            {message ? (
              <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{message}</div>
            ) : null}

            {!activeAssignment || !activeRequest ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                  <Icon className="h-5 w-5" name="doc" />
                </span>
                <p className="mt-3 text-[15px] font-semibold text-slate-900">Elegí una solicitud</p>
                <p className="mt-1 max-w-[260px] text-[13px] text-slate-500">Vas a ver acá el detalle y podrás enviar tu propuesta.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[12px] font-semibold text-slate-600">
                    {formatRequestCode(activeRequest.id)}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-lg px-3 py-1 text-[12px] font-bold uppercase tracking-[0.06em] ${OPPORTUNITY_STATUS_TONE[activeAssignment.status]}`}>
                      {OPPORTUNITY_STATUS_LABEL[activeAssignment.status]}
                    </span>
                    <div className="relative">
                      <button
                        aria-label="Más acciones"
                        className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
                        onClick={() => setDetailMenuOpen((open) => !open)}
                        type="button"
                      >
                        <svg aria-hidden="true" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="5" r="1.8" />
                          <circle cx="12" cy="12" r="1.8" />
                          <circle cx="12" cy="19" r="1.8" />
                        </svg>
                      </button>
                      {detailMenuOpen ? (
                        <>
                          <button aria-label="Cerrar menú" className="fixed inset-0 z-20 cursor-default" onClick={() => setDetailMenuOpen(false)} type="button" />
                          <div className="absolute right-0 top-9 z-30 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-[13px] shadow-[0_16px_40px_rgba(15,23,42,0.14)]">
                            <Link
                              className="block px-3 py-2 text-slate-700 hover:bg-slate-50"
                              href={`/dashboard/proveedor/solicitudes/${activeAssignment.requestId}`}
                            >
                              Ver solicitud completa
                            </Link>
                            {isManager ? (
                              <button
                                className="block w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50"
                                onClick={() => {
                                  setDetailMenuOpen(false);
                                  setAssignDialogOpen(true);
                                }}
                                type="button"
                              >
                                {activeAssignment.seller ? 'Reasignar vendedor' : 'Asignar vendedor'}
                              </button>
                            ) : null}
                          </div>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-4">
                  <span className="relative h-[124px] w-[132px] shrink-0 overflow-hidden rounded-[14px] bg-slate-100">
                    <Image alt="" className="object-cover" fill sizes="132px" src={requestImage(activeRequest)} />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-[21px] font-bold leading-tight tracking-[-0.02em] text-[#16123a]">
                      {activeRequest.productName || activeRequest.title}
                    </h2>
                    <p className="mt-2 flex items-center gap-2 text-[14px] text-slate-600">
                      <Icon className="h-4 w-4 text-slate-400" name="users" />
                      {activeRequest.buyerCompany?.name ?? 'Comprador'}
                    </p>
                    <p className="mt-1.5 flex items-center gap-2 text-[14px] text-slate-600">
                      <Icon className="h-4 w-4 text-slate-400" name="pin" />
                      {getBuyerLocation(activeRequest)}
                    </p>
                    <p className="mt-1.5 flex items-center gap-2 text-[14px] text-slate-600">
                      <Icon className="h-4 w-4 text-slate-400" name="calendar" />
                      {formatDeadline(activeRequest.updatedAt)}
                    </p>
                  </div>
                </div>

                {detailNotes ? (
                  <div className="mt-4 whitespace-pre-line rounded-[12px] bg-[#f4f2fd] px-4 py-3 text-[14px] leading-6 text-slate-700">
                    {detailNotes}
                  </div>
                ) : null}

                <h3 className="mt-5 text-[16px] font-bold text-[#16123a]">Detalle de la solicitud</h3>
                <dl className="mt-3 space-y-2.5">
                  {detailRows.map((row) => (
                    <div key={`${row.label}-${row.value}`} className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-3 text-[13px]">
                      <dt className="text-slate-500">{row.label}</dt>
                      <dd className="font-medium text-slate-900">{row.value}</dd>
                    </div>
                  ))}
                </dl>

                {parsedDescription.attachments.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {parsedDescription.attachments.map((fileName) => {
                      const style = getFileStyle(fileName);
                      return (
                        <span key={fileName} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[12px] text-slate-700">
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${style.badge}`}>{style.label}</span>
                          {fileName}
                        </span>
                      );
                    })}
                  </div>
                ) : null}

                <p className="mt-4 text-[12px] text-slate-500">
                  {activeAssignment.seller ? `Vendedor asignado: ${activeAssignment.seller.name}` : 'Todavía sin vendedor asignado.'}
                  {activeQuote ? ` · Propuesta enviada: ${formatCurrency(activeQuote.amount, activeQuote.currency)}` : ''}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-[12px] bg-indigo-600 text-[15px] font-semibold text-white shadow-[0_10px_24px_rgba(100,64,232,0.28)] transition hover:bg-indigo-700"
                    onClick={openQuoteModal}
                    type="button"
                  >
                    <Icon name="send" />
                    {activeQuote ? 'Editar propuesta' : 'Enviar propuesta'}
                  </button>
                  <button
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-[12px] border border-indigo-200 bg-white text-[15px] font-semibold text-indigo-600 transition hover:bg-indigo-50 disabled:opacity-60"
                    disabled={openingChat}
                    onClick={() => void handleOpenChat(activeAssignment.requestId)}
                    type="button"
                  >
                    <Icon name="chat" />
                    {openingChat ? 'Abriendo…' : 'Contactar comprador'}
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
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

