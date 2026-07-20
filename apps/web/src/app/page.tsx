import Image from 'next/image';
import Link from 'next/link';

function CheckIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M8.5 12.5l2.5 2.5 4.5-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function ArrowIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

type IconName = 'search' | 'request' | 'connect' | 'compare' | 'efficiency' | 'trust' | 'custom' | 'human';

function LineIcon({ name, className = 'h-6 w-6' }: { name: IconName; className?: string }) {
  const p = { stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  const paths: Record<IconName, React.ReactNode> = {
    search: (
      <>
        <circle cx="11" cy="11" r="7" {...p} />
        <path d="M21 21l-4.35-4.35" {...p} />
      </>
    ),
    request: (
      <>
        <path d="M14 2H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V8l-5-6z" {...p} />
        <path d="M14 2v6h6M12 11v6M9 14h6" {...p} />
      </>
    ),
    connect: (
      <>
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" {...p} />
        <path d="M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" {...p} />
      </>
    ),
    compare: (
      <>
        <circle cx="12" cy="12" r="9" {...p} />
        <path d="M8.5 12.5l2.5 2.5 4.5-5" {...p} />
      </>
    ),
    efficiency: <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" {...p} />,
    trust: (
      <>
        <path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3z" {...p} />
        <path d="M9.5 12l1.7 1.7L15 10" {...p} />
      </>
    ),
    custom: (
      <>
        <circle cx="12" cy="12" r="9" {...p} />
        <circle cx="12" cy="12" r="4" {...p} />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
      </>
    ),
    human: (
      <>
        <path d="M4 13v-1a8 8 0 0116 0v1" {...p} />
        <rect x="3" y="13" width="4" height="6" rx="1.5" {...p} />
        <rect x="17" y="13" width="4" height="6" rx="1.5" {...p} />
        <path d="M21 19a4 4 0 01-4 4h-3" {...p} />
      </>
    ),
  };
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24">
      {paths[name]}
    </svg>
  );
}

const HERO_PERKS = ['Red de proveedores verificados', 'Solicitudes sin costo', 'Acompañamiento experto'];

const TRUST = ['Arcor', 'Molinos', 'Ledesma', 'Quickfood', 'Cargill', 'Ternium', 'Acindar'];

const STEPS: { n: string; icon: IconName; title: string; text: string }[] = [
  { n: '01', icon: 'search', title: 'Explorá', text: 'Encontrá productos, materias primas y proveedores.' },
  { n: '02', icon: 'request', title: 'Solicitá', text: 'Contanos qué necesita tu empresa de forma simple y rápida.' },
  { n: '03', icon: 'connect', title: 'Conectá', text: 'Recibí propuestas de proveedores especializados.' },
  { n: '04', icon: 'compare', title: 'Compará y elegí', text: 'Evaluá condiciones, compará y avanzá con la mejor alternativa.' },
];

const CATEGORIES: { label: string; image: string }[] = [
  { label: 'Big Bags', image: '/bigbag.png' },
  { label: 'Bolsas industriales', image: '/bolsapp.png' },
  { label: 'Polipropileno', image: '/rollo.png' },
  { label: 'Polietileno', image: '/bolsapp.png' },
  { label: 'Rollos y telas', image: '/rollo.png' },
  { label: 'Tintas', image: '/amedida.png' },
  { label: 'Sacos', image: '/saco.png' },
  { label: 'Fibras', image: '/saco.png' },
  { label: 'Aditivos e insumos', image: '/amedida.png' },
  { label: 'Maquinaria', image: '/rollo.png' },
  { label: 'Servicios industriales', image: '/bigbag.png' },
  { label: 'Soluciones a medida', image: '/amedida.png' },
];

const WHY: { icon: IconName; title: string; text: string }[] = [
  { icon: 'efficiency', title: 'Eficiencia en cada compra', text: 'Simplificamos tu proceso de compra industrial para que ahorres tiempo y recursos.' },
  { icon: 'trust', title: 'Red de confianza', text: 'Trabajamos con proveedores verificados para garantizar transparencia y seguridad.' },
  { icon: 'custom', title: 'Soluciones a medida', text: 'Encontrá productos, materias primas e insumos adaptados a las necesidades de tu empresa.' },
  { icon: 'human', title: 'Acompañamiento humano', text: 'Nuestro equipo te asesora en cada etapa para que tomes siempre la mejor decisión.' },
];

const eyebrow = 'text-[11px] font-bold uppercase tracking-[0.22em] text-indigo-600';

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image alt="" className="object-cover object-center" fill priority sizes="100vw" src="/heroatar.png" />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-[1440px] px-6 py-16 lg:px-10 lg:py-28">
          <div className="max-w-xl">
            <p className={eyebrow}>Ecosistema B2B industrial</p>
            <h1 className="mt-4 text-[34px] font-semibold leading-[1.08] tracking-[-0.03em] text-slate-950 sm:text-[46px]">
              Conectamos empresas.
              <br />
              <span className="text-blue-600">Impulsamos negocios.</span>
              <br />
              Simplificamos la industria.
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-7 text-slate-500">
              Encontrá productos, materias primas y proveedores especializados. Solicitá cotizaciones y generá nuevas
              oportunidades desde un solo lugar.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(79,70,229,0.28)] transition hover:bg-indigo-500"
                href="/proveedores"
              >
                Encontrar proveedores
                <ArrowIcon />
              </Link>
              <Link
                className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-300 px-6 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                href="/acceso"
              >
                Quiero vender en ATAR
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3">
              {HERO_PERKS.map((perk) => (
                <span key={perk} className="inline-flex items-center gap-2 text-[13px] font-medium text-slate-600">
                  <CheckIcon className="h-4 w-4 text-indigo-600" />
                  {perk}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="border-y border-slate-200 bg-[#f6f7fb]">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center gap-6 px-6 py-6 lg:flex-row lg:px-10">
          <p className="shrink-0 text-[11px] font-bold uppercase leading-4 tracking-[0.16em] text-slate-400 lg:max-w-[120px]">
            Empresas que ya confían en ATAR
          </p>
          <div className="flex flex-1 flex-wrap items-center justify-center gap-x-8 gap-y-3 lg:justify-between">
            {TRUST.map((name) => (
              <span key={name} className="text-lg font-bold italic tracking-tight text-slate-400">
                {name}
              </span>
            ))}
            <span className="text-sm font-semibold text-slate-400">+1200 empresas más</span>
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-[1440px] px-6 py-16 lg:px-10">
          <p className={`text-center ${eyebrow}`}>Cómo funciona</p>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <div key={step.n} className="relative flex flex-col items-center text-center">
                {index < STEPS.length - 1 ? (
                  <span className="absolute left-[calc(50%+44px)] top-9 hidden h-px w-[calc(100%-88px)] bg-slate-200 lg:block" />
                ) : null}
                <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full border border-slate-200 bg-white text-indigo-600 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                  <LineIcon name={step.icon} />
                </div>
                <p className="mt-5 text-xs font-bold text-slate-400">{step.n}</p>
                <h3 className="mt-1 text-base font-semibold text-slate-950">{step.title}</h3>
                <p className="mt-2 max-w-[220px] text-[13px] leading-5 text-slate-500">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORÍAS */}
      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-[1440px] px-6 py-16 lg:px-10">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className={eyebrow}>Explorá por categorías</p>
              <h2 className="mt-2 text-[26px] font-semibold tracking-[-0.02em] text-slate-950 sm:text-[32px]">
                Productos, materias primas y soluciones para tu industria
              </h2>
            </div>
            <Link
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              href="/proveedores"
            >
              Ver todas las categorías
              <ArrowIcon />
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {CATEGORIES.map((category) => (
              <Link
                key={category.label}
                className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(15,23,42,0.10)]"
                href="/proveedores"
              >
                <div className="relative h-[110px] w-full overflow-hidden rounded-xl bg-[linear-gradient(180deg,#ffffff_0%,#f3f4ff_100%)]">
                  <Image alt={category.label} className="object-contain p-2" fill sizes="180px" src={category.image} />
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <p className="text-[13px] font-semibold leading-4 text-slate-950">{category.label}</p>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
                    <ArrowIcon className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* PANELES COMPRADOR / PROVEEDOR */}
      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid w-full max-w-[1440px] gap-6 px-6 py-16 lg:grid-cols-2 lg:px-10">
          {/* Comprador */}
          <div className="overflow-hidden rounded-[26px] bg-[linear-gradient(150deg,#0b1220_0%,#141a3a_60%,#1e2358_100%)] p-6 text-white lg:p-8">
            <div className="grid gap-6 md:grid-cols-2 md:items-center">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-300">Para compradores</p>
                <h3 className="mt-3 text-[24px] font-semibold leading-tight">
                  Una necesidad.
                  <br />
                  Múltiples oportunidades.
                </h3>
                <p className="mt-3 text-[13px] leading-6 text-white/70">
                  Solicitá cotizaciones, compará propuestas y conectá con los mejores proveedores.
                </p>
                <ul className="mt-4 space-y-2 text-[13px] text-white/85">
                  {['Accedé a una amplia red de proveedores', 'Compará precios y condiciones', 'Ahorrá tiempo en cada compra', 'Gestión centralizada de solicitudes'].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-indigo-300" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-slate-950 transition hover:bg-slate-100" href="/proveedores">
                  Encontrar proveedores
                  <ArrowIcon />
                </Link>
              </div>

              <div className="rounded-2xl bg-white p-4 text-slate-950 shadow-2xl">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <LineIcon name="request" className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold">Nueva solicitud</p>
                    <p className="text-[11px] text-slate-500">Bolsas PP · 10.000 unidades</p>
                  </div>
                </div>
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Propuestas recibidas</p>
                <div className="mt-2 space-y-2">
                  {[
                    { name: 'Proveedor 1', price: '$ 98.500' },
                    { name: 'Proveedor 2', price: '$ 102.300' },
                    { name: 'Proveedor 3', price: '$ 105.000' },
                  ].map((row) => (
                    <div key={row.name} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="h-7 w-7 rounded-full bg-slate-200" />
                        <div>
                          <p className="text-[12px] font-semibold">{row.name}</p>
                          <p className="text-[10px] text-amber-500">★★★★★</p>
                        </div>
                      </div>
                      <p className="text-[13px] font-bold text-slate-950">{row.price}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Proveedor */}
          <div className="overflow-hidden rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)] lg:p-8">
            <div className="grid gap-6 md:grid-cols-2 md:items-center">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-600">Para proveedores</p>
                <h3 className="mt-3 text-[24px] font-semibold leading-tight text-slate-950">
                  Tu empresa frente a nuevos compradores.
                </h3>
                <p className="mt-3 text-[13px] leading-6 text-slate-500">
                  Mostrá tus productos, capacidades y soluciones. Recibí oportunidades comerciales y construí nuevas
                  relaciones dentro de la industria.
                </p>
                <ul className="mt-4 space-y-2 text-[13px] text-slate-700">
                  {['Perfil comercial verificado', 'Recibí solicitudes relevantes', 'Gestioná oportunidades fácilmente', 'Aumentá tu visibilidad en el mercado'].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-indigo-600" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-500" href="/acceso">
                  Sumar mi empresa
                  <ArrowIcon />
                </Link>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-semibold text-slate-950">Perfil de proveedor</p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Verificado
                  </span>
                </div>
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Productos destacados</p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {['/bigbag.png', '/rollo.png', '/bolsapp.png'].map((src) => (
                    <div key={src} className="relative h-14 overflow-hidden rounded-xl bg-[linear-gradient(180deg,#ffffff_0%,#f3f4ff_100%)]">
                      <Image alt="" className="object-contain p-1.5" fill sizes="80px" src={src} />
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Solicitudes activas</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-slate-50 px-3 py-3">
                    <p className="text-xl font-bold text-slate-950">12</p>
                    <p className="text-[11px] text-slate-500">Nuevas</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-3">
                    <p className="text-xl font-bold text-slate-950">28</p>
                    <p className="text-[11px] text-slate-500">En negociación</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* POR QUÉ ELEGIR ATAR */}
      <section id="recursos" className="border-t border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-[1440px] px-6 py-16 lg:px-10">
          <p className={`text-center ${eyebrow}`}>Por qué elegir ATAR</p>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {WHY.map((item) => (
              <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <LineIcon name={item.icon} className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-[15px] font-semibold text-slate-950">{item.title}</h3>
                <p className="mt-2 text-[13px] leading-6 text-slate-500">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

    </main>
  );
}
