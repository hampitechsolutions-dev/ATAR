'use client';

import { usePathname } from 'next/navigation';
import AuthGuard from '@/components/auth/auth-guard';
import { useAuth } from '@/components/auth/auth-provider';
import BuyerMarketplaceHeader from '@/components/dashboard/buyer-marketplace-header';

export default function BuyerDashboardLayout({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const pathname = usePathname();
  const isBuyerHome = pathname === '/dashboard/comprador';
  const isBuyerWizard = pathname?.startsWith('/dashboard/comprador/solicitudes/nueva');
  const isBuyerRequestDetail =
    pathname?.startsWith('/dashboard/comprador/solicitudes/') && !pathname?.startsWith('/dashboard/comprador/solicitudes/nueva');

  return (
    <AuthGuard allowedRole="BUYER">
      <div className="min-h-screen bg-[#f5f7fb] text-slate-950">
        <BuyerMarketplaceHeader session={session} />
        {isBuyerHome ? (
          <div>{children}</div>
        ) : (
          <main
            className={
              isBuyerWizard || isBuyerRequestDetail
                ? 'mx-auto max-w-[1760px] px-3 py-3 lg:px-4 xl:px-6'
                : 'mx-auto max-w-[1320px] px-4 py-4'
            }
          >
            {children}
          </main>
        )}
      </div>
    </AuthGuard>
  );
}
