'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useWorkspace } from '@/components/auth/workspace-provider';
import SupplierDashboardShell from '@/components/dashboard/supplier-dashboard-shell';
import {
  atarApi,
  type RequestAssignmentRecord,
  type TeamMemberRecord,
} from '@/lib/atar-api';
import {
  OPPORTUNITY_STATUS_LABEL,
  OPPORTUNITY_STATUS_TONE,
} from '@/lib/opportunity-status';
import { loadSession, type WebSession } from '@/lib/session';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) {
    return '—';
  }

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

/** Detalle de un vendedor: su cartera y su desempeño. */
export default function SupplierTeamMemberPage() {
  const params = useParams<{ id: string }>();
  const sellerId = typeof params.id === 'string' ? params.id : '';
  const { isManager } = useWorkspace();

  const [session, setSession] = useState<WebSession | null>(null);
  const [member, setMember] = useState<TeamMemberRecord | null>(null);
  const [assignments, setAssignments] = useState<RequestAssignmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const storedSession = loadSession();
      if (!storedSession || !sellerId) {
        return;
      }

      setSession(storedSession);

      try {
        setLoading(true);
        setError(null);
        const [team, inbox] = await Promise.all([
          atarApi.getSupplierTeam(storedSession.accessToken),
          atarApi.getSupplierInbox({ sellerUserId: sellerId }, storedSession.accessToken),
        ]);

        if (!cancelled) {
          setMember(team.find((item) => item.id === sellerId) ?? null);
          setAssignments(inbox);
        }
      } catch (detailError) {
        if (!cancelled) {
          setError(
            detailError instanceof Error
              ? detailError.message
              : 'No se pudo cargar el detalle del vendedor.',
          );
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
  }, [sellerId]);

  const grouped = useMemo(() => {
    return {
      open: assignments.filter((assignment) =>
        ['NEW', 'UNASSIGNED', 'ASSIGNED', 'IN_RESPONSE'].includes(assignment.status),
      ),
      quoted: assignments.filter((assignment) =>
        ['QUOTED', 'NEGOTIATING'].includes(assignment.status),
      ),
      closed: assignments.filter((assignment) => ['WON', 'LOST'].includes(assignment.status)),
    };
  }, [assignments]);

  return (
    <SupplierDashboardShell session={session}>
      <div className="mx-auto w-full max-w-[1200px] space-y-4">
        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 transition hover:text-indigo-500"
          href="/dashboard/proveedor/equipo"
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
            <path d="M19 12H5M11 18l-6-6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
          Volver al equipo
        </Link>

        {!isManager ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            Esta sección es solo para administradores de la empresa.
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {error}
          </div>
        ) : loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center text-sm text-slate-500">
            Cargando vendedor...
          </div>
        ) : !member ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center text-sm text-slate-500">
            No encontramos a este vendedor en la empresa.
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-sm font-bold text-indigo-600">
                    {member.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-950">{member.name}</h1>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {member.isManager ? 'Gerente' : 'Vendedor'} · {member.email}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-[11px] text-slate-500">Volumen vendido</p>
                  <p className="text-xl font-semibold text-emerald-600">
                    {formatCurrency(member.wonAmount)}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                {[
                  { label: 'Asignadas', value: member.assigned },
                  { label: 'Pendientes', value: member.pending },
                  { label: 'Cotizadas', value: member.quoted },
                  { label: 'Ganadas', value: member.won },
                  { label: 'Conversión', value: `${member.conversionRate}%` },
                ].map((card) => (
                  <div className="rounded-xl bg-slate-50 px-3 py-3" key={card.label}>
                    <p className="text-lg font-semibold tracking-tight text-slate-950">{card.value}</p>
                    <p className="mt-1 text-[11px] text-slate-500">{card.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {[
              { title: 'En curso', items: grouped.open },
              { title: 'Cotizadas y en negociación', items: grouped.quoted },
              { title: 'Cerradas', items: grouped.closed },
            ].map((group) => (
              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" key={group.title}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-950">{group.title}</p>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
                    {group.items.length}
                  </span>
                </div>

                {group.items.length === 0 ? (
                  <p className="mt-3 rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-slate-500">
                    Sin oportunidades en este estado.
                  </p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {group.items.map((assignment) => (
                      <Link
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-3 transition hover:bg-slate-50"
                        href={`/dashboard/proveedor/solicitudes/${assignment.requestId}`}
                        key={assignment.id}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-slate-950">
                            {assignment.request.productName || assignment.request.title}
                          </p>
                          <p className="mt-0.5 truncate text-[11px] text-slate-500">
                            {assignment.request.buyerCompany?.name ?? 'Comprador'} ·{' '}
                            {assignment.request.category}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              OPPORTUNITY_STATUS_TONE[assignment.status]
                            }`}
                          >
                            {OPPORTUNITY_STATUS_LABEL[assignment.status]}
                          </span>
                          <p className="mt-1 text-[10px] text-slate-400">
                            {formatDate(assignment.assignedAt)}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </>
        )}
      </div>
    </SupplierDashboardShell>
  );
}
