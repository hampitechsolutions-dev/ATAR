'use client';

import { useParams, useRouter } from 'next/navigation';
import ConversationPanel from '@/components/chat/conversation-panel';
import SupplierDashboardShell from '@/components/dashboard/supplier-dashboard-shell';
import { useSupplierDashboardData } from '@/lib/dashboard-hooks';

export default function SupplierConversationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { session } = useSupplierDashboardData();
  const conversationId = typeof params.id === 'string' ? params.id : undefined;

  return (
    <SupplierDashboardShell fullBleed session={session}>
      <div className="flex h-full min-h-0 flex-col">
        {/* Barra de retorno (mobile) */}
        <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-3 py-2 lg:hidden">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Volver"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-700"
          >
            <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          </button>
          <p className="text-sm font-semibold text-slate-950">Conversación</p>
        </div>

        <div className="min-h-0 flex-1">
          <ConversationPanel
            conversationId={conversationId}
            mode="existing"
            session={session}
            title="Conversación activa"
          />
        </div>
      </div>
    </SupplierDashboardShell>
  );
}
