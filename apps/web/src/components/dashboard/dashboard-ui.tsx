import type { ReactNode } from 'react';
import DashboardSidebar from '@/components/dashboard/dashboard-sidebar';
import type { WebSession } from '@/lib/session';

export const dashboardInputClassName =
  'w-full rounded-[1.25rem] border border-slate-200/80 bg-white px-4 py-3 text-sm text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100';

export const dashboardTextareaClassName = `${dashboardInputClassName} min-h-32 resize-y`;

export const dashboardPrimaryButtonClassName =
  'inline-flex items-center justify-center rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60';

export const dashboardSecondaryButtonClassName =
  'inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60';

export const dashboardGhostButtonClassName =
  'inline-flex items-center justify-center rounded-full border border-indigo-200 bg-indigo-50/70 px-5 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60';

export function DashboardShell({
  children,
  role,
  session,
}: {
  children: ReactNode;
  role: 'buyer' | 'supplier';
  session: WebSession | null;
}) {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_18%,#eef2ff_100%)] text-slate-950">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-10 lg:py-8">
        <div className="self-start lg:sticky lg:top-6">
          <DashboardSidebar role={role} session={session} />
        </div>
        <section className="min-w-0 space-y-6">{children}</section>
      </div>
    </main>
  );
}

export function DashboardHero({
  eyebrow,
  title,
  description,
  actions,
  aside,
}: {
  eyebrow: string;
  title: ReactNode;
  description: ReactNode;
  actions?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-7">
      <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.18),_transparent_58%)] lg:block" />
      <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-indigo-100/40 blur-3xl" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-indigo-600">
            {eyebrow}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            {title}
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-slate-600">{description}</p>
          {actions ? <div className="flex flex-col gap-3 pt-2 sm:flex-row">{actions}</div> : null}
        </div>
        {aside ? <div className="relative">{aside}</div> : null}
      </div>
    </div>
  );
}

export function DashboardCard({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)] ${className}`.trim()}
    >
      {children}
    </div>
  );
}

export function DashboardMutedCard({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[1.5rem] border border-slate-200 bg-slate-50/90 p-4 ${className}`.trim()}
    >
      {children}
    </div>
  );
}

export function DashboardDarkCard({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#07111f_0%,#0f172a_48%,#312e81_100%)] p-6 text-white shadow-[0_22px_60px_rgba(15,23,42,0.18)] ${className}`.trim()}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.16),_transparent_42%)]" />
      <div className="relative">{children}</div>
    </div>
  );
}

export function DashboardStatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: ReactNode;
  helper?: ReactNode;
}) {
  return (
    <DashboardMutedCard className="h-full">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
      {helper ? <p className="mt-2 text-xs uppercase tracking-[0.18em] text-indigo-600">{helper}</p> : null}
    </DashboardMutedCard>
  );
}

export function DashboardSectionHeading({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

export function DashboardEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white px-6 py-10 text-sm text-slate-500 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
      <p className="font-semibold text-slate-700">{title}</p>
      <p className="mt-2 leading-7">{description}</p>
    </div>
  );
}

export function DashboardInfoBadge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'indigo' | 'emerald' | 'amber' | 'sky' | 'rose';
}) {
  const toneClassName =
    tone === 'emerald'
      ? 'bg-emerald-100 text-emerald-800'
      : tone === 'amber'
        ? 'bg-amber-100 text-amber-800'
        : tone === 'sky'
          ? 'bg-sky-100 text-sky-800'
          : tone === 'rose'
            ? 'bg-rose-100 text-rose-800'
            : tone === 'indigo'
              ? 'bg-indigo-100 text-indigo-800'
              : 'bg-slate-100 text-slate-700';

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${toneClassName}`}
    >
      {children}
    </span>
  );
}
