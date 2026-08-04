'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { clearSession, type WebSession } from '@/lib/session';
import WorkspaceSwitcher from './workspace-switcher';

type NavItem = {
  label: string;
  href: string;
};

function Icon({
  name,
}: {
  name: 'bell' | 'msg' | 'chev-down' | 'chev-right';
}) {
  const cls = 'h-4 w-4';

  if (name === 'chev-down') {
    return (
      <svg aria-hidden="true" className={cls} fill="none" viewBox="0 0 24 24">
        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }

  if (name === 'chev-right') {
    return (
      <svg aria-hidden="true" className={cls} fill="none" viewBox="0 0 24 24">
        <path d="M9 18l6-6-6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }

  if (name === 'msg') {
    return (
      <svg aria-hidden="true" className={cls} fill="none" viewBox="0 0 24 24">
        <path d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4v8z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className={cls} fill="none" viewBox="0 0 24 24">
      <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

export default function BuyerMarketplaceHeader({
  session,
  notificationCount = 1,
}: {
  session: WebSession | null;
  notificationCount?: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const productsRef = useRef<HTMLDivElement | null>(null);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isAccountOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!accountRef.current?.contains(event.target as Node)) {
        setIsAccountOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsAccountOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isAccountOpen]);

  function handleLogout() {
    clearSession();
    setIsAccountOpen(false);
    router.push('/acceso');
  }

  useEffect(() => {
    if (!isProductsOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!productsRef.current?.contains(event.target as Node)) {
        setIsProductsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsProductsOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isProductsOpen]);

  const profileName = useMemo(() => {
    return `${session?.user.firstName ?? 'Martin'} ${session?.user.lastName ?? 'Rodriguez'}`.trim();
  }, [session]);

  const profileCompany = useMemo(() => {
    return session?.user.memberships?.[0]?.company?.name ?? 'Textiles del Sur S.A.';
  }, [session]);

  const profileInitials = useMemo(() => {
    const initials = profileName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
    return initials || 'MR';
  }, [profileName]);

  const navItems: NavItem[] = useMemo(() => {
    return [
      { label: 'Inicio', href: '/dashboard/comprador' },
      { label: 'Proveedores', href: '/dashboard/comprador/proveedores' },
      { label: 'Mis solicitudes', href: '/dashboard/comprador/solicitudes' },
      { label: 'Mis pedidos', href: '/dashboard/comprador/pedidos' },
    ];
  }, []);

  return (
    <header className="hidden border-b border-slate-200 bg-white lg:block">
      <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-5 px-4 py-2.5">
        <div className="flex items-center gap-3">
          <Image alt="ATAR" height={26} src="/logoatar.png" width={26} />
          <div className="leading-tight">
            <p className="text-sm font-bold text-slate-950">ATAR</p>
          </div>
        </div>

        <nav className="hidden items-center gap-5 text-[13px] font-semibold text-slate-600 lg:flex">
          <Link
            className={pathname === '/dashboard/comprador' ? 'relative text-slate-950' : 'hover:text-slate-950'}
            href="/dashboard/comprador"
          >
            Inicio
            {pathname === '/dashboard/comprador' ? (
              <span className="absolute -bottom-[11px] left-0 h-[2px] w-full rounded-full bg-[#4f46ff]" />
            ) : null}
          </Link>

          <Link
            className={
              pathname?.startsWith('/dashboard/comprador/panel')
                ? 'relative text-slate-950'
                : 'hover:text-slate-950'
            }
            href="/dashboard/comprador/panel"
          >
            Panel
            {pathname?.startsWith('/dashboard/comprador/panel') ? (
              <span className="absolute -bottom-[11px] left-0 h-[2px] w-full rounded-full bg-[#4f46ff]" />
            ) : null}
          </Link>

          <div className="relative" ref={productsRef}>
            <button
              className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-950"
              onClick={() => setIsProductsOpen((current) => !current)}
              type="button"
            >
              Productos
              <span className={`transition ${isProductsOpen ? 'rotate-180' : ''}`}>
                <Icon name="chev-down" />
              </span>
            </button>

            {isProductsOpen ? (
              <div className="absolute left-0 top-[calc(100%+14px)] z-50 w-[320px] rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
                <Link
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  href="/dashboard/comprador/solicitudes/nueva"
                  onClick={() => setIsProductsOpen(false)}
                >
                  Cotizar por categoria
                  <Icon name="chev-right" />
                </Link>
                <Link
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  href="/dashboard/comprador/proveedores"
                  onClick={() => setIsProductsOpen(false)}
                >
                  Buscar proveedores
                  <Icon name="chev-right" />
                </Link>
              </div>
            ) : null}
          </div>

          {navItems.slice(1).map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link key={item.href} className={isActive ? 'text-slate-950' : 'hover:text-slate-950'} href={item.href}>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <WorkspaceSwitcher className="hidden lg:inline-flex" />

          <Link
            className="relative inline-flex h-8.5 w-8.5 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700"
            href="/dashboard/comprador/mensajes"
          >
            <Icon name="msg" />
          </Link>

          <Link
            className="relative inline-flex h-8.5 w-8.5 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700"
            href="/dashboard/comprador/notificaciones"
          >
            <Icon name="bell" />
            {notificationCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#4f46ff] px-1 text-[10px] font-semibold text-white">
                {Math.min(notificationCount, 9)}
              </span>
            ) : null}
          </Link>

          <div className="relative hidden lg:block" ref={accountRef}>
            <button
              aria-expanded={isAccountOpen}
              className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-white px-3 py-1 transition hover:bg-slate-50"
              onClick={() => setIsAccountOpen((current) => !current)}
              type="button"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#eef2ff] text-[11px] font-bold text-[#4f46ff]">
                {profileInitials}
              </span>
              <div className="leading-tight text-left">
                <p className="text-xs font-semibold text-slate-950">{profileName}</p>
                <p className="text-[11px] text-slate-500">{profileCompany}</p>
              </div>
              <span className={`transition ${isAccountOpen ? 'rotate-180' : ''}`}>
                <Icon name="chev-down" />
              </span>
            </button>

            {isAccountOpen ? (
              <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-[260px] rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eef2ff] text-xs font-bold text-[#4f46ff]">
                    {profileInitials}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-950">{profileName}</p>
                    <p className="mt-0.5 truncate text-[11px] text-slate-500">{profileCompany}</p>
                  </div>
                </div>

                <div className="mt-2 space-y-1">
                  <Link
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    href="/dashboard/comprador/configuracion"
                    onClick={() => setIsAccountOpen(false)}
                  >
                    <svg aria-hidden="true" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24">
                      <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33h.01A1.65 1.65 0 0010 3.09V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51h.01a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v.01a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                    </svg>
                    Configuración
                  </Link>

                  <button
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                    onClick={handleLogout}
                    type="button"
                  >
                    <svg aria-hidden="true" className="h-4 w-4 text-rose-500" fill="none" viewBox="0 0 24 24">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      <path d="M16 17l5-5-5-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      <path d="M21 12H9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </svg>
                    Cerrar sesión
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
