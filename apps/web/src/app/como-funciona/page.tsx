import Image from 'next/image';

function DashboardMock() {
  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-2xl shadow-slate-200/60">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.28),_transparent_60%)]" />
      <div className="relative space-y-4">
        <div className="flex items-center justify-between rounded-[1.5rem] bg-white/10 px-5 py-4">
          <div>
            <p className="text-sm font-semibold">Dashboard</p>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Comprador</p>
          </div>
          <div className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200">
            En vivo
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {['Solicitudes activas', 'Cotizaciones pendientes', 'Pedidos en producción'].map((label) => (
            <div key={label} className="rounded-[1.5rem] bg-white/10 px-4 py-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-300">{label}</p>
              <p className="mt-3 text-2xl font-semibold">8</p>
            </div>
          ))}
        </div>
        <div className="rounded-[1.75rem] bg-white/10 p-5">
          <p className="text-sm font-semibold">Pedidos en curso</p>
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 text-sm">
                <span className="text-slate-200">PED-2026-00{index + 7}</span>
                <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-200">
                  En curso
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
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

export default function ComoFuncionaPage() {
  const steps = [
    {
      index: '01',
      title: 'Solicitud',
      description: 'Contá qué necesitás, subí especificaciones y cantidades.',
    },
    {
      index: '02',
      title: 'Cotizaciones',
      description: 'Proveedores verificados reciben tu solicitud y envían sus mejores propuestas.',
    },
    {
      index: '03',
      title: 'Comparación',
      description: 'Compará precios, plazos, calidades y condiciones para tomar la mejor decisión.',
    },
    {
      index: '04',
      title: 'Producción',
      description: 'Aprobás y el proveedor inicia la producción. Seguimiento en tiempo real.',
    },
    {
      index: '05',
      title: 'Entrega',
      description: 'Seguimiento logístico hasta que recibís tu pedido.',
    },
  ];

  const controlItems = [
    {
      title: 'Visibilidad total',
      description: 'Estado de cada pedido en tiempo real. Sin llamadas ni mensajes.',
    },
    {
      title: 'Comunicación centralizada',
      description: 'Conversaciones, archivos y aprobaciones en un solo lugar.',
    },
    {
      title: 'Documentación siempre disponible',
      description: 'Especificaciones, cotizaciones, órdenes y facturación organizadas.',
    },
    {
      title: 'Reportes y métricas',
      description: 'Analizá tu compra y proveedores para optimizar cada operación.',
    },
  ];

  const benefits = [
    { title: 'Seguridad y confianza', description: 'Proveedores verificados y documentación respaldada.' },
    { title: 'Ahorro de tiempo', description: 'Cotizaciones en minutos, no en días.' },
    { title: 'Mejores condiciones', description: 'Compará y elegí siempre la mejor opción.' },
    { title: 'Decisiones basadas en datos', description: 'Métricas y reportes para comprar mejor, siempre.' },
  ];

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="mx-auto w-full max-w-7xl px-6 py-12 lg:px-10 lg:py-16">
        <div className="grid gap-10 lg:items-center">
          <div className="space-y-7">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600">
              Cómo funciona
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Un proceso simple. Resultados <span className="text-indigo-600">reales</span>.
            </h1>
            <p className="max-w-xl text-lg leading-8 text-slate-600">
              De la solicitud a la entrega, ATAR conecta tu industria con los proveedores adecuados en cada etapa.
            </p>
          </div>
        </div>

        <div className="mt-12 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-8 lg:grid-cols-5">
            {steps.map((step, index) => (
              <div key={step.index} className="relative">
                {index !== 0 ? (
                  <div className="absolute -left-6 top-7 hidden h-px w-12 bg-slate-200 lg:block" />
                ) : null}
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
                  {step.index}
                </div>
                <p className="mt-5 text-sm font-semibold text-slate-950">{step.title}</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-[0.4fr_0.6fr] lg:items-center">
            <div className="space-y-5">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600">
                Cada etapa, bajo control
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Desde tu panel central
              </h2>
              <p className="max-w-xl text-base leading-8 text-slate-600">
                Informacion clara para decidir mejor y operar con total transparencia.
              </p>

              <div className="space-y-3">
                {controlItems.map((item) => (
                  <div key={item.title} className="rounded-[1.25rem] border border-slate-200 bg-white p-4">
                    <p className="font-semibold text-slate-950">{item.title}</p>
                    <p className="mt-1 text-sm leading-7 text-slate-600">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <DashboardMock />
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Más que una plataforma, tu aliado estratégico
              </h2>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {benefits.map((item) => (
              <article key={item.title} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm">
                  ⬤
                </div>
                <p className="mt-5 text-lg font-semibold text-slate-950">{item.title}</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950">
        <div className="mx-auto w-full max-w-7xl px-6 py-14 lg:px-10">
          <div className="rounded-[2rem] bg-[linear-gradient(135deg,#0b1220_0%,#1f1b4f_55%,#312e81_100%)] p-8 text-white lg:p-12">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3">
                <h2 className="text-3xl font-semibold">Un proceso pensado para tu industria.</h2>
                <p className="max-w-2xl text-sm leading-7 text-slate-200">Resultados que se ven.</p>
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
