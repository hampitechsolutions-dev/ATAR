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

const FOOTER_COLUMNS: { title: string; links: string[] }[] = [
  { title: 'Plataforma', links: ['Productos', 'Proveedores', 'Cómo funciona', 'Solicitar cotización', 'Precios'] },
  { title: 'Recursos', links: ['Blog', 'Guías', 'Casos de éxito', 'Preguntas frecuentes'] },
  { title: 'Empresa', links: ['Sobre ATAR', 'Nuestro equipo', 'Trabajá con nosotros', 'Políticas'] },
];

export default function SiteFooter() {
  const pathname = usePathname();

  // Igual que el header: no se muestra dentro del dashboard ni en el acceso.
  if (pathname?.startsWith('/dashboard') || pathname?.startsWith('/acceso')) {
    return null;
  }

  return (
    <>
      {/* CTA BAND full-width, pegada al footer */}
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

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-[1440px] px-6 py-14 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_1.2fr]">
            <div>
              <div className="flex items-center gap-2.5">
                <Image alt="ATAR" height={32} src="/logoatar.png" width={32} />
                <div className="leading-tight">
                  <p className="text-base font-bold text-slate-950">ATAR</p>
                </div>
              </div>
              <div className="mt-5 flex gap-2">
                {['in', 'ig', 'yt', 'x'].map((social) => (
                  <span
                    key={social}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-[10px] font-semibold uppercase text-slate-400"
                  >
                    {social}
                  </span>
                ))}
              </div>
            </div>

            {FOOTER_COLUMNS.map((column) => (
              <div key={column.title}>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">{column.title}</p>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link}>
                      <span className="cursor-pointer text-[13px] text-slate-600 transition hover:text-slate-950">{link}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">¿Necesitás ayuda?</p>
              <p className="mt-4 text-[13px] leading-6 text-slate-500">Nuestro equipo está listo para ayudarte.</p>
              <Link
                className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-500"
                href="/contacto"
              >
                Contactar soporte
              </Link>
              <p className="mt-3 text-[12px] text-slate-400">Lunes a viernes de 9 a 18 hs</p>
            </div>
          </div>

          <div className="mt-12 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
            © 2026 ATAR. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </>
  );
}
