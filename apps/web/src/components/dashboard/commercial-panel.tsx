'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { useWorkspace } from '@/components/auth/workspace-provider';
import { atarApi, type SupplierMetricsRecord, type TeamMemberRecord } from '@/lib/atar-api';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Bloque comercial del panel del proveedor: metricas del pipeline y equipo.
 * El gerente ve la empresa completa; el vendedor ve solo su cartera.
 */
export default function CommercialPanel() {
  const { session } = useAuth();
  const { isManager } = useWorkspace();
  const [metrics, setMetrics] = useState<SupplierMetricsRecord | null>(null);
  const [team, setTeam] = useState<TeamMemberRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!session?.accessToken) {
        return;
      }

      try {
        setLoading(true);
        const metricsResult = await atarApi.getSupplierMetrics(session.accessToken);
        if (!cancelled) {
          setMetrics(metricsResult);
        }

        try {
          const teamResult = await atarApi.getSupplierTeam(session.accessToken);
          if (!cancelled) {
            setTeam(teamResult);
          }
        } catch {
          if (!cancelled) {
            setTeam([]);
          }
        }
      } catch {
        if (!cancelled) {
          setMetrics(null);
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
  }, [session?.accessToken]);

  if (loading || !metrics) {
    return null;
  }

  const cards = [
    { label: 'Solicitudes recibidas', value: metrics.received, tone: 'text-slate-950' },
    { label: 'Sin asignar', value: metrics.unassigned, tone: 'text-amber-600' },
    { label: 'Asignadas', value: metrics.assigned, tone: 'text-sky-600' },
    { label: 'Cotizaciones enviadas', value: metrics.quotesSent, tone: 'text-indigo-600' },
    { label: 'Cotizaciones aceptadas', value: metrics.quotesAwarded, tone: 'text-emerald-600' },
    { label: 'Oportunidades ganadas', value: metrics.won, tone: 'text-emerald-600' },
  ];

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-950">
              {metrics.scope === 'company' ? 'Panel comercial' : 'Mi actividad comercial'}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {metrics.scope === 'company'
                ? 'Estado del pipeline de toda la empresa.'
                : 'Solo las oportunidades que tenés asignadas.'}
            </p>
          </div>
          <Link
            className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-500"
            href="/dashboard/proveedor/solicitudes"
          >
            Ver bandeja
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {cards.map((card) => (
            <div className="rounded-xl bg-slate-50 px-3 py-3" key={card.label}>
              <p className={`text-[1.35rem] font-semibold tracking-tight ${card.tone}`}>{card.value}</p>
              <p className="mt-1 text-[11px] leading-4 text-slate-500">{card.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 px-3 py-3">
            <p className="text-[11px] text-slate-500">Volumen cotizado</p>
            <p className="mt-1 text-lg font-semibold text-slate-950">
              {formatCurrency(metrics.quotedAmount)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 px-3 py-3">
            <p className="text-[11px] text-slate-500">Volumen vendido</p>
            <p className="mt-1 text-lg font-semibold text-emerald-600">
              {formatCurrency(metrics.soldAmount)}
            </p>
          </div>
        </div>
      </div>

      {isManager && team.length > 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-950">Equipo comercial</p>
            <Link
              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-500"
              href="/dashboard/proveedor/equipo"
            >
              Ver equipo
            </Link>
          </div>

          {/* Tabla en desktop, cards en mobile. */}
          <div className="mt-3 hidden overflow-x-auto sm:block">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.12em] text-slate-400">
                  <th className="pb-2 font-semibold">Vendedor</th>
                  <th className="pb-2 text-right font-semibold">Asignadas</th>
                  <th className="pb-2 text-right font-semibold">Cotizadas</th>
                  <th className="pb-2 text-right font-semibold">Ganadas</th>
                  <th className="pb-2 text-right font-semibold">Conversión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {team.map((member) => (
                  <tr key={member.id}>
                    <td className="py-2.5">
                      <Link
                        className="font-semibold text-slate-950 hover:text-indigo-600"
                        href={`/dashboard/proveedor/equipo/${member.id}`}
                      >
                        {member.name}
                      </Link>
                      <span className="ml-2 text-[10px] text-slate-400">
                        {member.isManager ? 'Gerente' : 'Vendedor'}
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-slate-600">{member.assigned}</td>
                    <td className="py-2.5 text-right text-slate-600">{member.quoted}</td>
                    <td className="py-2.5 text-right text-slate-600">{member.won}</td>
                    <td className="py-2.5 text-right">
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 space-y-2 sm:hidden">
            {team.map((member) => (
              <Link
                className="block rounded-xl border border-slate-200 px-3 py-2.5"
                href={`/dashboard/proveedor/equipo/${member.id}`}
                key={member.id}
              >
                <p className="text-[13px] font-semibold text-slate-950">{member.name}</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  {member.assigned} asignadas · {member.quoted} cotizadas · {member.won} ganadas ·{' '}
                  {member.conversionRate}% conversión
                </p>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
