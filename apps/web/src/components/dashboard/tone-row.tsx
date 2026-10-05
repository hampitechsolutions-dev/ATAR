import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * Fila con fondo de color para los paneles: ícono en círculo, número opcional,
 * título, detalle y flecha. Cada fila tiene su propio fondo, así ningún
 * elemento queda "en el aire" sobre el blanco de la tarjeta.
 */

export type Tone = 'indigo' | 'blue' | 'sky' | 'amber' | 'violet' | 'emerald' | 'rose' | 'slate';

export const TONES: Record<Tone, { row: string; icon: string; accent: string; text: string }> = {
  // `indigo` y `violet` usan la escala del tema: dentro de `.theme-supplier` son verde y verde azulado.
  indigo: { row: 'bg-indigo-50 hover:bg-indigo-100', icon: 'bg-indigo-100 text-indigo-600', accent: 'shadow-[inset_4px_0_0_var(--color-indigo-500)]', text: 'text-indigo-600' },
  blue: { row: 'bg-[#eef3ff] hover:bg-[#e3ebff]', icon: 'bg-[#d9e4ff] text-[#1f5bff]', accent: 'shadow-[inset_4px_0_0_#1f5bff]', text: 'text-[#1f5bff]' },
  sky: { row: 'bg-[#edf6ff] hover:bg-[#e0f0ff]', icon: 'bg-[#d6eaff] text-sky-600', accent: 'shadow-[inset_4px_0_0_#0ea5e9]', text: 'text-sky-600' },
  amber: { row: 'bg-[#fff6e8] hover:bg-[#ffefd6]', icon: 'bg-[#ffe6bd] text-amber-600', accent: 'shadow-[inset_4px_0_0_#f59e0b]', text: 'text-amber-600' },
  violet: { row: 'bg-violet-50 hover:bg-violet-100', icon: 'bg-violet-100 text-violet-600', accent: 'shadow-[inset_4px_0_0_var(--color-violet-500)]', text: 'text-violet-600' },
  emerald: { row: 'bg-[#ecfaf3] hover:bg-[#dff5ea]', icon: 'bg-[#cdefdf] text-emerald-600', accent: 'shadow-[inset_4px_0_0_#10b981]', text: 'text-emerald-600' },
  rose: { row: 'bg-[#fff1f3] hover:bg-[#ffe6ea]', icon: 'bg-[#ffd9df] text-rose-600', accent: 'shadow-[inset_4px_0_0_#f43f5e]', text: 'text-rose-600' },
  slate: { row: 'bg-slate-100 hover:bg-slate-200/70', icon: 'bg-slate-200 text-slate-600', accent: 'shadow-[inset_4px_0_0_#64748b]', text: 'text-slate-600' },
};

export default function ToneRow({
  href,
  icon,
  tone,
  title,
  detail,
  count,
  meta,
  highlight = false,
}: {
  href: string;
  icon: ReactNode;
  tone: Tone;
  title: string;
  detail?: string;
  /** Número grande a la izquierda del título (tareas, contadores). */
  count?: number | string;
  /** Texto chico a la derecha, antes de la flecha (p. ej. "Ayer"). */
  meta?: string;
  /** Marca la fila con un borde de color a la izquierda: requiere atención. */
  highlight?: boolean;
}) {
  const t = TONES[tone];
  return (
    <Link className={`group flex items-center gap-3.5 rounded-[14px] px-3.5 py-3 transition sm:gap-4 sm:px-4 sm:py-3.5 ${t.row} ${highlight ? t.accent : ''}`} href={href}>
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full sm:h-12 sm:w-12 ${t.icon}`}>{icon}</span>
      {count !== undefined ? (
        <>
          <span className="w-8 shrink-0 text-center text-[24px] font-bold leading-none text-[#16123a] sm:w-10 sm:text-[26px]">{count}</span>
          <span className="h-9 w-px shrink-0 bg-slate-900/10" />
        </>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-bold leading-5 text-[#16123a] sm:text-[15px]">{title}</span>
        {detail ? <span className="block text-[12px] leading-4 text-slate-600 sm:text-[13px] sm:leading-5">{detail}</span> : null}
      </span>
      {meta ? <span className="hidden shrink-0 text-[12px] text-slate-500 sm:block">{meta}</span> : null}
      <span className={`shrink-0 transition group-hover:translate-x-0.5 ${t.text}`}>
        <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
          <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </svg>
      </span>
    </Link>
  );
}
