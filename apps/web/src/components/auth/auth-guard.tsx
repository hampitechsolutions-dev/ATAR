'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import type { MembershipRole } from '@/lib/atar-api';

export default function AuthGuard({
  children,
  allowedRole,
}: {
  children: React.ReactNode;
  allowedRole?: MembershipRole;
}) {
  const router = useRouter();
  const { isHydrated, isAuthenticated, role, isHybrid, getDefaultPath } = useAuth();

  // Los usuarios HYBRID pueden operar como comprador y proveedor, así que no se
  // bloquean por rol en ninguno de los dos dashboards.
  const roleDenied = Boolean(allowedRole && role && role !== allowedRole && !isHybrid);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!isAuthenticated) {
      router.replace('/acceso');
      return;
    }

    if (roleDenied) {
      router.replace(getDefaultPath());
    }
  }, [getDefaultPath, isAuthenticated, isHydrated, roleDenied, router]);

  if (!isHydrated || !isAuthenticated || roleDenied) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-950">
        <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-5 shadow-sm">
          Cargando sesion...
        </div>
      </main>
    );
  }

  return <>{children}</>;
}