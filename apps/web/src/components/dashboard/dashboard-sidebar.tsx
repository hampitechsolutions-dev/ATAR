'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearSession, getPrimaryCompanyName, type WebSession } from '@/lib/session';

type DashboardSidebarProps = {
  role: 'buyer' | 'supplier';
  session: WebSession | null;
};

const buyerItems = [
  { label: 'Dashboard', href: '/dashboard/comprador' },
  { label: 'Mis solicitudes', href: '/dashboard/comprador/solicitudes' },
  { label: 'Pedidos', href: '/dashboard/comprador/pedidos' },
  { label: 'Proveedores', href: '/dashboard/comprador/proveedores' },
  { label: 'Mensajes', href: '/dashboard/comprador/mensajes' },
  { label: 'Favoritos', href: '/dashboard/comprador/favoritos' },
];

const supplierItems = [
  { label: 'Inicio', href: '/dashboard/proveedor' },
  { label: 'Oportunidades', href: '/dashboard/proveedor/oportunidades' },
  { label: 'Solicitudes', href: '/dashboard/proveedor/solicitudes' },
  { label: 'Cotizaciones', href: '/dashboard/proveedor/cotizaciones' },
  { label: 'Pedidos', href: '/dashboard/proveedor/pedidos' },
  { label: 'Reportes', href: '/dashboard/proveedor/reportes' },
  { label: 'Configuracion', href: '/dashboard/proveedor/configuracion' },
];

export default function DashboardSidebar({
  role,
  session,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const items = role === 'buyer' ? buyerItems : supplierItems;
  const panelLabel = role === 'buyer' ? 'Panel comprador' : 'Panel proveedor';
  const baseClasses =
    role === 'buyer'
      ? 'rounded-[2rem] bg-slate-950 p-5 text-white shadow-2xl shadow-slate-300/30'
      : 'rounded-[2rem] bg-[#07111f] p-5 text-white shadow-2xl shadow-slate-300/30';
  const activeClasses =
    role === 'buyer'
      ? 'bg-white text-slate-950 font-semibold'
      : 'bg-gradient-to-r from-sky-500 to-violet-500 font-semibold text-white';

  function handleLogout() {
    clearSession();
    router.push('/acceso');
  }

  return (
    <aside className={baseClasses}>
      <div className="flex items-center gap-3 border-b border-white/10 pb-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-violet-500 text-sm font-bold">
          A
        </div>
        <div>
          <p className="font-semibold">ATAR</p>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{panelLabel}</p>
        </div>
      </div>

      <nav className="mt-6 space-y-2 text-sm">
        {items.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== `/${pathname?.split('/').slice(1, 3).join('/')}` &&
              pathname?.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.href}
              className={`block rounded-2xl px-4 py-3 transition ${
                isActive ? activeClasses : 'text-slate-300 hover:bg-white/5'
              }`}
              href={item.href}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
        <p className="text-sm font-semibold text-white">Sesion activa</p>
        <p className="mt-2 text-sm text-slate-300">
          {session ? getPrimaryCompanyName(session.user) : 'Mi empresa'}
        </p>
        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
          {session?.user.email}
        </p>
        <button
          className="mt-4 w-full rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
          onClick={handleLogout}
          type="button"
        >
          Cerrar sesion
        </button>
      </div>
    </aside>
  );
}
