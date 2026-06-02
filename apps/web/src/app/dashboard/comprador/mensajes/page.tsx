'use client';

import { useEffect, useMemo, useState } from 'react';
import DashboardSidebar from '@/components/dashboard/dashboard-sidebar';
import { atarApi, type RequestEventRecord } from '@/lib/atar-api';
import { useBuyerDashboardData } from '@/lib/dashboard-hooks';

type InboxItem = RequestEventRecord & {
  requestId: string;
  requestTitle: string;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function BuyerMessagesPage() {
  const { session, requests, loading, error } = useBuyerDashboardData();
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [loadingInbox, setLoadingInbox] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadInbox() {
      if (!session?.accessToken || requests.length === 0) {
        setInbox([]);
        return;
      }

      try {
        setLoadingInbox(true);
        const details = await Promise.all(
          requests.slice(0, 12).map((request) =>
            atarApi.getRequestDetail(request.id, session.accessToken),
          ),
        );

        if (cancelled) {
          return;
        }

        const items = details.flatMap((request) =>
          (request.events ?? []).map((event) => ({
            ...event,
            requestId: request.id,
            requestTitle: request.title,
          })),
        );

        items.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

        setInbox(items);
      } finally {
        if (!cancelled) {
          setLoadingInbox(false);
        }
      }
    }

    void loadInbox();

    return () => {
      cancelled = true;
    };
  }, [requests, session?.accessToken]);

  const supplierItems = useMemo(() => {
    return inbox.filter((item) => item.actorRole === 'SUPPLIER');
  }, [inbox]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[0.2fr_0.8fr] lg:px-10">
        <DashboardSidebar role="buyer" session={session} />

        <section className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Inbox operacional</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Mensajes
            </h1>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Consolida eventos y avances emitidos por proveedores y por tu propio equipo
              sobre las solicitudes activas.
            </p>
          </div>

          {error ? (
            <div className="rounded-[1.5rem] bg-rose-100 px-5 py-4 text-sm text-rose-800">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Eventos relevados</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{inbox.length}</p>
            </article>
            <article className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Mensajes de proveedores</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">
                {supplierItems.length}
              </p>
            </article>
            <article className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Solicitudes monitoreadas</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{requests.length}</p>
            </article>
          </div>

          <div className="space-y-4">
            {loading || loadingInbox ? (
              <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-8 text-sm text-slate-500 shadow-sm">
                Cargando inbox...
              </div>
            ) : inbox.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white px-6 py-10 text-sm text-slate-500 shadow-sm">
                No hay eventos para mostrar todavia.
              </div>
            ) : (
              inbox.map((item) => (
                <article
                  key={`${item.requestId}-${item.id}`}
                  className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        {item.requestTitle}
                      </p>
                      <h2 className="mt-2 text-lg font-semibold text-slate-950">
                        {item.title}
                      </h2>
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        {item.detail ?? 'Sin detalle adicional.'}
                      </p>
                    </div>
                    <div className="text-sm text-slate-500">
                      <p>{item.actorCompanyName ?? 'Sistema ATAR'}</p>
                      <p className="mt-1">{formatDateTime(item.createdAt)}</p>
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
