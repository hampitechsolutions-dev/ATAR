import AccessPanel from '@/components/auth/access-panel';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';

export default function AccesoPage() {
  return (
    <main className="h-screen overflow-hidden bg-white text-slate-950">
      <div className="grid h-screen lg:grid-cols-2">
        <section className="relative hidden overflow-hidden lg:flex">
          <Image alt="" className="object-cover" fill priority sizes="50vw" src="/login.png" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.92)_0%,rgba(2,6,23,0.65)_55%,rgba(2,6,23,0.12)_100%)]" />

          {/* Volver al sitio: arriba a la izquierda, sobre la imagen. En mobile, donde
              la imagen no se muestra, el botón va arriba del formulario. */}
          <Link
            className="absolute left-6 top-6 z-10 inline-flex h-10 items-center gap-2 rounded-full border border-white/60 bg-white/10 px-4 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white hover:text-slate-950"
            href="/"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
              <path d="M19 12H5M11 18l-6-6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
            Volver a la web
          </Link>

          <div className="relative flex w-full flex-col justify-center px-14 py-12">
            <div className="flex items-center gap-3">
              <Image alt="ATAR" height={40} src="/logoatar.png" width={40} />
              <div className="leading-none">
                <p className="text-2xl font-semibold text-white">ATAR</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">
                  Marketplace industrial
                </p>
              </div>
            </div>

            <div className="mt-14 max-w-xl space-y-5">
              <h1 className="text-5xl font-semibold leading-[1.06] tracking-tight text-white">
                La red comercial
                <br />
                de la <span className="text-indigo-500">industria de la rafia.</span>
              </h1>
              <p className="max-w-lg text-base leading-8 text-slate-300">
                Comprá, cotizá y gestioná proveedores verificados desde un único lugar.
              </p>
            </div>



          </div>
        </section>

        {/* Columna + my-auto: centrado cuando entra, scrolleable cuando no. En mobile
            el botón de volver va arriba, en el flujo, para no tapar el título. */}
        <section className="relative flex h-full flex-col overflow-y-auto bg-slate-50 px-6 py-6 lg:px-10">
          <Link
            className="mb-4 inline-flex h-10 shrink-0 items-center gap-2 self-start lg:hidden rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-500 hover:text-slate-950"
            href="/"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
              <path d="M19 12H5M11 18l-6-6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
            Volver a la web
          </Link>
          <div className="my-auto w-full">
            {/* AccessPanel lee ?perfil= de la URL. */}
            <Suspense fallback={null}>
              <AccessPanel />
            </Suspense>
          </div>
        </section>
      </div>
    </main>
  );
}
