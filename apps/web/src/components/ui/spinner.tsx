/**
 * Spinner de carga reutilizable. Muestra actividad mientras se traen datos que
 * pueden demorar unos segundos, para que la página no parezca colgada.
 */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Cargando"
      className={`inline-block animate-spin rounded-full border-2 border-slate-200 border-t-[#4f46ff] align-[-2px] motion-reduce:animate-none ${
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
 * Pantalla completa de carga al entrar al panel: el logo de ATAR con un pulso
 * y una barra de progreso. Reemplaza al spinner chico dentro de una tarjeta.
 */
export function DashboardLoader({ label = 'Preparando tu panel…' }: { label?: string }) {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[linear-gradient(180deg,#f7f9ff_0%,#eef1fe_100%)] px-6 text-slate-950"
      role="status"
    >
      <span className="relative flex h-20 w-20 items-center justify-center">
        <span className="loader-ring absolute inset-0 rounded-full bg-[#1f5bff]/25" />
        <span className="loader-ring absolute inset-0 rounded-full bg-[#1f5bff]/20 [animation-delay:0.8s]" />
        <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-[0_14px_36px_rgba(31,91,255,0.18)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="ATAR" className="h-9 w-9" src="/logoatar.png" />
        </span>
      </span>
      <span className="h-1 w-40 overflow-hidden rounded-full bg-[#dfe6ff]">
        <span className="loader-bar block h-full w-2/5 rounded-full bg-[#1f5bff]" />
      </span>
      <p className="text-sm font-medium text-slate-500">{label}</p>
    </main>
  );
}
