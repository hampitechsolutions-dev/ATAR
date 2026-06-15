'use client';

import ConversationsInbox from '@/components/chat/conversations-inbox';
import { DashboardHero, DashboardShell } from '@/components/dashboard/dashboard-ui';
import { useSupplierDashboardData } from '@/lib/dashboard-hooks';

export default function SupplierMessagesPage() {
  const { session, error } = useSupplierDashboardData();

  return (
    <DashboardShell role="supplier" session={session}>
      <DashboardHero
        description="Retoma conversaciones activas con compradores, filtra por contexto y mantén visible el historial operativo sin salir del dashboard."
        eyebrow="Mensajeria interna"
        title={
          <>
            Conversaciones y <span className="text-indigo-600">respuesta comercial</span>
          </>
        }
      />

      {error ? (
        <div className="rounded-[1.5rem] bg-rose-100 px-5 py-4 text-sm text-rose-800">{error}</div>
      ) : null}

      <ConversationsInbox rolePath="proveedor" session={session} />
    </DashboardShell>
  );
}
