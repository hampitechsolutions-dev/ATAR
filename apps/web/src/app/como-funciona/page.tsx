import Image from 'next/image';
import Link from 'next/link';

function ArrowIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

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
      description: 'Proveedores verificados reciben tu solicitud y envían sus propuestas.',
      icon: 'quotes' as const,
    },
    {
      index: '03',
      title: 'Comparación',
      description: 'Compará precios, plazos, calidades y condiciones para decidir.',
      icon: 'compare' as const,
    },
    {
      index: '04',
      title: 'Producción',
      description: 'Aprobás y el proveedor arranca. Seguimiento en tiempo real.',
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
    {
      title: 'Seguridad y confianza',
      description: 'Proveedores verificados y documentación respaldada.',
      icon: 'shield' as const,
    },
    {
      title: 'Ahorro de tiempo',
      description: 'Cotizaciones en minutos, no en días.',
      icon: 'clock' as const,
    },
    {
      title: 'Mejores condiciones',
      description: 'Compará y elegí siempre la mejor opción.',
      icon: 'star' as const,
    },
    {
      title: 'Decisiones basadas en datos',
      description: 'Métricas y reportes para comprar mejor, siempre.',
      icon: 'db' as const,
    },
  ];

  return (
    <main className="bg-white text-slate-950">
      {/* ==================== HERO (con el video) ==================== */}
      <section className="relative isolate flex min-h-[620px] items-center overflow-hidden bg-[#070b17] text-white lg:min-h-[720px]">
        <Image alt="" className="object-cover object-center" fill priority sizes="100vw" src="/heroatar.png" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#070b17_0%,rgba(7,11,23,0.94)_38%,rgba(7,11,23,0.72)_70%,rgba(7,11,23,0.55)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(7,11,23,0.7)_0%,transparent_35%)]" />

        <div className="relative z-10 mx-auto w-full max-w-[1440px] px-6 py-16 lg:px-12 lg:py-20">
          <div className="grid items-center gap-12 lg:grid-cols-[0.52fr_0.48fr] lg:gap-16">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#4f7bff]">
                Cómo funciona
              </p>
              <h1 className="mt-5 text-[2.4rem] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-5xl lg:text-[3.5rem]">
                Procesos simples. <span className="text-[#4f7bff]">Mejores resultados.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-white/70">
                De la solicitud a la entrega, ATAR conecta tu industria con los proveedores adecuados
                en cada etapa.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/acceso"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#2f6bff] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_18px_50px_rgba(47,107,255,0.4)] transition hover:bg-[#255bef]"
                >
                  Iniciar cotización
                  <ArrowIcon />
                </Link>
                <Link
                  href="/productos"
                  className="inline-flex items-center justify-center rounded-full border border-white/25 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Ver productos
                </Link>
              </div>
            </div>

            {/* El video vive dentro del hero, no como franja aparte. */}
            <div className="relative">
              <div className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-[radial-gradient(circle_at_center,rgba(47,107,255,0.28),transparent_65%)] blur-2xl" />
              <div className="relative overflow-hidden rounded-[1.5rem] shadow-[0_30px_80px_rgba(0,0,0,0.45)] ring-1 ring-white/15">
                <video
                  className="aspect-video h-full w-full object-cover"
                  controls
                  playsInline
                  preload="metadata"
                  poster="/cf.png"
                >
                  <source src="/como-funciona.mp4" type="video/mp4" />
                  Tu navegador no soporta la reproducción de video.
                </video>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== LOS CINCO PASOS ==================== */}
      <section className="bg-[#f7f8fb]">
        <div className="mx-auto w-full max-w-[1180px] px-6 py-24 lg:px-10 lg:py-28">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.3em] text-[#2f6bff]">
            El recorrido
          </p>
          <h2 className="mx-auto mt-4 max-w-2xl text-center text-3xl font-semibold tracking-[-0.02em] text-slate-950 sm:text-[2.6rem]">
            De la solicitud a la entrega, en cinco pasos.
          </h2>

          <div className="relative mt-16 grid grid-cols-1 gap-y-12 sm:grid-cols-2 lg:grid-cols-5 lg:gap-y-0">
            {/* Línea conectora: arranca y termina en el centro de los extremos. */}
            <div className="pointer-events-none absolute left-[10%] right-[10%] top-[26px] hidden h-px bg-slate-300/70 lg:block" />
            {steps.map((step) => (
              <div key={step.index} className="relative flex flex-col items-center px-4 text-center">
                <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-[#2f6bff] shadow-sm">
                  <StepIcon name={step.icon} />
                </span>
                <span className="mt-5 text-sm font-bold tracking-[0.2em] text-[#2f6bff]">
                  {step.index}
                </span>
                <h3 className="mt-2 text-lg font-semibold text-slate-950">{step.title}</h3>
                <p className="mt-2 max-w-[220px] text-sm leading-6 text-slate-500">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== PANEL CENTRAL ==================== */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-[1440px] px-6 py-24 lg:px-12 lg:py-28">
          <div className="grid gap-14 lg:grid-cols-[0.45fr_0.55fr] lg:items-center">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#2f6bff]">
                Cada etapa, bajo control
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-slate-950 sm:text-[2.6rem]">
                Todo desde tu panel central.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-8 text-slate-500">
                Información clara para decidir mejor y operar con total transparencia.
              </p>

              <div className="mt-9 space-y-6">
                {controlItems.map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#2f6bff]" />
                    <div>
                      <p className="text-base font-semibold text-slate-950">{item.title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative h-[360px] w-full sm:h-[420px] lg:h-[480px]">
              <Image
                alt="Panel de ATAR"
                className="object-contain object-center"
                fill
                sizes="(min-width: 1024px) 55vw, 100vw"
                src="/dash.png"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ==================== SEPARADOR CINEMATOGRÁFICO ==================== */}
      <section className="relative isolate flex min-h-[420px] items-center overflow-hidden bg-[#070b17] text-white lg:min-h-[520px]">
        <Image alt="" className="object-cover object-center" fill sizes="100vw" src="/hero-industria.png" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,11,23,0.9)_0%,rgba(7,11,23,0.55)_50%,rgba(7,11,23,0.2)_100%)]" />
        <div className="relative z-10 mx-auto w-full max-w-[1440px] px-6 lg:px-12">
          <h2 className="max-w-2xl text-3xl font-semibold leading-[1.1] tracking-[-0.02em] sm:text-5xl">
            Cada pedido, con la trazabilidad que la industria necesita.
          </h2>
          <span className="mt-8 block h-1 w-16 rounded-full bg-[#2f6bff]" />
        </div>
      </section>

      {/* ==================== BENEFICIOS (franja oscura) ==================== */}
      <section className="bg-[#0a0f1e] text-white">
        <div className="mx-auto w-full max-w-[1440px] px-6 py-24 lg:px-12 lg:py-28">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.32em] text-white/40">
            Por qué ATAR
          </p>
          <h2 className="mx-auto mt-4 max-w-2xl text-center text-3xl font-semibold tracking-[-0.02em] sm:text-[2.6rem]">
            Más que una plataforma, tu aliado estratégico.
          </h2>

          <div className="mt-16 grid grid-cols-1 gap-y-12 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-white/10">
            {benefits.map((item) => (
              <div key={item.title} className="flex flex-col items-center px-6 text-center">
                <span className="text-[#4f7bff]">
                  <BenefitIcon name={item.icon} />
                </span>
                <h3 className="mt-5 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 max-w-[240px] text-sm leading-6 text-white/55">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
