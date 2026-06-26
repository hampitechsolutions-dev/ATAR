'use client';

import { useMemo } from 'react';
import SupplierDashboardShell from '@/components/dashboard/supplier-dashboard-shell';
import { useSupplierDashboardData } from '@/lib/dashboard-hooks';

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
  const { session, myQuotes, openRequests, loading, error } = useSupplierDashboardData();

  const notifications = useMemo(() => {
    const quoteNotifications = myQuotes.map((quote) => ({
      id: `quote-${quote.id}`,
      title:
        quote.status === 'AWARDED'
          ? 'Cotizacion adjudicada'
          : quote.status === 'REJECTED'
            ? 'Cotizacion rechazada'
            : 'Cotizacion actualizada',
      description: quote.request?.title ?? 'Movimiento comercial reciente',
      timestamp: quote.updatedAt,
    }));

    const requestNotifications = openRequests.slice(0, 6).map((request) => ({
      id: `request-${request.id}`,
      title: 'Nueva solicitud disponible',
      description: request.title,
      timestamp: request.updatedAt,
    }));

    return [...quoteNotifications, ...requestNotifications].sort(
      (left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
    );
  }, [myQuotes, openRequests]);

  return (
    <SupplierDashboardShell searchPlaceholder="Buscar alertas o novedades..." session={session}>
      <section className="space-y-4">
        <div className="rounded-[24px] border border-[#e7eaf3] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
          <h1 className="text-[32px] font-semibold tracking-[-0.03em] text-[#1f2373]">
            Notificaciones
          </h1>
          <p className="mt-1 text-sm text-[#7e85b2]">
            Visualiza eventos clave de solicitudes, cotizaciones y pedidos.
          </p>
        </div>

        {error ? (
          <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="rounded-[24px] border border-[#e7eaf3] bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
          {loading ? (
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
                  className="flex items-start gap-4 rounded-[20px] border border-[#edf0fb] bg-[#fbfbff] px-4 py-4"
                >
                  <div className="mt-1 h-3 w-3 rounded-full bg-[#5b4bff]" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[#33407a]">{notification.title}</p>
                      <span className="text-xs text-[#9aa1c8]">
                        {formatRelative(notification.timestamp)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[#6a729d]">{notification.description}</p>
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
