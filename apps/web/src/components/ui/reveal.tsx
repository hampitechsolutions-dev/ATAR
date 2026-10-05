'use client';

import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react';

/**
 * Aparece con un fundido hacia arriba la primera vez que entra en pantalla.
 * La transición vive en globals.css (`.reveal`), que también la desactiva si
 * el sistema pide reducir el movimiento.
 */
export default function Reveal({
  children,
  as: Tag = 'div',
  className = '',
  delay = 0,
}: {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** Retraso en ms, para escalonar elementos hermanos. */
  delay?: number;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal ${className}`}
      data-visible={visible}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
