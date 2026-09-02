'use client';

import Link from 'next/link';

/**
 * CTA global para arrancar una solicitud de cotización (RFQ) desde cualquier
 * pantalla del comprador. La investigación de producto marcó que pedir
 * cotización es la "ruta principal" del marketplace, así que el acceso no debe
 * depender de estar en una página puntual.
 *
 * En mobile es un FAB apilado por encima del asistente (que vive abajo a la
 * derecha); en desktop el acceso vive en el header, así que acá se oculta.
 */
export default function BuyerNewRequestCta() {
  return (
    <Link
      href="/dashboard/comprador/solicitudes/nueva"
      aria-label="Nueva solicitud de cotización"
      className="group fixed bottom-[152px] right-4 z-40 inline-flex h-14 items-center gap-2 rounded-full bg-[#1847ff] pl-4 pr-5 text-white shadow-[0_16px_40px_rgba(24,71,255,0.35)] transition hover:-translate-y-0.5 hover:bg-[#0f3ff5] lg:hidden"
    >
      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
      </svg>
      <span className="text-[13px] font-semibold">Nueva solicitud</span>
    </Link>
  );
}
