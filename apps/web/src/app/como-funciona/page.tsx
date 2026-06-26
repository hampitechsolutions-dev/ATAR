import Image from 'next/image';

function StepIcon({ name }: { name: 'request' | 'quotes' | 'compare' | 'produce' | 'deliver' }) {
  if (name === 'request') {
    return (
      <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24">
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

  if (name === 'quotes') {
    return (
      <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path
          d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4v8z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
        <path
          d="M8 9h8M8 13h6"
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
      <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path
          d="M12 3l-7 4v10l7 4 7-4V7l-7-4z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
        <path
          d="M12 7v14"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
        <path
          d="M5 7l7 4 7-4"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    );
  }

  if (name === 'produce') {
    return (
      <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path
          d="M10 6h4l2 3-2 3h-4L8 9l2-3z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
        <path
          d="M6 20l3-6m9 6l-3-6"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
        <path
          d="M4 20h16"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24">
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

function BenefitIcon({ name }: { name: 'shield' | 'clock' | 'star' | 'db' }) {
  if (name === 'shield') {
    return (
      <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24">
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

  if (name === 'clock') {
    return (
      <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path
          d="M12 22a10 10 0 110-20 10 10 0 010 20z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
        <path
          d="M12 6v6l4 2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    );
  }

  if (name === 'star') {
    return (
      <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24">
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

  return (
    <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24">
      <path
        d="M20 6H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M7 10h4M7 14h10"
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

export default function ComoFuncionaPage() {
  const steps = [
    {
      index: '01',
      title: 'Solicitud',
      description: 'Contá qué necesitás, subí especificaciones y cantidades.',
      icon: 'request' as const,
    },
    {
      index: '02',
      title: 'Cotizaciones',
      description: 'Proveedores verificados reciben tu solicitud y envían sus mejores propuestas.',
      icon: 'quotes' as const,
    },
    {
      index: '03',
      title: 'Comparación',
      description: 'Compará precios, plazos, calidades y condiciones para tomar la mejor decisión.',
      icon: 'compare' as const,
    },
    {
      index: '04',
      title: 'Producción',
      description: 'Aprobás y el proveedor inicia la producción. Seguimiento en tiempo real.',
      icon: 'produce' as const,
    },
    {
      index: '05',
      title: 'Entrega',
      description: 'Seguimiento logístico hasta que recibís tu pedido.',
      icon: 'deliver' as const,
    },
  ];

  const controlItems = [
    {
      title: 'Visibilidad total',
      description: 'Estado de cada pedido en tiempo real. Sin llamadas ni mensajes.',
      icon: 'chart' as const,
    },
    {
      title: 'Comunicación centralizada',
      description: 'Conversaciones, archivos y aprobaciones en un solo lugar.',
      icon: 'chat' as const,
    },
    {
      title: 'Documentación siempre disponible',
      description: 'Especificaciones, cotizaciones, órdenes y facturación organizadas.',
      icon: 'file' as const,
    },
    {
      title: 'Reportes y métricas',
      description: 'Analizá tu compra y proveedores para optimizar cada operación.',
      icon: 'pie' as const,
    },
  ];

  const benefits = [
    {
      title: 'Seguridad y confianza',
      description: 'Proveedores verificados y documentación respaldada.',
      icon: 'shield' as const,
    },
    { title: 'Ahorro de tiempo', description: 'Cotizaciones en minutos, no en días.', icon: 'clock' as const },
    { title: 'Mejores condiciones', description: 'Compará y elegí siempre la mejor opción.', icon: 'star' as const },
    {
      title: 'Decisiones basadas en datos',
      description: 'Métricas y reportes para comprar mejor, siempre.',
      icon: 'db' as const,
    },
  ];

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(59,91,255,0.12),_transparent_45%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
        <div className="mx-auto w-full max-w-7xl px-6 py-12 lg:px-10 lg:py-16">
          <div className="grid gap-10 lg:grid-cols-[0.48fr_0.52fr] lg:items-center">
            <div className="space-y-7">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600">
                Cómo funciona
              </p>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Un proceso simple. <br />
                Resultados <span className="text-indigo-600">reales</span>.
              </h1>
              <p className="max-w-xl text-lg leading-8 text-slate-600">
                De la solicitud a la entrega, ATAR conecta tu industria con los proveedores adecuados en cada etapa.
              </p>
            </div>

            <div className="relative h-[320px] w-full sm:h-[380px] lg:h-[420px]">
              <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_bottom,_rgba(59,91,255,0.20),_transparent_55%)] blur-2xl" />
              <Image
                alt="Cómo funciona ATAR"
                className="object-contain object-right"
                fill
                priority
                sizes="(min-width: 1024px) 52vw, 100vw"
                src="/cf.png"
              />
            </div>
          </div>

          <div className="pointer-events-none absolute left-10 top-[260px] hidden h-28 w-28 opacity-50 lg:block">
            <div className="grid h-full w-full grid-cols-6 gap-2">
              {Array.from({ length: 36 }).map((_, index) => (
                <span key={index} className="h-1 w-1 rounded-full bg-indigo-200" />
              ))}
            </div>
          </div>

          <div className="mt-12 rounded-[2rem] border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur">
            <div className="grid gap-8 lg:grid-cols-5">
              {steps.map((step, index) => (
                <div key={step.index} className="relative">
                  {index !== 0 ? (
                    <div className="absolute -left-6 top-7 hidden h-px w-12 bg-slate-200 lg:block" />
                  ) : null}

                  <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                    <StepIcon name={step.icon} />
                    <span className="absolute -left-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-semibold text-white">
                      {step.index}
                    </span>
                  </div>

                  <p className="mt-5 text-sm font-semibold text-slate-950">{step.title}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-[0.4fr_0.6fr] lg:items-center">
            <div className="space-y-5">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600">Cada etapa, bajo control</p>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Desde tu panel <span className="text-indigo-600">central</span>
              </h2>
              <p className="max-w-xl text-base leading-8 text-slate-600">
                Informacion clara para decidir mejor y operar con total transparencia.
              </p>

              <div className="space-y-3">
                {controlItems.map((item) => (
                  <div
                    key={item.title}
                    className="flex gap-4 rounded-[1.25rem] border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <span className="h-2 w-2 rounded-full bg-indigo-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-950">{item.title}</p>
                      <p className="mt-1 text-sm leading-7 text-slate-600">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative lg:-mr-16 xl:-mr-28">
              <div className="relative h-[360px] w-full sm:h-[420px] lg:h-[460px]">
                <Image
                  alt="Dashboard ATAR"
                  className="object-contain object-right"
                  fill
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  src="/dash.png"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Más que una plataforma, <span className="text-indigo-600">tu aliado estratégico</span>
              </h2>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {benefits.map((item) => (
              <article key={item.title} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <BenefitIcon name={item.icon} />
                </div>
                <p className="mt-5 text-base font-semibold text-slate-950">{item.title}</p>
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
