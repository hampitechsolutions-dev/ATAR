/**
 * Spinner de carga reutilizable. Muestra actividad mientras se traen datos que
 * pueden demorar unos segundos, para que la página no parezca colgada.
 */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Cargando"
      className={`inline-block animate-spin rounded-full border-2 border-slate-200 border-t-[var(--brand-accent,#4f46ff)] align-[-2px] motion-reduce:animate-none ${
        className ?? 'h-5 w-5'
      }`}
    />
  );
}

/** Spinner + texto, centrado. Para estados de carga de página o sección. */
export function LoadingState({
  label = 'Cargando...',
  className,
  spinnerClassName,
}: {
  label?: string;
  className?: string;
  spinnerClassName?: string;
}) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className ?? 'px-6 py-8'}`}>
      <Spinner className={spinnerClassName} />
      <span className="text-sm text-slate-500">{label}</span>
    </div>
  );
}

/**
 * Carga de una pantalla del panel: el logo de ATAR con un pulso y una barra
 * de progreso. Va dentro del layout (deja visibles header y navegación).
 */
export function PageLoader({ label = 'Cargando…', className = 'min-h-[60vh]' }: { label?: string; className?: string }) {
  return (
    <div aria-busy="true" aria-live="polite" className={`flex flex-col items-center justify-center gap-6 px-6 ${className}`} role="status">
      <span className="relative flex h-20 w-20 items-center justify-center">
        <span className="loader-ring absolute inset-0 rounded-full bg-[var(--brand-accent,#1f5bff)]/25" />
        <span className="loader-ring absolute inset-0 rounded-full bg-[var(--brand-accent,#1f5bff)]/20 [animation-delay:0.8s]" />
        <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-[0_14px_36px_rgba(31,91,255,0.18)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="ATAR" className="h-9 w-9" src="/logoatar.png" />
        </span>
      </span>
      <span className="h-1 w-40 overflow-hidden rounded-full bg-[var(--brand-accent-soft,#dfe6ff)]">
        <span className="loader-bar block h-full w-2/5 rounded-full bg-[var(--brand-accent,#1f5bff)]" />
      </span>
      <p className="text-sm font-medium text-slate-500">{label}</p>
    </div>
  );
}

/** Igual que PageLoader pero a pantalla completa: al entrar al panel, antes de que exista el layout. */
export function DashboardLoader({ label = 'Preparando tu panel…' }: { label?: string }) {
  return (
    <main className="bg-[linear-gradient(180deg,var(--brand-wash-from,#f7f9ff)_0%,var(--brand-wash-to,#eef1fe)_100%)] text-slate-950">
      <PageLoader className="min-h-screen" label={label} />
    </main>
  );
}
