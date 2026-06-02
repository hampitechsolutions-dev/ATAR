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
  const { isHydrated, isAuthenticated, role, getDefaultPath } = useAuth();

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!isAuthenticated) {
      router.replace('/acceso');
      return;
    }

    if (allowedRole && role && role !== allowedRole) {
      router.replace(getDefaultPath());
    }
  }, [allowedRole, getDefaultPath, isAuthenticated, isHydrated, role, router]);

  if (!isHydrated || !isAuthenticated || (allowedRole && role && role !== allowedRole)) {
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