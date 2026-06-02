'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { getPrimaryCompanyName } from '@/lib/session';

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { isHydrated, isAuthenticated, session, signOut, getDefaultPath } = useAuth();

  const inDashboard = pathname?.startsWith('/dashboard');
  if (inDashboard) {
    return null;
  }

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/75 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        <Link className="flex items-center gap-3" href="/">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-violet-500 text-lg font-bold text-white">
            A
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight text-white">ATAR</p>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Marketplace Industrial</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-slate-300 lg:flex">
          <Link className="transition hover:text-white" href="/proveedores">
            Proveedores
          </Link>
          <Link className="transition hover:text-white" href="/acceso">
            Acceso
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {!isHydrated ? (
            <div className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-400">Cargando</div>
          ) : isAuthenticated && session ? (
            <>
              <div className="hidden rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 md:inline-flex">
                {getPrimaryCompanyName(session.user)}
              </div>
              <button
                className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/30 hover:text-white"
                onClick={() => router.push(getDefaultPath())}
                type="button"
              >
                Ir a mi panel
              </button>
              <button
                className="rounded-full bg-gradient-to-r from-sky-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                onClick={() => {
                  signOut();
                  router.push('/acceso');
                }}
                type="button"
              >
                Cerrar sesion
              </button>
            </>
          ) : (
            <>
              <Link
                className="hidden rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/30 hover:text-white sm:inline-flex"
                href="/acceso"
              >
                Iniciar sesion
              </Link>
              <Link
                className="rounded-full bg-gradient-to-r from-sky-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                href="/acceso"
              >
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}