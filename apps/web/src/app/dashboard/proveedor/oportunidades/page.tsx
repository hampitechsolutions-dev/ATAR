'use client';

import { useMemo, useState } from 'react';
import DashboardSidebar from '@/components/dashboard/dashboard-sidebar';
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
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[0.22fr_0.78fr] lg:px-10">
        <DashboardSidebar role="supplier" session={session} />

        <section className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Pipeline comercial</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Oportunidades
            </h1>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Revisa las oportunidades abiertas del marketplace y vuelve al inicio para
              cotizar sobre la seleccionada.
            </p>
            <input
              className="mt-6 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-400"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por comprador, categoria o descripcion"
              value={search}
            />
          </div>

          {error ? (
            <div className="rounded-[1.5rem] bg-rose-100 px-5 py-4 text-sm text-rose-800">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4">
            {loading ? (
              <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-8 text-sm text-slate-500 shadow-sm">
                Cargando oportunidades...
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white px-6 py-10 text-sm text-slate-500 shadow-sm">
                No hay oportunidades que coincidan con tu busqueda.
              </div>
            ) : (
              filteredRequests.map((request) => (
                <article
                  key={request.id}
                  className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
                >
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
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
