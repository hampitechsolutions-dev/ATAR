import { providerDirectory, supplierCategories, supplierFilters } from '@/lib/provider-directory';
import Image from 'next/image';

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
    { value: '+850', label: 'Proveedores verificados' },
    { value: '+120', label: 'Nuevos proveedores este mes' },
    { value: '18', label: 'Categorías industriales' },
    { value: '98%', label: 'Índice de aprobación promedio' },
  ];

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="mx-auto w-full max-w-7xl px-6 py-12 lg:px-10 lg:py-16">
        <div className="grid gap-10 lg:items-center">
          <div className="space-y-7">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600">
              Para compradores industriales
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Encontrá proveedores verificados para cada{' '}
              <span className="text-indigo-600">necesidad industrial</span>
            </h1>
            <p className="max-w-xl text-lg leading-8 text-slate-600">
              Accedé a una red calificada de fabricantes y distribuidores. Compará capacidades,
              tiempos y condiciones en un solo lugar.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                className="inline-flex justify-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500"
                href="/acceso"
              >
                Solicitar cotización
              </a>
              <a
                className="inline-flex justify-center rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                href="/como-funciona"
              >
                Ver cómo funciona
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
                <span className="font-semibold text-slate-950">+2.500</span> industrias ya compran mejor
                con ATAR
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
          {heroStats.map((item) => (
            <div key={item.label} className="rounded-2xl bg-slate-50 p-5">
              <p className="text-3xl font-semibold text-slate-950">{item.value}</p>
              <p className="mt-2 text-sm text-slate-600">{item.label}</p>
            </div>
          ))}
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
                  Buscar por nombre, producto o servicio...
                </div>
                <button
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  type="button"
                >
                  Filtros
                </button>
              </div>

              <div className="grid gap-4">
                {providerDirectory.map((supplier) => (
                  <article
                    key={supplier.id}
                    className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr_0.35fr] lg:items-center">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white">
                          {supplier.name.slice(0, 2)}
                        </div>
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-lg font-semibold text-slate-950">{supplier.name}</p>
                            <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                              Verificado
                            </span>
                          </div>
                          <p className="text-sm text-slate-500">{supplier.city}</p>
                          <p className="max-w-2xl text-sm leading-7 text-slate-600">
                            {supplier.description}
                          </p>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {supplier.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-3 rounded-[1.25rem] bg-slate-50 p-4 text-sm text-slate-600 sm:grid-cols-3 lg:grid-cols-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Capacidad</p>
                          <p className="mt-1 font-semibold text-slate-950">250 ton/mes</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Entrega</p>
                          <p className="mt-1 font-semibold text-slate-950">5 - 10 días</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Rating</p>
                          <p className="mt-1 font-semibold text-slate-950">{supplier.rating}</p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row lg:flex-col lg:items-end">
                        <a
                          className="inline-flex justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                          href="/contacto"
                        >
                          Ver perfil
                        </a>
                        <a
                          className="inline-flex justify-center rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                          href="/acceso"
                        >
                          Solicitar cotización
                        </a>
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
                  Publicar solicitud
                </a>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Categorías</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {supplierCategories.map((category) => (
                    <span
                      key={category}
                      className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Filtros</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {supplierFilters.map((filter) => (
                    <span
                      key={filter}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600"
                    >
                      {filter}
                    </span>
                  ))}
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
