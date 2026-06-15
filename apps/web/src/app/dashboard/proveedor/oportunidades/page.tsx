'use client';

import { useMemo, useState } from 'react';
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardHero,
  DashboardShell,
  dashboardInputClassName,
} from '@/components/dashboard/dashboard-ui';
import { useSupplierDashboardData } from '@/lib/dashboard-hooks';

function formatDate(value: string | null) {
  if (!value) {
    return 'Sin fecha';
  }

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

export default function SupplierOpportunitiesPage() {
  const { session, openRequests, loading, error } = useSupplierDashboardData();
  const [search, setSearch] = useState('');

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();
    return openRequests.filter((request) => {
      if (query.length === 0) {
        return true;
      }

      return (
        request.title.toLowerCase().includes(query) ||
        request.category.toLowerCase().includes(query) ||
        request.description.toLowerCase().includes(query) ||
        request.buyerCompany?.name?.toLowerCase().includes(query)
      );
    });
  }, [openRequests, search]);

  return (
    <DashboardShell role="supplier" session={session}>
      <DashboardHero
        description="Explora oportunidades abiertas del marketplace, filtra por comprador o categoria y vuelve al dashboard principal para cotizar la seleccionada."
        eyebrow="Pipeline comercial"
        title={
          <>
            Oportunidades y <span className="text-indigo-600">mercado activo</span>
          </>
        }
      />

      <DashboardCard>
        <input
          className={dashboardInputClassName}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por comprador, categoria o descripcion"
          value={search}
        />
      </DashboardCard>

      {error ? (
        <div className="rounded-[1.5rem] bg-rose-100 px-5 py-4 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4">
        {loading ? (
          <DashboardEmptyState
            description="Estamos relevando nuevas oportunidades."
            title="Cargando oportunidades..."
          />
        ) : filteredRequests.length === 0 ? (
          <DashboardEmptyState
            description="No hay oportunidades que coincidan con tu busqueda."
            title="Sin resultados"
          />
        ) : (
          filteredRequests.map((request) => (
            <DashboardCard key={request.id}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    {request.category}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-950">
                    {request.title}
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    {request.description}
                  </p>
                </div>
                <div className="rounded-[1.5rem] bg-slate-50 p-4 text-sm text-slate-600">
                  <p>
                    Comprador:{' '}
                    <span className="font-semibold text-slate-950">
                      {request.buyerCompany?.name ?? 'No informado'}
                    </span>
                  </p>
                  <p className="mt-1">
                    Fecha limite:{' '}
                    <span className="font-semibold text-slate-950">
                      {formatDate(request.dueDate)}
                    </span>
                  </p>
                  <p className="mt-1">
                    Estado:{' '}
                    <span className="font-semibold text-slate-950">
                      {request.status}
                    </span>
                  </p>
                </div>
              </div>
            </DashboardCard>
          ))
        )}
      </div>
    </DashboardShell>
  );
}
