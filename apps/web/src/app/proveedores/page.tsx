import { providerDirectory, supplierCategories, supplierFilters } from '@/lib/provider-directory';
import Image from 'next/image';

function StatIcon({ name }: { name: 'users' | 'file' | 'grid' | 'star' }) {
  if (name === 'users') {
    return (
      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
        <path
          d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
        <path
          d="M9 11a4 4 0 100-8 4 4 0 000 8z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
        <path
          d="M23 21v-2a4 4 0 00-3-3.87"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
        <path
          d="M16 3.13a4 4 0 010 7.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    );
  }

  if (name === 'file') {
    return (
      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
        <path
          d="M14 2H8a2 2 0 00-2 2v16a2 2 0 002 2h8a2 2 0 002-2V8l-4-6z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
        <path
          d="M14 2v6h6"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    );
  }

  if (name === 'grid') {
    return (
      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
        <path
          d="M10 3H3v7h7V3zM21 3h-7v7h7V3zM10 14H3v7h7v-7zM21 14h-7v7h7v-7z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7l3-7z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className ?? 'h-4 w-4'} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.96a1 1 0 00.95.69h4.163c.969 0 1.371 1.24.588 1.81l-3.37 2.449a1 1 0 00-.364 1.118l1.287 3.961c.3.921-.755 1.688-1.539 1.118L10.59 15.34a1 1 0 00-1.175 0l-3.373 2.453c-.783.57-1.838-.197-1.539-1.118l1.287-3.961a1 1 0 00-.364-1.118L2.056 9.387c-.783-.57-.38-1.81.588-1.81h4.163a1 1 0 00.95-.69l1.292-3.96z" />
    </svg>
  );
}

function PaperPlaneIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className ?? 'h-5 w-5'} fill="none" viewBox="0 0 24 24">
      <path
        d="M22 2L11 13"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M22 2l-7 20-4-9-9-4 20-7z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function SiteFooter() {
  return (
    <footer className="bg-slate-950 text-slate-200">
      <div className="mx-auto w-full max-w-7xl px-6 py-14 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Image alt="ATAR" height={32} src="/logoatar.png" width={32} />
              <p className="text-lg font-semibold text-white">ATAR</p>
            </div>
            <p className="max-w-sm text-sm leading-7 text-slate-400">
              La plataforma industrial que conecta industrias con los mejores proveedores de
              bolsas industriales.
            </p>
          </div>

          <div className="space-y-3 text-sm">
            <p className="font-semibold text-white">Soluciones</p>
            <a className="block text-slate-400 hover:text-slate-200" href="/#soluciones">
              Para compradores
            </a>
            <a className="block text-slate-400 hover:text-slate-200" href="/#soluciones">
              Para proveedores
            </a>
            <a className="block text-slate-400 hover:text-slate-200" href="/proveedores">
              Cotizaciones
            </a>
            <a className="block text-slate-400 hover:text-slate-200" href="/proveedores">
              Gestión de proveedores
            </a>
          </div>

          <div className="space-y-3 text-sm">
            <p className="font-semibold text-white">Recursos</p>
            <a className="block text-slate-400 hover:text-slate-200" href="/#recursos">
              Centro de ayuda
            </a>
            <a className="block text-slate-400 hover:text-slate-200" href="/#recursos">
              Guías
            </a>
            <a className="block text-slate-400 hover:text-slate-200" href="/#recursos">
              Blog
            </a>
            <a className="block text-slate-400 hover:text-slate-200" href="/#recursos">
              Preguntas frecuentes
            </a>
          </div>

          <div className="rounded-[1.5rem] bg-white/10 p-5">
            <p className="text-sm font-semibold text-white">¿Listo para empezar?</p>
            <p className="mt-2 text-sm leading-7 text-slate-400">
              Crea tu cuenta gratis y empezá a comprar de forma más eficiente.
            </p>
            <a
              className="mt-5 inline-flex w-full justify-center rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-500"
              href="/acceso"
            >
              Crear cuenta gratis
            </a>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 ATAR. Todos los derechos reservados.</p>
          <div className="flex flex-wrap gap-4">
            <a className="hover:text-slate-300" href="#">
              Términos y condiciones
            </a>
            <a className="hover:text-slate-300" href="#">
              Política de privacidad
            </a>
            <a className="hover:text-slate-300" href="#">
              Política de cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function ProveedoresPage() {
  const heroStats = [
    { value: '+850', label: 'Proveedores verificados', icon: 'users' as const },
    { value: '+120', label: 'Rubros y servicios', icon: 'file' as const },
    { value: '18', label: 'Categorías industriales', icon: 'grid' as const },
    { value: '98%', label: 'Índice de aprobación promedio', icon: 'star' as const },
  ];

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(59,91,255,0.12),_transparent_45%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
        <div className="mx-auto w-full max-w-7xl px-6 py-12 lg:px-10 lg:py-16">
          <div className="grid gap-10 lg:grid-cols-[0.48fr_0.52fr] lg:items-center">
            <div className="space-y-7">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600">
                Para compradores industriales
              </p>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Encontrá proveedores verificados para cada{' '}
                <span className="text-indigo-600">necesidad industrial</span>
              </h1>
              <p className="max-w-xl text-lg leading-8 text-slate-600">
                Accedé a una red calificada de fabricantes y distribuidores. Compará capacidades, tiempos y
                condiciones en un solo lugar.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500"
                  href="/acceso"
                >
                  Solicitar cotización <span aria-hidden="true">→</span>
                </a>
                <a
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  href="/como-funciona"
                >
                  Ver cómo funciona <span aria-hidden="true">→</span>
                </a>
              </div>

              <div className="flex items-center gap-3 text-sm text-slate-600">
                <div className="flex -space-x-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-9 w-9 rounded-full border-2 border-white bg-[linear-gradient(135deg,#cbd5e1_0%,#f8fafc_60%,#ffffff_100%)]"
                    />
                  ))}
                </div>
                <p>
                  <span className="font-semibold text-slate-950">+2.400</span> industrias ya compran mejor con ATAR
                </p>
              </div>
            </div>

            <div className="relative h-[320px] w-full sm:h-[380px] lg:h-[420px]">
              <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_bottom,_rgba(59,91,255,0.20),_transparent_55%)] blur-2xl" />
              <Image
                alt="Proveedores ATAR"
                className="object-contain object-right"
                fill
                priority
                sizes="(min-width: 1024px) 52vw, 100vw"
                src="/proveedores.png"
              />
            </div>
          </div>

          <div className="mt-10 rounded-[1.5rem] border border-slate-200 bg-white/70 p-3 shadow-sm backdrop-blur">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {heroStats.map((item) => (
                <div key={item.label} className="flex items-center gap-4 rounded-2xl bg-white px-5 py-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                    <StatIcon name={item.icon} />
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-slate-950">{item.value}</p>
                    <p className="mt-0.5 text-xs text-slate-600">{item.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[0.7fr_0.3fr] lg:items-start">
            <div className="space-y-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600">
                    Red de proveedores verificados
                  </p>
                  <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                    Buscá y compará proveedores confiables
                  </h2>
                </div>
              </div>

              <div className="flex flex-col gap-3 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center">
                <div className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  <svg aria-hidden="true" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24">
                    <path
                      d="M21 21l-4.35-4.35"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                    <path
                      d="M11 19a8 8 0 100-16 8 8 0 000 16z"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                  Buscar por nombre, producto o servicio...
                </div>
                <button
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  type="button"
                >
                  Filtros <span aria-hidden="true">→</span>
                </button>
              </div>

              <div className="grid gap-4">
                {providerDirectory.map((supplier) => (
                  <article
                    key={supplier.id}
                    className="rounded-[2rem] border border-slate-200 bg-white px-5 py-4 shadow-[0_18px_55px_rgba(15,23,42,0.07)]"
                  >
                    <div className="grid gap-5 lg:grid-cols-[1fr_320px] lg:items-start">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">
                              {supplier.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-2xl font-semibold leading-[1.05] tracking-tight text-slate-950">
                                  {supplier.name.toUpperCase()}
                                </p>
                                <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-[0.32em] text-emerald-800">
                                  Verificado
                                </span>
                              </div>
                              <p className="text-xs text-slate-500">{supplier.city}</p>
                            </div>
                          </div>

                          <a
                            className="inline-flex h-9 w-20 items-center justify-center rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold leading-4 text-slate-800 shadow-[0_10px_22px_rgba(15,23,42,0.10)] hover:bg-slate-50"
                            href="/contacto"
                          >
                            Ver perfil
                          </a>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1">
                          {supplier.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-[1.6rem] bg-[linear-gradient(135deg,rgba(99,102,241,0.14)_0%,rgba(248,250,252,1)_50%,rgba(99,102,241,0.08)_100%)] p-2.5 shadow-[0_14px_45px_rgba(59,91,255,0.16)]">
                        <div className="rounded-[1.4rem] border border-slate-200 bg-white p-3.5 shadow-[0_14px_35px_rgba(15,23,42,0.10)]">
                          <div className="grid grid-cols-2 divide-x divide-slate-200">
                            <div className="space-y-1 pr-4">
                              <p className="text-xs font-semibold text-slate-700">Capacidad</p>
                              <p className="text-xl font-semibold leading-none text-slate-950">250</p>
                              <p className="text-xs text-slate-500">ton/mes</p>
                            </div>
                            <div className="space-y-1 pl-4">
                              <p className="text-xs font-semibold text-slate-700">Entrega</p>
                              <p className="text-xl font-semibold leading-none text-slate-950">5 - 10</p>
                              <p className="text-xs text-slate-500">días</p>
                            </div>
                          </div>

                          <div className="mt-4 border-t border-slate-200 pt-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-slate-700">
                                <StarIcon className="h-4 w-4 text-amber-400" />
                                <p className="text-xs font-semibold text-slate-600">Rating</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 text-amber-400">
                                  {Array.from({ length: 5 }).map((_, index) => (
                                    <StarIcon key={index} className="h-4 w-4" />
                                  ))}
                                </div>
                                <p className="text-xs font-semibold text-slate-950">{supplier.rating}</p>
                              </div>
                            </div>
                          </div>

                          <a
                            className="mt-4 inline-flex h-10 w-full items-center justify-center gap-3 rounded-full bg-[linear-gradient(90deg,#3f37ff_0%,#7a2cff_100%)] px-5 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(77,64,255,0.26)] hover:opacity-95"
                            href="/acceso"
                          >
                            <PaperPlaneIcon className="h-4 w-4 text-white" />
                            Solicitar cotizacion
                          </a>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <a className="inline-flex text-sm font-semibold text-indigo-600" href="/acceso">
                Ver más proveedores →
              </a>
            </div>

            <aside className="space-y-4">
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-lg font-semibold text-slate-950">¿No encontrás el proveedor que necesitás?</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Publicá tu solicitud y recibí propuestas de proveedores verificados.
                </p>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  {['Recibí múltiples propuestas', 'Compará condiciones fácilmente', 'Elegí la mejor opción'].map(
                    (item) => (
                      <div key={item} className="flex items-start gap-3">
                        <span className="mt-1 h-2 w-2 rounded-full bg-indigo-600" />
                        {item}
                      </div>
                    ),
                  )}
                </div>
                <a
                  className="mt-5 inline-flex w-full justify-center rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-500"
                  href="/acceso"
                >
                  Publicar solicitud →
                </a>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Categorías</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {['Todos', ...supplierCategories.slice(0, 5)].map((category, index) => (
                    <span
                      key={category}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                        index === 0
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Filtros</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {supplierFilters.slice(0, 4).map((filter) => (
                    <span
                      key={filter}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600"
                    >
                      {filter}
                    </span>
                  ))}
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-600">
                    + Más filtros
                  </span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="bg-slate-950">
        <div className="mx-auto w-full max-w-7xl px-6 py-14 lg:px-10">
          <div className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#0b1220_0%,#1f1b4f_55%,#312e81_100%)] p-8 text-white lg:p-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_55%)]" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3">
                <h2 className="text-3xl font-semibold">Sumate a la red de empresas que ya compran mejor.</h2>
                <p className="max-w-2xl text-sm leading-7 text-slate-200">
                  Más eficiencia, mejores precios y proveedores confiables en un solo lugar.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  className="inline-flex justify-center rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
                  href="/acceso"
                >
                  Iniciar sesión
                </a>
                <a
                  className="inline-flex justify-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500"
                  href="/acceso"
                >
                  Crear cuenta gratis
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
