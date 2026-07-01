'use client';

import Link from 'next/link';
import { useMemo, type CSSProperties } from 'react';
import { useBuyerDashboardData } from '@/lib/dashboard-hooks';

type IconName =
  | 'sun'
  | 'calculator'
  | 'chart'
  | 'check'
  | 'shield'
  | 'rosette'
  | 'clock'
  | 'headset'
  | 'arrow-right';

function Icon({ name, className = 'h-5 w-5' }: { name: IconName; className?: string }) {
  if (name === 'sun') {
    return (
      <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
        <path
          d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2"
        />
      </svg>
    );
  }

  if (name === 'calculator') {
    return (
      <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
        <rect x="4" y="2" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M8 6h8" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
        <path d="M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h.01M16 19h.01" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      </svg>
    );
  }

  if (name === 'chart') {
    return (
      <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
        <path d="M7 16V10M12 16V6M17 16v-3" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
        <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }

  if (name === 'check') {
    return (
      <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <path d="M8.5 12.5l2.5 2.5 4.5-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }

  if (name === 'shield') {
    return (
      <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
        <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }

  if (name === 'rosette') {
    return (
      <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="9" r="6" stroke="currentColor" strokeWidth="2" />
        <path d="M9 13.5L7.5 22l4.5-2.5L16.5 22 15 13.5" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
        <path d="M9.5 9l1.7 1.7L14.5 7.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }

  if (name === 'clock') {
    return (
      <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <path d="M12 7v5l3 2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }

  if (name === 'headset') {
    return (
      <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
        <path d="M4 13v-1a8 8 0 0116 0v1" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
        <rect x="3" y="13" width="4" height="6" rx="1.5" stroke="currentColor" strokeWidth="2" />
        <rect x="17" y="13" width="4" height="6" rx="1.5" stroke="currentColor" strokeWidth="2" />
        <path d="M21 19a4 4 0 01-4 4h-3" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) {
    return 'Buen día';
  }
  if (hour < 19) {
    return 'Buenas tardes';
  }
  return 'Buenas noches';
}

export default function DashboardCompradorPage() {
  const { session, loading } = useBuyerDashboardData();

  const firstName = session?.user.firstName ?? '';
  const greeting = useMemo(() => getGreeting(), []);

  const cotizacionPerks = ['Cotizaciones rápidas', 'Múltiples proveedores', 'Compará precios y plazos'];
  const panelPerks = ['Ver solicitudes y cotizaciones', 'Gestionar pedidos', 'Administrar tu cuenta'];

  const stats: { icon: IconName; value: string; text: string }[] = [
    { icon: 'shield', value: '+200', text: 'Proveedores verificados' },
    { icon: 'rosette', value: '100%', text: 'Plataforma segura y confiable' },
    { icon: 'clock', value: 'Cotizaciones', text: 'en menos de 24 hs' },
    { icon: 'headset', value: 'Soporte experto', text: 'Estamos para ayudarte en lo que necesites' },
  ];

  const decor: { src: string; w: number; dur: number; delay: number; opacity: number; pos: CSSProperties }[] = [
    { src: '/bigbag.png', w: 230, dur: 8, delay: 0, opacity: 0.34, pos: { top: '9%', left: '2%' } },
    { src: '/rollo.png', w: 205, dur: 9, delay: 0.7, opacity: 0.3, pos: { top: '44%', left: '0%' } },
    { src: '/saco.png', w: 190, dur: 8.5, delay: 1.3, opacity: 0.32, pos: { bottom: '6%', left: '3%' } },
    { src: '/bolsapp.png', w: 220, dur: 9.5, delay: 0.3, opacity: 0.32, pos: { top: '9%', right: '2%' } },
    { src: '/amedida.png', w: 195, dur: 7.8, delay: 1, opacity: 0.3, pos: { top: '44%', right: '0%' } },
    { src: '/rollo.png', w: 190, dur: 8.8, delay: 1.6, opacity: 0.32, pos: { bottom: '6%', right: '3%' } },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 text-sm text-slate-600">
        Cargando...
      </div>
    );
  }

  return (
    <main className="relative flex min-h-[calc(100vh-57px)] flex-col justify-center overflow-hidden px-4 py-4">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
        {decor.map((item, index) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${item.src}-${index}`}
            alt=""
            src={item.src}
            className={`floaty absolute select-none object-contain ${index % 2 === 0 ? '' : 'floaty-alt'}`}
            style={{
              ...item.pos,
              width: item.w,
              opacity: item.opacity,
              animationDuration: `${item.dur}s`,
              animationDelay: `${item.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[980px]">
        <div className="flex flex-col items-center text-center">
        <span className="flex h-8 w-8 items-center justify-center rounded-full text-[#2563ff]">
          <Icon name="sun" className="h-5 w-5" />
        </span>
        <h1 className="mt-1.5 text-[24px] font-semibold tracking-[-0.03em] text-slate-950 sm:text-[30px]">
          ¡{greeting}, <span className="text-[#2563ff]">{firstName || 'de nuevo'}</span>!
        </h1>
        <p className="mt-1 text-sm text-slate-500">¿Qué te gustaría hacer hoy?</p>
        <span className="mt-2.5 h-[3px] w-14 rounded-full bg-[#2563ff]" />
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <article className="flex flex-col rounded-[18px] border border-slate-200 bg-white p-5 text-center shadow-[0_10px_40px_rgba(15,23,42,0.05)]">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef2ff] text-[#2563ff]">
            <Icon name="calculator" className="h-5 w-5" />
          </span>
          <h2 className="mt-3 text-base font-semibold tracking-[-0.02em] text-slate-950">Iniciar cotización</h2>
          <p className="mx-auto mt-1.5 max-w-[320px] text-[13px] leading-5 text-slate-500">
            Solicitá cotizaciones a múltiples proveedores y compará las mejores opciones.
          </p>

          <ul className="mx-auto mt-3.5 w-fit space-y-2 border-t border-slate-100 pt-3.5 text-left text-[13px] text-slate-600">
            {cotizacionPerks.map((perk) => (
              <li key={perk} className="flex items-center gap-2">
                <Icon name="check" className="h-4 w-4 text-[#2563ff]" />
                {perk}
              </li>
            ))}
          </ul>

          <Link
            className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1d4ed8] px-5 text-sm font-semibold text-white shadow-[0_14px_35px_rgba(29,78,216,0.30)] transition hover:bg-[#1b45c0]"
            href="/dashboard/comprador/solicitudes/nueva"
          >
            Iniciar cotización
            <Icon name="arrow-right" className="h-4 w-4" />
          </Link>
        </article>

        <article className="flex flex-col rounded-[18px] border border-slate-200 bg-white p-5 text-center shadow-[0_10px_40px_rgba(15,23,42,0.05)]">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef2ff] text-[#2563ff]">
            <Icon name="chart" className="h-5 w-5" />
          </span>
          <h2 className="mt-3 text-base font-semibold tracking-[-0.02em] text-slate-950">Usar panel administrativo</h2>
          <p className="mx-auto mt-1.5 max-w-[320px] text-[13px] leading-5 text-slate-500">
            Gestioná tus solicitudes, pedidos, proveedores y configuraciones de tu cuenta.
          </p>

          <ul className="mx-auto mt-3.5 w-fit space-y-2 border-t border-slate-100 pt-3.5 text-left text-[13px] text-slate-600">
            {panelPerks.map((perk) => (
              <li key={perk} className="flex items-center gap-2">
                <Icon name="check" className="h-4 w-4 text-[#2563ff]" />
                {perk}
              </li>
            ))}
          </ul>

          <Link
            className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#2563ff] px-5 text-sm font-semibold text-[#1d4ed8] transition hover:bg-[#eef2ff]"
            href="/dashboard/comprador/panel"
          >
            Ir al panel administrativo
            <Icon name="arrow-right" className="h-4 w-4" />
          </Link>
        </article>
      </div>

      <div className="mt-4 rounded-[18px] border border-slate-200 bg-white px-5 py-4 shadow-[0_10px_40px_rgba(15,23,42,0.05)]">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.text} className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eef2ff] text-[#2563ff]">
                <Icon name={stat.icon} className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-slate-950">{stat.value}</p>
                <p className="text-[11px] leading-4 text-slate-500">{stat.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>

      <style jsx>{`
        .floaty {
          animation-name: floaty;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          will-change: transform;
        }

        .floaty-alt {
          animation-name: floatyAlt;
        }

        @keyframes floaty {
          0% {
            transform: translate(0, 0) rotate(-4deg);
          }
          50% {
            transform: translate(14px, -30px) rotate(4deg);
          }
          100% {
            transform: translate(0, 0) rotate(-4deg);
          }
        }

        @keyframes floatyAlt {
          0% {
            transform: translate(0, 0) rotate(5deg);
          }
          50% {
            transform: translate(-16px, 26px) rotate(-3deg);
          }
          100% {
            transform: translate(0, 0) rotate(5deg);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .floaty {
            animation: none;
          }
        }
      `}</style>
    </main>
  );
}
