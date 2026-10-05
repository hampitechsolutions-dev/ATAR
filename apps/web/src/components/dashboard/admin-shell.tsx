'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { clearSession, getUserFullName } from '@/lib/session';

const ADMIN_NAV = [{ label: 'Facturación', href: '/dashboard/admin/facturacion' }];

/**
 * Chrome del panel de administración de ATAR. Canvas sobrio (gris oscuro) para
 * diferenciarlo de los paneles de empresa (violeta/verde del marketplace).
 */
export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session } = useAuth();
  const userName = session ? getUserFullName(session.user) : 'Administración';

  function handleLogout() {
    clearSession();
    router.push('/acceso');
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#0b1120_0%,#111827_100%)] text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/admin/facturacion" className="flex items-center gap-2.5">
              <Image alt="ATAR" height={28} src="/logoatarblanco.png" width={28} />
              <span className="text-base font-bold tracking-tight">ATAR</span>
            </Link>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
              Administración
            </span>
          </div>

          <nav className="hidden items-center gap-1 text-sm sm:flex">
            {ADMIN_NAV.map((item) => {
              const active = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  className={`rounded-full px-3.5 py-1.5 font-medium transition ${
                    active ? 'bg-white text-slate-900' : 'text-white/75 hover:bg-white/10 hover:text-white'
                  }`}
                  href={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-white/70 md:inline">{userName}</span>
            <button
              className="rounded-full border border-white/20 px-3.5 py-1.5 text-sm font-semibold text-white/85 transition hover:bg-white/10"
              onClick={handleLogout}
              type="button"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8">{children}</div>
    </main>
  );
}
