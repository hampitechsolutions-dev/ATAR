'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';

// Selector Compro/Vendo para empresas HYBRID: alterna entre el dashboard de
// comprador (crear solicitudes, comparar cotizaciones) y el de proveedor
// (recibir solicitudes, enviar cotizaciones). No se muestra para empresas que
// solo compran o solo venden.
export default function WorkspaceSwitcher({ className = '' }: { className?: string }) {
  const { isHybrid } = useAuth();
  const pathname = usePathname();

  if (!isHybrid) {
    return null;
  }

  const isSelling = Boolean(pathname?.startsWith('/dashboard/proveedor'));

  const base =
    'inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition';
  const active = 'bg-white text-indigo-600 shadow-sm';
  const inactive = 'text-slate-500 hover:text-slate-700';

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 ${className}`}
      role="tablist"
      aria-label="Modo de trabajo"
    >
      <Link
        aria-selected={!isSelling}
        className={`${base} ${!isSelling ? active : inactive}`}
        href="/dashboard/comprador"
        role="tab"
      >
        <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
          <path d="M6 6h15l-1.5 9h-12z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d="M6 6L5 3H3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <circle cx="9" cy="20" r="1.4" fill="currentColor" />
          <circle cx="18" cy="20" r="1.4" fill="currentColor" />
        </svg>
        Compro
      </Link>
      <Link
        aria-selected={isSelling}
        className={`${base} ${isSelling ? active : inactive}`}
        href="/dashboard/proveedor"
        role="tab"
      >
        <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
          <path d="M20.59 13.41L12 22l-9-9V4h9l8.59 8.59a2 2 0 010 2.82z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d="M7 7h.01" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
        </svg>
        Vendo
      </Link>
    </div>
  );
}
