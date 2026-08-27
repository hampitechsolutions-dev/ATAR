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
      { label: 'Planes', href: '/acceso' },
    ],
  },
  {
    title: 'Recursos',
    links: [
      { label: 'Centro de ayuda', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Guías y recursos', href: '#' },
      { label: 'Contacto', href: '/contacto' },
    ],
  },
  {
    title: 'Empresa',
    links: [
      { label: 'Sobre nosotros', href: '#' },
      { label: 'Trabajá con nosotros', href: '#' },
      { label: 'Términos y condiciones', href: '#' },
      { label: 'Privacidad', href: '#' },
    ],
  },
];

export default function SiteFooter() {
  const pathname = usePathname();

  // El dashboard y el acceso tienen su propio cierre.
  if (pathname?.startsWith('/dashboard') || pathname?.startsWith('/acceso')) {
    return null;
  }

  // La home ya trae su propia llamada a la accion antes del footer.
  const isHome = pathname === '/';

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
      <footer className="bg-[#070b17] text-white">
        <div className="mx-auto w-full max-w-[1440px] px-6 py-16 lg:px-12">
          <div className="grid gap-12 lg:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_1.2fr]">
            <div>
              <div className="flex items-center gap-2.5">
                <Image alt="ATAR" height={30} src="/logoatarblanco.png" width={30} />
                <span className="text-lg font-bold tracking-tight">ATAR</span>
              </div>
              <p className="mt-4 max-w-xs text-sm leading-6 text-white/50">
                Conectamos industrias proveedoras con la red más grande de clientes.
              </p>
              <div className="mt-6 flex gap-3">
                {(['in', 'ig', 'yt'] as SocialName[]).map((social) => (
                  <span
                    key={social}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/60 transition hover:border-white/40 hover:text-white"
                  >
                    <SocialIcon name={social} />
                  </span>
                ))}
              </div>
            </div>

            {FOOTER_COLUMNS.map((column) => (
              <div key={column.title}>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">
                  {column.title}
                </p>
                <ul className="mt-5 space-y-3">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        className="text-sm text-white/65 transition hover:text-white"
                        href={link.href}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">
                Suscribite a nuestro newsletter
              </p>
              <form className="mt-5 flex items-center gap-2 rounded-full border border-white/15 bg-white/5 p-1.5">
                <input
                  className="w-full bg-transparent px-4 py-2 text-sm text-white outline-none placeholder:text-white/40"
                  placeholder="Tu email"
                  type="email"
                />
                <button
                  type="submit"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2f6bff] text-white transition hover:bg-[#255bef]"
                  aria-label="Suscribirme"
                >
                  <ArrowIcon />
                </button>
              </form>
            </div>
          </div>

          <div className="mt-14 border-t border-white/10 pt-6 text-center text-xs text-white/40">
            © 2026 ATAR. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </>
  );
}
