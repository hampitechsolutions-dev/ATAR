const navItems = [
  { label: "Inicio", href: "#inicio" },
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Proveedores", href: "#proveedores" },
  { label: "Soluciones", href: "#soluciones" },
  { label: "Recursos", href: "#recursos" },
];

const differentiators = [
  {
    title: "Industrial",
    description: "Pensada para procesos reales de compra, abastecimiento y operacion B2B.",
  },
  {
    title: "Confiable",
    description: "Transparencia, trazabilidad y proveedores verificados en cada operacion.",
  },
  {
    title: "Intuitiva",
    description: "Experiencias simples para comparar mejor y resolver mas rapido.",
  },
  {
    title: "Escalable",
    description: "Base flexible para crecer en catalogo, demanda y red comercial.",
  },
  {
    title: "Tecnologica",
    description: "IA, datos y automatizacion aplicados al comercio industrial.",
  },
];

const categories = [
  "Bolsas de Polipropileno",
  "Big Bags",
  "Bolsas de Papel",
  "Bobinas y films",
  "Accesorios industriales",
];

const featuredSuppliers = [
  { name: "PLASTAR S.A.", location: "Buenos Aires, Argentina", rating: "4.9" },
  { name: "BOLPACK", location: "Cordoba, Argentina", rating: "4.8" },
  { name: "POLYMAX", location: "Rosario, Santa Fe", rating: "4.9" },
  { name: "FLEXIBAG", location: "Mendoza, Argentina", rating: "4.7" },
];

const steps = [
  {
    index: "1",
    title: "Publica tu necesidad",
    description: "Subi tu pedido o licitacion con detalle tecnico, archivos y tiempos requeridos.",
  },
  {
    index: "2",
    title: "Recibi cotizaciones",
    description: "Los proveedores responden en privado sin ver la oferta de los demas.",
  },
  {
    index: "3",
    title: "Compara con contexto",
    description: "Evalua precio, plazo, condiciones, reputacion y capacidad tecnica.",
  },
  {
    index: "4",
    title: "Adjudica y gestiona",
    description: "Confirma la compra y deja trazabilidad del proceso comercial.",
  },
  {
    index: "5",
    title: "Escala la operacion",
    description: "Centraliza demanda, seguimiento, CRM y fuerza comercial en un solo lugar.",
  },
];

const stats = [
  { label: "Proveedores verificados", value: "+2.500" },
  { label: "Industrias conectadas", value: "+15.000" },
  { label: "Cotizaciones gestionadas", value: "+45.000" },
  { label: "Paises objetivo", value: "+12" },
];

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_30%),linear-gradient(180deg,#030712_0%,#020617_56%,#f8fafc_56%,#f8fafc_100%)]">
      <section id="inicio" className="mx-auto flex w-full max-w-7xl flex-col gap-14 px-6 py-16 lg:px-10 lg:py-24">
        <nav className="hidden items-center gap-7 text-sm text-slate-300 lg:flex">
          {navItems.map((item) => (
            <a key={item.label} href={item.href} className="transition hover:text-white">
              {item.label}
            </a>
          ))}
        </nav>
        <div className="grid gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-8">
            <div className="inline-flex rounded-full border border-violet-400/30 bg-violet-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-violet-200">
              Antepropuesta integrada al producto
            </div>
            <div className="space-y-5">
              <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
                Conectamos industrias con los mejores proveedores.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
                Simplifica la compra industrial. Solicita cotizaciones, compara proveedores
                y gestiona pedidos desde una plataforma clara, moderna y pensada para
                operacion real.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <a
                href="/acceso"
                className="rounded-full bg-gradient-to-r from-sky-500 to-violet-500 px-6 py-3 text-center font-semibold text-white transition hover:opacity-90"
              >
                Crear cuenta gratis
              </a>
              <a
                href="#como-funciona"
                className="rounded-full border border-white/15 px-6 py-3 text-center font-semibold text-slate-100 transition hover:border-white/30 hover:bg-white/5"
              >
                Ver como funciona
              </a>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">Proveedores verificados</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Seguridad, confianza y documentacion en un mismo flujo.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">Cotizaciones rapidas</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Solicita, compara y decide en minutos, no en dias.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">Compra optimizada</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Mejor contexto para precio, plazo, calidad y respaldo.
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-sky-500/20 via-transparent to-violet-500/20 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/80 p-4 shadow-2xl shadow-slate-950/60">
              <div className="mb-4 flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-white">ATAR web</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Plataforma industrial
                  </p>
                </div>
                <div className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                  Home principal
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-[1.75rem] border border-white/10 bg-white p-5 text-slate-950">
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span className="rounded-full bg-violet-50 px-3 py-1 font-medium text-violet-600">
                      Plataforma industrial
                    </span>
                    <span>Web</span>
                  </div>
                  <h2 className="mt-5 max-w-md text-3xl font-semibold tracking-tight text-slate-950">
                    Conectamos industrias con los mejores proveedores de bolsas industriales.
                  </h2>
                  <p className="mt-4 max-w-md text-sm leading-7 text-slate-600">
                    Simplifica tu abastecimiento. Solicita cotizaciones, compara alternativas
                    y centraliza tus pedidos desde un solo lugar.
                  </p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {categories.slice(0, 4).map((category) => (
                      <div
                        key={category}
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"
                      >
                        {category}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="rounded-[1.75rem] border border-sky-400/20 bg-gradient-to-br from-sky-500/20 to-violet-500/20 p-5">
                    <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/80 p-5">
                      <p className="text-xs uppercase tracking-[0.2em] text-sky-300">
                        Mobile app
                      </p>
                      <h3 className="mt-3 text-2xl font-semibold text-white">
                        Seguimiento rapido desde cualquier lugar.
                      </h3>
                      <div className="mt-5 space-y-3">
                        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                          Pedidos abiertos
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                          Respuesta de cotizaciones
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                          Estado de adjudicaciones
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/80 p-4">
                      <p className="text-3xl font-semibold text-white">+2.500</p>
                      <p className="mt-2 text-sm text-slate-400">Proveedores verificados</p>
                    </div>
                    <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/80 p-4">
                      <p className="text-3xl font-semibold text-white">24/7</p>
                      <p className="mt-2 text-sm text-slate-400">Soporte y operacion continua</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 rounded-[2rem] border border-white/10 bg-slate-950/60 p-6 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-white/8 bg-white/4 p-5">
              <p className="text-3xl font-semibold text-white">{stat.value}</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="como-funciona" className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-6 py-20 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="space-y-6">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-violet-600">
                Como funciona
              </p>
              <h2 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Conectamos industrias en 5 pasos simples.
              </h2>
              <p className="max-w-xl text-lg leading-8 text-slate-600">
                Un proceso claro y transparente para publicar necesidades, recibir
                cotizaciones privadas y tomar mejores decisiones con informacion real.
              </p>
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="font-semibold text-slate-950">Transparente</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Informacion clara para comparar mejor y decidir con mas contexto.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="font-semibold text-slate-950">Rapido</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Menos telefono, menos Excel, menos friccion operativa.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {steps.map((step) => (
                <article
                  key={step.index}
                  className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/15 to-violet-500/15 text-lg font-semibold text-violet-700">
                    {step.index}
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-slate-950">{step.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="proveedores" className="bg-slate-50">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-20 lg:px-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-violet-600">
                Marketplace activo
              </p>
              <h2 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Un ecosistema industrial claro, confiable y moderno.
              </h2>
              <p className="max-w-3xl text-lg leading-8 text-slate-600">
                La antepropuesta visual apunta a una plataforma limpia, potente y directa.
                Esta version web toma esa linea para comunicar confianza, tecnologia y
                operacion industrial real.
              </p>
            </div>
            <a
              href="#cta"
              className="inline-flex rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
            >
              Ver todas las categorias
            </a>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {categories.map((category, index) => (
              <div
                key={category}
                className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="mb-4 h-32 rounded-2xl bg-gradient-to-br from-slate-200 via-slate-100 to-white" />
                <p className="font-semibold text-slate-950">{category}</p>
                <p className="mt-2 text-sm text-slate-600">Categoria {index + 1}</p>
              </div>
            ))}
          </div>

          <div className="rounded-[2rem] bg-slate-950 p-6 shadow-2xl shadow-slate-300/30">
            <div className="flex flex-col gap-3 pb-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-300">
                  Marketplace destacados
                </p>
                <h3 className="mt-3 text-3xl font-semibold text-white">
                  Proveedores con presencia y reputacion.
                </h3>
              </div>
              <p className="max-w-2xl text-sm leading-7 text-slate-400">
                La propuesta visual muestra marcas fuertes, datos resumidos y acceso rapido.
                Esta seccion conserva ese enfoque para construir confianza desde la home.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-4">
              {featuredSuppliers.map((supplier) => (
                <article
                  key={supplier.name}
                  className="rounded-[1.5rem] border border-white/8 bg-white/5 p-5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-sm font-bold text-slate-950">
                      {supplier.name.slice(0, 2)}
                    </div>
                    <span className="rounded-full bg-amber-400/15 px-3 py-1 text-sm font-semibold text-amber-300">
                      {supplier.rating}
                    </span>
                  </div>
                  <h4 className="mt-5 text-lg font-semibold text-white">{supplier.name}</h4>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{supplier.location}</p>
                  <a
                    href="#cta"
                    className="mt-5 inline-flex text-sm font-semibold text-sky-300 transition hover:text-sky-200"
                  >
                    Ver perfil
                  </a>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="soluciones" className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-20 lg:px-10">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-violet-600">
              Concepto visual
            </p>
            <h2 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Tecnologia para conectar. Confianza para crecer.
            </h2>
            <p className="max-w-3xl text-lg leading-8 text-slate-600">
              La antepropuesta aporta una identidad clara: industrial, confiable, intuitiva,
              escalable y tecnologica. Esa linea ya se refleja en la estructura y tono de la
              web.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {differentiators.map((item) => (
              <article
                key={item.title}
                className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl text-violet-600 shadow-sm">
                  •
                </div>
                <h3 className="mt-5 text-lg font-semibold text-slate-950">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="recursos" className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-20 lg:px-10">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-violet-600">
              Recursos
            </p>
            <h2 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Base documental y estrategica para seguir construyendo.
            </h2>
            <p className="max-w-3xl text-lg leading-8 text-slate-600">
              La propuesta visual no queda aislada: ya convive con la definicion de producto,
              arquitectura y roadmap del proyecto para que diseño y negocio avancen juntos.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">
                Producto
              </p>
              <h3 className="mt-4 text-xl font-semibold text-slate-950">Fundacion del producto</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Vision, actores, fases y decisiones clave del negocio.
              </p>
            </article>
            <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">
                MVP
              </p>
              <h3 className="mt-4 text-xl font-semibold text-slate-950">PRD web + app</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Alcance inicial, roles y funcionalidades de la primera version.
              </p>
            </article>
            <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">
                Arquitectura
              </p>
              <h3 className="mt-4 text-xl font-semibold text-slate-950">Base tecnica</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Monorepo, web, mobile, API y lineamientos de implementacion.
              </p>
            </article>
            <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">
                Branding
              </p>
              <h3 className="mt-4 text-xl font-semibold text-slate-950">Identidad visual</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Paleta, tono, principios de UI y direccion grafica inicial.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section id="cta" className="bg-slate-950">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-16 lg:px-10">
          <div className="rounded-[2rem] border border-white/10 bg-gradient-to-r from-slate-900 via-slate-950 to-violet-950/60 p-8 lg:p-12">
            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div className="space-y-5">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-300">
                  Ecosistema industrial
                </p>
                <h2 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  Un punto de encuentro entre la demanda y la oferta industrial.
                </h2>
                <p className="max-w-2xl text-lg leading-8 text-slate-300">
                  Ya existe una base visual y de producto mas consistente. El siguiente paso es
                  conectar esta experiencia web con login, dashboard comprador y flujo real de
                  pedidos sobre la API que ya esta implementada.
                </p>
              </div>
              <div className="grid gap-4">
                <a
                  href="#inicio"
                  className="rounded-full bg-gradient-to-r from-sky-500 to-violet-500 px-6 py-4 text-center font-semibold text-white transition hover:opacity-90"
                >
                  Seguir construyendo la experiencia
                </a>
                <a
                  href="#proveedores"
                  className="rounded-full border border-white/15 px-6 py-4 text-center font-semibold text-slate-200 transition hover:border-white/30 hover:bg-white/5"
                >
                  Ver propuesta comercial
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
