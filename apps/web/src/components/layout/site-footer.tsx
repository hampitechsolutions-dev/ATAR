'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

function ArrowIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

type SocialName = 'in' | 'ig' | 'yt';

const strokeProps = {
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none',
};

function SocialIcon({ name }: { name: SocialName }) {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24">
      {name === 'in' ? (
        <path d="M6 9v9M6 6v.01M11 18v-5a2 2 0 014 0v5M11 12v6" {...strokeProps} />
      ) : name === 'ig' ? (
        <>
          <rect x="3" y="3" width="18" height="18" rx="5" {...strokeProps} />
          <circle cx="12" cy="12" r="4" {...strokeProps} />
          <path d="M16.5 7.5v.01" {...strokeProps} />
        </>
      ) : (
        <>
          <rect x="3" y="6" width="18" height="12" rx="4" {...strokeProps} />
          <path d="M10 9.5l5 2.5-5 2.5z" {...strokeProps} fill="currentColor" />
        </>
      )}
    </svg>
  );
}

const FOOTER_COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Plataforma',
    links: [
      { label: 'Productos', href: '/productos' },
      { label: 'Proveedores', href: '/proveedores' },
      { label: 'Cómo funciona', href: '/como-funciona' },
      { label: 'Precios', href: '/acceso' },
    ],
  },
  {
    title: 'Recursos',
    links: [
      { label: 'Blog', href: '#' },
      { label: 'Guías', href: '#' },
      { label: 'Centro de ayuda', href: '#' },
      { label: 'Contacto', href: '/contacto' },
    ],
  },
  {
    title: 'Empresa',
    links: [
      { label: 'Sobre ATAR', href: '/como-funciona' },
      { label: 'Novedades', href: '#' },
      { label: 'Trabajá con nosotros', href: '#' },
    ],
  },
];

function GlobeIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" {...strokeProps} />
      <path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" {...strokeProps} />
    </svg>
  );
}

export default function SiteFooter() {
  const pathname = usePathname();

  // El dashboard y el acceso tienen su propio cierre.
  if (pathname?.startsWith('/dashboard') || pathname?.startsWith('/acceso')) {
    return null;
  }

  // Estas páginas ya traen su propia llamada a la acción antes del footer.
  const isHome = ['/', '/productos', '/proveedores', '/como-funciona'].includes(pathname ?? '');

  return (
    <>
      {isHome ? null : (
      /* CTA BAND full-width, pegada al footer */
      <section className="relative overflow-hidden bg-[linear-gradient(120deg,#070b1a_0%,#0e1633_55%,#141d4a_100%)] text-white">
        <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_80%_50%,rgba(37,99,235,0.35),transparent_60%)]" />
        <div className="pointer-events-none absolute -right-6 bottom-0 hidden h-full w-[380px] opacity-90 lg:block">
          <Image alt="" className="object-contain object-right-bottom" fill sizes="380px" src="/logoatarblanco.png" />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-[1440px] px-6 py-16 lg:px-10 lg:py-20">
          <div className="max-w-xl">
            <h2 className="text-[30px] font-semibold leading-tight tracking-[-0.02em] sm:text-[38px]">
              La industria se conecta en ATAR.
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/70">
              Productos, materias primas, proveedores y oportunidades comerciales dentro de un mismo ecosistema.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white transition hover:bg-indigo-500"
                href="/acceso"
              >
                Explorar ATAR
                <ArrowIcon />
              </Link>
              <Link
                className="inline-flex h-12 items-center justify-center rounded-xl border border-white/25 px-6 text-sm font-semibold text-white transition hover:bg-white/10"
                href="/acceso"
              >
                Registrar mi empresa
              </Link>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* FOOTER: el mismo que usa la home. */}
      <footer className="bg-[#0b1530] text-white">
        <div className="mx-auto w-full max-w-[1440px] px-6 pb-8 pt-14 lg:px-12">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_0.7fr_0.7fr_0.8fr_1.3fr]">
            <div>
              <div className="flex items-center gap-2.5">
                <Image alt="ATAR" height={34} src="/logoatarblanco.png" width={34} />
                <span className="text-2xl font-bold tracking-tight">ATAR</span>
              </div>
              <p className="mt-4 max-w-[240px] text-sm leading-6 text-[#8fb0ff]">
                La red comercial de la industria de rafia y envases industriales.
              </p>
            </div>

            {FOOTER_COLUMNS.map((column) => (
              <div key={column.title}>
                <p className="text-sm font-semibold text-white">{column.title}</p>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link className="text-sm text-white/65 transition hover:text-white" href={link.href}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div className="lg:border-l lg:border-white/10 lg:pl-10">
              <p className="text-sm font-semibold text-white">Recibí novedades de ATAR</p>
              <form className="mt-4 flex items-center overflow-hidden rounded-[10px] bg-white">
                <input
                  aria-label="Tu email"
                  className="h-11 w-full bg-transparent px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  placeholder="Tu email"
                  type="email"
                />
                <button
                  aria-label="Suscribirme"
                  className="flex h-11 w-12 shrink-0 items-center justify-center bg-[#1f5bff] text-white transition hover:bg-[#194ee6]"
                  type="submit"
                >
                  <ArrowIcon />
                </button>
              </form>
              <div className="mt-6 flex gap-4">
                {(['in', 'ig', 'yt'] as SocialName[]).map((social) => (
                  <span key={social} className="text-[#5b8dff] transition hover:text-white">
                    <SocialIcon name={social} />
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 ATAR. Todos los derechos reservados.</p>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
              <Link className="transition hover:text-white" href="#">
                Términos y condiciones
              </Link>
              <Link className="transition hover:text-white" href="#">
                Política de privacidad
              </Link>
              <span className="inline-flex items-center gap-1.5 text-white/70">
                <GlobeIcon />
                Español
              </span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
