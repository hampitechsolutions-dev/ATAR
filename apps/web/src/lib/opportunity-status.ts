import type { OpportunityStatus } from '@/lib/atar-api';

/**
 * Pipeline comercial del proveedor.
 * NUEVA -> SIN ASIGNAR -> ASIGNADA -> EN RESPUESTA -> COTIZADA ->
 * EN NEGOCIACION -> GANADA / PERDIDA
 */
export const OPPORTUNITY_STATUS_LABEL: Record<OpportunityStatus, string> = {
  NEW: 'Nueva',
  UNASSIGNED: 'Sin asignar',
  ASSIGNED: 'Asignada',
  IN_RESPONSE: 'En respuesta',
  QUOTED: 'Cotizada',
  NEGOTIATING: 'En negociación',
  WON: 'Ganada',
  LOST: 'Perdida',
};

// Badges con la paleta de ATAR: fondo claro, texto saturado, sin bordes duros.
export const OPPORTUNITY_STATUS_TONE: Record<OpportunityStatus, string> = {
  NEW: 'bg-indigo-50 text-indigo-600',
  UNASSIGNED: 'bg-amber-50 text-amber-600',
  ASSIGNED: 'bg-sky-50 text-sky-600',
  IN_RESPONSE: 'bg-violet-50 text-violet-600',
  QUOTED: 'bg-blue-50 text-blue-600',
  NEGOTIATING: 'bg-teal-50 text-teal-600',
  WON: 'bg-emerald-50 text-emerald-600',
  LOST: 'bg-rose-50 text-rose-600',
};

export const OPPORTUNITY_PIPELINE: OpportunityStatus[] = [
  'NEW',
  'UNASSIGNED',
  'ASSIGNED',
  'IN_RESPONSE',
  'QUOTED',
  'NEGOTIATING',
  'WON',
];

export type InboxFilterKey =
  | 'all'
  | 'unassigned'
  | 'assigned'
  | 'in_response'
  | 'quoted'
  | 'won'
  | 'lost'
  | 'private';

export const INBOX_FILTERS: { key: InboxFilterKey; label: string; status?: OpportunityStatus }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'unassigned', label: 'Sin asignar' },
  { key: 'assigned', label: 'Asignadas' },
  { key: 'in_response', label: 'En respuesta', status: 'IN_RESPONSE' },
  { key: 'quoted', label: 'Cotizadas', status: 'QUOTED' },
  { key: 'won', label: 'Ganadas', status: 'WON' },
  { key: 'lost', label: 'Perdidas', status: 'LOST' },
  { key: 'private', label: 'Privadas' },
];

export function matchesInboxFilter(
  filter: InboxFilterKey,
  assignment: { status: OpportunityStatus; seller: unknown; request: { privateRequest: boolean } },
) {
  if (filter === 'all') {
    return true;
  }

  if (filter === 'private') {
    return assignment.request.privateRequest;
  }

  if (filter === 'unassigned') {
    return !assignment.seller && (assignment.status === 'NEW' || assignment.status === 'UNASSIGNED');
  }

  if (filter === 'assigned') {
    return Boolean(assignment.seller);
  }

  const target = INBOX_FILTERS.find((item) => item.key === filter)?.status;
  return target ? assignment.status === target : true;
}
