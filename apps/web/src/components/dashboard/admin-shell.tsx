'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { clearSession, getUserFullName } from '@/lib/session';

type AdminIconName = 'wallet' | 'factory' | 'cart' | 'gear';

const ADMIN_NAV: { label: string; href: string; icon: AdminIconName }[] = [
  { label: 'Facturación', href: '/dashboard/admin/facturacion', icon: 'wallet' },
  { label: 'Proveedores', href: '/dashboard/admin/proveedores', icon: 'factory' },
  { label: 'Compradores', href: '/dashboard/admin/compradores', icon: 'cart' },
  { label: 'Administración', href: '/dashboard/admin/administracion', icon: 'gear' },
];

function AdminIcon({ name }: { name: AdminIconName }) {
  const p = {
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };
  if (name === 'wallet') {
    return (
      <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
        <path d="M3 7a2 2 0 012-2h12a2 2 0 012 2v1" {...p} />
        <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2v-6a2 2 0 00-2-2H5" {...p} />
        <path d="M16 13h.01" {...p} strokeWidth={3} />
      </svg>
    );
  }
  if (name === 'factory') {
    return (
      <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
        <path d="M3 21V10l7 4V10l7 4V3h4v18H3z" {...p} />
      </svg>
    );
  }
  if (name === 'cart') {
    return (
      <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
        <path d="M3 3h2l2.4 12.3a2 2 0 002 1.7h7.7a2 2 0 002-1.6L21 8H6" {...p} />
        <circle cx="10" cy="20" r="1" {...p} strokeWidth={2.5} />
        <circle cx="18" cy="20" r="1" {...p} strokeWidth={2.5} />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3" {...p} />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.2.61.76 1.05 1.42 1.05H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" {...p} />
    </svg>
  );
}

/**
 * Chrome del panel de administración de ATAR con sidebar. Canvas sobrio para
 * diferenciarlo de los paneles de empresa (violeta/verde del marketplace).
 */
export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session } = useAuth();
  const userName = session ? getUserFullName(session.user) : 'Administración';
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  function handleLogout() {
    clearSession();
    router.push('/acceso');
  }

  const isActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`);

  const nav = (
    <nav className="flex-1 space-y-1 px-3">
      {ADMIN_NAV.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
              active ? 'bg-white text-slate-900 font-semibold shadow' : 'text-white/75 hover:bg-white/10 hover:text-white'
            }`}
            href={item.href}
          >
            <span className={active ? 'text-indigo-600' : 'text-white/60'}>
              <AdminIcon name={item.icon} />
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const sidebarInner = (
    <div className="flex h-full flex-col py-5">
      <div className="flex items-center gap-2.5 px-5 pb-5">
        <Image alt="ATAR" height={28} src="/logoatarblanco.png" width={28} />
        <div className="leading-tight">
          <p className="text-base font-bold tracking-tight">ATAR</p>
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/50">Administración</p>
        </div>
      </div>
      {nav}
      <div className="mt-4 border-t border-white/10 px-5 pt-4">
        <p className="truncate text-sm font-semibold">{userName}</p>
        <button
          className="mt-2 text-xs font-semibold text-white/60 transition hover:text-white"
          onClick={handleLogout}
          type="button"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#0b1120_0%,#111827_100%)] text-white">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-white/10 bg-slate-950/60 lg:block">
        {sidebarInner}
      </aside>

      {/* Top bar mobile */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-slate-950/80 px-4 py-3 backdrop-blur lg:hidden">
        <Link href="/dashboard/admin/facturacion" className="flex items-center gap-2">
          <Image alt="ATAR" height={24} src="/logoatarblanco.png" width={24} />
          <span className="text-sm font-bold">ATAR · Admin</span>
        </Link>
        <button
          aria-label="Abrir menú"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/20"
          onClick={() => setMenuOpen(true)}
          type="button"
        >
          <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
          </svg>
        </button>
      </header>

      {/* Drawer mobile */}
      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-slate-950/60" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 bg-slate-950">{sidebarInner}</div>
        </div>
      ) : null}

      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
