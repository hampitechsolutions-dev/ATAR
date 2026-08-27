'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useWorkspace } from '@/components/auth/workspace-provider';
import { type SupplierWorkspaceCounters } from '@/lib/dashboard-hooks';
import {
  clearSession,
  getPrimaryCompanyName,
  getUserFullName,
  isSellerAccount,
  type WebSession,
} from '@/lib/session';

type DashboardSidebarProps = {
  role: 'buyer' | 'supplier';
  session: WebSession | null;
  className?: string;
  onNavigate?: () => void;
  supplierCounters?: SupplierWorkspaceCounters;
};

type SidebarIconName =
  | 'home'
  | 'file'
  | 'tag'
  | 'box'
  | 'users'
  | 'chat'
  | 'bell'
  | 'heart'
  | 'gear'
  | 'grid'
  | 'factory'
  | 'star'
  | 'chart'
  | 'mail';

type SidebarItem = {
  label: string;
  href?: string;
  icon: SidebarIconName;
  badge?: number;
  /** Encabezado del grupo. Se repite en cada item del mismo bloque. */
  section?: string;
  /** Administracion de la empresa: un vendedor no lo ve. */
  managerOnly?: boolean;
};

const buyerItems: ReadonlyArray<SidebarItem> = [
  { label: 'Inicio', href: '/dashboard/comprador', icon: 'home' },
  { label: 'Solicitudes', href: '/dashboard/comprador/solicitudes', icon: 'file' },
  { label: 'Cotizaciones', href: '/dashboard/comprador/cotizaciones', icon: 'tag' },
  { label: 'Pedidos', href: '/dashboard/comprador/pedidos', icon: 'box' },
  { label: 'Proveedores', href: '/dashboard/comprador/proveedores', icon: 'users' },
  { label: 'Mensajes', href: '/dashboard/comprador/mensajes', icon: 'chat', badge: 3 },
  { label: 'Notificaciones', href: '/dashboard/comprador/notificaciones', icon: 'bell', badge: 3 },
  { label: 'Favoritos', href: '/dashboard/comprador/favoritos', icon: 'heart' },
  { label: 'Configuración', href: '/dashboard/comprador/configuracion', icon: 'gear' },
];

/**
 * El menu del proveedor esta agrupado por para que sirve cada cosa, no por
 * orden historico: un vendedor entra a "Mi trabajo" todos los dias y casi
 * nunca al resto. Lo marcado como `managerOnly` es administracion de la
 * empresa y no le aparece.
 */
const supplierItems: ReadonlyArray<SidebarItem> = [
  { label: 'Inicio', href: '/dashboard/proveedor', icon: 'home' },

  { section: 'Mi trabajo', label: 'Solicitudes', href: '/dashboard/proveedor/solicitudes', icon: 'file' },
  { section: 'Mi trabajo', label: 'Cotizaciones', href: '/dashboard/proveedor/cotizaciones', icon: 'tag' },
  { section: 'Mi trabajo', label: 'Pedidos', href: '/dashboard/proveedor/pedidos', icon: 'box' },
  { section: 'Mi trabajo', label: 'Clientes', href: '/dashboard/proveedor/clientes', icon: 'users' },
  { section: 'Mi trabajo', label: 'Mensajes', href: '/dashboard/proveedor/mensajes', icon: 'mail' },

  { section: 'Empresa', label: 'Catalogo', href: '/dashboard/proveedor/catalogo', icon: 'grid' },
  { section: 'Empresa', label: 'Produccion', href: '/dashboard/proveedor/produccion', icon: 'factory', managerOnly: true },
  { section: 'Empresa', label: 'Equipo', href: '/dashboard/proveedor/equipo', icon: 'users', managerOnly: true },
  { section: 'Empresa', label: 'Resenas', href: '/dashboard/proveedor/resenas', icon: 'star', managerOnly: true },
  { section: 'Empresa', label: 'Configuracion', href: '/dashboard/proveedor/configuracion', icon: 'gear', managerOnly: true },

  { section: 'Mi cuenta', label: 'Estadisticas', href: '/dashboard/proveedor/reportes', icon: 'chart' },
  { section: 'Mi cuenta', label: 'Notificaciones', href: '/dashboard/proveedor/notificaciones', icon: 'bell' },
  { section: 'Mi cuenta', label: 'Mis empresas', href: '/dashboard/proveedor/empresas', icon: 'users' },
];

function SidebarIcon({ name }: { name: SidebarIconName }) {
  if (name === 'home') {
    return (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path
          d="M3 10.5L12 3l9 7.5V21a2 2 0 01-2 2H5a2 2 0 01-2-2v-10.5z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
        <path
          d="M9 23V13h6v10"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    );
  }

  if (name === 'file') {
    return (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path
          d="M14 2H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V8l-5-6z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
        <path
          d="M14 2v6h6"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    );
  }

  if (name === 'tag') {
    return (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path
          d="M20.59 13.41L12 22l-9-9V4h9l8.59 8.59a2 2 0 010 2.82z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
        <path
          d="M7 7h.01"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
        />
      </svg>
    );
  }

  if (name === 'box') {
    return (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path
          d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
        <path
          d="M3.3 7.3L12 12l8.7-4.7"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
        <path
          d="M12 22V12"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    );
  }

  if (name === 'users') {
    return (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path
          d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
        <path
          d="M9 11a4 4 0 100-8 4 4 0 000 8z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
        <path
          d="M23 21v-2a4 4 0 00-3-3.87"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
        <path
          d="M16 3.13a4 4 0 010 7.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    );
  }

  if (name === 'chat') {
    return (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path
          d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4v8z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    );
  }

  if (name === 'bell') {
    return (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path
          d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
        <path
          d="M13.73 21a2 2 0 01-3.46 0"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    );
  }

  if (name === 'heart') {
    return (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path
          d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    );
  }

  if (name === 'grid') {
    return (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path d="M10 3H3v7h7V3z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="M21 3h-7v7h7V3z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="M21 14h-7v7h7v-7z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="M10 14H3v7h7v-7z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }

  if (name === 'factory') {
    return (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path d="M3 21V10l7 4V10l7 4V3h4v18H3z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }

  if (name === 'star') {
    return (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path d="M12 3l2.8 5.68L21 9.59l-4.5 4.39 1.06 6.21L12 17.27l-5.56 2.92 1.06-6.21L3 9.59l6.2-.91L12 3z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }

  if (name === 'chart') {
    return (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path d="M18 20V10" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="M12 20V4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="M6 20v-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="M3 20h18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }

  if (name === 'mail') {
    return (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path d="M4 6h16v12H4z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="M4 8l8 6 8-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 20h9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export default function DashboardSidebar({
  role,
  session,
  className,
  onNavigate,
  supplierCounters,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isManager, activeWorkspace } = useWorkspace();

  const items =
    role === 'buyer'
      ? buyerItems
      : supplierItems
          // Administrar la empresa (equipo, produccion, resenas, configuracion)
          // no es trabajo del vendedor: se lo saca del menu en vez de dejarle
          // pantallas donde no puede hacer nada.
          .filter((item) => !item.managerOnly || isManager)
          // "Mis empresas" es el perfil del vendedor: representar a otra
          // empresa no aplica a la cuenta de una proveedora ni de un comprador.
          .filter(
            (item) =>
              item.href !== '/dashboard/proveedor/empresas' ||
              (session ? isSellerAccount(session.user) : false),
          )
          .map((item) => {
          if (!supplierCounters) {
            return item;
          }

          if (item.href === '/dashboard/proveedor/solicitudes') {
            return { ...item, badge: supplierCounters.openRequestsCount };
          }

          if (item.href === '/dashboard/proveedor/cotizaciones') {
            return { ...item, badge: supplierCounters.myQuotesCount };
          }

          if (item.href === '/dashboard/proveedor/pedidos') {
            return { ...item, badge: supplierCounters.activeOrdersCount };
          }

          if (item.href === '/dashboard/proveedor/mensajes') {
            return { ...item, badge: supplierCounters.unreadMessagesCount };
          }

          if (item.href === '/dashboard/proveedor/notificaciones') {
            return { ...item, badge: supplierCounters.unreadNotificationsCount };
          }

          return item;
        });
  // Identidad de la persona; la empresa activa va como contexto debajo.
  const userName = session ? getUserFullName(session.user) : 'Mi cuenta';
  const companyName =
    activeWorkspace?.company.name ?? (session ? getPrimaryCompanyName(session.user) : 'Mi empresa');
  const initials =
    userName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'MC';

  function handleLogout() {
    clearSession();
    router.push('/acceso');
  }

  if (role !== 'buyer') {
    return (
      <aside className={`flex h-full flex-col border-r border-slate-200 bg-white ${className ?? ''}`}>
        <div className="px-5 pb-4 pt-4">
          <div className="flex items-center gap-3">
            <Image alt="ATAR" height={28} src="/logoatar.png" width={28} />
            <p className="text-lg font-semibold tracking-tight text-slate-950">ATAR</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-3 text-[13px]">
          {items.map((item, index) => {
            // El encabezado se dibuja al abrir cada grupo, no en cada item.
            const startsSection = item.section && item.section !== items[index - 1]?.section;
            const isActive = item.href
              ? pathname === item.href ||
                (item.href !== `/${pathname?.split('/').slice(1, 3).join('/')}` &&
                  pathname?.startsWith(`${item.href}/`))
              : false;

            const content = (
              <>
                <span className="flex items-center gap-3">
                  <span className={`${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-500'}`}>
                    <SidebarIcon name={item.icon} />
                  </span>
                  <span className={`${isActive ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
                </span>
                {typeof item.badge === 'number' && item.badge > 0 ? (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[10px] font-semibold text-white">
                    {item.badge}
                  </span>
                ) : null}
              </>
            );

            const classes = `group flex w-full items-center justify-between rounded-xl px-3 py-2 transition ${
              isActive
                ? 'bg-[linear-gradient(90deg,rgba(79,70,229,0.18)_0%,rgba(99,102,241,0.10)_60%,rgba(255,255,255,0)_100%)] text-indigo-700'
                : item.href
                  ? 'text-slate-600 hover:bg-slate-50'
                  : 'cursor-default text-slate-400'
            }`;

            const heading = startsSection ? (
              <p className="px-3 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                {item.section}
              </p>
            ) : null;

            if (!item.href) {
              return (
                <div key={item.label}>
                  {heading}
                  <button className={classes} disabled type="button">
                    {content}
                  </button>
                </div>
              );
            }

            return (
              <div key={item.href}>
                {heading}
                <Link className={classes} href={item.href} onClick={() => onNavigate?.()}>
                  {content}
                </Link>
              </div>
            );
          })}
        </nav>

        <div className="px-3 pb-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 overflow-hidden rounded-2xl bg-white">
                <Image alt="Asistente ATAR" fill sizes="40px" src="/botatar.png" className="object-contain p-1" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-950">¿Necesitás ayuda?</p>
                <p className="mt-0.5 text-[11px] text-slate-500">Hablá con el Asistente ATAR</p>
              </div>
            </div>
            <button className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 text-xs font-semibold text-indigo-700 hover:bg-indigo-100" type="button">
              Iniciar chat
            </button>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className={`flex h-full flex-col border-r border-slate-200 bg-white ${className ?? ''}`}>
      <div className="px-6 pb-4 pt-5">
        <div className="flex items-center gap-3">
          <Image alt="ATAR" height={28} src="/logoatar.png" width={28} />
          <p className="text-lg font-semibold tracking-tight text-slate-950">ATAR</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-4 pb-3 text-sm">
        {items.map((item) => {
          const isActive = item.href
            ? pathname === item.href ||
              (item.href !== `/${pathname?.split('/').slice(1, 3).join('/')}` &&
                pathname?.startsWith(`${item.href}/`))
            : false;

          const badge = 'badge' in item ? item.badge : undefined;
          const icon = 'icon' in item ? item.icon : null;

          return (
            <Link
              key={item.href ?? item.label}
              className={`group flex items-center justify-between rounded-lg px-3 py-2 transition ${
                isActive
                  ? 'bg-[linear-gradient(90deg,rgba(79,70,229,0.16)_0%,rgba(99,102,241,0.10)_60%,rgba(255,255,255,0)_100%)] text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
              href={item.href ?? '/dashboard/comprador'}
              onClick={() => onNavigate?.()}
            >
              <span className="flex items-center gap-3">
                <span className={`${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-500'}`}>
                  {icon ? <SidebarIcon name={icon} /> : null}
                </span>
                <span className={`${isActive ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
              </span>
              {typeof badge === 'number' && badge > 0 ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[11px] font-semibold text-white">
                  {badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 pb-4">
        <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
          <p className="text-xs font-semibold text-slate-950">¿Necesitás ayuda?</p>
          <p className="mt-1 text-xs text-slate-500">Hablá con el Asistente ATAR</p>
          <button className="mt-2 inline-flex h-9 w-full items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 text-xs font-semibold text-indigo-700 hover:bg-indigo-100" type="button">
            Iniciar chat
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-950">{userName}</p>
              <p className="mt-0.5 truncate text-[11px] text-slate-500">{companyName}</p>
            </div>
          </div>
          <button className="text-xs font-semibold text-slate-500 hover:text-slate-700" onClick={handleLogout} type="button">
            Salir
          </button>
        </div>
      </div>
    </aside>
  );
}
