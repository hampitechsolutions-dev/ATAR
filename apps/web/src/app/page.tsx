import Image from 'next/image';

function FeatureIcon({ name }: { name: 'quote' | 'compare' | 'manage' | 'trust' }) {
  if (name === 'quote') {
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
        <path
          d="M9 13h6M9 17h6"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    );
  }

  if (name === 'compare') {
    return (
      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
        <path
          d="M7 21V7m0 0l-3 3m3-3l3 3"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
        <path
          d="M17 3v14m0 0l-3-3m3 3l3-3"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    );
  }

  if (name === 'manage') {
    return (
      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
        <path
          d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
        <path
          d="M3.3 7.3L12 12l8.7-4.7"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
        <path
          d="M12 22V12"
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
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M9 12l2 2 4-4"
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

export default function Home() {
  const stats = [
    { value: '+850', label: 'Proveedores verificados' },
    { value: '+2.500', label: 'Industrias compradoras' },
    { value: '+18.000', label: 'Solicitudes registradas' },
    { value: '+30.000', label: 'Pedidos concretados' },
  ];

  const platformFeatures = [
    {
      icon: 'quote' as const,
      title: 'Solicitá cotizaciones',
      description:
        'Enviá tu solicitud y recibí múltiples cotizaciones de proveedores verificados.',
    },
    {
      icon: 'compare' as const,
      title: 'Compará y elegí',
      description:
        'Compará precios, plazos, calidades y condiciones para tomar la mejor decisión.',
    },
    {
      icon: 'manage' as const,
      title: 'Gestioná tus pedidos',
      description:
        'Hacé seguimiento de tus pedidos, entregas y facturación desde tu panel.',
    },
    {
      icon: 'trust' as const,
      title: 'Comprá con confianza',
      description:
        'Operá con seguridad dentro de la plataforma y con el respaldo de ATAR.',
    },
  ];

  const categoryCards = [
    'Bolsas de polipropileno',
    'Bolsas para escombros',
    'Bolsas laminadas',
    'Bolsas de rafia',
    'Bolsas con fuelle',
    'Bolsas a medida',
  ];

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="relative overflow-hidden">
        <div className="mx-auto w-full max-w-7xl px-6 py-12 lg:px-10 lg:py-16">
          <div className="grid gap-10 lg:grid-cols-[0.48fr_0.52fr] lg:items-center">
            <div className="space-y-7">

            <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Conectamos industrias con los mejores proveedores de{' '}
              <span className="text-indigo-600">bolsas industriales</span>
            </h1>

            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                className="inline-flex justify-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500"
                href="/acceso"
              >
                Crear cuenta gratis
              </a>
              <a
                className="inline-flex justify-center rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                href="/como-funciona"
              >
                Ver cómo funciona
              </a>
            </div>

          </div>

            <div className="relative h-[320px] w-full sm:h-[420px] lg:hidden">
              <Image
                alt="Hero ATAR"
                className="object-contain object-right"
                fill
                priority
                sizes="100vw"
                src="/hero.png"
              />
            </div>
            <div className="hidden lg:block lg:h-[520px]" />
          </div>

          <div className="pointer-events-none absolute right-0 top-10 hidden h-[520px] w-[min(58rem,56vw)] lg:block">
            <Image
              alt="Hero ATAR"
              className="object-contain object-right"
              fill
              priority
              sizes="(min-width: 1024px) 52vw, 100vw"
              src="/hero.png"
            />
          </div>
        </div>

        <div className="mt-10 grid gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => (
            <div key={item.label} className="rounded-2xl bg-slate-50 p-5">
              <p className="text-3xl font-semibold text-slate-950">{item.value}</p>
              <p className="mt-2 text-sm text-slate-600">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="soluciones" className="border-t border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-7xl px-6 py-14 lg:px-10 lg:py-16">
          <div className="grid gap-10 lg:grid-cols-[0.36fr_0.64fr] lg:items-start">
            <div className="space-y-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-indigo-600">
                TODO LO QUE NECESITÁS, EN UN SOLO LUGAR
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Una plataforma pensada para la industria
              </h2>
              <p className="max-w-md text-sm leading-7 text-slate-500">
                Optimizá tu tiempo y asegurá las mejores condiciones de compra con herramientas
                diseñadas para vos.
              </p>
              <a className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600" href="/como-funciona">
                Conocé todas las funcionalidades <span aria-hidden="true">→</span>
              </a>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {platformFeatures.map((feature) => (
                <article
                  key={feature.title}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                    <FeatureIcon name={feature.icon} />
                  </div>
                  <h3 className="mt-5 text-sm font-semibold text-slate-950">{feature.title}</h3>
                  <p className="mt-2 text-xs leading-6 text-slate-500">{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-10">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600">
                Todo tipo de bolsas industriales
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Encontrá la bolsa ideal para tu industria
              </h2>
            </div>
            <a
              className="inline-flex rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              href="/proveedores"
            >
              Ver todas las categorías →
            </a>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {categoryCards.map((category) => (
              <div key={category} className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="relative mb-4 h-28 overflow-hidden rounded-2xl bg-slate-100">
                  <Image
                    alt="Big bag"
                    className="object-cover"
                    fill
                    sizes="(min-width: 1280px) 180px, (min-width: 1024px) 220px, (min-width: 640px) 45vw, 90vw"
                    src="/bigbag.jfif"
                  />
                </div>
                <p className="text-sm font-semibold text-slate-950">{category}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-[0.45fr_0.55fr] lg:items-center">
            <div className="space-y-5">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600">
                Para proveedores
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Mostrá tu capacidad. Conseguí más clientes.
              </h2>
              <p className="max-w-xl text-base leading-8 text-slate-600">
                Sumate a una red de empresas que buscan proveedores confiables. Mostrá tu
                propuesta de valor y ganá nuevas oportunidades de compra.
              </p>

              <div className="space-y-2 text-sm text-slate-700">
                <div className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-indigo-600" />
                  Recibí solicitudes de compra calificadas
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-indigo-600" />
                  Gestioná cotizaciones en minutos
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-indigo-600" />
                  Destacate con reputación y verificaciones
                </div>
              </div>

              <a
                className="inline-flex justify-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500"
                href="/acceso"
              >
                Quiero ser proveedor
              </a>
            </div>

            <Image
              alt="Dashboard ATAR"
              className="h-auto w-full"
              height={720}
              sizes="(min-width: 1024px) 50vw, 100vw"
              src="/dash.png"
              width={1200}
            />
          </div>
        </div>
      </section>

      <section id="recursos" className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-10">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
                Compradores
              </p>
              <p className="mt-4 text-lg font-semibold text-slate-950">
                Mejores decisiones de compra
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Compará ofertas con contexto y trazabilidad.
              </p>
            </article>
            <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
                Proveedores
              </p>
              <p className="mt-4 text-lg font-semibold text-slate-950">
                Más oportunidades calificadas
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Respondé solicitudes reales y destacá tu propuesta.
              </p>
            </article>
            <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
                Operación
              </p>
              <p className="mt-4 text-lg font-semibold text-slate-950">
                Seguimiento y control
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Flujo de pedidos, documentación y reportes.
              </p>
            </article>
            <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
                Soporte
              </p>
              <p className="mt-4 text-lg font-semibold text-slate-950">
                Acompañamiento experto
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Equipo especializado para cada etapa del proceso.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="bg-slate-950">
        <div className="mx-auto w-full max-w-7xl px-6 py-14 lg:px-10">
          <div className="rounded-[2rem] bg-[linear-gradient(135deg,#0b1220_0%,#1f1b4f_55%,#312e81_100%)] p-8 text-white lg:p-12">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3">
                <h2 className="text-3xl font-semibold">Comprá mejor. Producí más.</h2>
                <p className="max-w-2xl text-sm leading-7 text-slate-200">
                  Unificá demanda, cotizaciones y seguimiento operativo en una sola plataforma.
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
