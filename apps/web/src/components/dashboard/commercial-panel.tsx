'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { useWorkspace } from '@/components/auth/workspace-provider';
import {
  atarApi,
  type SupplierMetricsOverviewRecord,
  type TeamMemberRecord,
} from '@/lib/atar-api';

/** Valor del filtro que consolida todas las empresas del vendedor. */
const ALL_COMPANIES = 'all';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

/**
 * Bloque comercial del panel del proveedor: metricas del pipeline y equipo.
 *
 * Un vendedor puede representar a varias proveedoras. Por eso las metricas
 * llegan consolidadas (`/companies/metrics/overview`): arranca en el total
 * general de todas sus empresas y puede filtrar por una sola. El gerente ve la
 * empresa completa; el vendedor ve solo su cartera.
 */
export default function CommercialPanel({ className = '' }: { className?: string }) {
  const { session } = useAuth();
  const { workspaces } = useWorkspace();
  const [overview, setOverview] = useState<SupplierMetricsOverviewRecord | null>(null);
  const [companyFilter, setCompanyFilter] = useState<string>(ALL_COMPANIES);
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
        const result = await atarApi.getSupplierMetricsOverview(session.accessToken);
        if (!cancelled) {
          setOverview(result);
        }
      } catch {
        if (!cancelled) {
          setOverview(null);
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

  const hasMultipleCompanies = (overview?.companiesCount ?? 0) > 1;

  // Con una sola empresa el filtro no aplica: se muestra esa directamente.
  const activeFilter = hasMultipleCompanies
    ? companyFilter
    : overview?.companies[0]?.companyId ?? ALL_COMPANIES;

  const selectedCompany = useMemo(
    () => overview?.companies.find((item) => item.companyId === activeFilter) ?? null,
    [activeFilter, overview],
  );

  // El equipo pertenece a una empresa concreta: no tiene sentido consolidarlo.
  const teamCompanyId = selectedCompany?.companyId ?? null;
  const canSeeTeam = Boolean(
    teamCompanyId &&
      (workspaces.find((workspace) => workspace.companyId === teamCompanyId)?.isManager ?? true),
  );

  useEffect(() => {
    let cancelled = false;

    async function loadTeam() {
      if (!session?.accessToken || !teamCompanyId || !canSeeTeam) {
        setTeam([]);
        return;
      }

      try {
        // Un vendedor recibe 403 en /companies/team y sigue sin la tabla.
        const result = await atarApi.getSupplierTeam(session.accessToken, teamCompanyId);
        if (!cancelled) {
          setTeam(result);
        }
      } catch {
        if (!cancelled) {
          setTeam([]);
        }
      }
    }

    void loadTeam();

    return () => {
      cancelled = true;
    };
  }, [canSeeTeam, session?.accessToken, teamCompanyId]);

  if (loading || !overview || overview.companiesCount === 0) {
    return null;
  }

  const metrics = selectedCompany ?? overview.total;
  const scope = selectedCompany?.scope ?? overview.scope;

  const cards = [
    { label: 'Solicitudes recibidas', value: metrics.received, tone: 'text-slate-950' },
    { label: 'Sin asignar', value: metrics.unassigned, tone: 'text-amber-600' },
    { label: 'Asignadas', value: metrics.assigned, tone: 'text-sky-600' },
    { label: 'Cotizaciones enviadas', value: metrics.quotesSent, tone: 'text-indigo-600' },
    { label: 'Cotizaciones aceptadas', value: metrics.quotesAwarded, tone: 'text-emerald-600' },
    { label: 'Oportunidades ganadas', value: metrics.won, tone: 'text-emerald-600' },
  ];

  const title = selectedCompany
    ? selectedCompany.company.name
    : `Todas tus empresas (${overview.companiesCount})`;

  const subtitle = selectedCompany
    ? scope === 'company'
      ? 'Estado del pipeline de toda la empresa.'
      : 'Solo las oportunidades que tenés asignadas en esta empresa.'
    : scope === 'seller'
      ? 'Total consolidado de tu cartera en todas las empresas que representás.'
      : 'Total consolidado de todas las empresas que representás.';

  return (
    <section className={`space-y-4 ${className}`}>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-950">{title}</p>
            <p className="mt-0.5 text-[11px] text-slate-500">{subtitle}</p>
          </div>
          <Link
            className="shrink-0 text-[11px] font-semibold text-indigo-600 hover:text-indigo-500"
            href="/dashboard/proveedor/solicitudes"
          >
            Ver bandeja
          </Link>
        </div>

        {/* Filtro por empresa: el consolidado primero, despues una por una. */}
        {hasMultipleCompanies ? (
          <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
            <FilterChip
              active={activeFilter === ALL_COMPANIES}
              label="Todas las empresas"
              onClick={() => setCompanyFilter(ALL_COMPANIES)}
            />
            {overview.companies.map((item) => (
              <FilterChip
                active={activeFilter === item.companyId}
                key={item.companyId}
                label={item.company.name}
                onClick={() => setCompanyFilter(item.companyId)}
              />
            ))}
          </div>
        ) : null}

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

        {/* Desglose: solo aporta cuando se esta mirando el consolidado. */}
        {hasMultipleCompanies && !selectedCompany ? (
          <div className="mt-4 border-t border-slate-200 pt-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Desglose por empresa
            </p>

            <div className="mt-2 hidden overflow-x-auto sm:block">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[10px] uppercase tracking-[0.12em] text-slate-400">
                    <th className="pb-2 font-semibold">Empresa</th>
                    <th className="pb-2 text-right font-semibold">Recibidas</th>
                    <th className="pb-2 text-right font-semibold">Cotizadas</th>
                    <th className="pb-2 text-right font-semibold">Ganadas</th>
                    <th className="pb-2 text-right font-semibold">Vendido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {overview.companies.map((item) => (
                    <tr key={item.companyId}>
                      <td className="py-2.5">
                        <button
                          className="font-semibold text-slate-950 hover:text-indigo-600"
                          onClick={() => setCompanyFilter(item.companyId)}
                          type="button"
                        >
                          {item.company.name}
                        </button>
                        {item.scope === 'seller' ? (
                          <span className="ml-2 text-[10px] text-slate-400">Mi cartera</span>
                        ) : null}
                      </td>
                      <td className="py-2.5 text-right text-slate-600">{item.received}</td>
                      <td className="py-2.5 text-right text-slate-600">{item.quotesSent}</td>
                      <td className="py-2.5 text-right text-slate-600">{item.won}</td>
                      <td className="py-2.5 text-right font-semibold text-emerald-600">
                        {formatCompactCurrency(item.soldAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-2 space-y-2 sm:hidden">
              {overview.companies.map((item) => (
                <button
                  className="block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-left"
                  key={item.companyId}
                  onClick={() => setCompanyFilter(item.companyId)}
                  type="button"
                >
                  <p className="text-[13px] font-semibold text-slate-950">{item.company.name}</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {item.received} recibidas · {item.quotesSent} cotizadas · {item.won} ganadas ·{' '}
                    {formatCompactCurrency(item.soldAmount)} vendido
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {selectedCompany && canSeeTeam && team.length > 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="min-w-0 truncate text-sm font-semibold text-slate-950">
              Equipo comercial · {selectedCompany.company.name}
            </p>
            <Link
              className="shrink-0 text-[11px] font-semibold text-indigo-600 hover:text-indigo-500"
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
              <tbody className="divide-y divide-slate-200">
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

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
        active
          ? 'border-indigo-600 bg-indigo-600 text-white'
          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}
