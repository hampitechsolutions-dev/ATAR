'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import SupplierDashboardShell from '@/components/dashboard/supplier-dashboard-shell';
import {
  atarApi,
  type CommercialOpportunityRecord,
  type CustomerRecord,
} from '@/lib/atar-api';
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
    return 'Sin registro';
  }

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

const OPPORTUNITY_COPY = {
  REPURCHASE: {
    label: 'Oportunidad de recompra',
    tone: 'bg-emerald-50 text-emerald-600',
    cta: 'Contactar cliente',
  },
  FOLLOW_UP: {
    label: 'Seguimiento pendiente',
    tone: 'bg-amber-50 text-amber-600',
    cta: 'Hacer seguimiento',
  },
  AFTER_SALES: {
    label: 'Postventa',
    tone: 'bg-sky-50 text-sky-600',
    cta: 'Consultar entrega',
  },
} as const;

/**
 * Historial comercial del proveedor (base del CRM interno) y las señales
 * comerciales que ATAR detecta sobre esa historia.
 */
export default function SupplierClientsPage() {
  const [session, setSession] = useState<WebSession | null>(null);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [opportunities, setOpportunities] = useState<CommercialOpportunityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

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
        const [customersResult, opportunitiesResult] = await Promise.all([
          atarApi.getSupplierCustomers(storedSession.accessToken),
          atarApi.getCommercialOpportunities(storedSession.accessToken),
        ]);

        if (!cancelled) {
          setCustomers(customersResult);
          setOpportunities(opportunitiesResult);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : 'No se pudo cargar el historial comercial.',
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

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return customers;
    }

    return customers.filter((customer) =>
      [customer.name, customer.location, customer.lastProduct ?? '']
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }, [customers, search]);

  const totals = customers.reduce(
    (accumulator, customer) => ({
      revenue: accumulator.revenue + customer.purchasedAmount,
      orders: accumulator.orders + customer.ordersCount,
      quotes: accumulator.quotes + customer.quotesCount,
    }),
    { revenue: 0, orders: 0, quotes: 0 },
  );

  return (
    <SupplierDashboardShell searchPlaceholder="Buscar clientes, ciudades o cuentas..." session={session}>
      <div className="mx-auto w-full max-w-[1200px] space-y-4">
        <div>
          <p className="text-xs text-slate-500">Historial comercial</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Clientes</h1>
          <p className="mt-1 text-xs text-slate-500">
            Todo lo que cotizaste y vendiste, por cliente, con las señales de recompra.
          </p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {/* Señales comerciales: base para las automatizaciones */}
        {opportunities.length > 0 ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-950">Oportunidades detectadas</p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  ATAR revisa tu historial y te avisa cuándo conviene volver a contactar.
                </p>
              </div>
              <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold text-indigo-600">
                {opportunities.length}
              </span>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {opportunities.slice(0, 6).map((opportunity, index) => {
                const copy = OPPORTUNITY_COPY[opportunity.type];

                return (
                  <article
                    className="rounded-xl border border-slate-200 p-3.5"
                    key={`${opportunity.type}-${opportunity.companyId}-${index}`}
                  >
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${copy.tone}`}>
                      {copy.label}
                    </span>
                    <p className="mt-2.5 text-[13px] font-semibold text-slate-950">
                      {opportunity.companyName}
                    </p>
                    <p className="mt-1 text-[11px] leading-5 text-slate-500">
                      {opportunity.product ?? 'Producto sin detallar'}
                      {typeof opportunity.days === 'number'
                        ? ` · hace ${opportunity.days} días`
                        : ''}
                      {opportunity.units ? ` · ${opportunity.units} unidades` : ''}
                    </p>
                    <Link
                      className="mt-3 inline-flex h-8 w-full items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 text-[11px] font-semibold text-indigo-700 transition hover:bg-indigo-100"
                      href="/dashboard/proveedor/mensajes"
                    >
                      {copy.cta}
                    </Link>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Clientes', value: String(customers.length) },
            { label: 'Cotizaciones', value: String(totals.quotes) },
            { label: 'Pedidos ganados', value: String(totals.orders) },
            { label: 'Volumen vendido', value: formatCurrency(totals.revenue) },
          ].map((card) => (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5" key={card.label}>
              <p className="text-lg font-semibold tracking-tight text-slate-950">{card.value}</p>
              <p className="mt-1 text-[11px] text-slate-500">{card.label}</p>
            </div>
          ))}
        </div>

        <div className="relative">
          <input
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-indigo-400"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar cliente o producto..."
            value={search}
          />
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center text-sm text-slate-500">
            Cargando historial comercial...
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center text-sm text-slate-500">
            Todavía no hay clientes con cotizaciones registradas.
          </div>
        ) : (
          <>
            {/* Tabla en desktop */}
            <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70">
                  <tr className="text-[10px] uppercase tracking-[0.12em] text-slate-400">
                    <th className="px-5 py-3 font-semibold">Cliente</th>
                    <th className="px-4 py-3 font-semibold">Último producto</th>
                    <th className="px-4 py-3 text-right font-semibold">Cotizaciones</th>
                    <th className="px-4 py-3 text-right font-semibold">Pedidos</th>
                    <th className="px-4 py-3 font-semibold">Última compra</th>
                    <th className="px-4 py-3 font-semibold">Vendedor</th>
                    <th className="px-5 py-3 text-right font-semibold">Volumen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCustomers.map((customer) => (
                    <tr className="transition hover:bg-slate-50/60" key={customer.companyId}>
                      <td className="px-5 py-3">
                        <p className="text-[13px] font-semibold text-slate-950">{customer.name}</p>
                        <p className="text-[10px] text-slate-400">{customer.location}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {customer.lastProduct ?? customer.lastQuotedProduct ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">{customer.quotesCount}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{customer.ordersCount}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatDate(customer.lastPurchaseAt)}
                        {typeof customer.daysSinceLastPurchase === 'number' ? (
                          <span className="ml-1 text-[10px] text-slate-400">
                            ({customer.daysSinceLastPurchase} d)
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {customer.sellers[0]?.name ?? 'Sin asignar'}
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-slate-950">
                        {formatCurrency(customer.purchasedAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards en mobile */}
            <div className="space-y-3 lg:hidden">
              {filteredCustomers.map((customer) => (
                <article
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  key={customer.companyId}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold text-slate-950">{customer.name}</p>
                      <p className="truncate text-[11px] text-slate-500">{customer.location}</p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-slate-950">
                      {formatCurrency(customer.purchasedAmount)}
                    </p>
                  </div>

                  <p className="mt-2 text-[11px] text-slate-500">
                    {customer.quotesCount} cotización{customer.quotesCount === 1 ? '' : 'es'} ·{' '}
                    {customer.ordersCount} pedido{customer.ordersCount === 1 ? '' : 's'}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Última compra: {formatDate(customer.lastPurchaseAt)}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Atendido por: {customer.sellers[0]?.name ?? 'Sin asignar'}
                  </p>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </SupplierDashboardShell>
  );
}
