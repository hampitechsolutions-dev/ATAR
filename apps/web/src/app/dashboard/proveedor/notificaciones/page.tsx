'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import SupplierDashboardShell from '@/components/dashboard/supplier-dashboard-shell';
import { atarApi, type NotificationRecord } from '@/lib/atar-api';
import {
  SUPPLIER_COUNTERS_REFRESH_EVENT,
  useSupplierDashboardData,
} from '@/lib/dashboard-hooks';

function formatRelative(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.round(diff / (1000 * 60)));

  if (minutes < 60) {
    return `Hace ${minutes} min`;
  }

  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `Hace ${hours} h`;
  }

  return `Hace ${Math.round(hours / 24)} d`;
}

export default function SupplierNotificationsPage() {
  const { session, loading: dashboardLoading, error: dashboardError } = useSupplierDashboardData();
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
        const nextResponse =
          response.unreadCount > 0
            ? await atarApi.markAllNotificationsRead(accessToken)
            : response;

        if (!cancelled) {
          setNotifications(nextResponse.items);
          setUnreadCount(nextResponse.unreadCount);
          if (response.unreadCount > 0) {
            window.dispatchEvent(new Event(SUPPLIER_COUNTERS_REFRESH_EVENT));
          }
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

  const summary = useMemo(
    () => ({
      total: notifications.length,
      unread: unreadCount,
      awards: notifications.filter((item) => item.type === 'QUOTE_AWARDED').length,
    }),
    [notifications, unreadCount],
  );

  async function markAllAsRead() {
    if (!session?.accessToken || unreadCount === 0) {
      return;
    }
    const accessToken = session.accessToken;

    try {
      setError(null);
      const response = await atarApi.markAllNotificationsRead(accessToken);
      setNotifications(response.items);
      setUnreadCount(response.unreadCount);
      window.dispatchEvent(new Event(SUPPLIER_COUNTERS_REFRESH_EVENT));
    } catch (markError) {
      setError(markError instanceof Error ? markError.message : 'No se pudieron marcar las notificaciones.');
    }
  }

  return (
    <SupplierDashboardShell searchPlaceholder="Buscar alertas o novedades..." session={session}>
      <section className="space-y-4">
        <div className="rounded-[24px] border border-[#e7eaf3] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-[32px] font-semibold tracking-[-0.03em] text-[#1f2373]">
                Notificaciones
              </h1>
              <p className="mt-1 text-sm text-[#7e85b2]">
                Alertas persistentes para mensajes, adjudicaciones, negociaciones y ordenes.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="rounded-full bg-[#f4f6ff] px-4 py-2 text-sm font-semibold text-[#33407a]">
                {summary.total} recientes
              </div>
              <div className="rounded-full bg-[#ede9ff] px-4 py-2 text-sm font-semibold text-[#5b4bff]">
                {summary.unread} sin leer
              </div>
              <div className="rounded-full bg-[#ecfdf3] px-4 py-2 text-sm font-semibold text-[#0f9f6e]">
                {summary.awards} adjudicadas
              </div>
              <button
                className="rounded-full border border-[#dbe2f7] bg-white px-4 py-2 text-sm font-semibold text-[#33407a] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={unreadCount === 0}
                onClick={() => void markAllAsRead()}
                type="button"
              >
                Marcar todo como leido
              </button>
            </div>
          </div>
        </div>

        {error ?? dashboardError ? (
          <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {error ?? dashboardError}
          </div>
        ) : null}

        <div className="rounded-[24px] border border-[#e7eaf3] bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
          {dashboardLoading || loading ? (
            <div className="rounded-[18px] bg-[#fbfbff] px-4 py-8 text-sm text-[#8d95be]">
              Cargando notificaciones...
            </div>
          ) : notifications.length === 0 ? (
            <div className="rounded-[18px] border border-dashed border-[#d8ddee] bg-[#fbfbff] px-4 py-8 text-sm text-[#8d95be]">
              No hay novedades recientes para mostrar.
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <article
                  key={notification.id}
                  className={`flex items-start gap-4 rounded-[20px] border px-4 py-4 ${
                    notification.readAt
                      ? 'border-[#edf0fb] bg-[#fbfbff]'
                      : 'border-[#dcd7ff] bg-[#f5f3ff]'
                  }`}
                >
                  <div className="mt-1 h-3 w-3 rounded-full bg-[#5b4bff]" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[#33407a]">{notification.title}</p>
                      <span className="text-xs text-[#9aa1c8]">
                        {formatRelative(notification.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[#6a729d]">
                      {notification.detail ?? 'Nueva novedad comercial disponible.'}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {notification.readAt ? (
                        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94a0c7]">
                          Leida
                        </span>
                      ) : (
                        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5b4bff]">
                          Nueva
                        </span>
                      )}
                      {notification.href ? (
                        <Link className="text-sm font-semibold text-[#4a3df0] hover:text-[#3d31d6]" href={notification.href}>
                          Ver detalle
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </SupplierDashboardShell>
  );
}
