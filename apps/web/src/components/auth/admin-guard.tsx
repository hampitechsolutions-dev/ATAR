'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { DashboardLoader } from '@/components/ui/spinner';
import { getDefaultDashboardPath, isPlatformAdmin } from '@/lib/session';

/**
 * Protege el panel de administración de ATAR: solo entra un usuario con una
 * membresía de rol ADMIN. Cualquier otro vuelve a su propio dashboard. El
 * backend igual valida cada endpoint (isPlatformAdmin); esto es solo UX.
 */
export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isHydrated, isAuthenticated, user } = useAuth();

  const denied = Boolean(user && !isPlatformAdmin(user));
  const redirectPath = user ? getDefaultDashboardPath(user) : '/acceso';

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    if (!isAuthenticated) {
      router.replace('/acceso');
      return;
    }
    if (denied && redirectPath !== pathname) {
      router.replace(redirectPath);
    }
  }, [denied, isAuthenticated, isHydrated, pathname, redirectPath, router]);

  if (!isHydrated || !isAuthenticated || denied) {
    return <DashboardLoader label="Verificando acceso…" />;
  }

  return <>{children}</>;
}
