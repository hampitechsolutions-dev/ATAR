'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

// Video de YouTube (https://youtu.be/kpeCiSX2BgY). Se usa youtube-nocookie para
// que YouTube no deje cookies hasta que la persona le dé a reproducir.
const VIDEO_ID = 'kpeCiSX2BgY';
const VIDEO_SRC = `https://www.youtube-nocookie.com/embed/${VIDEO_ID}?autoplay=1&rel=0&modestbranding=1`;

/**
 * Botón que abre el video de "Cómo funciona" en un modal. El reproductor se
 * carga recién al abrir el modal, así la página no descarga nada de YouTube
 * hasta que hace falta.
 */
export default function VideoTrigger({
  children,
  className,
  label = 'Ver video de cómo funciona ATAR',
}: {
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <button aria-label={label} className={className} onClick={() => setOpen(true)} type="button">
        {children}
      </button>
      {/* Portal al body: los contenedores animados (transform / will-change)
          atrapan a los `position: fixed` y el modal quedaba dentro del hero. */}
      {open
        ? createPortal(
        <div
          aria-label="Video de cómo funciona ATAR"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#050914]/85 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="dialog"
        >
          <div className="relative w-full max-w-4xl" onClick={(event) => event.stopPropagation()}>
            <button
              aria-label="Cerrar video"
              className="absolute -top-11 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              onClick={() => setOpen(false)}
              type="button"
            >
              <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
              </svg>
            </button>
            <div className="overflow-hidden rounded-[16px] bg-black shadow-[0_30px_80px_rgba(0,0,0,0.5)] ring-1 ring-white/10">
              <iframe
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="aspect-video w-full"
                referrerPolicy="strict-origin-when-cross-origin"
                src={VIDEO_SRC}
                title="Cómo funciona ATAR"
              />
            </div>
          </div>
        </div>,
            document.body,
          )
        : null}
    </>
  );
}
