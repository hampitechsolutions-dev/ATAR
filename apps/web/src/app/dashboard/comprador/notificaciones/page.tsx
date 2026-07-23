'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import PushOptIn from '@/components/notifications/push-opt-in';
import { atarApi, type NotificationRecord } from '@/lib/atar-api';
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

function getTone(type: NotificationRecord['type']) {
  switch (type) {
    case 'QUOTE_SUBMITTED':
    case 'QUOTE_UPDATED':
      return 'bg-violet-500';
    case 'QUOTE_AWARDED':
    case 'ORDER_ISSUED':
      return 'bg-emerald-500';
    case 'FULFILLMENT_UPDATED':
      return 'bg-sky-500';
    case 'NEW_MESSAGE':
      return 'bg-amber-500';
    default:
      return 'bg-slate-400';
  }
}

export default function BuyerNotificationsPage() {
  const { session, loading: dashboardLoading, error: dashboardError } = useBuyerDashboardData();
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.accessToken) {
      return;
    }
    const accessToken = session.accessToken;

    let cancelled = false;

    async function loadNotifications() {
      try {
        setLoading(true);
        setError(null);
        const response = await atarApi.getNotifications({ limit: 30 }, accessToken);
        if (!cancelled) {
          setNotifications(response.items);
          setUnreadCount(response.unreadCount);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : 'No se pudieron cargar las notificaciones.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadNotifications();

    return () => {
      cancelled = true;
    };
  }, [session?.accessToken]);

  const visibleError = error ?? dashboardError;
  const hasUnread = unreadCount > 0;

  const summary = useMemo(
    () => ({
      total: notifications.length,
      unread: unreadCount,
      messages: notifications.filter((item) => item.type === 'NEW_MESSAGE').length,
    }),
    [notifications, unreadCount],
  );

  async function markAllAsRead() {
    if (!session?.accessToken || !hasUnread) {
      return;
    }
    const accessToken = session.accessToken;

    try {
      setError(null);
      const response = await atarApi.markAllNotificationsRead(accessToken);
      setNotifications(response.items);
      setUnreadCount(response.unreadCount);
    } catch (markError) {
      setError(markError instanceof Error ? markError.message : 'No se pudieron actualizar las notificaciones.');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Notificaciones</h1>
          <p className="mt-1 text-sm text-slate-500">
            Actividad comercial real del comprador: cotizaciones, mensajes y avances operativos.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
            {summary.total} recientes
          </div>
          <div className="rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700">
            {summary.unread} sin leer
          </div>
          <div className="rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
            {summary.messages} mensajes
          </div>
          <button
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!hasUnread}
            onClick={() => void markAllAsRead()}
            type="button"
          >
            Marcar todo como leido
          </button>
        </div>
      </div>

      <PushOptIn />

      {visibleError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {visibleError}
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {dashboardLoading || loading ? (
          <div className="px-6 py-8 text-sm text-slate-500">Cargando notificaciones...</div>
        ) : notifications.length === 0 ? (
          <div className="px-6 py-10 text-sm text-slate-500">No hay notificaciones recientes.</div>
        ) : (
          <div className="divide-y divide-slate-200">
            {notifications.map((notification) => (
              <article
                key={notification.id}
                className={`flex items-start gap-4 px-6 py-4 ${notification.readAt ? 'bg-white' : 'bg-indigo-50/40'}`}
              >
                <span className={`mt-2 h-2.5 w-2.5 rounded-full ${getTone(notification.type)}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-950">{notification.title}</p>
                    {notification.readAt ? (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Leida
                      </span>
                    ) : (
                      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-700">
                        Nueva
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {notification.detail ?? 'Nueva novedad comercial disponible.'}
                  </p>
                  {notification.href ? (
                    <Link className="mt-3 inline-flex text-sm font-semibold text-indigo-700 hover:text-indigo-800" href={notification.href}>
                      Ver detalle
                    </Link>
                  ) : null}
                </div>
                <span className="text-xs text-slate-400">{formatRelative(notification.createdAt)}</span>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
