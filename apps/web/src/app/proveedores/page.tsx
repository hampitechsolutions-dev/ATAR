const supplierCategories = [
  "Bolsas industriales",
  "Packaging",
  "Plasticos",
  "Quimicos",
  "Maquinaria",
  "Servicios",
];

const filters = [
  "ISO 9001",
  "ISO 14001",
  "BRC",
  "FSSC 22000",
  "Entrega rapida",
  "Produccion nacional",
];

const suppliers = [
  {
    name: "BOLPACK",
    city: "Cordoba, Argentina",
    description: "Fabricacion de bolsas industriales, big bags y soluciones de polipropileno.",
    rating: "4.8",
    tags: ["ISO 9001", "Entrega rapida", "Produccion nacional"],
  },
  {
    name: "POLYMAX",
    city: "Rosario, Santa Fe",
    description: "Packaging flexible, impresiones de alta calidad y conversion industrial.",
    rating: "4.9",
    tags: ["BRC", "Linea premium", "Atencion personalizada"],
  },
  {
    name: "FLEXIBAG",
    city: "Mendoza, Argentina",
    description: "Envases y filmes tecnicos para agroindustria, alimentos e higiene.",
    rating: "4.7",
    tags: ["FSSC 22000", "Exportacion", "Stock permanente"],
  },
  {
    name: "QUIMAR S.A.",
    city: "Buenos Aires, Argentina",
    description: "Materias primas y productos quimicos para procesos industriales.",
    rating: "4.8",
    tags: ["ISO 14001", "Asistencia tecnica", "Laboratorio"],
  },
];

const trustItems = [
  "Validacion de documentacion",
  "Informacion actualizada",
  "Reputacion y calificaciones",
  "Transparencia en los datos",
];

export default function ProveedoresPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-12 lg:px-10 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[0.34fr_0.66fr]">
          <aside className="space-y-8">
            <div className="space-y-5">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-violet-600">
                Proveedores verificados
              </p>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Encontra proveedores industriales con contexto y confianza.
              </h1>
              <p className="text-base leading-8 text-slate-600">
                Esta vista toma la linea de la antepropuesta para mostrar filtros,
                categorias y fichas claras, orientadas a compra industrial.
              </p>
            </div>

            <div className="space-y-4">
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                <p className="font-semibold text-slate-950">Busqueda inteligente</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Encontra rapidamente proveedores por categoria, ubicacion y capacidad.
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                <p className="font-semibold text-slate-950">Filtros avanzados</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Cruza certificaciones, plazo de entrega, ubicacion y reputacion.
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                <p className="font-semibold text-slate-950">Proveedor verificado</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Todos los perfiles pasan por un proceso de validacion inicial.
                </p>
              </div>
            </div>
          </aside>

          <div className="space-y-6">
            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_40%,#e0e7ff_100%)] p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Inicio / Proveedores</p>
                    <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                      Proveedores
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      Conecta con los mejores proveedores industriales.
                    </p>
                  </div>
                  <div className="rounded-full bg-gradient-to-r from-sky-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white">
                    128 proveedores encontrados
                  </div>
                </div>
                <div className="mt-5 grid gap-3 lg:grid-cols-[1.4fr_0.8fr_0.4fr]">
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-400">
                    Que producto o servicio buscas?
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-400">
                    Ubicacion
                  </div>
                  <button className="rounded-2xl bg-gradient-to-r from-sky-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white">
                    Buscar
                  </button>
                </div>
              </div>

              <div className="grid gap-3 border-b border-slate-200 p-6 md:grid-cols-3 xl:grid-cols-6">
                {supplierCategories.map((category) => (
                  <div
                    key={category}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm font-medium text-slate-700"
                  >
                    {category}
                  </div>
                ))}
              </div>

              <div className="grid gap-6 p-6 lg:grid-cols-[0.32fr_0.68fr]">
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-semibold text-slate-950">Filtros</p>
                    <button className="text-sm font-medium text-violet-600">
                      Limpiar filtros
                    </button>
                  </div>

                  <div className="mt-6 space-y-6">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">Certificaciones</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {filters.map((filter) => (
                          <span
                            key={filter}
                            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600"
                          >
                            {filter}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-950">Plazo de entrega</p>
                      <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                        Cualquier plazo
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-950">Calificacion minima</p>
                      <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                        4.5 o mas
                      </div>
                    </div>

                    <button className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white">
                      Aplicar filtros
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {suppliers.map((supplier) => (
                    <article
                      key={supplier.name}
                      className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white">
                              {supplier.name.slice(0, 2)}
                            </div>
                            <div>
                              <h3 className="text-xl font-semibold text-slate-950">
                                {supplier.name}
                              </h3>
                              <p className="text-sm text-slate-500">{supplier.city}</p>
                            </div>
                          </div>
                          <p className="max-w-2xl text-sm leading-7 text-slate-600">
                            {supplier.description}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {supplier.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex min-w-44 flex-col items-start gap-3 lg:items-end">
                          <span className="rounded-full bg-amber-400/15 px-3 py-1 text-sm font-semibold text-amber-700">
                            {supplier.rating}
                          </span>
                          <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                            Verificado
                          </span>
                          <button className="rounded-full border border-violet-200 px-4 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-50">
                            Ver perfil
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-2xl shadow-slate-300/30">
              <h3 className="text-2xl font-semibold">Confianza en cada conexion</h3>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
                Trabajamos para garantizar que cada proveedor dentro de ATAR cumpla con
                estandares de calidad, seguridad y servicio.
              </p>
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {trustItems.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm font-medium text-slate-200"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
