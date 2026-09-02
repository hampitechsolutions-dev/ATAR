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
