'use client';

import { useParams } from 'next/navigation';
import ConversationPanel from '@/components/chat/conversation-panel';
import { DashboardHero, DashboardShell } from '@/components/dashboard/dashboard-ui';
import { useBuyerDashboardData } from '@/lib/dashboard-hooks';

export default function BuyerConversationDetailPage() {
  const params = useParams<{ id: string }>();
  const { session, error } = useBuyerDashboardData();

  return (
    <DashboardShell role="buyer" session={session}>
      <DashboardHero
        description="Retoma la conversación, busca mensajes anteriores y comparte archivos dentro del contexto comercial correspondiente."
        eyebrow="Detalle de conversacion"
        title={
          <>
            Chat y <span className="text-indigo-600">seguimiento</span>
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
