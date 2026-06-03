'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { getPrimaryCompanyName } from '@/lib/session';

const marketingNav = [
  { label: 'Inicio', href: '/' },
  { label: 'Cómo funciona', href: '/como-funciona' },
  { label: 'Proveedores', href: '/proveedores' },
  { label: 'Contacto', href: '/contacto' },
];

function AtarMark() {
  return (
    <div className="flex items-center gap-3">
      <Image
        alt="ATAR"
        className="h-10 w-10"
        height={40}
        src="/logoatar.png"
        width={40}
      />
      <p className="text-lg font-semibold tracking-tight text-slate-950">ATAR</p>
    </div>
  );
}

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { isHydrated, isAuthenticated, session, signOut, getDefaultPath } = useAuth();

  const inDashboard = pathname?.startsWith('/dashboard');
  const inAccess = pathname?.startsWith('/acceso');
  if (inDashboard || inAccess) {
    return null;
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-6 py-4 lg:px-10">
        <Link href="/" className="shrink-0">
          <AtarMark />
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-slate-600 lg:flex">
          {marketingNav.map((item) => {
            const isActive =
              (item.href === '/' && pathname === '/') ||
              (item.href !== '/' && item.href.startsWith('/') && pathname === item.href);

            return (
              <Link
                key={item.label}
                className={`inline-flex items-center gap-1 border-b-2 pb-1 transition ${
                  isActive
                    ? 'border-indigo-600 text-slate-950'
                    : 'border-transparent hover:border-slate-200 hover:text-slate-950'
                }`}
                href={item.href}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {!isHydrated ? (
            <div className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-500">
              Cargando
            </div>
          ) : isAuthenticated && session ? (
            <>
              <div className="hidden rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 md:inline-flex">
                {getPrimaryCompanyName(session.user)}
              </div>
              <button
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                onClick={() => router.push(getDefaultPath())}
                type="button"
              >
                Ir a mi panel
              </button>
              <button
                className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
                onClick={() => {
                  signOut();
                  router.push('/acceso');
                }}
                type="button"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link
                className="hidden rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:inline-flex"
                href="/acceso"
              >
                Iniciar sesión
              </Link>
              <Link
                className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
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
