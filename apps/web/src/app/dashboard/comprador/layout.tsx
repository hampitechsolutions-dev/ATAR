'use client';

import { usePathname } from 'next/navigation';
import AuthGuard from '@/components/auth/auth-guard';
import { useAuth } from '@/components/auth/auth-provider';
import AssistantFab from '@/components/dashboard/assistant-fab';
import BuyerBottomNav from '@/components/dashboard/buyer-bottom-nav';
import BuyerMarketplaceHeader from '@/components/dashboard/buyer-marketplace-header';

export default function BuyerDashboardLayout({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const pathname = usePathname();
  const isBuyerHome = pathname === '/dashboard/comprador';
  const isBuyerPanel = pathname?.startsWith('/dashboard/comprador/panel');
  const isBuyerMessages = pathname === '/dashboard/comprador/mensajes';
  const isBuyerWizard = pathname?.startsWith('/dashboard/comprador/solicitudes/nueva');
  const isBuyerRequestDetail =
    pathname?.startsWith('/dashboard/comprador/solicitudes/') && !pathname?.startsWith('/dashboard/comprador/solicitudes/nueva');
  const isFullBleed = isBuyerHome || isBuyerPanel;
  // El bottom nav mobile se muestra en las páginas "de navegación", no en las
  // que ya tienen su propia UI inferior (wizard) o layout full-height (chat).
  const showBottomNav = !isBuyerMessages && !isBuyerWizard && !isBuyerRequestDetail;

  return (
    <AuthGuard allowedRole="BUYER">
      <div
        className={`bg-[#f5f7fb] text-slate-950 ${
          isBuyerMessages ? 'flex h-[100dvh] flex-col overflow-hidden' : 'min-h-screen'
        }`}
      >
        <BuyerMarketplaceHeader session={session} />
        {isFullBleed ? (
          <div className={showBottomNav ? 'pb-[76px] lg:pb-0' : undefined}>{children}</div>
        ) : isBuyerMessages ? (
          <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
        ) : (
          <main
            className={
              isBuyerWizard || isBuyerRequestDetail
                ? 'mx-auto max-w-[1760px] px-3 py-3 lg:px-4 xl:px-6'
                : 'mx-auto max-w-[1320px] px-4 pt-4 pb-24 lg:pb-4'
            }
          >
            {children}
          </main>
        )}
        {showBottomNav ? <BuyerBottomNav /> : null}
        <AssistantFab />
      </div>
    </AuthGuard>
  );
}
