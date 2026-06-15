'use client';

import ConversationsInbox from '@/components/chat/conversations-inbox';
import {
  DashboardHero,
  DashboardShell,
} from '@/components/dashboard/dashboard-ui';
import { useBuyerDashboardData } from '@/lib/dashboard-hooks';

export default function BuyerMessagesPage() {
  const { session, error } = useBuyerDashboardData();

  return (
    <DashboardShell role="buyer" session={session}>
      <DashboardHero
        description="Busca, filtra y retoma conversaciones persistentes vinculadas a productos y cotizaciones, con sincronizacion automatica dentro de la plataforma."
        eyebrow="Mensajeria interna"
        title={
          <>
            Conversaciones y <span className="text-indigo-600">seguimiento directo</span>
          </>
        }
      />

      {error ? (
        <div className="rounded-[1.5rem] bg-rose-100 px-5 py-4 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      <ConversationsInbox rolePath="comprador" session={session} />
    </DashboardShell>
  );
}
