'use client';

import { useMemo } from 'react';
import SupplierDashboardShell from '@/components/dashboard/supplier-dashboard-shell';
import { useSupplierDashboardData } from '@/lib/dashboard-hooks';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function SupplierClientsPage() {
  const { session, myQuotes, loading, error } = useSupplierDashboardData();

  const clients = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        city: string;
        quotes: number;
        awarded: number;
        revenue: number;
      }
    >();

    myQuotes.forEach((quote) => {
      const name = quote.request?.buyerCompany?.name ?? 'Cliente';
      const city =
        quote.request?.buyerCompany?.city && quote.request?.buyerCompany?.country
          ? `${quote.request.buyerCompany.city}, ${quote.request.buyerCompany.country}`
          : quote.request?.buyerCompany?.country ?? 'Sin ubicacion';

      const current = map.get(name) ?? {
        name,
        city,
        quotes: 0,
        awarded: 0,
        revenue: 0,
      };

      current.quotes += 1;
      if (quote.status === 'AWARDED') {
        current.awarded += 1;
        current.revenue += quote.amount ?? 0;
      }

      map.set(name, current);
    });

    return Array.from(map.values()).sort(
      (left, right) => right.revenue - left.revenue || right.quotes - left.quotes,
    );
  }, [myQuotes]);

  return (
    <SupplierDashboardShell searchPlaceholder="Buscar clientes, ciudades o cuentas..." session={session}>
      <section className="space-y-4">
        <div className="rounded-[24px] border border-[#e7eaf3] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
          <h1 className="text-[24px] font-semibold tracking-[-0.03em] text-[#1f2373] sm:text-[32px]">
            Clientes
          </h1>
          <p className="mt-1 text-sm text-[#7e85b2]">
            Visualiza tus cuentas activas, volumen comercial y adjudicaciones.
          </p>
        </div>

        {error ? (
          <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-3">
          {loading ? (
            <div className="rounded-[18px] border border-[#edf0fb] bg-white px-4 py-8 text-sm text-[#8d95be]">
              Cargando clientes...
            </div>
          ) : clients.length === 0 ? (
            <div className="rounded-[18px] border border-dashed border-[#d8ddee] bg-white px-4 py-8 text-sm text-[#8d95be]">
              Aun no hay clientes asociados a tus cotizaciones.
            </div>
          ) : (
            clients.map((client, index) => (
              <article
                key={client.name}
                className="grid grid-cols-1 gap-4 rounded-[20px] border border-[#e7eaf3] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.04)] md:grid-cols-[56px_1fr_repeat(3,0.65fr)_120px] md:items-center"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f4f6ff] text-sm font-bold text-[#5b4bff]">
                  {index + 1}
                </div>
                <div>
                  <p className="text-lg font-semibold text-[#33407a]">{client.name}</p>
                  <p className="mt-1 text-sm text-[#7e85b2]">{client.city}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[#9aa1c8]">
                    Cotizaciones
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#33407a]">{client.quotes}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[#9aa1c8]">
                    Ganadas
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#33407a]">{client.awarded}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[#9aa1c8]">
                    Facturado
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#33407a]">
                    {formatCurrency(client.revenue)}
                  </p>
                </div>
                <div className="md:text-right">
                  <button
                    className="inline-flex h-9 items-center justify-center rounded-xl border border-[#dde2f5] px-4 text-sm font-semibold text-[#5546ff]"
                    type="button"
                  >
                    Ver cliente
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </SupplierDashboardShell>
  );
}
