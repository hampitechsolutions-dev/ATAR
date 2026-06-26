'use client';

import { useMemo } from 'react';
import { useBuyerDashboardData } from '@/lib/dashboard-hooks';

function formatRelative(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.floor(diff / 60000));
  if (minutes < 60) {
    return `Hace ${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `Hace ${hours} h`;
  }

  const days = Math.floor(hours / 24);
  return `Hace ${days} d`;
}

export default function BuyerNotificationsPage() {
  const { requests, loading, error } = useBuyerDashboardData();

  const notifications = useMemo(() => {
    return requests
      .slice()
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 12)
      .map((request) => {
        if (request.status === 'ORDER_ISSUED') {
          return {
            title: 'Pedido entregado',
            detail: request.title,
            tone: 'bg-emerald-500',
            time: formatRelative(request.updatedAt),
          };
        }

        if (request.status === 'NEGOTIATING') {
          return {
            title: 'Pedido en producción',
            detail: request.title,
            tone: 'bg-indigo-500',
            time: formatRelative(request.updatedAt),
          };
        }

        if ((request._count?.quotes ?? 0) > 0) {
          return {
            title: 'Nueva cotización disponible',
            detail: request.title,
            tone: 'bg-violet-500',
            time: formatRelative(request.updatedAt),
          };
        }

        return {
          title: 'Solicitud actualizada',
          detail: request.title,
          tone: 'bg-slate-400',
          time: formatRelative(request.updatedAt),
        };
      });
  }, [requests]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Notificaciones</h1>
        <p className="mt-1 text-sm text-slate-500">Seguimiento de actividad y novedades del comprador</p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="px-6 py-8 text-sm text-slate-500">Cargando notificaciones...</div>
        ) : notifications.length === 0 ? (
          <div className="px-6 py-10 text-sm text-slate-500">No hay notificaciones recientes.</div>
        ) : (
          <div className="divide-y divide-slate-200">
            {notifications.map((notification, index) => (
              <article key={`${notification.title}-${index}`} className="flex items-start gap-4 px-6 py-4">
                <span className={`mt-2 h-2.5 w-2.5 rounded-full ${notification.tone}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-950">{notification.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{notification.detail}</p>
                </div>
                <span className="text-xs text-slate-400">{notification.time}</span>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
