'use client';

import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { useWorkspace } from '@/components/auth/workspace-provider';
import { getTour, getTourProfile, getToursFor, type Tour, type TourProfile } from '@/lib/tours';

/* Persistencia --------------------------------------------------------------
 * Por usuario y por navegador, igual que los favoritos y la presentación del
 * asistente. Solo se guardan ids de recorridos: nada sensible. */

type StoredProgress = { completed: string[]; paused: { tourId: string; index: number } | null };

const EMPTY_PROGRESS: StoredProgress = { completed: [], paused: null };

function storageKey(userId?: string) {
  return userId ? `atar:tours:${userId}` : 'atar:tours';
}

function readProgress(userId?: string): StoredProgress {
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) {
      return EMPTY_PROGRESS;
    }
    const parsed = JSON.parse(raw) as Partial<StoredProgress>;
    return {
      completed: Array.isArray(parsed.completed) ? parsed.completed.filter((item) => typeof item === 'string') : [],
      paused:
        parsed.paused && typeof parsed.paused.tourId === 'string' && typeof parsed.paused.index === 'number'
          ? { tourId: parsed.paused.tourId, index: parsed.paused.index }
          : null,
    };
  } catch {
    return EMPTY_PROGRESS;
  }
}

function writeProgress(userId: string | undefined, progress: StoredProgress) {
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(progress));
  } catch {
    // Sin localStorage (modo privado estricto): el progreso dura lo que la sesión.
  }
}

/* Contexto ------------------------------------------------------------------ */

type ActiveTour = {
  tourId: string;
  index: number;
  /** Hacia dónde se movió el usuario: define para qué lado se saltea un paso sin destino. */
  direction: 1 | -1;
  /** El paso anterior no estaba disponible y se salteó. */
  skipped: boolean;
  /** Pasos seguidos sin destino: corta el recorrido si no aparece ninguno. */
  misses: number;
};

type TourContextValue = {
  profile: TourProfile;
  tours: Tour[];
  /** Recorrido en curso, si hay uno. */
  activeTourId: string | null;
  /** Recorrido que quedó a medias y se puede retomar. */
  paused: { tour: Tour; index: number } | null;
  isCompleted: (tourId: string) => boolean;
  start: (tourId: string) => void;
  resume: () => void;
  /** Borra el progreso guardado, para volver a ver todo desde cero. */
  reset: () => void;
};

const TourContext = createContext<TourContextValue | null>(null);

export function useTour() {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour debe usarse dentro de TourProvider.');
  }
  return context;
}

export default function TourProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;
  // La key vuelve a montar el estado cuando se conoce el usuario (o cambia):
  // así el progreso guardado se lee una sola vez, al iniciar.
  return (
    <TourState key={userId ?? 'anon'} userId={userId}>
      {children}
    </TourState>
  );
}

function TourState({ children, userId }: { children: React.ReactNode; userId?: string }) {
  const pathname = usePathname();
  const { isManager } = useWorkspace();
  const profile = getTourProfile(pathname, isManager);
  const tours = useMemo(() => getToursFor(profile), [profile]);

  const [progress, setProgress] = useState<StoredProgress>(() => (userId ? readProgress(userId) : EMPTY_PROGRESS));
  const [active, setActive] = useState<ActiveTour | null>(null);

  const save = useCallback(
    (update: (current: StoredProgress) => StoredProgress) => {
      setProgress((current) => {
        const next = update(current);
        writeProgress(userId, next);
        return next;
      });
    },
    [userId],
  );

  const start = useCallback(
    (tourId: string) => {
      if (!getTour(tourId)) {
        return;
      }
      save((current) => ({ ...current, paused: null }));
      setActive({ tourId, index: 0, direction: 1, skipped: false, misses: 0 });
    },
    [save],
  );

  const resume = useCallback(() => {
    if (progress.paused && getTour(progress.paused.tourId)) {
      setActive({ tourId: progress.paused.tourId, index: progress.paused.index, direction: 1, skipped: false, misses: 0 });
      save((current) => ({ ...current, paused: null }));
    }
  }, [progress.paused, save]);

  const reset = useCallback(() => {
    setActive(null);
    save(() => EMPTY_PROGRESS);
  }, [save]);

  /** Sale del recorrido. `pause` lo deja disponible para retomar. */
  const stop = useCallback(
    (options: { completed?: boolean; pause?: boolean } = {}) => {
      setActive((current) => {
        if (current) {
          save((stored) => ({
            completed:
              options.completed && !stored.completed.includes(current.tourId)
                ? [...stored.completed, current.tourId]
                : stored.completed,
            paused: options.pause ? { tourId: current.tourId, index: current.index } : null,
          }));
        }
        return null;
      });
    },
    [save],
  );

  const pausedTour = progress.paused ? getTour(progress.paused.tourId) : null;

  const value = useMemo<TourContextValue>(
    () => ({
      profile,
      tours,
      activeTourId: active?.tourId ?? null,
      paused: pausedTour && progress.paused && tours.includes(pausedTour) ? { tour: pausedTour, index: progress.paused.index } : null,
      isCompleted: (tourId) => progress.completed.includes(tourId),
      start,
      resume,
      reset,
    }),
    [active?.tourId, pausedTour, profile, progress, reset, resume, start, tours],
  );

  const activeTour = active ? getTour(active.tourId) : null;

  return (
    <TourContext.Provider value={value}>
      {children}
      {active && activeTour ? (
        <TourOverlay
          // Cada paso se monta de cero: su estado (elemento, posición) no se arrastra al siguiente.
          key={`${active.tourId}:${active.index}`}
          active={active}
          onMove={(index, direction, skipped) =>
            setActive({ tourId: active.tourId, index, direction, skipped, misses: skipped ? active.misses + 1 : 0 })
          }
          onStop={stop}
          tour={activeTour}
        />
      ) : null}
    </TourContext.Provider>
  );
}

/* Overlay ------------------------------------------------------------------- */

type Rect = { top: number; left: number; width: number; height: number };

/** Cuánto se espera a que aparezca el elemento de un paso antes de saltearlo. */
const TARGET_TIMEOUT_MS = 6000;
const BUBBLE_GAP = 14;
const EDGE = 12;

function findTarget(candidates: string[]) {
  for (const name of candidates) {
    const nodes = document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`);
    for (const node of nodes) {
      const rect = node.getBoundingClientRect();
      // Los elementos ocultos (variante mobile en escritorio, menú cerrado) no tienen caja.
      if (rect.width > 0 && rect.height > 0 && getComputedStyle(node).visibility !== 'hidden') {
        return node;
      }
    }
  }
  return null;
}

function TourOverlay({
  tour,
  active,
  onMove,
  onStop,
}: {
  tour: Tour;
  active: ActiveTour;
  onMove: (index: number, direction: 1 | -1, skipped: boolean) => void;
  onStop: (options?: { completed?: boolean; pause?: boolean }) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const step = tour.steps[active.index];
  const total = tour.steps.length;
  const titleId = useId();
  const bodyId = useId();

  const [rect, setRect] = useState<Rect | null>(null);
  // false mientras se navega o se busca el elemento: el globo espera.
  const [ready, setReady] = useState(false);
  const [bubble, setBubble] = useState<{ top: number; left: number; width: number } | null>(null);
  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const nextRef = useRef<HTMLButtonElement | null>(null);
  // La ruta del paso ya se alcanzó: si después cambia, es el usuario yéndose.
  const arrivedRef = useRef(false);

  const goTo = useCallback(
    (index: number, direction: 1 | -1, skipped = false) => {
      if (index >= total) {
        onStop({ completed: true });
        return;
      }
      if (index < 0) {
        // No hay nada antes: se sigue hacia adelante desde el principio.
        onMove(0, 1, skipped);
        return;
      }
      onMove(index, direction, skipped);
    },
    [onMove, onStop, total],
  );

  // Ubica el paso: navega si hace falta, espera el elemento y lo sigue.
  useEffect(() => {
    if (!step) {
      return;
    }

    if (pathname !== step.route) {
      if (arrivedRef.current) {
        // El usuario salió de la pantalla del paso (por ejemplo, con Atrás).
        onStop({ pause: true });
        return;
      }
      router.push(step.route);
      return;
    }
    arrivedRef.current = true;

    if (!step.target) {
      // Paso sin elemento: tarjeta centrada.
      const frame = window.requestAnimationFrame(() => setReady(true));
      return () => window.cancelAnimationFrame(frame);
    }

    const candidates = step.target;
    const startedAt = Date.now();
    let element: HTMLElement | null = null;
    let cancelled = false;

    const measure = () => {
      if (!element || !element.isConnected) {
        return;
      }
      const box = element.getBoundingClientRect();
      // Recortado a la pantalla: el botón del asistente vive medio afuera del borde.
      const left = Math.max(0, box.left);
      const top = Math.max(0, box.top);
      const right = Math.min(window.innerWidth, box.right);
      const bottom = Math.min(window.innerHeight, box.bottom);
      setRect({ top, left, width: Math.max(0, right - left), height: Math.max(0, bottom - top) });
    };

    const tick = () => {
      if (cancelled) {
        return;
      }
      if (!element) {
        element = findTarget(candidates);
        if (element) {
          const box = element.getBoundingClientRect();
          if (box.top < 72 || box.bottom > window.innerHeight - 72) {
            const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            element.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
          }
          measure();
          setReady(true);
        } else if (Date.now() - startedAt > TARGET_TIMEOUT_MS) {
          window.clearInterval(timer);
          if (active.misses + 1 >= total) {
            onStop();
          } else {
            // El elemento no está en esta pantalla: se saltea el paso sin trabar el recorrido.
            goTo(active.index + active.direction, active.direction, true);
          }
        }
        return;
      }
      measure();
    };
    const timer = window.setInterval(tick, 140);
    const frame = window.requestAnimationFrame(tick);

    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [active.direction, active.index, active.misses, goTo, onStop, pathname, router, step, total]);

  // Ubica el globo junto al elemento, sin salirse de la pantalla.
  useLayoutEffect(() => {
    if (!ready) {
      return;
    }
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(368, vw - EDGE * 2);
    const height = bubbleRef.current?.offsetHeight ?? 240;

    if (!rect) {
      setBubble({ width, left: (vw - width) / 2, top: Math.max(EDGE, (vh - height) / 2) });
      return;
    }

    const centered = Math.min(Math.max(EDGE, rect.left + rect.width / 2 - width / 2), vw - width - EDGE);
    const clampTop = (value: number) => Math.min(Math.max(EDGE, value), vh - height - EDGE);
    const below = vh - (rect.top + rect.height);
    const right = vw - (rect.left + rect.width);

    if (below >= height + BUBBLE_GAP + EDGE) {
      setBubble({ width, left: centered, top: rect.top + rect.height + BUBBLE_GAP });
    } else if (rect.top >= height + BUBBLE_GAP + EDGE) {
      setBubble({ width, left: centered, top: rect.top - height - BUBBLE_GAP });
    } else if (right >= width + BUBBLE_GAP + EDGE) {
      setBubble({ width, left: rect.left + rect.width + BUBBLE_GAP, top: clampTop(rect.top) });
    } else if (rect.left >= width + BUBBLE_GAP + EDGE) {
      setBubble({ width, left: rect.left - width - BUBBLE_GAP, top: clampTop(rect.top) });
    } else {
      // El elemento ocupa casi toda la pantalla: el globo va fijo abajo.
      setBubble({ width, left: (vw - width) / 2, top: vh - height - EDGE });
    }
  }, [ready, rect, active.index]);

  // Al cambiar de paso, el foco va al botón principal del globo.
  useEffect(() => {
    if (ready && bubble) {
      nextRef.current?.focus({ preventScroll: true });
    }
    // Solo al aparecer el paso, no en cada reubicación del globo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, active.index, Boolean(bubble)]);

  const isLast = active.index === total - 1;
  const next = useCallback(() => goTo(active.index + 1, 1), [active.index, goTo]);
  const previous = useCallback(() => goTo(active.index - 1, -1), [active.index, goTo]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onStop();
      } else if (event.key === 'ArrowRight') {
        next();
      } else if (event.key === 'ArrowLeft' && active.index > 0) {
        previous();
      } else if (event.key === 'Tab' && bubbleRef.current) {
        // El foco no sale del globo mientras el recorrido está abierto.
        const focusable = Array.from(bubbleRef.current.querySelectorAll<HTMLElement>('button:not([disabled])'));
        if (focusable.length === 0) {
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const current = document.activeElement;
        if (!bubbleRef.current.contains(current)) {
          event.preventDefault();
          first.focus();
        } else if (event.shiftKey && current === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && current === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active.index, next, onStop, previous]);

  if (!step) {
    return null;
  }

  const pad = 6;
  const accent = 'var(--brand-accent,#1847ff)';

  return (
    <div className="fixed inset-0 z-[80]">
      {/* Capa que frena los clics sobre la página mientras el recorrido está abierto. */}
      <div aria-hidden="true" className="absolute inset-0" />

      {ready && rect ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute rounded-[12px] transition-[top,left,width,height] duration-200 ease-out motion-reduce:transition-none"
          style={{
            top: rect.top - pad,
            left: rect.left - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
            // La sombra gigante oscurece todo menos el elemento resaltado.
            boxShadow: `0 0 0 3px ${accent}, 0 0 0 6px rgba(255,255,255,0.9), 0 0 0 9999px rgba(7,12,28,0.6)`,
          }}
        />
      ) : (
        <div aria-hidden="true" className="absolute inset-0 bg-[rgba(7,12,28,0.6)] transition-opacity duration-200 motion-reduce:transition-none" />
      )}

      <p aria-live="polite" className="sr-only">
        {ready ? `Paso ${active.index + 1} de ${total}: ${step.title}` : 'Cargando el siguiente paso del recorrido'}
      </p>

      {ready ? (
        <div
          ref={bubbleRef}
          aria-describedby={bodyId}
          aria-labelledby={titleId}
          aria-modal="true"
          className={`absolute rounded-[16px] border border-slate-300 bg-white shadow-[0_24px_60px_rgba(2,6,23,0.35)] transition-[top,left,opacity] duration-200 ease-out motion-reduce:transition-none ${
            bubble ? 'opacity-100' : 'opacity-0'
          }`}
          role="dialog"
          style={bubble ? { top: bubble.top, left: bubble.left, width: bubble.width } : { top: 0, left: 0, width: 368 }}
        >
          <div className="flex items-center gap-2.5 border-b border-slate-200 px-4 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-300 bg-white p-0.5">
              <Image alt="" className="h-full w-full object-contain" height={72} src="/botatar.png?v=2" unoptimized width={72} />
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="text-[13px] font-bold text-slate-950">ATARIA</p>
              <p className="truncate text-[12px] text-slate-600">{tour.title}</p>
            </div>
            <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[12px] font-semibold text-slate-700">
              {active.index + 1} de {total}
            </span>
          </div>

          <div
            aria-label="Progreso del recorrido"
            aria-valuemax={total}
            aria-valuemin={1}
            aria-valuenow={active.index + 1}
            className="h-1.5 bg-slate-200"
            role="progressbar"
          >
            <div
              className="h-full rounded-r-full bg-[var(--brand-accent,#1847ff)] transition-[width] duration-300 motion-reduce:transition-none"
              style={{ width: `${((active.index + 1) / total) * 100}%` }}
            />
          </div>

          <div className="px-4 pb-4 pt-3.5">
            {active.skipped ? (
              <p className="mb-2 rounded-[8px] bg-amber-100 px-2.5 py-1.5 text-[12px] font-medium text-amber-900">
                Salteé un paso que no está disponible en esta pantalla.
              </p>
            ) : null}
            <h2 className="text-[17px] font-bold leading-6 text-slate-950" id={titleId}>
              {step.title}
            </h2>
            <p className="mt-1.5 text-[14px] leading-[1.5] text-slate-700" id={bodyId}>
              {step.body}
            </p>

            <div className="mt-4 flex items-center justify-between gap-2">
              <button
                className="h-10 rounded-[10px] px-2 text-[13px] font-semibold text-slate-600 underline-offset-2 transition hover:text-slate-950 hover:underline"
                onClick={() => onStop()}
                type="button"
              >
                Omitir recorrido
              </button>
              <div className="flex items-center gap-2">
                {active.index > 0 ? (
                  <button
                    className="h-10 rounded-[10px] border border-slate-400 bg-white px-3.5 text-[13px] font-semibold text-slate-900 transition hover:border-slate-900"
                    onClick={previous}
                    type="button"
                  >
                    Anterior
                  </button>
                ) : null}
                <button
                  ref={nextRef}
                  className="h-10 rounded-[10px] bg-[var(--brand-accent,#1847ff)] px-4 text-[13px] font-semibold text-white transition hover:brightness-110"
                  onClick={next}
                  type="button"
                >
                  {isLast ? 'Finalizar' : 'Siguiente'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-slate-800 shadow-lg" role="status">
          ATARIA te está llevando…
        </div>
      )}
    </div>
  );
}
