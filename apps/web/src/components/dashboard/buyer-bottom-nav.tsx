'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';

type IconName =
  | 'home'
  | 'panel'
  | 'bell'
  | 'menu'
  | 'users'
  | 'file'
  | 'box'
  | 'heart'
  | 'chat'
  | 'gear'
  | 'tag'
  | 'plus'
  | 'logout'
  | 'chev-right'
  | 'close';

function Icon({ name, className = 'h-5 w-5' }: { name: IconName; className?: string }) {
  const p = {
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };
  const paths: Record<IconName, React.ReactNode> = {
    home: <path d="M3 10.5L12 3l9 7.5V21a2 2 0 01-2 2H5a2 2 0 01-2-2V10.5zM9 23V13h6v10" {...p} />,
    panel: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="3" {...p} />
        <path d="M7 16v-4M12 16V8M17 16v-6" {...p} />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" {...p} />
        <path d="M13.73 21a2 2 0 01-3.46 0" {...p} />
      </>
    ),
    menu: <path d="M4 6h16M4 12h16M4 18h16" {...p} />,
    users: (
      <>
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" {...p} />
        <path d="M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" {...p} />
      </>
    ),
    file: (
      <>
        <path d="M14 2H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V8l-5-6z" {...p} />
        <path d="M14 2v6h6" {...p} />
      </>
    ),
    box: (
      <>
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" {...p} />
        <path d="M3.3 7.3L12 12l8.7-4.7M12 22V12" {...p} />
      </>
    ),
    heart: <path d="M12 21s-7-4.35-7-10a4 4 0 017-2.65A4 4 0 0119 11c0 5.65-7 10-7 10z" {...p} />,
    chat: <path d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4v8z" {...p} />,
    gear: (
      <>
        <circle cx="12" cy="12" r="3" {...p} />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.2.61.76 1.05 1.42 1.05H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" {...p} />
      </>
    ),
    tag: (
      <>
        <path d="M20.59 13.41L12 22l-9-9V4h9l8.59 8.59a2 2 0 010 2.82z" {...p} />
        <path d="M7 7h.01" {...p} strokeWidth={3} />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" {...p} />,
    logout: (
      <>
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" {...p} />
        <path d="M16 17l5-5-5-5M21 12H9" {...p} />
      </>
    ),
    'chev-right': <path d="M9 18l6-6-6-6" {...p} />,
    close: <path d="M18 6L6 18M6 6l12 12" {...p} />,
  };
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24">
      {paths[name]}
    </svg>
  );
}

const DRAWER_ITEMS: { label: string; href: string; icon: IconName }[] = [
  { label: 'Inicio', href: '/dashboard/comprador', icon: 'home' },
  { label: 'Panel administrativo', href: '/dashboard/comprador/panel', icon: 'panel' },
  { label: 'Nueva cotización', href: '/dashboard/comprador/solicitudes/nueva', icon: 'plus' },
  { label: 'Proveedores', href: '/dashboard/comprador/proveedores', icon: 'users' },
  { label: 'Mis solicitudes', href: '/dashboard/comprador/solicitudes', icon: 'file' },
  { label: 'Cotizaciones', href: '/dashboard/comprador/cotizaciones', icon: 'tag' },
  { label: 'Mis pedidos', href: '/dashboard/comprador/pedidos', icon: 'box' },
  { label: 'Favoritos', href: '/dashboard/comprador/favoritos', icon: 'heart' },
  { label: 'Mensajes', href: '/dashboard/comprador/mensajes', icon: 'chat' },
  { label: 'Notificaciones', href: '/dashboard/comprador/notificaciones', icon: 'bell' },
  { label: 'Configuración', href: '/dashboard/comprador/configuracion', icon: 'gear' },
];

export default function BuyerBottomNav({ notificationCount = 1 }: { notificationCount?: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const tabs: { label: string; href: string; icon: IconName; badge?: number }[] = [
    { label: 'Inicio', href: '/dashboard/comprador', icon: 'home' },
    { label: 'Panel', href: '/dashboard/comprador/panel', icon: 'panel' },
    { label: 'Alertas', href: '/dashboard/comprador/notificaciones', icon: 'bell', badge: notificationCount },
  ];

  function handleLogout() {
    setOpen(false);
    signOut();
    router.replace('/acceso');
  }

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-md items-stretch justify-around px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2">
          {tabs.map((tab) => {
            const active =
              tab.href === '/dashboard/comprador'
                ? pathname === tab.href
                : pathname?.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="relative flex flex-1 flex-col items-center gap-1 py-1"
              >
                <span className={active ? 'text-[#4f46ff]' : 'text-slate-400'}>
                  <Icon name={tab.icon} className="h-6 w-6" />
                </span>
                {tab.badge ? (
                  <span className="absolute right-[22%] top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#4f46ff] px-1 text-[9px] font-bold text-white">
                    {tab.badge}
                  </span>
                ) : null}
                <span className={`text-[10px] font-semibold ${active ? 'text-[#4f46ff]' : 'text-slate-500'}`}>
                  {tab.label}
                </span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex flex-1 flex-col items-center gap-1 py-1"
          >
            <span className="text-slate-400">
              <Icon name="menu" className="h-6 w-6" />
            </span>
            <span className="text-[10px] font-semibold text-slate-500">Menú</span>
          </button>
        </div>
      </nav>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-slate-950/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[82vh] overflow-y-auto rounded-t-3xl bg-white pb-[max(16px,env(safe-area-inset-bottom))] shadow-[0_-20px_60px_rgba(2,6,23,0.28)]">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
              <p className="text-base font-bold text-slate-950">Menú</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500"
              >
                <Icon name="close" className="h-4 w-4" />
              </button>
            </div>

            <div className="p-2">
              {DRAWER_ITEMS.map((item) => {
                const active =
                  item.href === '/dashboard/comprador'
                    ? pathname === item.href
                    : pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3 ${
                      active ? 'bg-[#eef2ff]' : 'active:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className={active ? 'text-[#4f46ff]' : 'text-slate-500'}>
                        <Icon name={item.icon} className="h-5 w-5" />
                      </span>
                      <span className={`text-[15px] font-semibold ${active ? 'text-[#4f46ff]' : 'text-slate-800'}`}>
                        {item.label}
                      </span>
                    </span>
                    <span className="text-slate-300">
                      <Icon name="chev-right" className="h-4 w-4" />
                    </span>
                  </Link>
                );
              })}

              <button
                type="button"
                onClick={handleLogout}
                className="mt-1 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left active:bg-rose-50"
              >
                <span className="text-rose-500">
                  <Icon name="logout" className="h-5 w-5" />
                </span>
                <span className="text-[15px] font-semibold text-rose-600">Cerrar sesión</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
