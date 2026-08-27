'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useWorkspace } from '@/components/auth/workspace-provider';
import SupplierDashboardShell from '@/components/dashboard/supplier-dashboard-shell';
import TeamInvitationsPanel from '@/components/dashboard/team-invitations-panel';
import { atarApi, type TeamMemberRecord } from '@/lib/atar-api';
import { loadSession, type WebSession } from '@/lib/session';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value);
}

/** Equipo comercial de la empresa proveedora. Solo accesible para gerentes. */
export default function SupplierTeamPage() {
  const { isManager, activeWorkspace } = useWorkspace();
  const [session, setSession] = useState<WebSession | null>(null);
  const [team, setTeam] = useState<TeamMemberRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

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
        const result = await atarApi.getSupplierTeam(storedSession.accessToken);
        if (!cancelled) {
          setTeam(result);
        }
      } catch (teamError) {
        if (!cancelled) {
          setError(
            teamError instanceof Error ? teamError.message : 'No se pudo cargar el equipo comercial.',
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
  }, []);

  /** Aprueba o quita a un vendedor que pidió sumarse a la empresa. */
  async function handleMemberAction(member: TeamMemberRecord, action: 'approve' | 'remove') {
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
      setError(
        actionError instanceof Error ? actionError.message : 'No se pudo actualizar el equipo.',
      );
    } finally {
      setProcessingId(null);
    }
  }

  const pendingMembers = team.filter((member) => member.status === 'INVITED');

  const totals = team.reduce(
    (accumulator, member) => ({
      assigned: accumulator.assigned + member.assigned,
      quoted: accumulator.quoted + member.quoted,
      won: accumulator.won + member.won,
      wonAmount: accumulator.wonAmount + member.wonAmount,
    }),
    { assigned: 0, quoted: 0, won: 0, wonAmount: 0 },
  );

  return (
    <SupplierDashboardShell searchPlaceholder="Buscar vendedores" session={session}>
      <div className="mx-auto w-full max-w-[1200px] space-y-4">
        <div>
          <p className="text-xs text-slate-500">Gestión comercial</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Equipo comercial</h1>
          <p className="mt-1 text-xs text-slate-500">
            Desempeño de los vendedores de {activeWorkspace?.company.name ?? 'tu empresa'}.
          </p>
        </div>

        {/* Pedidos de vendedores e invitaciones: va antes de la tabla porque
            es lo que el gerente tiene pendiente de responder. */}
        {isManager ? (
          <TeamInvitationsPanel
            accessToken={session?.accessToken}
            companyName={activeWorkspace?.company.name ?? 'tu empresa'}
            onTeamChanged={() =>
              session?.accessToken ? refresh(session.accessToken) : Promise.resolve()
            }
          />
        ) : null}

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
            Cargando equipo...
          </div>
        ) : team.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center text-sm text-slate-500">
            Todavía no hay vendedores en el equipo. Invitá a uno desde el panel de arriba.
          </div>
        ) : (
          <>
            {message ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
                {message}
              </div>
            ) : null}

            {/* Vendedores que se registraron pidiendo sumarse al equipo. */}
            {pendingMembers.length > 0 ? (
              <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                <p className="text-sm font-semibold text-amber-900">
                  {pendingMembers.length} solicitud{pendingMembers.length === 1 ? '' : 'es'} para
                  sumarse a tu equipo
                </p>
                <p className="mt-0.5 text-[11px] text-amber-800">
                  Hasta que los apruebes no pueden recibir solicitudes asignadas.
                </p>

                <div className="mt-3 space-y-2">
                  {pendingMembers.map((member) => (
                    <div
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-white px-3.5 py-3"
                      key={member.id}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-[11px] font-bold text-amber-700">
                          {member.name.slice(0, 2).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-slate-950">
                            {member.name}
                          </p>
                          <p className="truncate text-[11px] text-slate-500">{member.email}</p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          className="inline-flex h-9 items-center rounded-xl border border-slate-200 px-3 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                          disabled={processingId === member.id}
                          onClick={() => void handleMemberAction(member, 'remove')}
                          type="button"
                        >
                          Rechazar
                        </button>
                        <button
                          className="inline-flex h-9 items-center rounded-xl bg-indigo-600 px-4 text-[12px] font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
                          disabled={processingId === member.id}
                          onClick={() => void handleMemberAction(member, 'approve')}
                          type="button"
                        >
                          {processingId === member.id ? 'Guardando...' : 'Aprobar'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Vendedores', value: team.length },
                { label: 'Asignadas', value: totals.assigned },
                { label: 'Cotizadas', value: totals.quoted },
                { label: 'Ganadas', value: totals.won },
              ].map((card) => (
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5" key={card.label}>
                  <p className="text-[1.5rem] font-semibold tracking-tight text-slate-950">{card.value}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{card.label}</p>
                </div>
              ))}
            </div>

            {/* Tabla en desktop */}
            <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70">
                  <tr className="text-[10px] uppercase tracking-[0.12em] text-slate-400">
                    <th className="px-5 py-3 font-semibold">Vendedor</th>
                    <th className="px-4 py-3 text-right font-semibold">Asignadas</th>
                    <th className="px-4 py-3 text-right font-semibold">Pendientes</th>
                    <th className="px-4 py-3 text-right font-semibold">Cotizadas</th>
                    <th className="px-4 py-3 text-right font-semibold">Ganadas</th>
                    <th className="px-4 py-3 text-right font-semibold">Conversión</th>
                    <th className="px-5 py-3 text-right font-semibold">Volumen vendido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {team.map((member) => (
                    <tr className="transition hover:bg-slate-50/60" key={member.id}>
                      <td className="px-5 py-3">
                        <Link
                          className="flex items-center gap-3"
                          href={`/dashboard/proveedor/equipo/${member.id}`}
                        >
                          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-[11px] font-bold text-indigo-600">
                            {member.name.slice(0, 2).toUpperCase()}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-[13px] font-semibold text-slate-950">
                              {member.name}
                            </span>
                            <span className="block truncate text-[10px] text-slate-400">
                              {member.isManager ? 'Gerente' : 'Vendedor'} · {member.email}
                              {member.status === 'INVITED' ? (
                                <span className="ml-1.5 rounded-full bg-amber-50 px-1.5 py-0.5 font-semibold text-amber-600">
                                  Pendiente
                                </span>
                              ) : null}
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">{member.assigned}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{member.pending}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{member.quoted}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{member.won}</td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            member.conversionRate >= 40
                              ? 'bg-emerald-50 text-emerald-600'
                              : member.conversionRate > 0
                                ? 'bg-amber-50 text-amber-600'
                                : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {member.conversionRate}%
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-slate-950">
                        {formatCurrency(member.wonAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards en mobile y tablet */}
            <div className="space-y-3 lg:hidden">
              {team.map((member) => (
                <Link
                  className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  href={`/dashboard/proveedor/equipo/${member.id}`}
                  key={member.id}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-xs font-bold text-indigo-600">
                      {member.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold text-slate-950">{member.name}</p>
                      <p className="truncate text-[11px] text-slate-500">
                        {member.isManager ? 'Gerente' : 'Vendedor'}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        member.conversionRate >= 40
                          ? 'bg-emerald-50 text-emerald-600'
                          : member.conversionRate > 0
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {member.conversionRate}%
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                    {[
                      { label: 'Asignadas', value: member.assigned },
                      { label: 'Pendientes', value: member.pending },
                      { label: 'Cotizadas', value: member.quoted },
                      { label: 'Ganadas', value: member.won },
                    ].map((item) => (
                      <div className="rounded-xl bg-slate-50 py-2" key={item.label}>
                        <p className="text-sm font-semibold text-slate-950">{item.value}</p>
                        <p className="text-[10px] text-slate-500">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </SupplierDashboardShell>
  );
}
