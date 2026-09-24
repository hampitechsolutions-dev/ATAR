'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

const VIDEO_SRC = '/atarvideo.mp4';

/**
 * Botón que abre el video de "Cómo funciona" (public/atarvideo.mp4, 0:57) en un
 * modal. Si el archivo falla al cargar, el modal lo dice en vez de mostrar un
 * reproductor roto.
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
  const [failed, setFailed] = useState(false);

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
              {failed ? (
                <div className="flex aspect-video flex-col items-center justify-center gap-2 px-6 text-center text-white">
                  <p className="text-lg font-semibold">El video estará disponible pronto.</p>
                  <p className="text-sm text-white/60">Mientras tanto, recorré los pasos de esta página.</p>
                </div>
              ) : (
                <video
                  autoPlay
                  className="aspect-video w-full"
                  controls
                  onError={() => setFailed(true)}
                  playsInline
                  poster="/cf.png"
                  src={VIDEO_SRC}
                >
                  Tu navegador no soporta la reproducción de video.
                </video>
              )}
            </div>
          </div>
        </div>,
            document.body,
          )
        : null}
    </>
  );
}
