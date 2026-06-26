'use client';

import { useParams } from 'next/navigation';
import ConversationPanel from '@/components/chat/conversation-panel';
import { DashboardHero, DashboardShell } from '@/components/dashboard/dashboard-ui';
import { useSupplierDashboardData } from '@/lib/dashboard-hooks';

export default function SupplierConversationDetailPage() {
  const params = useParams<{ id: string }>();
  const { session, error } = useSupplierDashboardData();

  return (
    <DashboardShell role="supplier" session={session}>
      <DashboardHero
        description="Gestiona la conversación con el comprador, adjunta archivos y mantén la trazabilidad de cada intercambio."
        eyebrow="Detalle de conversacion"
        title={
          <>
            Chat y <span className="text-indigo-600">contexto comercial</span>
          </>
        }
      />

      {error ? (
        <div className="rounded-[1.5rem] bg-rose-100 px-5 py-4 text-sm text-rose-800">{error}</div>
      ) : null}

      <ConversationPanel
        conversationId={typeof params.id === 'string' ? params.id : undefined}
        mode="existing"
        session={session}
        title="Conversacion activa"
      />
    </DashboardShell>
  );
}
