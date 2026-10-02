'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useWorkspace } from '@/components/auth/workspace-provider';
import SupplierDashboardShell from '@/components/dashboard/supplier-dashboard-shell';
import TeamInvitationsPanel from '@/components/dashboard/team-invitations-panel';
import { atarApi, type RequestAssignmentRecord, type TeamMemberRecord } from '@/lib/atar-api';
import { LoadingState } from '@/components/ui/spinner';
import { loadSession, type WebSession } from '@/lib/session';
import { TONES, type Tone } from '@/components/dashboard/tone-row';

const PAGE_SIZE = 6;
const DAY = 86400000;

type SortKey = 'performance' | 'conversion' | 'pending' | 'name';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value);
}

function formatAgo(value: string, nowMs: number) {
  const minutes = Math.max(1, Math.floor((nowMs - new Date(value).getTime()) / 60000));
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} ${days === 1 ? 'día' : 'días'}`;
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join('') || 'VE'
  );
}

/** Evento del feed a partir del estado comercial de cada solicitud asignada. */
function activityFor(assignment: RequestAssignmentRecord) {
  const product = assignment.request.productName || assignment.request.title;
  const buyer = assignment.request.buyerCompany?.name;
  const detail = [product, buyer].filter(Boolean).join(' · ');
  if (assignment.status === 'WON') return { text: 'ganó una venta', detail, icon: 'trophy' as const, tone: 'bg-emerald-100 text-emerald-600', dot: 'bg-emerald-500' };
  if (assignment.status === 'LOST') return { text: 'perdió una oportunidad', detail, icon: 'doc' as const, tone: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400' };
  if (assignment.quote || assignment.status === 'QUOTED' || assignment.status === 'NEGOTIATING') {
    return { text: 'envió una cotización', detail, icon: 'send' as const, tone: 'bg-indigo-100 text-indigo-600', dot: 'bg-indigo-500' };
  }
  if (assignment.status === 'IN_RESPONSE') return { text: 'está preparando una respuesta', detail, icon: 'doc' as const, tone: 'bg-indigo-100 text-indigo-600', dot: 'bg-indigo-500' };
  return { text: 'tiene una nueva solicitud asignada', detail, icon: 'user' as const, tone: 'bg-amber-100 text-amber-600', dot: 'bg-amber-500' };
}

/* Íconos ------------------------------------------------------------------- */

type IconName = 'users' | 'doc' | 'tag' | 'trophy' | 'arrow' | 'plus' | 'search' | 'send' | 'user' | 'alert' | 'close' | 'chev-left' | 'chev-right';

const ICON_PATHS: Record<IconName, ReactNode> = {
  users: <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8" />,
  doc: <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5zM14 3v5h5M9 13h6M9 17h4" />,
  tag: <path d="M20.6 13.4L12 22l-9-9V4h9l8.6 8.6a2 2 0 010 2.8zM7.5 7.5h.01" />,
  trophy: <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4zM17 5h3v2a3 3 0 01-3 3M7 5H4v2a3 3 0 003 3" />,
  arrow: <path d="M9 6l6 6-6 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  search: <path d="M21 21l-4.3-4.3M11 19a8 8 0 100-16 8 8 0 000 16z" />,
  send: <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />,
  user: <path d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0" />,
  alert: <path d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />,
  close: <path d="M18 6L6 18M6 6l12 12" />,
  'chev-left': <path d="M15 18l-6-6 6-6" />,
  'chev-right': <path d="M9 6l6 6-6 6" />,
};

function Icon({ name, className = 'h-4 w-4' }: { name: IconName; className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      {ICON_PATHS[name]}
    </svg>
  );
}

// Un color por indicador, para distinguirlos de un vistazo.
const KPI_TONES: Tone[] = ['indigo', 'sky', 'amber', 'emerald'];

const card = 'rounded-[18px] border border-[#cbc4ee] bg-white shadow-[0_10px_30px_rgba(40,28,110,0.07)]';
const selectClass =
  'h-11 appearance-none rounded-[12px] border border-slate-300 bg-white pl-3.5 pr-9 text-[14px] text-slate-700 outline-none transition focus:border-indigo-300';

function SelectChevron() {
  return (
    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
      <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M6 9l6 6 6-6" />
      </svg>
    </span>
  );
}

/** Equipo comercial de la empresa proveedora. Solo accesible para gerentes. */
export default function SupplierTeamPage() {
  const { isManager, activeWorkspace } = useWorkspace();
  const [session, setSession] = useState<WebSession | null>(null);
  const [team, setTeam] = useState<TeamMemberRecord[]>([]);
  const [assignments, setAssignments] = useState<RequestAssignmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ACTIVE' | 'INVITED'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'manager' | 'seller'>('all');
  const [sort, setSort] = useState<SortKey>('performance');
  const [page, setPage] = useState(1);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  // Pedidos de vendedores que quieren representar a la empresa (se responden en el modal).
  const [incomingCount, setIncomingCount] = useState(0);
  // Hora de referencia fija para que los cálculos del render sean puros.
  const [nowMs] = useState(() => Date.now());

  const refresh = useCallback(async (accessToken: string) => {
    const result = await atarApi.getSupplierTeam(accessToken);
    setTeam(result);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const storedSession = loadSession();
      if (!storedSession) {
        return;
      }

      setSession(storedSession);

      try {
        setLoading(true);
        setError(null);
        const [teamResult, inboxResult, representationResult] = await Promise.allSettled([
          atarApi.getSupplierTeam(storedSession.accessToken),
          atarApi.getSupplierInbox(undefined, storedSession.accessToken),
          atarApi.getCompanyRepresentation(storedSession.accessToken),
        ]);
        if (cancelled) return;
        setIncomingCount(representationResult.status === 'fulfilled' ? representationResult.value.incoming.length : 0);
        if (teamResult.status === 'rejected') throw teamResult.reason;
        setTeam(teamResult.value);
        // La bandeja alimenta el feed; si falla, la página sigue funcionando.
        setAssignments(inboxResult.status === 'fulfilled' ? inboxResult.value : []);
      } catch (teamError) {
        if (!cancelled) {
          setError(teamError instanceof Error ? teamError.message : 'No se pudo cargar el equipo comercial.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  /** Aprueba o quita a un vendedor que pidió sumarse a la empresa. */
  async function handleMemberAction(member: TeamMemberRecord, action: 'approve' | 'remove') {
    setMenuFor(null);
    if (!session?.accessToken) {
      return;
    }

    if (action === 'remove' && !window.confirm(`¿Quitar a ${member.name} del equipo?`)) {
      return;
    }

    try {
      setProcessingId(member.id);
      setError(null);
      setMessage(null);

      if (action === 'approve') {
        await atarApi.approveTeamMember(member.id, session.accessToken);
        setMessage(`${member.name} ya puede recibir solicitudes asignadas.`);
      } else {
        await atarApi.removeTeamMember(member.id, session.accessToken);
        setMessage(`${member.name} salió del equipo. Sus solicitudes volvieron a "sin asignar".`);
      }

      await refresh(session.accessToken);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'No se pudo actualizar el equipo.');
    } finally {
      setProcessingId(null);
    }
  }

  // Última actividad de cada vendedor según sus solicitudes asignadas.
  const lastActivityBySeller = useMemo(() => {
    const map = new Map<string, string>();
    for (const assignment of assignments) {
      if (!assignment.seller) continue;
      const current = map.get(assignment.seller.id);
      if (!current || new Date(assignment.updatedAt) > new Date(current)) {
        map.set(assignment.seller.id, assignment.updatedAt);
      }
    }
    return map;
  }, [assignments]);

  const feed = useMemo(
    () =>
      assignments
        .filter((assignment) => assignment.seller)
        .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
        .slice(0, 6),
    [assignments],
  );

  const pendingMembers = team.filter((member) => member.status === 'INVITED');
  const activeMembers = team.filter((member) => member.status !== 'INVITED');

  const totals = team.reduce(
    (accumulator, member) => ({
      assigned: accumulator.assigned + member.assigned,
      pending: accumulator.pending + member.pending,
      quoted: accumulator.quoted + member.quoted,
      quotedAmount: accumulator.quotedAmount + member.quotedAmount,
      won: accumulator.won + member.won,
      wonAmount: accumulator.wonAmount + member.wonAmount,
    }),
    { assigned: 0, pending: 0, quoted: 0, quotedAmount: 0, won: 0, wonAmount: 0 },
  );

  const kpis: { label: string; value: number; note: string; icon: IconName; href?: string; action?: () => void }[] = [
    {
      label: 'Vendedores activos',
      value: activeMembers.length,
      note: pendingMembers.length > 0 ? `${pendingMembers.length} por aprobar` : 'Equipo al día',
      icon: 'users',
      action: () => updateFilters(() => setStatusFilter(pendingMembers.length > 0 ? 'INVITED' : 'all')),
    },
    {
      label: 'Solicitudes asignadas',
      value: totals.assigned,
      note: totals.pending > 0 ? `${totals.pending} pendientes de respuesta` : 'Sin pendientes',
      icon: 'doc',
      href: '/dashboard/proveedor/solicitudes',
    },
    {
      label: 'Cotizaciones enviadas',
      value: totals.quoted,
      note: `${formatCurrency(totals.quotedAmount)} cotizado`,
      icon: 'tag',
      href: '/dashboard/proveedor/cotizaciones',
    },
    {
      label: 'Ventas ganadas',
      value: totals.won,
      note: `${formatCurrency(totals.wonAmount)} vendido`,
      icon: 'trophy',
      action: () => updateFilters(() => setSort('performance')),
    },
  ];

  const filteredTeam = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result = team.filter((member) => {
      if (statusFilter !== 'all' && (statusFilter === 'INVITED') !== (member.status === 'INVITED')) return false;
      if (roleFilter === 'manager' && !member.isManager) return false;
      if (roleFilter === 'seller' && member.isManager) return false;
      if (!query) return true;
      return `${member.name} ${member.email}`.toLowerCase().includes(query);
    });
    return [...result].sort((left, right) => {
      if (sort === 'conversion') return right.conversionRate - left.conversionRate;
      if (sort === 'pending') return right.pending - left.pending;
      if (sort === 'name') return left.name.localeCompare(right.name, 'es');
      return right.wonAmount - left.wonAmount || right.won - left.won || right.quoted - left.quoted;
    });
  }, [roleFilter, search, sort, statusFilter, team]);

  const totalPages = Math.max(1, Math.ceil(filteredTeam.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageTeam = filteredTeam.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function updateFilters(change: () => void) {
    change();
    setPage(1);
  }

  const companyName = activeWorkspace?.company.name ?? 'tu empresa';

  return (
    <SupplierDashboardShell
      onSearchChange={(value) => updateFilters(() => setSearch(value))}
      searchPlaceholder="Buscar vendedores por nombre o email..."
      searchValue={search}
      session={session}
    >
      {/* Encabezado */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[14px] text-slate-500">Gestión comercial</p>
          <h1 className="mt-0.5 text-[32px] font-bold leading-tight tracking-[-0.035em] text-[#16123a] sm:text-[36px]">Equipo comercial</h1>
          <p className="mt-0.5 text-[15px] text-slate-500">
            Gestioná a los vendedores de {companyName}, asigná oportunidades y seguí su desempeño.
          </p>
        </div>
        {isManager ? (
          <button
            className="inline-flex h-12 items-center gap-2 rounded-[12px] bg-indigo-600 px-6 text-[15px] font-semibold text-white shadow-[0_10px_24px_rgba(100,64,232,0.28)] transition hover:bg-indigo-700"
            onClick={() => setInviteOpen(true)}
            type="button"
          >
            <Icon name="plus" />
            Invitar vendedor
          </button>
        ) : null}
      </div>

      {!isManager ? (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-100 px-5 py-4 text-sm text-amber-800">
          Esta sección es solo para administradores de la empresa.
        </div>
      ) : (
        <>
          {error ? <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-100 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
          {message ? <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-100 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
          {incomingCount > 0 ? (
            <button
              className="mt-4 flex w-full items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-100 px-5 py-3 text-left text-sm text-amber-800 transition hover:bg-amber-100/70"
              onClick={() => setInviteOpen(true)}
              type="button"
            >
              <span>
                <span className="font-semibold">
                  {incomingCount} {incomingCount === 1 ? 'vendedor pidió' : 'vendedores pidieron'} sumarse a {companyName}.
                </span>{' '}
                Revisalos para que puedan recibir solicitudes.
              </span>
              <span className="shrink-0 font-semibold">Revisar</span>
            </button>
          ) : null}

          {/* Contadores */}
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((kpi, index) => {
              const content = (
                <>
                  <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${TONES[KPI_TONES[index % 4]].icon}`}>
                    <Icon className="h-6 w-6" name={kpi.icon} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[30px] font-bold leading-none text-[#16123a]">{loading ? '—' : kpi.value}</span>
                    <span className="mt-1.5 block text-[15px] text-slate-600">{kpi.label}</span>
                    <span className={`mt-1.5 block truncate text-[13px] font-medium ${/^Sin|al día|^\$\s?0 /.test(kpi.note) ? 'text-slate-400' : 'text-emerald-600'}`}>
                      {loading ? '' : kpi.note}
                    </span>
                  </span>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e2ddff] text-indigo-600 transition group-hover:translate-x-0.5">
                    <Icon name="arrow" />
                  </span>
                </>
              );
              const className = `${card} group flex items-start gap-4 p-5 text-left transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(40,28,110,0.09)]`;
              return kpi.href ? (
                <Link key={kpi.label} className={className} href={kpi.href}>
                  {content}
                </Link>
              ) : (
                <button key={kpi.label} className={className} onClick={kpi.action} type="button">
                  {content}
                </button>
              );
            })}
          </div>

          <div className="mt-5 grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
            {/* Tabla */}
            <section className={`${card} min-w-0 p-4`}>
              <div className="flex flex-wrap gap-3">
                <label className="relative basis-full sm:min-w-[220px] sm:flex-1 sm:basis-auto">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Icon name="search" />
                  </span>
                  <input
                    className="h-11 w-full rounded-[12px] border border-slate-300 bg-white pl-10 pr-3 text-[14px] outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                    onChange={(event) => updateFilters(() => setSearch(event.target.value))}
                    placeholder="Buscar vendedores por nombre o email..."
                    type="search"
                    value={search}
                  />
                </label>
                <label className="relative min-w-0 flex-1 sm:flex-none">
                  <select aria-label="Estado" className={`${selectClass} w-full sm:min-w-[170px]`} onChange={(event) => updateFilters(() => setStatusFilter(event.target.value as typeof statusFilter))} value={statusFilter}>
                    <option value="all">Todos los estados</option>
                    <option value="ACTIVE">Activos</option>
                    <option value="INVITED">Pendientes de aprobación</option>
                  </select>
                  <SelectChevron />
                </label>
                <label className="relative min-w-0 flex-1 sm:flex-none">
                  <select aria-label="Rol" className={`${selectClass} w-full sm:min-w-[150px]`} onChange={(event) => updateFilters(() => setRoleFilter(event.target.value as typeof roleFilter))} value={roleFilter}>
                    <option value="all">Todos los roles</option>
                    <option value="manager">Gerentes</option>
                    <option value="seller">Vendedores</option>
                  </select>
                  <SelectChevron />
                </label>
                <label className="relative min-w-0 flex-1 sm:flex-none">
                  <select aria-label="Ordenar" className={`${selectClass} w-full sm:min-w-[200px]`} onChange={(event) => updateFilters(() => setSort(event.target.value as SortKey))} value={sort}>
                    <option value="performance">Ordenar por desempeño</option>
                    <option value="conversion">Mayor conversión</option>
                    <option value="pending">Más pendientes</option>
                    <option value="name">Nombre (A-Z)</option>
                  </select>
                  <SelectChevron />
                </label>
              </div>

              {/* La tabla se desliza de costado en pantallas chicas: la primera
                  columna queda fija para no perder de vista al vendedor. */}
              <p className="mt-3 flex items-center gap-1.5 text-[12px] text-slate-400 md:hidden">
                <Icon className="h-3.5 w-3.5" name="chev-right" />
                Deslizá la tabla hacia el costado para ver todos los datos.
              </p>
              <div className="mt-2 overflow-x-auto md:mt-4">
                <table className="w-full min-w-[860px] text-left text-[14px]">
                  <thead>
                    <tr className="bg-[#eceaff] text-[11px] font-semibold uppercase tracking-[0.08em] text-[#3d3780]">
                      <th className="sticky left-0 z-10 rounded-l-lg bg-[#eceaff] px-2.5 py-3">Vendedor</th>
                      <th className="px-2.5 py-3">Rol</th>
                      <th className="px-2.5 py-3">Estado</th>
                      <th className="px-2.5 py-3 text-center" title="Solicitudes asignadas">Oportunidades</th>
                      <th className="px-2.5 py-3 text-center">Pendientes</th>
                      <th className="px-2.5 py-3 text-center">Cotizadas</th>
                      <th className="px-2.5 py-3 text-center">Ganadas</th>
                      <th className="px-2.5 py-3 text-center">Conversión</th>
                      <th className="whitespace-nowrap px-2.5 py-3">Volumen</th>
                      <th className="rounded-r-lg px-2.5 py-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td className="px-3 py-10" colSpan={10}>
                          <LoadingState label="Cargando equipo..." />
                        </td>
                      </tr>
                    ) : pageTeam.length === 0 ? (
                      <tr>
                        <td className="px-3 py-10 text-center text-slate-500" colSpan={10}>
                          {team.length === 0 ? 'Todavía no hay vendedores en el equipo. Invitá al primero.' : 'No hay vendedores que coincidan con los filtros.'}
                        </td>
                      </tr>
                    ) : (
                      pageTeam.map((member) => {
                        const invited = member.status === 'INVITED';
                        const last = lastActivityBySeller.get(member.id);
                        const stale = !last || nowMs - new Date(last).getTime() > 7 * DAY;
                        const highlight = member.pending >= 3 && !invited;
                        return (
                          <tr key={member.id} className={`border-t border-[#d6d0f2] ${highlight ? 'bg-[#efeaff]' : 'bg-white even:bg-[#f0eff8]'}`}>
                            <td className="sticky left-0 z-10 max-w-[150px] bg-inherit px-2.5 py-3 shadow-[6px_0_10px_-8px_rgba(40,28,110,0.25)] md:max-w-none md:shadow-none">
                              <Link className="flex items-center gap-3" href={`/dashboard/proveedor/equipo/${member.id}`}>
                                <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[13px] font-bold text-indigo-600 md:flex">
                                  {initials(member.name)}
                                </span>
                                <span className="min-w-0">
                                  <span className="block truncate font-semibold text-slate-900 hover:underline">{member.name}</span>
                                  <span className="hidden truncate text-[13px] text-slate-500 md:block">{member.email}</span>
                                  {highlight ? (
                                    <span className="mt-0.5 hidden items-center gap-1 text-[12px] text-amber-600 md:flex">
                                      <Icon className="h-3.5 w-3.5" name="alert" />
                                      {member.pending} solicitudes pendientes
                                    </span>
                                  ) : invited ? null : (
                                    <span className="mt-0.5 hidden items-center gap-1.5 text-[12px] text-slate-500 md:flex">
                                      <span className={`h-1.5 w-1.5 rounded-full ${stale ? 'bg-slate-300' : 'bg-emerald-500'}`} />
                                      {last ? `Última actividad ${formatAgo(last, nowMs)}` : 'Sin actividad registrada'}
                                    </span>
                                  )}
                                </span>
                              </Link>
                            </td>
                            <td className="px-2.5 py-3">
                              <span className="rounded-md bg-indigo-100 px-2.5 py-1 text-[12px] font-medium text-indigo-600">
                                {member.isManager ? 'Gerente' : 'Vendedor'}
                              </span>
                            </td>
                            <td className="px-2.5 py-3">
                              <span
                                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1 text-[12px] font-medium ${
                                  invited ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                                }`}
                              >
                                <span className={`h-1.5 w-1.5 rounded-full ${invited ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                {invited ? 'Por aprobar' : 'Activo'}
                              </span>
                            </td>
                            <td className="px-2.5 py-3 text-center text-slate-700">{member.assigned}</td>
                            <td className="px-2.5 py-3 text-center">
                              <span className={`inline-flex min-w-7 justify-center rounded-full px-2 py-0.5 ${member.pending > 0 ? 'bg-amber-100 font-semibold text-amber-700' : 'text-slate-700'}`}>
                                {member.pending}
                              </span>
                            </td>
                            <td className="px-2.5 py-3 text-center text-slate-700">{member.quoted}</td>
                            <td className="px-2.5 py-3 text-center text-slate-700">{member.won}</td>
                            <td className="px-2.5 py-3 text-center">
                              <span
                                className={`rounded-md px-2.5 py-1 text-[12px] font-semibold ${
                                  member.conversionRate >= 20
                                    ? 'bg-emerald-100 text-emerald-600'
                                    : member.conversionRate > 0
                                      ? 'bg-amber-100 text-amber-600'
                                      : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                {member.conversionRate}%
                              </span>
                            </td>
                            <td className="px-2.5 py-3 font-semibold text-slate-900">{formatCurrency(member.wonAmount)}</td>
                            <td className="px-2.5 py-3">
                              <div className="flex items-center justify-center gap-2">
                                {invited ? (
                                  <button
                                    className="inline-flex h-9 items-center rounded-[10px] bg-indigo-600 px-3.5 text-[12px] font-semibold text-white disabled:opacity-60"
                                    disabled={processingId === member.id}
                                    onClick={() => void handleMemberAction(member, 'approve')}
                                    type="button"
                                  >
                                    {processingId === member.id ? 'Guardando…' : 'Aprobar'}
                                  </button>
                                ) : null}
                                <div className="relative">
                                  <button
                                    aria-label="Más acciones"
                                    className="flex h-9 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                                    onClick={() => setMenuFor(menuFor === member.id ? null : member.id)}
                                    type="button"
                                  >
                                    <svg aria-hidden="true" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                      <circle cx="12" cy="5" r="1.8" />
                                      <circle cx="12" cy="12" r="1.8" />
                                      <circle cx="12" cy="19" r="1.8" />
                                    </svg>
                                  </button>
                                  {menuFor === member.id ? (
                                    <>
                                      <button aria-label="Cerrar menú" className="fixed inset-0 z-20 cursor-default" onClick={() => setMenuFor(null)} type="button" />
                                      <div className="absolute right-0 top-10 z-30 w-48 overflow-hidden rounded-xl border border-slate-300 bg-white py-1 text-[13px] shadow-[0_16px_40px_rgba(15,23,42,0.14)]">
                                        <Link className="block px-3 py-2 text-slate-700 hover:bg-slate-50" href={`/dashboard/proveedor/equipo/${member.id}`}>
                                          Ver desempeño
                                        </Link>
                                        <Link className="block px-3 py-2 text-slate-700 hover:bg-slate-50" href="/dashboard/proveedor/solicitudes">
                                          Asignar solicitudes
                                        </Link>
                                        {!member.isManager ? (
                                          <button
                                            className="block w-full px-3 py-2 text-left text-rose-600 hover:bg-rose-50"
                                            onClick={() => void handleMemberAction(member, 'remove')}
                                            type="button"
                                          >
                                            {invited ? 'Rechazar solicitud' : 'Quitar del equipo'}
                                          </button>
                                        ) : null}
                                      </div>
                                    </>
                                  ) : null}
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 px-1 text-[13px] text-slate-500">
                <p>
                  {filteredTeam.length === 0
                    ? 'Sin resultados'
                    : `Mostrando ${(currentPage - 1) * PAGE_SIZE + 1} a ${Math.min(currentPage * PAGE_SIZE, filteredTeam.length)} de ${filteredTeam.length} vendedores`}
                </p>
                {totalPages > 1 ? (
                  <div className="flex items-center gap-1.5">
                    <button aria-label="Página anterior" className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 disabled:opacity-40" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} type="button">
                      <Icon name="chev-left" />
                    </button>
                    {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => (
                      <button
                        key={number}
                        className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-[13px] font-semibold ${number === currentPage ? 'bg-indigo-600 text-white' : 'border border-slate-300 bg-white text-slate-600'}`}
                        onClick={() => setPage(number)}
                        type="button"
                      >
                        {number}
                      </button>
                    ))}
                    <button aria-label="Página siguiente" className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 disabled:opacity-40" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)} type="button">
                      <Icon name="chev-right" />
                    </button>
                  </div>
                ) : null}
              </div>
            </section>

            {/* Actividad del equipo */}
            <aside className={`${card} p-5`}>
              <div className="flex items-center justify-between">
                <h2 className="text-[17px] font-bold text-[#16123a]">Actividad del equipo</h2>
                <Link className="text-[13px] font-semibold" href="/dashboard/proveedor/solicitudes">
                  <span className="text-indigo-600">Ver todas</span>
                </Link>
              </div>
              {feed.length === 0 ? (
                <p className="mt-6 text-center text-[13px] text-slate-500">
                  {loading ? 'Cargando…' : 'Todavía no hay actividad. Aparece cuando asignás solicitudes a tu equipo.'}
                </p>
              ) : (
                <ol className="relative mt-4 space-y-4 before:absolute before:bottom-3 before:left-[3px] before:top-3 before:w-px before:bg-slate-200">
                  {feed.map((assignment) => {
                    const event = activityFor(assignment);
                    return (
                      <li key={assignment.id} className="relative flex gap-3 pl-5">
                        <span className={`absolute left-0 top-4 h-[7px] w-[7px] rounded-full ${event.dot}`} />
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${event.tone}`}>
                          <Icon name={event.icon} />
                        </span>
                        <Link className="min-w-0 flex-1" href={`/dashboard/proveedor/solicitudes/${assignment.requestId}`}>
                          <span className="flex items-start justify-between gap-2">
                            <span className="truncate text-[14px] font-semibold text-slate-900">{assignment.seller?.name}</span>
                            <span className="shrink-0 text-[12px] text-slate-400">{formatAgo(assignment.updatedAt, nowMs)}</span>
                          </span>
                          <span className="block text-[13px] text-slate-600">{event.text}</span>
                          <span className="block truncate text-[12px] text-slate-400">{event.detail}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              )}
            </aside>
          </div>
        </>
      )}

      {/* Invitaciones: el mismo panel de antes, dentro de un modal. */}
      {inviteOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#120f2e]/45 p-4 pt-[8vh] backdrop-blur-[2px]" onClick={() => setInviteOpen(false)} role="presentation">
          <div aria-label="Invitar vendedor" aria-modal="true" className="relative w-full max-w-[720px]" onClick={(event) => event.stopPropagation()} role="dialog">
            <button
              aria-label="Cerrar"
              className="absolute -top-11 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
              onClick={() => setInviteOpen(false)}
              type="button"
            >
              <Icon name="close" />
            </button>
            <TeamInvitationsPanel
              accessToken={session?.accessToken}
              companyName={companyName}
              onTeamChanged={async () => {
                if (!session?.accessToken) return;
                await refresh(session.accessToken);
                const representation = await atarApi.getCompanyRepresentation(session.accessToken).catch(() => null);
                if (representation) setIncomingCount(representation.incoming.length);
              }}
            />
          </div>
        </div>
      ) : null}
    </SupplierDashboardShell>
  );
}
