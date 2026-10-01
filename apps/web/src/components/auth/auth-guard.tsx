'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { DashboardLoader } from '@/components/ui/spinner';
import type { MembershipRole } from '@/lib/atar-api';
import { canAccessDashboard, getDefaultDashboardPath } from '@/lib/session';

export default function AuthGuard({
  children,
  allowedRole,
}: {
  children: React.ReactNode;
  allowedRole?: MembershipRole;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isHydrated, isAuthenticated, user, getDefaultPath } = useAuth();

  // El acceso se decide por lado del marketplace, no por rol exacto: los
  // usuarios HYBRID operan de los dos lados y los vendedores (SELLER) entran
  // al dashboard de proveedor de su empresa.
  const roleDenied = Boolean(allowedRole && user && !canAccessDashboard(user, allowedRole));
  const redirectPath = user ? getDefaultDashboardPath(user) : '/acceso';

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!isAuthenticated) {
      router.replace('/acceso');
      return;
    }

    if (roleDenied) {
      const destination = redirectPath || getDefaultPath();
      if (destination !== pathname) {
        router.replace(destination);
      }
    }
  }, [getDefaultPath, isAuthenticated, isHydrated, pathname, redirectPath, roleDenied, router]);

  if (!isHydrated || !isAuthenticated || roleDenied) {
    return <DashboardLoader />;
  }

  return <>{children}</>;
}
