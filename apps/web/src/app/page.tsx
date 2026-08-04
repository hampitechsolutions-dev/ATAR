import Image from 'next/image';
import Link from 'next/link';

/* ============================ ICONOS ============================ */

type IconName =
  | 'arrow'
  | 'search'
  | 'doc'
  | 'compare'
  | 'cart'
  | 'check'
  | 'users'
  | 'box'
  | 'chart'
  | 'clock'
  | 'building'
  | 'plus'
  | 'shield'
  | 'in'
  | 'ig'
  | 'yt';

function Icon({ name, className = 'h-5 w-5' }: { name: IconName; className?: string }) {
  const s = { stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  const paths: Record<IconName, React.ReactNode> = {
    arrow: <path d="M5 12h14M13 6l6 6-6 6" {...s} />,
    search: (
      <>
        <circle cx="11" cy="11" r="7" {...s} />
        <path d="M21 21l-4.3-4.3" {...s} />
      </>
    ),
    doc: (
      <>
        <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z" {...s} />
        <path d="M14 3v5h5M9 13h6M9 17h4" {...s} />
      </>
    ),
    compare: <path d="M3 6h12M3 12h8M3 18h12M17 8l4-4-4-4M21 16l-4 4-4-4" {...s} />,
    cart: (
      <>
        <circle cx="9" cy="20" r="1.4" {...s} />
        <circle cx="18" cy="20" r="1.4" {...s} />
        <path d="M2 3h3l2.5 12.5a1.5 1.5 0 001.5 1.2h8a1.5 1.5 0 001.5-1.2L21 7H6" {...s} />
      </>
    ),
    check: (
      <>
        <circle cx="12" cy="12" r="9" {...s} />
        <path d="M8.5 12.5l2.5 2.5 4.5-5" {...s} />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z" {...s} />
        <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13A4 4 0 0116 11" {...s} />
      </>
    ),
    box: (
      <>
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" {...s} />
        <path d="M3.3 7.3L12 12l8.7-4.7M12 22V12" {...s} />
      </>
    ),
    chart: <path d="M4 20V4M4 20h16M8 16v-4M13 16V8M18 16v-6" {...s} />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" {...s} />
        <path d="M12 7v5l3 2" {...s} />
      </>
    ),
    building: (
      <>
        <path d="M3 21h18M6 21V4h9v17M15 21V9h3v12" {...s} />
        <path d="M9 8h3M9 12h3M9 16h3" {...s} />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" {...s} />,
    shield: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" {...s} />
        <path d="M9 12l2 2 4-4" {...s} />
      </>
    ),
    in: <path d="M6 9v9M6 6v.01M11 18v-5a2 2 0 014 0v5M11 12v6" {...s} />,
    ig: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="5" {...s} />
        <circle cx="12" cy="12" r="4" {...s} />
        <path d="M17 7v.01" {...s} />
      </>
    ),
    yt: (
      <>
        <rect x="3" y="6" width="18" height="12" rx="4" {...s} />
        <path d="M10 9.5l5 2.5-5 2.5z" {...s} fill="currentColor" />
      </>
    ),
  };
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24">
      {paths[name]}
    </svg>
  );
}

/* ============================ DATA ============================ */

const STEPS: { n: string; label: string; text: string; icon: IconName }[] = [
  { n: '01', label: 'Explorá', text: 'Buscá productos, categorías y proveedores.', icon: 'search' },
  { n: '02', label: 'Solicitá', text: 'Contanos qué necesitás y recibí cotizaciones.', icon: 'doc' },
  { n: '03', label: 'Comparó', text: 'Analizá opciones, precios y condiciones.', icon: 'compare' },
  { n: '04', label: 'Comprá y elegí', text: 'Seleccioná la mejor opción y avanzá con tu compra.', icon: 'cart' },
];

const TRUST = ['Arcor', 'Molinos', 'Cargill', 'Bünge', 'Terminal 6', 'AGD', 'Louis Dreyfus'];

const CATEGORIES: { title: string; count: string; img: string; span: string }[] = [
  { title: 'Polímeros', count: '+120 productos', img: '/polimerosweb.png', span: 'lg:col-span-2 lg:row-span-2' },
  { title: 'Envases y embalajes', count: '+65 productos', img: '/envasesweb.png', span: 'lg:col-span-2' },
  { title: 'Telas y mallas', count: '+80 productos', img: '/telasweb.png', span: '' },
  { title: 'Hilos y cuerdas', count: '+63 productos', img: '/hilosweb.png', span: '' },
  { title: 'Tintas y aditivos', count: '+35 productos', img: '/tintasweb.png', span: '' },
  { title: 'Maquinarias', count: '+25 productos', img: '/maquinariaweb.png', span: '' },
  { title: 'Bolsas plásticas', count: '+40 productos', img: '/bolsaspp.png', span: '' },
];

const BUYER_PERKS = [
  'Accedé a la red amplia de proveedores',
  'Compará precios y condiciones',
  'Ahorrá tiempo y costos operativos',
  'Gestión centralizada de solicitudes',
];

const SUPPLIER_PERKS = [
  'Perfil de empresa verificado',
  'Ofertas visibles para compradores',
  'Notificaciones de nuevas solicitudes',
  'Aumentá tus oportunidades de venta',
];

const STATS: { v: string; l: string; icon: IconName }[] = [
  { v: '450+', l: 'Empresas activas', icon: 'building' },
  { v: '12.000+', l: 'Productos disponibles', icon: 'box' },
  { v: '38.000+', l: 'Cotizaciones generadas', icon: 'chart' },
  { v: '24 h', l: 'Respuesta promedio', icon: 'clock' },
];

const HERO_STATS: { icon: IconName; v: string; l: string }[] = [
  { icon: 'users', v: '+450 empresas', l: 'confían en ATAR' },
  { icon: 'box', v: '+12.000 productos', l: 'disponibles' },
  { icon: 'clock', v: '24 h', l: 'respuesta promedio' },
];

const FOOTER_COLS: { title: string; items: { label: string; href: string }[] }[] = [
  {
    title: 'Plataforma',
    items: [
      { label: 'Productos', href: '/productos' },
      { label: 'Proveedores', href: '/proveedores' },
      { label: 'Cómo funciona', href: '/como-funciona' },
      { label: 'Planes', href: '/acceso' },
    ],
  },
  {
    title: 'Recursos',
    items: [
      { label: 'Centro de ayuda', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Guías y recursos', href: '#' },
      { label: 'Contacto', href: '/contacto' },
    ],
  },
  {
    title: 'Empresa',
    items: [
      { label: 'Sobre nosotros', href: '#' },
      { label: 'Trabajá con nosotros', href: '#' },
      { label: 'Términos y condiciones', href: '#' },
      { label: 'Política de privacidad', href: '#' },
    ],
  },
];

/* ============================ HOME ============================ */

export default function Home() {
  return (
    <main className="bg-white text-slate-950">
      {/* ==================== HERO ==================== */}
      <section className="relative isolate flex min-h-[calc(100vh-72px)] items-center overflow-hidden bg-[#070b17] text-white">
        <Image alt="" className="object-cover object-center" fill priority sizes="100vw" src="/hero-industria.png" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#070b17_0%,rgba(7,11,23,0.92)_28%,rgba(7,11,23,0.55)_55%,rgba(7,11,23,0.12)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(7,11,23,0.7)_0%,transparent_35%)]" />

        <div className="relative z-10 mx-auto w-full max-w-[1440px] px-6 py-24 lg:px-12">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70 backdrop-blur">
              El ecosistema digital de la industria
            </span>
            <h1 className="mt-7 text-[2.7rem] font-semibold leading-[1.03] tracking-[-0.03em] sm:text-6xl lg:text-[4.1rem]">
              Conectamos industrias proveedoras con la{' '}
              <span className="text-[#4f7bff]">red más grande de clientes.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-white/70">
              Encontrá productos, materias primas y proveedores especializados. Solicitá cotizaciones y generá nuevas
              oportunidades desde un solo lugar.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/acceso"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#2f6bff] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_18px_50px_rgba(47,107,255,0.4)] transition hover:bg-[#255bef]"
              >
                Iniciar cotización
                <Icon name="arrow" className="h-4 w-4" />
              </Link>
              <Link
                href="/acceso"
                className="inline-flex items-center justify-center rounded-full border border-white/25 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Quiero vender en ATAR
              </Link>
            </div>

            <div className="mt-14 flex flex-wrap gap-x-12 gap-y-5">
              {HERO_STATS.map((item) => (
                <div key={item.v} className="flex items-center gap-2.5">
                  <Icon name={item.icon} className="h-5 w-5 text-[#4f7bff]" />
                  <p className="text-sm text-white/75">
                    <span className="font-semibold text-white">{item.v}</span> {item.l}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== EMPRESAS (franja oscura) ==================== */}
      <section className="bg-[#0a0f1e]">
        <div className="mx-auto w-full max-w-[1440px] px-6 py-16 lg:px-12">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.32em] text-white/40">
            Empresas que ya confían en ATAR
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-14 gap-y-8 lg:justify-between">
            {TRUST.map((name) => (
              <span key={name} className="text-xl font-semibold italic tracking-tight text-white/45 lg:text-[22px]">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== CÓMO FUNCIONA (timeline) ==================== */}
      <section className="bg-[#f7f8fb]">
        <div className="mx-auto w-full max-w-[1180px] px-6 py-24 lg:px-10 lg:py-28">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.3em] text-[#2f6bff]">
            ¿Cómo funciona?
          </p>
          <h2 className="mx-auto mt-4 max-w-2xl text-center text-3xl font-semibold tracking-[-0.02em] text-slate-950 sm:text-[2.6rem]">
            Del requerimiento a la compra, en cuatro pasos.
          </h2>

          <div className="relative mt-16 grid grid-cols-1 gap-y-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-y-0">
            {/* línea conectora */}
            <div className="pointer-events-none absolute left-[12.5%] right-[12.5%] top-[26px] hidden h-px bg-slate-300/70 lg:block" />
            {STEPS.map((step) => (
              <div key={step.n} className="relative flex flex-col items-center px-4 text-center">
                <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-[#2f6bff] shadow-sm">
                  <Icon name={step.icon} className="h-6 w-6" />
                </span>
                <span className="mt-5 text-sm font-bold tracking-[0.2em] text-[#2f6bff]">{step.n}</span>
                <h3 className="mt-2 text-lg font-semibold text-slate-950">{step.label}</h3>
                <p className="mt-2 max-w-[220px] text-sm leading-6 text-slate-500">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== SEPARADOR CINEMATOGRÁFICO ==================== */}
      <section className="relative isolate flex min-h-[420px] items-center overflow-hidden bg-[#070b17] text-white lg:min-h-[520px]">
        <Image alt="" className="object-cover object-center" fill sizes="100vw" src="/heroatar.png" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,11,23,0.9)_0%,rgba(7,11,23,0.55)_50%,rgba(7,11,23,0.2)_100%)]" />
        <div className="relative z-10 mx-auto w-full max-w-[1440px] px-6 lg:px-12">
          <h2 className="max-w-2xl text-3xl font-semibold leading-[1.1] tracking-[-0.02em] sm:text-5xl">
            La industria argentina se mueve más rápido cuando todos están conectados.
          </h2>
          <span className="mt-8 block h-1 w-16 rounded-full bg-[#2f6bff]" />
        </div>
      </section>

      {/* ==================== CATEGORÍAS (bento) ==================== */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-[1440px] px-6 py-24 lg:px-12">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#2f6bff]">Explorá por categoría</p>
              <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-[-0.02em] text-slate-950 sm:text-[2.6rem]">
                Productos, materias primas y soluciones para tu industria.
              </h2>
            </div>
            <Link
              href="/productos"
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              Ver todas las categorías
              <Icon name="arrow" className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 grid auto-rows-[190px] grid-cols-2 gap-4 lg:grid-flow-dense lg:grid-cols-4 lg:auto-rows-[215px]">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.title}
                href="/productos"
                className={`group relative overflow-hidden rounded-3xl bg-slate-900 ${
                  cat.span.includes('col-span-2') ? 'col-span-2' : ''
                } ${cat.span}`}
              >
                <Image
                  alt={cat.title}
                  className="object-cover transition duration-500 group-hover:scale-[1.06]"
                  fill
                  sizes="(min-width:1024px) 50vw, 100vw"
                  src={cat.img}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/15 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-end p-5">
                  <p className="text-lg font-semibold text-white drop-shadow-sm">{cat.title}</p>
                  <p className="mt-0.5 text-xs text-white/70">{cat.count}</p>
                </div>
                <span className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white opacity-0 backdrop-blur transition group-hover:opacity-100">
                  <Icon name="arrow" className="h-4 w-4" />
                </span>
              </Link>
            ))}

            {/* Más categorías */}
            <Link
              href="/productos"
              className="group flex flex-col justify-between rounded-3xl border border-slate-200 bg-[#f7f8fb] p-5 transition hover:border-[#2f6bff]/40 hover:bg-[#f2f5ff]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#2f6bff] shadow-sm">
                <Icon name="plus" className="h-5 w-5" />
              </span>
              <div>
                <p className="text-lg font-semibold text-slate-950">Más categorías</p>
                <p className="mt-0.5 text-sm text-slate-500">Explorá todas las opciones</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ==================== ESCENAS COMPRADOR / PROVEEDOR ==================== */}
      <section className="bg-[#070b17]">
        <div className="grid lg:grid-cols-2">
          {/* Comprador */}
          <div className="relative isolate flex min-h-[560px] flex-col justify-center overflow-hidden bg-[#0a1020] px-6 py-20 text-white lg:px-14">
            <Image alt="" className="object-cover object-right opacity-30" fill sizes="50vw" src="/dash.png" />
            <div className="absolute inset-0 bg-[linear-gradient(120deg,#0a1020_0%,rgba(10,16,32,0.85)_45%,rgba(10,16,32,0.4)_100%)]" />
            <div className="relative z-10 max-w-md">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#4f7bff]">Para compradores</p>
              <h3 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.02em] sm:text-4xl">
                Una necesidad.
                <br />
                Múltiples oportunidades.
              </h3>
              <p className="mt-4 text-base leading-7 text-white/65">
                Recibí cotizaciones personalizadas de múltiples proveedores y elegí la mejor opción.
              </p>
              <ul className="mt-6 space-y-3">
                {BUYER_PERKS.map((perk) => (
                  <li key={perk} className="flex items-center gap-3 text-sm text-white/80">
                    <Icon name="check" className="h-5 w-5 text-[#4f7bff]" />
                    {perk}
                  </li>
                ))}
              </ul>
              <Link
                href="/acceso"
                className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#2f6bff] px-6 text-sm font-semibold text-white transition hover:bg-[#255bef]"
              >
                Iniciar cotización
                <Icon name="arrow" className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Proveedor */}
          <div className="relative isolate flex min-h-[560px] flex-col justify-center overflow-hidden bg-[#0a1020] px-6 py-20 text-white lg:px-14">
            <Image alt="" className="object-cover object-center opacity-40" fill sizes="50vw" src="/maquinariaweb.png" />
            <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(10,16,32,0.55)_0%,rgba(10,16,32,0.8)_60%,#0a1020_100%)]" />
            <div className="relative z-10 ml-auto max-w-md text-right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#4f7bff]">Para proveedores</p>
              <h3 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.02em] sm:text-4xl">
                Tu empresa frente a nuevos compradores.
              </h3>
              <p className="mt-4 text-base leading-7 text-white/65">
                Publicá tus productos y recibí solicitudes de cotización de empresas que buscan lo que ofrecés.
              </p>
              <ul className="mt-6 space-y-3">
                {SUPPLIER_PERKS.map((perk) => (
                  <li key={perk} className="flex items-center justify-end gap-3 text-sm text-white/80">
                    {perk}
                    <Icon name="check" className="h-5 w-5 text-[#4f7bff]" />
                  </li>
                ))}
              </ul>
              <Link
                href="/acceso"
                className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/25 px-6 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Quiero vender en ATAR
                <Icon name="arrow" className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== NÚMEROS ==================== */}
      <section className="relative overflow-hidden bg-[#0a0f1e] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(47,107,255,0.16),transparent_55%)]" />
        <div className="relative mx-auto w-full max-w-[1440px] px-6 py-20 lg:px-12">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.32em] text-white/40">ATAR en números</p>
          <div className="mt-12 grid grid-cols-2 gap-y-12 lg:grid-cols-4 lg:divide-x lg:divide-white/10">
            {STATS.map((stat) => (
              <div key={stat.l} className="flex flex-col items-center px-4 text-center">
                <Icon name={stat.icon} className="h-6 w-6 text-[#4f7bff]" />
                <p className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">{stat.v}</p>
                <p className="mt-2 text-sm text-white/55">{stat.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== CTA FINAL ==================== */}
      <section className="relative isolate flex min-h-[520px] items-center overflow-hidden bg-[#05070f] text-white lg:min-h-[600px]">
        <Image alt="" className="object-cover object-center opacity-45" fill sizes="100vw" src="/hero-industria.png" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,7,15,0.85)_0%,rgba(5,7,15,0.7)_50%,rgba(5,7,15,0.92)_100%)]" />
        <div className="relative z-10 mx-auto w-full max-w-[1100px] px-6 text-center lg:px-10">
          <h2 className="mx-auto max-w-3xl text-4xl font-semibold leading-[1.08] tracking-[-0.02em] sm:text-6xl">
            La industria se mueve más rápido cuando todos trabajan juntos.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base text-white/60">Sin costos iniciales. Cancelá cuando quieras.</p>
          <Link
            href="/acceso"
            className="mt-10 inline-flex h-14 items-center justify-center gap-2 rounded-full bg-[#2f6bff] px-9 text-base font-semibold text-white shadow-[0_20px_60px_rgba(47,107,255,0.4)] transition hover:bg-[#255bef]"
          >
            Crear cuenta gratis
            <Icon name="arrow" className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* ==================== FOOTER OSCURO ==================== */}
      <footer className="bg-[#070b17] text-white">
        <div className="mx-auto w-full max-w-[1440px] px-6 py-16 lg:px-12">
          <div className="grid gap-12 lg:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_1.2fr]">
            <div>
              <div className="flex items-center gap-2.5">
                <Image alt="ATAR" height={30} src="/logoatarblanco.png" width={30} />
                <span className="text-lg font-bold tracking-tight">ATAR</span>
              </div>
              <p className="mt-4 max-w-xs text-sm leading-6 text-white/50">
                Conectamos industrias proveedoras con la red más grande de clientes.
              </p>
              <div className="mt-6 flex gap-3">
                {(['in', 'ig', 'yt'] as IconName[]).map((social) => (
                  <span
                    key={social}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/60 transition hover:border-white/40 hover:text-white"
                  >
                    <Icon name={social} className="h-4 w-4" />
                  </span>
                ))}
              </div>
            </div>

            {FOOTER_COLS.map((col) => (
              <div key={col.title}>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">{col.title}</p>
                <ul className="mt-5 space-y-3">
                  {col.items.map((item) => (
                    <li key={item.label}>
                      <Link className="text-sm text-white/65 transition hover:text-white" href={item.href}>
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">
                Suscribite a nuestro newsletter
              </p>
              <form className="mt-5 flex items-center gap-2 rounded-full border border-white/15 bg-white/5 p-1.5">
                <input
                  className="w-full bg-transparent px-4 py-2 text-sm text-white outline-none placeholder:text-white/40"
                  placeholder="Tu email"
                  type="email"
                />
                <button
                  type="submit"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2f6bff] text-white transition hover:bg-[#255bef]"
                  aria-label="Suscribirme"
                >
                  <Icon name="arrow" className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>

          <div className="mt-14 border-t border-white/10 pt-6 text-center text-xs text-white/40">
            © 2026 ATAR. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </main>
  );
}
