import Image from 'next/image';
import Link from 'next/link';
import { Caveat } from 'next/font/google';
import LandingAuthRedirect from '@/components/layout/landing-auth-redirect';
import CountUp from '@/components/ui/count-up';
import Reveal from '@/components/ui/reveal';

const script = Caveat({ subsets: ['latin'], weight: ['500', '600'] });

/* ============================ ICONOS ============================ */

type IconName =
  | 'arrow'
  | 'search'
  | 'doc'
  | 'chat'
  | 'check-circle'
  | 'shield'
  | 'bolt'
  | 'truck'
  | 'users'
  | 'box'
  | 'globe';

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
    chat: (
      <>
        <path d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z" {...s} />
        <path d="M8.5 12h.01M12 12h.01M15.5 12h.01" {...s} />
      </>
    ),
    'check-circle': (
      <>
        <circle cx="12" cy="12" r="9" {...s} />
        <path d="M8.5 12.5l2.5 2.5 4.5-5" {...s} />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" {...s} />
        <path d="M9 12l2 2 4-4" {...s} />
      </>
    ),
    bolt: (
      <>
        <rect x="3" y="5" width="13" height="14" rx="2" {...s} />
        <path d="M16 9h2.5L21 12v5h-5M7 9h5M7 13h3" {...s} />
      </>
    ),
    truck: (
      <>
        <path d="M2 6h12v10H2zM14 9h4l4 4v3h-8" {...s} />
        <circle cx="6" cy="18" r="2" {...s} />
        <circle cx="18" cy="18" r="2" {...s} />
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
    globe: (
      <>
        <circle cx="12" cy="12" r="9" {...s} />
        <path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" {...s} />
      </>
    ),
  };
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24">
      {paths[name]}
    </svg>
  );
}

/* ============================ BANDERAS ============================ */

type FlagName = 'ar' | 'uy' | 'br' | 'bo' | 'cl' | 'pe' | 'py';

function Flag({ name }: { name: FlagName }) {
  const flags: Record<FlagName, React.ReactNode> = {
    ar: (
      <>
        <rect width="24" height="24" fill="#74acdf" />
        <rect y="8" width="24" height="8" fill="#fff" />
        <circle cx="12" cy="12" r="2" fill="#f6b40e" />
      </>
    ),
    uy: (
      <>
        <rect width="24" height="24" fill="#fff" />
        <rect y="5" width="24" height="3" fill="#0038a8" />
        <rect y="11" width="24" height="3" fill="#0038a8" />
        <rect y="17" width="24" height="3" fill="#0038a8" />
        <rect width="11" height="11" fill="#fff" />
        <circle cx="5.5" cy="5.5" r="2.6" fill="#fcd116" />
      </>
    ),
    br: (
      <>
        <rect width="24" height="24" fill="#009c3b" />
        <path d="M12 4l9 8-9 8-9-8z" fill="#ffdf00" />
        <circle cx="12" cy="12" r="3.8" fill="#002776" />
      </>
    ),
    bo: (
      <>
        <rect width="24" height="8" fill="#d52b1e" />
        <rect y="8" width="24" height="8" fill="#f9e300" />
        <rect y="16" width="24" height="8" fill="#007934" />
      </>
    ),
    cl: (
      <>
        <rect width="24" height="12" fill="#fff" />
        <rect y="12" width="24" height="12" fill="#d52b1e" />
        <rect width="10" height="12" fill="#0039a6" />
        <circle cx="5" cy="6" r="1.6" fill="#fff" />
      </>
    ),
    pe: (
      <>
        <rect width="24" height="24" fill="#fff" />
        <rect width="8" height="24" fill="#d91023" />
        <rect x="16" width="8" height="24" fill="#d91023" />
      </>
    ),
    py: (
      <>
        <rect width="24" height="8" fill="#d52b1e" />
        <rect y="8" width="24" height="8" fill="#fff" />
        <rect y="16" width="24" height="8" fill="#0038a8" />
      </>
    ),
  };
  return (
    <svg aria-hidden="true" className="h-5 w-5 shrink-0 overflow-hidden rounded-full ring-1 ring-slate-200" viewBox="0 0 24 24">
      <clipPath id={`flag-${name}`}>
        <circle cx="12" cy="12" r="12" />
      </clipPath>
      <g clipPath={`url(#flag-${name})`}>{flags[name]}</g>
    </svg>
  );
}

/* ============================ MAPA ============================ */

// Silueta simplificada de Sudamérica con los puntos donde hay empresas.
function SouthAmericaMap() {
  const dots = [
    { x: 64, y: 44 },
    { x: 150, y: 70 },
    { x: 60, y: 108 },
    { x: 118, y: 120 },
    { x: 166, y: 150 },
    { x: 124, y: 162 },
    { x: 84, y: 186 },
    { x: 128, y: 190 },
  ];
  return (
    <svg aria-hidden="true" className="h-full w-full" viewBox="0 0 220 270">
      <defs>
        <radialGradient id="sa-glow" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#dbe6ff" />
          <stop offset="100%" stopColor="#eef3ff" />
        </radialGradient>
      </defs>
      <path
        d="M58 28 L78 14 L102 16 L122 24 L140 30 L152 40 L162 52 L180 64 L200 84 L204 100 L194 114 L182 128 L172 146 L160 160 L146 172 L136 184 L126 194 L118 206 L112 222 L104 238 L96 254 L88 262 L84 250 L82 230 L80 208 L78 186 L76 162 L72 138 L64 118 L52 100 L42 86 L38 70 L42 54 L50 40 Z"
        fill="url(#sa-glow)"
        stroke="#bcd0ff"
        strokeWidth="1.5"
      />
      <path d="M78 186 L128 190 M76 162 L124 162 M72 138 L118 120 M64 118 L150 110 M52 100 L150 70" stroke="#cddbff" strokeWidth="1" fill="none" />
      {dots.map((dot) => (
        <g key={`${dot.x}-${dot.y}`}>
          <circle className="animate-map-pulse" cx={dot.x} cy={dot.y} r="7" fill="#2f6bff" style={{ animationDelay: `${(dot.x * 7) % 2400}ms` }} />
          <circle cx={dot.x} cy={dot.y} r="3.4" fill="#2f6bff" />
        </g>
      ))}
    </svg>
  );
}

/* ============================ DATA ============================ */

const HERO_FEATURES: { icon: IconName; text: string }[] = [
  { icon: 'shield', text: 'Proveedores verificados' },
  { icon: 'bolt', text: 'Cotizaciones en minutos' },
  { icon: 'truck', text: 'Foco en una sola industria' },
];

const CATEGORIES: { title: string; text: string; img: string }[] = [
  { title: 'Big Bags', text: 'Distintos tamaños y especificaciones.', img: '/bigbags.png' },
  { title: 'Sacos y bolsas PP', text: 'Para múltiples aplicaciones.', img: '/bolsaspp.png' },
  { title: 'Telas y rafia', text: 'Tejidos de alto rendimiento.', img: '/telasweb.png' },
  { title: 'Hilos y cuerdas', text: 'Resistencia y calidad industrial.', img: '/hilosweb.png' },
  { title: 'Polímeros', text: 'Materia prima para producir.', img: '/polimero.png' },
  { title: 'Maquinaria', text: 'Equipos y soluciones para tu planta.', img: '/maquinariaweb.png' },
];

const STEPS: { label: string; text: string; icon: IconName }[] = [
  { label: 'Buscá', text: 'Encontrá productos o proveedores.', icon: 'search' },
  { label: 'Solicitá', text: 'Enviá tu cotización con los detalles que necesitás.', icon: 'doc' },
  { label: 'Compará', text: 'Recibí propuestas de empresas verificadas.', icon: 'chat' },
  { label: 'Elegí y avanzá', text: 'Seleccioná la mejor opción y concretá tu compra.', icon: 'check-circle' },
];

const STATS: { v: string; l: string; icon: IconName }[] = [
  { v: '450+', l: 'empresas verificadas', icon: 'users' },
  { v: '12.000+', l: 'productos publicados', icon: 'box' },
  { v: '38.000+', l: 'cotizaciones gestionadas', icon: 'chat' },
  { v: '8', l: 'países de la región', icon: 'globe' },
];

const COUNTRIES: { name: string; flag: FlagName | null }[] = [
  { name: 'Argentina', flag: 'ar' },
  { name: 'Uruguay', flag: 'uy' },
  { name: 'Brasil', flag: 'br' },
  { name: 'Bolivia', flag: 'bo' },
  { name: 'Chile', flag: 'cl' },
  { name: 'Perú', flag: 'pe' },
  { name: 'Paraguay', flag: 'py' },
  { name: 'Otros', flag: null },
];

const TRUST = ['Braskem', 'ALPE', 'LyondellBasell', 'Indorama', 'Sinteplast', 'ExxonMobil', 'Sumitomo', 'Crown'];

// globals.css fija `a { color: inherit }` fuera de las capas de Tailwind, así
// que en los <Link> el color del texto va en un <span> hijo.
const primaryCta =
  'inline-flex h-12 items-center justify-center gap-2 rounded-[10px] bg-[#1f5bff] px-6 text-sm font-semibold text-white shadow-[0_14px_36px_rgba(31,91,255,0.35)] transition hover:-translate-y-0.5 hover:bg-[#194ee6] hover:shadow-[0_18px_42px_rgba(31,91,255,0.45)]';

/* ============================ HOME ============================ */

export default function Home() {
  return (
    <main className="bg-white text-slate-950">
      <LandingAuthRedirect />

      {/* ==================== HERO ==================== */}
      <section className="relative isolate overflow-hidden bg-[#0b1530] text-white">
        {/* La foto ocupa la derecha para que el big bag con el logo no quede
            debajo del texto; el degradé funde su borde con el fondo. */}
        <div className="absolute inset-y-0 right-0 w-full lg:w-[70%]">
          <Image alt="" className="animate-hero-zoom object-cover object-[60%_center]" fill priority sizes="(min-width:1024px) 70vw, 100vw" src="/heroatarweb.png" />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#0b1530_0%,#0b1530_30%,rgba(11,21,48,0.75)_45%,rgba(11,21,48,0.25)_62%,rgba(11,21,48,0)_78%)]" />
        <div className="absolute inset-0 bg-[#0b1530]/70 lg:hidden" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(0deg,rgba(11,21,48,0.55),transparent)]" />

        <div className="relative z-10 mx-auto flex min-h-[560px] w-full max-w-[1440px] items-center px-6 py-16 lg:min-h-[640px] lg:px-12">
          <div className="max-w-[760px]">
            <h1 className="animate-fade-up text-[2.8rem] font-bold leading-[1.02] tracking-[-0.04em] sm:text-[3.8rem] xl:text-[4.6rem]">
              El <span className="text-[#3b7bff] lg:whitespace-nowrap">punto de encuentro</span>
              <br className="hidden lg:block" /> <span className="lg:whitespace-nowrap">de la industria de la rafia.</span>
            </h1>
            <p className="animate-fade-up mt-6 max-w-[560px] text-lg leading-8 text-white/80 [animation-delay:150ms]">
              Comprá y vendé productos de la cadena del polipropileno, con proveedores verificados y cotizaciones en minutos.
            </p>

            <div className="animate-fade-up mt-9 flex flex-col gap-3 [animation-delay:300ms] sm:flex-row">
              <Link className={primaryCta} href="/acceso">
                <span className="inline-flex items-center gap-2 text-white">
                  Iniciar una cotización
                  <Icon name="arrow" className="h-4 w-4" />
                </span>
              </Link>
              <Link
                className="inline-flex h-12 items-center justify-center rounded-[10px] border border-white/45 px-6 text-sm font-semibold text-white transition hover:bg-white/10"
                href="/acceso"
              >
                Quiero vender en ATAR
              </Link>
            </div>

            <div className="animate-fade-up mt-10 grid max-w-lg gap-3 [animation-delay:450ms] sm:mt-12 sm:grid-cols-3 sm:gap-6">
              {HERO_FEATURES.map((item) => (
                <div key={item.text} className="flex items-center gap-3">
                  <Icon name={item.icon} className="h-6 w-6 shrink-0 text-[#5b8dff] sm:h-7 sm:w-7" />
                  <p className="text-[13px] leading-5 text-white/85">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={`${script.className} pointer-events-none absolute right-10 top-16 z-10 hidden animate-float-soft rounded-2xl bg-[#0b1530]/45 px-6 py-4 text-right text-[32px] leading-[1.1] text-white backdrop-blur-sm xl:block`}>
          Más industria.
          <br />
          Más oportunidades.
          <svg aria-hidden="true" className="ml-auto mt-1 h-4 w-48 text-[#3b7bff]" viewBox="0 0 200 16">
            <path className="animate-draw-line" d="M4 12 C60 4, 130 2, 196 6" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="4" />
          </svg>
        </div>
      </section>

      {/* ==================== CATEGORÍAS ==================== */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-[1440px] px-6 py-16 lg:px-12 lg:py-20">
          <Reveal className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Categorías principales</p>
              <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-slate-950 sm:text-[2.5rem]">
                Todo para la industria de rafia y envases industriales.
              </h2>
            </div>
            <Link className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold" href="/productos">
              <span className="inline-flex items-center gap-2 text-[#1f5bff]">
                Ver todas las categorías
                <Icon name="arrow" className="h-4 w-4" />
              </span>
            </Link>
          </Reveal>

          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
            {CATEGORIES.map((cat, index) => (
              <Reveal key={cat.title} delay={index * 80}>
              <Link
                className="group block h-full overflow-hidden rounded-[14px] border border-slate-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-[#1f5bff]/40 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)]"
                href={`/productos?q=${encodeURIComponent(cat.title.split(' ')[0])}`}
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                  <Image
                    alt={cat.title}
                    className="object-cover transition duration-500 group-hover:scale-105"
                    fill
                    sizes="(min-width:1280px) 16vw, (min-width:768px) 33vw, 50vw"
                    src={cat.img}
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[15px] font-semibold text-slate-950">{cat.title}</p>
                    <span className="text-[#1f5bff] transition group-hover:translate-x-1">
                      <Icon name="arrow" className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="mt-1.5 text-[13px] leading-5 text-slate-500">{cat.text}</p>
                </div>
              </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== CÓMO FUNCIONA ==================== */}
      <section className="bg-[#f3f6fd]">
        <div className="mx-auto w-full max-w-[1440px] px-6 py-16 lg:px-12 lg:py-20">
          <Reveal className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-3xl font-bold tracking-[-0.03em] text-slate-950 sm:text-[2.5rem]">¿Cómo funciona?</h2>
            <p className="text-[15px] text-slate-600">Simple. Rápido. Enfocado en tu industria.</p>
          </Reveal>

          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:mt-12 sm:gap-10 lg:grid-cols-4 lg:gap-6">
            {STEPS.map((step, index) => (
              <Reveal key={step.label} className="group relative flex flex-col items-start gap-3 sm:flex-row sm:gap-4" delay={index * 140}>
                <span className="flex h-10 w-10 shrink-0 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-[#e3eaff] text-lg font-semibold text-[#1f5bff] transition duration-300 group-hover:bg-[#1f5bff] group-hover:text-white">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <Icon name={step.icon} className="h-10 w-10 text-[#1f5bff] transition duration-300 group-hover:-translate-y-1" />
                  <h3 className="mt-3 text-lg font-bold text-slate-950">{step.label}</h3>
                  <p className="mt-1.5 max-w-[210px] text-sm leading-6 text-slate-500">{step.text}</p>
                </div>
                {index < STEPS.length - 1 ? (
                  <span className="absolute right-0 top-10 hidden text-[#1f5bff] lg:block">
                    <Icon name="arrow" className="h-6 w-6" />
                  </span>
                ) : null}
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== RED ESPECIALIZADA ==================== */}
      <section className="grid bg-[#0d2350] text-white lg:grid-cols-[1fr_1fr]">
        <div className="relative min-h-[300px] overflow-hidden lg:min-h-[520px]">
          <Image alt="" className="object-cover object-center transition duration-[2000ms] hover:scale-105" fill sizes="(min-width:1024px) 50vw, 100vw" src="/acceso.png" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_55%,#0d2350_100%)]" />
        </div>
        <div className="flex items-center px-6 py-14 lg:px-14">
          <Reveal className="max-w-[620px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-white/70">Una red especializada</p>
            <h2 className="mt-4 text-3xl font-bold leading-[1.1] tracking-[-0.03em] sm:text-[2.6rem]">
              Empresas reales.
              <br />
              Oportunidades concretas.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/75">
              En ATAR conectamos a toda la cadena de valor de la industria del polipropileno, con un espacio pensado
              exclusivamente para tu sector.
            </p>
            <div className="mt-10 grid grid-cols-2 gap-8 sm:grid-cols-4">
              {STATS.map((stat) => (
                <div key={stat.l}>
                  <Icon name={stat.icon} className="h-8 w-8 text-[#5b8dff]" />
                  <p className="mt-3 text-3xl font-bold tracking-tight">
                    <CountUp value={stat.v} />
                  </p>
                  <p className="mt-1 text-sm leading-5 text-white/70">{stat.l}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ==================== COMPRADORES / PROVEEDORES ==================== */}
      <section className="bg-white">
        <div className="mx-auto grid w-full max-w-[1440px] gap-5 px-6 py-12 lg:grid-cols-2 lg:px-12 lg:py-14">
          <Reveal className="group relative isolate flex min-h-[280px] overflow-hidden rounded-[16px] bg-[linear-gradient(110deg,#eef3ff_0%,#f6f8ff_55%,#dfe8ff_100%)] p-8 sm:p-10">
            <div className="pointer-events-none absolute -right-6 bottom-0 top-0 hidden w-[46%] sm:block">
              <Image alt="" className="origin-bottom-right scale-[1.35] transition duration-500 group-hover:scale-[1.42] object-contain object-right-bottom mix-blend-multiply" fill sizes="320px" src="/bolsapp.png" />
            </div>
            <div className="relative z-10 max-w-[360px]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Para compradores</p>
              <h3 className="mt-3 text-[1.9rem] font-bold leading-[1.12] tracking-[-0.03em] text-slate-950">
                Encontrá lo que necesitás, sin intermediarios.
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Solicitá cotizaciones a proveedores verificados y compará opciones en un solo lugar.
              </p>
              <Link className={`${primaryCta} mt-6`} href="/acceso">
                <span className="inline-flex items-center gap-2 text-white">
                  Iniciar una cotización
                  <Icon name="arrow" className="h-4 w-4" />
                </span>
              </Link>
            </div>
          </Reveal>

          <Reveal className="group relative isolate flex min-h-[280px] overflow-hidden rounded-[16px] bg-[linear-gradient(110deg,#eef3ff_0%,#f6f8ff_55%,#dfe8ff_100%)] p-8 sm:p-10" delay={120}>
            <div className="pointer-events-none absolute -right-2 bottom-0 top-4 hidden w-[42%] sm:block">
              <Image alt="" className="origin-bottom-right scale-[1.35] transition duration-500 group-hover:scale-[1.42] object-contain object-right-bottom mix-blend-multiply" fill sizes="320px" src="/bigbag.png" />
            </div>
            <div className="relative z-10 max-w-[360px]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Para proveedores</p>
              <h3 className="mt-3 text-[1.9rem] font-bold leading-[1.12] tracking-[-0.03em] text-slate-950">
                Llevá tus productos a más clientes.
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Publicá tu catálogo, recibí solicitudes y hacé crecer tu negocio.
              </p>
              <Link
                className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-[10px] border border-[#1f5bff]/50 bg-white px-6 text-sm font-semibold"
                href="/acceso"
              >
                <span className="inline-flex items-center gap-2 text-[#1f5bff]">
                  Quiero vender en ATAR
                  <Icon name="arrow" className="h-4 w-4" />
                </span>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ==================== REGIÓN ==================== */}
      <section className="bg-[linear-gradient(180deg,#ffffff_0%,#f3f6fd_100%)]">
        <div className="mx-auto grid w-full max-w-[1440px] items-center gap-10 px-6 py-14 lg:grid-cols-[1.1fr_0.8fr_0.7fr] lg:px-12">
          <Reveal>
            <h2 className="text-3xl font-bold tracking-[-0.03em] text-slate-950 sm:text-[2.3rem]">Una industria que mueve el mundo.</h2>
            <p className="mt-4 max-w-xl text-[15px] leading-7 text-slate-600">
              Los envases y tejidos de polipropileno son esenciales en la agricultura, la construcción, la minería, la
              alimentación y muchas otras industrias. En ATAR trabajamos para que esta cadena de valor sea más eficiente,
              conectada y competitiva.
            </p>
            <Link
              className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-[10px] border border-[#1f5bff]/50 bg-white px-6 text-sm font-semibold"
              href="/como-funciona"
            >
              <span className="inline-flex items-center gap-2 text-[#1f5bff]">
                Conocé más sobre ATAR
                <Icon name="arrow" className="h-4 w-4" />
              </span>
            </Link>
          </Reveal>

          <Reveal className="mx-auto h-[260px] w-full max-w-[260px] lg:h-[300px]" delay={120}>
            <SouthAmericaMap />
          </Reveal>

          <Reveal className="rounded-[16px] border border-slate-200 bg-white/80 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]" delay={240}>
            <p className="text-lg font-semibold leading-6 text-slate-950">
              Una red que crece
              <br />
              en la región.
            </p>
            <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3.5">
              {COUNTRIES.map((country) => (
                <li key={country.name} className="flex items-center gap-2.5 text-sm text-slate-700">
                  {country.flag ? (
                    <Flag name={country.flag} />
                  ) : (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#e3eaff] text-[#1f5bff]">
                      <Icon name="globe" className="h-3.5 w-3.5" />
                    </span>
                  )}
                  {country.name}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ==================== EMPRESAS ==================== */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-[1440px] px-6 py-14 lg:px-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-2xl font-bold tracking-[-0.03em] text-slate-950 sm:text-[2rem]">Empresas que confían en ATAR</h2>
            <Link className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold" href="/proveedores">
              <span className="inline-flex items-center gap-2 text-[#1f5bff]">
                Ver todas las empresas
                <Icon name="arrow" className="h-4 w-4" />
              </span>
            </Link>
          </div>
          {/* Cinta continua: la lista va duplicada y se desplaza la mitad. */}
          <div className="marquee mt-10 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
            <div className="marquee-track flex w-max items-center gap-16">
              {[...TRUST, ...TRUST].map((name, index) => (
                <span
                  key={`${name}-${index}`}
                  aria-hidden={index >= TRUST.length}
                  className="whitespace-nowrap text-xl font-bold tracking-tight text-slate-400 transition hover:text-slate-700"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
