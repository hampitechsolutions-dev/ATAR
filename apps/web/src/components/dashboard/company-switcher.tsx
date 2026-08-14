'use client';

import { useEffect, useRef, useState } from 'react';
import { useWorkspace } from '@/components/auth/workspace-provider';

/**
 * Selector "Trabajando como".
 *
 * Solo aparece cuando el usuario representa a mas de una empresa (por ejemplo
 * un vendedor que atiende a tres proveedoras). Al cambiar de empresa se
 * recarga el contexto comercial completo.
 */
export default function CompanySwitcher({ className = '' }: { className?: string }) {
  const { workspaces, activeWorkspace, hasMultipleWorkspaces, selectWorkspace } = useWorkspace();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  if (!hasMultipleWorkspaces || !activeWorkspace) {
    return null;
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        className="inline-flex h-10 max-w-[240px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-left transition hover:bg-slate-50"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-[10px] font-bold text-indigo-600">
          {activeWorkspace.company.name.slice(0, 2).toUpperCase()}
        </span>
        <span className="min-w-0 leading-tight">
          <span className="block text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Trabajando como
          </span>
          <span className="block truncate text-xs font-semibold text-slate-950">
            {activeWorkspace.company.name}
          </span>
        </span>
        <svg
          aria-hidden="true"
          className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </svg>
      </button>

      {open ? (
        <div
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-[280px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_20px_60px_rgba(15,23,42,0.14)]"
          role="listbox"
        >
          <p className="px-2.5 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Tus empresas
          </p>
          {workspaces.map((workspace) => {
            const isActive = workspace.companyId === activeWorkspace.companyId;

            return (
              <button
                aria-selected={isActive}
                className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition ${
                  isActive ? 'bg-indigo-50' : 'hover:bg-slate-50'
                }`}
                key={workspace.companyId}
                onClick={() => {
                  setOpen(false);
                  if (!isActive) {
                    selectWorkspace(workspace.companyId);
                  }
                }}
                role="option"
                type="button"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ${
                    isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {workspace.company.name.slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold text-slate-950">
                    {workspace.company.name}
                  </span>
                  <span className="block text-[10px] text-slate-500">
                    {workspace.isManager ? 'Administrador' : 'Vendedor'}
                    {workspace.company.city ? ` · ${workspace.company.city}` : ''}
                  </span>
                </span>
                {isActive ? (
                  <svg aria-hidden="true" className="h-4 w-4 shrink-0 text-indigo-600" fill="none" viewBox="0 0 24 24">
                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                  </svg>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
