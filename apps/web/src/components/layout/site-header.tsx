'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { getPrimaryCompanyName } from '@/lib/session';

const marketingNav = [
  { label: 'Inicio', href: '/' },
  { label: 'Productos', href: '/productos' },
  { label: 'Proveedores', href: '/proveedores' },
  { label: 'Cómo funciona', href: '/como-funciona' },
];

function AtarMark() {
  return (
    <div className="flex items-center gap-2.5">
      <Image alt="ATAR" className="h-9 w-9" height={36} src="/logoatar.png" width={36} />
      <div className="leading-tight">
        <p className="text-lg font-bold tracking-tight text-slate-950">ATAR</p>
      </div>
    </div>
  );
}

function MenuIcon({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function CloseIcon({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { isHydrated, isAuthenticated, session, signOut, getDefaultPath } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  // Cierra el menú mobile al navegar.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const inDashboard = pathname?.startsWith('/dashboard');
  const inAccess = pathname?.startsWith('/acceso');
  if (inDashboard || inAccess) {
    return null;
  }

  const isActiveLink = (href: string) =>
    (href === '/' && pathname === '/') || (href !== '/' && pathname === href);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-10">
        <Link href="/" className="shrink-0">
          <AtarMark />
        </Link>

        {/* Navegación desktop */}
        <nav className="hidden items-center gap-8 text-sm text-slate-600 lg:flex">
          {marketingNav.map((item) => (
            <Link
              key={item.label}
              className={`inline-flex items-center gap-1 border-b-2 pb-1 transition ${
                isActiveLink(item.href)
                  ? 'border-indigo-600 text-slate-950'
                  : 'border-transparent hover:border-slate-200 hover:text-slate-950'
              }`}
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {!isHydrated ? (
            <div className="hidden rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-500 lg:block">
              Cargando
            </div>
          ) : isAuthenticated && session ? (
            <>
              <div className="hidden rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 xl:inline-flex">
                {getPrimaryCompanyName(session.user)}
              </div>
              <button
                className="hidden rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 lg:inline-flex"
                onClick={() => router.push(getDefaultPath())}
                type="button"
              >
                Ir a mi panel
              </button>
              <button
                className="hidden rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 lg:inline-flex"
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
                className="hidden rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 lg:inline-flex"
                href="/acceso"
              >
                Iniciar sesión
              </Link>
              <Link
                className="hidden rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 sm:inline-flex"
                href="/acceso"
              >
                Crear cuenta gratis
              </Link>
            </>
          )}

          {/* Botón hamburguesa (mobile/tablet) */}
          <button
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-50 lg:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            type="button"
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* Menú mobile: expande/colapsa con animación */}
      <div
        className={`grid bg-white transition-[grid-template-rows] duration-300 ease-out lg:hidden ${
          menuOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <nav
            className={`flex flex-col border-t border-slate-200 px-4 py-3 transition-all duration-300 ease-out sm:px-6 ${
              menuOpen ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0'
            }`}
          >
            {marketingNav.map((item) => (
              <Link
                key={item.label}
                className={`rounded-xl px-3 py-3 text-sm font-medium transition ${
                  isActiveLink(item.href)
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
                href={item.href}
              >
                {item.label}
              </Link>
            ))}

            <div className="mt-3 flex flex-col gap-2 border-t border-slate-200 pt-4">
              {!isHydrated ? null : isAuthenticated && session ? (
                <>
                  <div className="px-3 text-sm text-slate-500">{getPrimaryCompanyName(session.user)}</div>
                  <button
                    className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    onClick={() => router.push(getDefaultPath())}
                    type="button"
                  >
                    Ir a mi panel
                  </button>
                  <button
                    className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
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
                    className="rounded-xl border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    href="/acceso"
                  >
                    Iniciar sesión
                  </Link>
                  <Link
                    className="rounded-xl bg-indigo-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-indigo-500"
                    href="/acceso"
                  >
                    Crear cuenta gratis
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
