'use client';

import Image from 'next/image';
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
  { label: 'Cotizaciones', href: '/dashboard/comprador/cotizaciones' },
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
  { label: 'Mensajes', href: '/dashboard/proveedor/mensajes' },
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
  const roleSummary =
    role === 'buyer'
      ? 'Solicitudes, comparacion y decisiones de compra en un mismo lugar.'
      : 'Oportunidades, cotizaciones y seguimiento operativo desde una sola vista.';

  function handleLogout() {
    clearSession();
    router.push('/acceso');
  }

  return (
    <aside className="overflow-hidden rounded-[2rem] bg-[linear-gradient(180deg,#07111f_0%,#0f172a_48%,#111827_100%)] p-5 text-white shadow-[0_24px_60px_rgba(15,23,42,0.25)]">
      <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
        <div className="flex items-center gap-3">
          <Image alt="ATAR" height={40} src="/logoatar.png" width={40} />
          <div>
            <p className="text-lg font-semibold text-white">ATAR</p>
            <p className="text-[11px] uppercase tracking-[0.24em] text-indigo-200">
              {panelLabel}
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-7 text-slate-300">{roleSummary}</p>
        <div className="mt-4 inline-flex rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-200">
          {role === 'buyer' ? 'Compras industriales' : 'Red de proveedores'}
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
              className={`block rounded-[1.25rem] border px-4 py-3 transition ${
                isActive
                  ? 'border-indigo-400/30 bg-[linear-gradient(90deg,rgba(79,70,229,0.92),rgba(99,102,241,0.78))] text-white shadow-[0_12px_24px_rgba(79,70,229,0.22)]'
                  : 'border-transparent text-slate-300 hover:border-white/10 hover:bg-white/5 hover:text-white'
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
          className="mt-4 w-full rounded-[1.25rem] border border-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/8"
          onClick={handleLogout}
          type="button"
        >
          Cerrar sesion
        </button>
      </div>
    </aside>
  );
}
