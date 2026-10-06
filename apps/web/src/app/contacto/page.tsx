import Image from 'next/image';
import Reveal from '@/components/ui/reveal';

/* ============================ ICONOS ============================ */

type IconName = 'arrow' | 'chat' | 'mail' | 'phone' | 'calendar' | 'clock' | 'pin' | 'lock';

function Icon({ name, className = 'h-5 w-5' }: { name: IconName; className?: string }) {
  const paths: Record<IconName, string> = {
    arrow: 'M5 12h14M13 6l6 6-6 6',
    chat: 'M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4v8z',
    mail: 'M4 6h16v12H4zM4 8l8 6 8-6',
    phone: 'M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 1.9.7 2.8a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.4c.9.3 1.8.6 2.8.7a2 2 0 011.7 2z',
    calendar: 'M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z',
    clock: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2',
    pin: 'M12 21s7-6.1 7-11a7 7 0 10-14 0c0 4.9 7 11 7 11zM12 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
    lock: 'M6 11h12a1 1 0 011 1v8a1 1 0 01-1 1H6a1 1 0 01-1-1v-8a1 1 0 011-1zM8 11V7a4 4 0 018 0v4',
  };
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d={paths[name]} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

/* ============================ CONTENIDO ============================ */

const EMAIL = 'hola@atar.com.ar';
const PHONE = '+54 11 1234 5678';
const PHONE_HREF = 'tel:+541112345678';

const CONTACT_OPTIONS: { title: string; description: string; action: string; href: string; icon: IconName }[] = [
  { title: 'Chat en vivo', description: 'Hablá con nuestro equipo en tiempo real y resolvé tus consultas al instante.', action: 'Iniciar chat', href: '#consulta', icon: 'chat' },
  { title: 'Email', description: 'Enviános tu consulta y te responderemos a la brevedad.', action: EMAIL, href: `mailto:${EMAIL}`, icon: 'mail' },
  { title: 'Teléfono', description: 'Llamanos de lunes a viernes de 9 a 18 hs.', action: PHONE, href: PHONE_HREF, icon: 'phone' },
  { title: 'Agenda una reunión', description: 'Coordina una reunión con un especialista y conocé más sobre ATAR.', action: 'Agendar reunión', href: '#consulta', icon: 'calendar' },
];

// globals.css fija `a { color: inherit }`: el color del texto de los enlaces va en la clase del propio enlace.
const primaryCta =
  'inline-flex h-12 items-center justify-center gap-2 rounded-[10px] bg-[#1f5bff] px-6 text-sm font-semibold text-white shadow-[0_14px_36px_rgba(31,91,255,0.35)] transition hover:-translate-y-0.5 hover:bg-[#194ee6]';
const field =
  'h-12 w-full rounded-[10px] border border-slate-300 bg-white px-4 text-[15px] text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#1f5bff] focus:ring-4 focus:ring-[#1f5bff]/15';
const eyebrow = 'text-[11px] font-semibold uppercase tracking-[0.24em]';

/* ============================ PÁGINA ============================ */

export default function ContactoPage() {
  return (
    <main className="bg-white text-slate-950">
      {/* ==================== HERO ==================== */}
      <section className="relative isolate overflow-hidden bg-[#0b1530] text-white">
        <div className="absolute inset-y-0 right-0 w-full lg:w-[66%]">
          <Image alt="" className="animate-hero-zoom object-cover object-center" fill priority sizes="(min-width:1024px) 66vw, 100vw" src="/login.png" />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#0b1530_0%,#0b1530_34%,rgba(11,21,48,0.82)_50%,rgba(11,21,48,0.4)_72%,rgba(11,21,48,0.25)_100%)]" />
        <div className="absolute inset-0 bg-[#0b1530]/60 lg:hidden" />

        <div className="relative z-10 mx-auto flex min-h-[480px] w-full max-w-[1440px] items-center px-6 py-16 lg:min-h-[540px] lg:px-12">
          <div className="max-w-[680px]">
            <p className={`animate-fade-up ${eyebrow} text-white/80`}>Estamos para ayudarte</p>
            <h1 className="animate-fade-up mt-4 text-[2.5rem] font-bold leading-[1.05] tracking-[-0.04em] [animation-delay:100ms] sm:text-[3.3rem] xl:text-[3.8rem]">
              Hablemos de cómo ATAR puede <span className="text-[#3b7bff]">impulsar tu industria.</span>
            </h1>
            <p className="animate-fade-up mt-5 max-w-[540px] text-[17px] leading-7 text-white/80 [animation-delay:200ms]">
              Nuestro equipo está listo para asesorarte, resolver tus dudas y ayudarte a encontrar la mejor solución para tu negocio.
            </p>
            <div className="animate-fade-up mt-8 flex flex-col gap-3 [animation-delay:300ms] sm:flex-row">
              <a className={primaryCta} href="#consulta">
                Enviar mensaje
                <Icon className="h-4 w-4" name="arrow" />
              </a>
              <a className="inline-flex h-12 items-center justify-center gap-2 rounded-[10px] border border-white/60 px-6 text-sm font-semibold text-white transition hover:bg-white/10" href={PHONE_HREF}>
                <Icon className="h-4 w-4" name="phone" />
                Llamar ahora
              </a>
            </div>
            <p className="animate-fade-up mt-8 flex items-center gap-3 text-[14px] text-white/85 [animation-delay:400ms]">
              <Icon className="h-6 w-6 shrink-0 text-[#5b8dff]" name="clock" />
              Respuestas en menos de 24 hs
            </p>
          </div>
        </div>
      </section>

      {/* ==================== CANALES ==================== */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-[1440px] px-6 py-16 lg:px-12 lg:py-20">
          <Reveal>
            <p className={`${eyebrow} text-slate-500`}>Canales de contacto</p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-[#0b1530] sm:text-[2.5rem]">Elegí cómo querés contactarnos</h2>
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CONTACT_OPTIONS.map((option, index) => (
              <Reveal key={option.title} delay={index * 100}>
                <a
                  className="group flex h-full flex-col rounded-[14px] border border-slate-300 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-[#1f5bff] hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)]"
                  href={option.href}
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#dbe6ff] text-[#1f5bff]">
                    <Icon className="h-6 w-6" name={option.icon} />
                  </span>
                  <span className="mt-5 text-[19px] font-bold text-[#0b1530]">{option.title}</span>
                  <span className="mt-2 text-[14px] leading-6 text-slate-600">{option.description}</span>
                  <span className="mt-auto flex items-center gap-1.5 pt-5 text-[14px] font-semibold text-[#1f5bff]">
                    {option.action}
                    <Icon className="h-4 w-4 transition group-hover:translate-x-0.5" name="arrow" />
                  </span>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== CONSULTA ==================== */}
      <section className="scroll-mt-6 bg-[linear-gradient(180deg,#f3f6fd_0%,#ffffff_100%)]" id="consulta">
        <div className="mx-auto grid w-full max-w-[1440px] gap-6 px-6 py-16 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:px-12 lg:py-20">
          <Reveal className="rounded-[16px] border border-slate-300 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-8">
            <p className={`${eyebrow} text-slate-500`}>Formulario</p>
            <h2 className="mt-3 text-[1.9rem] font-bold tracking-[-0.03em] text-[#0b1530]">Enviános tu consulta</h2>
            <p className="mt-2 text-[15px] leading-6 text-slate-600">Completá el formulario y te contactaremos lo antes posible.</p>

            <form className="mt-7 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-[14px] font-semibold text-slate-800">
                  Nombre y apellido
                  <input autoComplete="name" className={`${field} mt-2 font-normal`} name="nombre" placeholder="Ej. Juan Pérez" />
                </label>
                <label className="block text-[14px] font-semibold text-slate-800">
                  Email corporativo
                  <input autoComplete="email" className={`${field} mt-2 font-normal`} name="email" placeholder="Ej. juan@empresa.com" type="email" />
                </label>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-[14px] font-semibold text-slate-800">
                  Empresa
                  <input autoComplete="organization" className={`${field} mt-2 font-normal`} name="empresa" placeholder="Ej. Empresa S.A." />
                </label>
                <label className="block text-[14px] font-semibold text-slate-800">
                  Teléfono
                  <input autoComplete="tel" className={`${field} mt-2 font-normal`} name="telefono" placeholder="Ej. +54 11 1234 5678" type="tel" />
                </label>
              </div>
              <label className="block text-[14px] font-semibold text-slate-800">
                Motivo de consulta
                <select className={`${field} mt-2 font-normal`} defaultValue="" name="motivo">
                  <option value="">Seleccioná una opción</option>
                  <option value="comprador">Quiero comprar</option>
                  <option value="proveedor">Quiero ser proveedor</option>
                  <option value="soporte">Soporte</option>
                  <option value="otro">Otro</option>
                </select>
              </label>
              <label className="block text-[14px] font-semibold text-slate-800">
                Contanos cómo podemos ayudarte
                <textarea className={`${field} mt-2 h-auto min-h-36 py-3 font-normal`} name="mensaje" placeholder="Escribí tu mensaje aquí..." />
              </label>

              <button className={`${primaryCta} w-full`} type="button">
                Enviar mensaje
                <Icon className="h-4 w-4" name="arrow" />
              </button>
              <p className="flex items-center gap-2 text-[13px] text-slate-600">
                <Icon className="h-4 w-4 shrink-0 text-slate-500" name="lock" />
                Tu información está protegida. No compartimos tus datos.
              </p>
            </form>
          </Reveal>

          <div className="flex flex-col gap-6">
            <Reveal className="rounded-[16px] bg-[#0b1530] p-6 text-white sm:p-8" delay={120}>
              <p className={`${eyebrow} text-[#8fb0ff]`}>Dónde estamos</p>
              <h3 className="mt-3 text-[1.5rem] font-bold tracking-[-0.02em]">Oficinas centrales</h3>
              <ul className="mt-6 space-y-4 text-[15px] text-white/90">
                <li className="flex gap-3">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#5b8dff]" name="pin" />
                  <span>
                    Av. Corrientes 1234, Piso 8
                    <br />
                    C1043AAB, Buenos Aires, Argentina
                  </span>
                </li>
                <li className="flex gap-3">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#5b8dff]" name="clock" />
                  Lunes a viernes de 9 a 18 hs.
                </li>
                <li className="flex gap-3">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#5b8dff]" name="phone" />
                  <a className="text-white underline-offset-4 hover:underline" href={PHONE_HREF}>
                    {PHONE}
                  </a>
                </li>
                <li className="flex gap-3">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#5b8dff]" name="mail" />
                  <a className="text-white underline-offset-4 hover:underline" href={`mailto:${EMAIL}`}>
                    {EMAIL}
                  </a>
                </li>
              </ul>
            </Reveal>

            <Reveal className="relative isolate flex-1 overflow-hidden rounded-[16px] bg-[linear-gradient(110deg,#eef3ff_0%,#f6f8ff_55%,#dfe8ff_100%)] p-6 sm:p-8" delay={220}>
              <div className="pointer-events-none absolute -right-4 bottom-0 top-6 hidden w-[42%] sm:block">
                <Image alt="" className="origin-bottom-right scale-[1.3] object-contain object-right-bottom mix-blend-multiply" fill sizes="260px" src="/bigbag.png" />
              </div>
              <div className="relative max-w-[300px]">
                <p className={`${eyebrow} text-slate-500`}>Conectamos industrias</p>
                <p className="mt-3 text-[1.5rem] font-bold leading-[1.15] tracking-[-0.02em] text-[#0b1530]">Con oportunidades reales.</p>
                <p className="mt-3 text-[14px] leading-6 text-slate-600">
                  ATAR es la plataforma líder en abastecimiento de bolsas industriales en Latinoamérica.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </main>
  );
}
