'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const SEEN_KEY = 'atar:buyer:new-request-cta-seen';

/**
 * CTA global para arrancar una solicitud de cotización (RFQ) desde cualquier
 * pantalla del comprador. La investigación de producto marcó que pedir
 * cotización es la "ruta principal" del marketplace, así que el acceso no debe
 * depender de estar en una página puntual.
 *
 * En mobile es un FAB apilado por encima del asistente (que vive abajo a la
 * derecha); en desktop el acceso vive en el header, así que acá se oculta.
 *
 * Igual que el asistente, no tapa el contenido: la primera vez se muestra
 * completo unos segundos y después queda como un "+" medio escondido contra
 * el borde derecho.
 */
export default function BuyerNewRequestCta() {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let seen = true;
    try {
      seen = window.localStorage.getItem(SEEN_KEY) === '1';
    } catch {
      // Sin localStorage: queda directamente plegado.
    }
    if (seen) {
      return;
    }
    const show = window.setTimeout(() => setExpanded(true), 600);
    const hide = window.setTimeout(() => {
      setExpanded(false);
      try {
        window.localStorage.setItem(SEEN_KEY, '1');
      } catch {
        // Se volverá a mostrar la próxima vez.
      }
    }, 6000);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
    };
  }, []);

  return (
    <Link
      href="/dashboard/comprador/solicitudes/nueva"
      aria-label="Nueva solicitud de cotización"
      data-tour="buyer-cta"
      className={`fixed bottom-[152px] right-4 z-40 inline-flex h-14 items-center rounded-full bg-[#1847ff] shadow-[0_16px_40px_rgba(24,71,255,0.35)] transition-all duration-500 lg:hidden ${
        expanded ? 'gap-2 pl-4 pr-5' : 'w-14 translate-x-[calc(50%+16px)] justify-start pl-3 opacity-90'
      }`}
    >
      {/* globals.css: el color de los <a> va en un hijo. */}
      <span className="inline-flex items-center gap-2 text-white">
        <svg aria-hidden="true" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
        </svg>
        {expanded ? <span className="whitespace-nowrap text-[13px] font-semibold">Nueva solicitud</span> : null}
      </span>
    </Link>
  );
}
