'use client';

import { useEffect, useState } from 'react';
import type { RequestAssignmentRecord, TeamMemberRecord } from '@/lib/atar-api';

/**
 * Selector de vendedor para asignar o reasignar una oportunidad.
 * Muestra la carga actual de cada vendedor para que el gerente reparta trabajo
 * con criterio.
 */
export default function AssignSellerDialog({
  assignment,
  team,
  submitting,
  onAssign,
  onClose,
}: {
  assignment: RequestAssignmentRecord;
  team: TeamMemberRecord[];
  submitting: boolean;
  onAssign: (sellerUserId: string | null) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(assignment.seller?.id ?? null);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const isReassignment = Boolean(assignment.seller);
  const productName = assignment.request.productName || assignment.request.title;

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6"
      role="dialog"
    >
      <button
        aria-label="Cerrar"
        className="absolute inset-0 cursor-default bg-slate-950/50"
        onClick={onClose}
        type="button"
      />

      <div className="relative z-10 flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-[0_24px_70px_rgba(2,6,23,0.35)] sm:rounded-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-950">
              {isReassignment ? 'Reasignar solicitud' : 'Asignar vendedor'}
            </h3>
            <p className="mt-0.5 truncate text-[11px] text-slate-500">{productName}</p>
          </div>
          <button
            aria-label="Cerrar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50"
            onClick={onClose}
            type="button"
          >
            <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
            </svg>
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-5 py-4">
          {team.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-xs text-slate-500">
              Todavía no hay vendedores cargados en la empresa.
            </p>
          ) : (
            team.map((member) => {
              const isSelected = selected === member.id;

              return (
                <button
                  className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/60'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                  key={member.id}
                  onClick={() => setSelected(member.id)}
                  type="button"
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                      isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {member.name.slice(0, 2).toUpperCase()}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-slate-950">
                      {member.name}
                      {member.isManager ? (
                        <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-500">
                          Gerente
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-slate-500">
                      {member.pending} solicitud{member.pending === 1 ? '' : 'es'} pendiente
                      {member.pending === 1 ? '' : 's'} · {member.quoted} cotizada
                      {member.quoted === 1 ? '' : 's'} · {member.conversionRate}% conversión
                    </span>
                  </span>

                  {isSelected ? (
                    <svg aria-hidden="true" className="h-4 w-4 shrink-0 text-indigo-600" fill="none" viewBox="0 0 24 24">
                      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                    </svg>
                  ) : null}
                </button>
              );
            })
          )}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-slate-200 px-5 py-4">
          {isReassignment ? (
            <button
              className="text-[12px] font-semibold text-slate-500 transition hover:text-rose-600 disabled:opacity-50"
              disabled={submitting}
              onClick={() => onAssign(null)}
              type="button"
            >
              Quitar asignación
            </button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            <button
              className="inline-flex h-10 items-center rounded-xl border border-slate-200 px-4 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-50"
              onClick={onClose}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="inline-flex h-10 items-center rounded-xl bg-indigo-600 px-5 text-[13px] font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={submitting || !selected}
              onClick={() => selected && onAssign(selected)}
              type="button"
            >
              {submitting ? 'Guardando...' : isReassignment ? 'Reasignar' : 'Asignar'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
