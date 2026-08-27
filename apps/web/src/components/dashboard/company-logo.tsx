/**
 * Avatar de una empresa: su logo si lo cargó, iniciales si no.
 *
 * Es solo para empresas. Las personas (vendedores, miembros del equipo) siguen
 * con sus propias iniciales: mostrarles el logo de la empresa las volveria
 * indistinguibles entre si.
 *
 * El logo puede ser un data URI subido desde Configuracion, que el optimizador
 * de next/image no procesa, asi que se renderiza con <img>.
 */
export default function CompanyLogo({
  name,
  logoUrl,
  className = 'h-9 w-9',
  rounded = 'rounded-xl',
  tone = 'bg-slate-100 text-slate-600',
  textClassName = 'text-[11px]',
}: {
  name: string;
  logoUrl?: string | null;
  /** Tamaño del cuadro. */
  className?: string;
  rounded?: string;
  /** Colores del fallback de iniciales. */
  tone?: string;
  textClassName?: string;
}) {
  const initials =
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || '?';

  if (logoUrl) {
    return (
      <span
        className={`flex shrink-0 items-center justify-center overflow-hidden border border-slate-200 bg-white ${rounded} ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt={name} className="max-h-full max-w-full object-contain" src={logoUrl} />
      </span>
    );
  }

  return (
    <span
      className={`flex shrink-0 items-center justify-center font-bold ${rounded} ${tone} ${textClassName} ${className}`}
    >
      {initials}
    </span>
  );
}
