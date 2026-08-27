'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/components/auth/workspace-provider';
import CompanyLogo from './company-logo';
import {
  clearSession,
  getPrimaryCompanyName,
  getUserFullName,
  isSellerAccount,
  type WebSession,
} from '@/lib/session';

type SupplierAccountMenuProps = {
  session: WebSession | null;
};

export default function SupplierAccountMenu({ session }: SupplierAccountMenuProps) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // La cuenta es la persona; la empresa es el contexto en el que trabaja.
  const { activeWorkspace, workspaces, hasMultipleWorkspaces, selectWorkspace } = useWorkspace();
  const sellerName = session ? getUserFullName(session.user) : 'Mi cuenta';
  // Representar empresas es cosa del vendedor, no de la cuenta de la empresa.
  const showMyCompanies = session ? isSellerAccount(session.user) : false;
  const companyName =
    activeWorkspace?.company.name ?? (session ? getPrimaryCompanyName(session.user) : 'Mi empresa');
  const accountInitials = useMemo(() => {
    return (
      sellerName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('') || 'MC'
    );
  }, [sellerName]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  function handleLogout() {
    clearSession();
    setIsOpen(false);
    router.push('/acceso');
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        aria-expanded={isOpen}
        className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm transition hover:bg-slate-50"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-700">
          {accountInitials}
        </div>
        <div className="hidden sm:block">
          <p className="max-w-[150px] truncate text-xs font-semibold text-slate-950">{sellerName}</p>
          <p className="max-w-[150px] truncate text-[11px] text-slate-500">{companyName}</p>
        </div>
        <svg
          aria-hidden="true"
          className={`hidden h-4 w-4 text-slate-400 transition sm:block ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-[280px] rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-700 shadow-sm">
              {accountInitials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-950">{sellerName}</p>
              <p className="mt-0.5 truncate text-[11px] text-slate-500">{companyName}</p>
            </div>
          </div>

          {/* El selector de empresa tambien vive aca: en mobile el header no
              tiene lugar para el switcher y este menu esta en todas las vistas. */}
          {hasMultipleWorkspaces ? (
            <div className="mt-2 border-t border-slate-200 pt-2">
              <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Representas a
              </p>
              {workspaces.map((workspace) => {
                const isActive = workspace.companyId === activeWorkspace?.companyId;

                return (
                  <button
                    aria-pressed={isActive}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition ${
                      isActive ? 'bg-indigo-50' : 'hover:bg-slate-50'
                    }`}
                    key={workspace.companyId}
                    onClick={() => {
                      setIsOpen(false);
                      if (!isActive) {
                        selectWorkspace(workspace.companyId);
                      }
                    }}
                    type="button"
                  >
                    <CompanyLogo
                      className="h-7 w-7"
                      logoUrl={workspace.company.logoUrl}
                      name={workspace.company.name}
                      rounded="rounded-lg"
                      textClassName="text-[10px]"
                      tone={isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold text-slate-950">
                        {workspace.company.name}
                      </span>
                      <span className="block text-[10px] text-slate-500">
                        {workspace.isManager ? 'Administrador' : 'Vendedor'}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className="mt-2 space-y-1">
            {showMyCompanies ? (
            <Link
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              href="/dashboard/proveedor/empresas"
              onClick={() => setIsOpen(false)}
            >
              <svg aria-hidden="true" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                <path d="M23 21v-2a4 4 0 00-3-3.87" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                <path d="M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
              Mis empresas
            </Link>
            ) : null}

            <Link
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              href="/dashboard/proveedor/configuracion"
              onClick={() => setIsOpen(false)}
            >
              <svg aria-hidden="true" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24">
                <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33h.01A1.65 1.65 0 0010 3.09V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51h.01a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v.01a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
              </svg>
              Configuracion de empresa
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
              Cerrar sesion
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
