'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Cuenta desde 0 hasta el número de `value` cuando entra en pantalla,
 * conservando el formato ("12.000+", "450+", "8"). Si el sistema pide
 * reducir el movimiento, muestra el valor final directamente.
 */
export default function CountUp({ value, duration = 1400 }: { value: string; duration?: number }) {
  const match = value.match(/^([^\d]*)([\d.]+)(.*)$/);
  const target = match ? Number(match[2].replace(/\./g, '')) : NaN;
  const ref = useRef<HTMLSpanElement | null>(null);
  const [current, setCurrent] = useState<number | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || !Number.isFinite(target)) {
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    let frame = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) {
          return;
        }
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          // easeOutCubic: arranca rápido y frena al llegar.
          const eased = 1 - Math.pow(1 - progress, 3);
          setCurrent(Math.round(target * eased));
          if (progress < 1) {
            frame = requestAnimationFrame(tick);
          }
        };
        frame = requestAnimationFrame(tick);
      },
      // Arranca apenas asoma: dentro de un <Reveal> el número todavía está
      // invisible, así no se ve el salto del valor final a 0.
      { threshold: 0 },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [duration, target]);

  if (!match || !Number.isFinite(target)) {
    return <span>{value}</span>;
  }

  // Antes de empezar (y en el HTML del servidor) se ve el valor final, así
  // nunca queda un "0" si el JS no corre.
  const shown = current === null ? value : `${match[1]}${current.toLocaleString('es-AR')}${match[3]}`;
  return (
    <span ref={ref} className="tabular-nums">
      {shown}
    </span>
  );
}
