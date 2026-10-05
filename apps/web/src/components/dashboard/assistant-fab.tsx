'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { useTour } from '@/components/tour/tour-provider';
import { findTourForQuestion, getSectionTour, getWelcomeTour } from '@/lib/tours';

/** Mensaje del chat. `tourId` agrega un botón para iniciar ese recorrido. */
type ChatMessage = { id: number; role: 'bot' | 'user'; text: string; tourId?: string };

// La presentación se muestra una sola vez por usuario en cada navegador.
const INTRO_KEY = 'atar:assistant:intro-seen';

function introKey(userId?: string) {
  return userId ? `${INTRO_KEY}:${userId}` : INTRO_KEY;
}

function BotAvatar({ className = 'h-full w-full' }: { className?: string }) {
  return (
    <Image
      alt="ATARIA"
      className={`${className} object-contain`}
      height={80}
      src="/botatar.png?v=2"
      unoptimized
      width={80}
    />
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

export default function AssistantFab() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const idRef = useRef(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const { session } = useAuth();
  const userId = session?.user.id;
  const tour = useTour();
  const welcomeTour = getWelcomeTour(tour.profile);
  const sectionTour = getSectionTour(tour.profile, pathname);
  const tutorials = tour.tours.filter((item) => !item.welcome);
  // Primera entrada: el asistente se presenta con un globo. Después queda
  // medio escondido contra el borde y vuelve a salir al pasarle el mouse.
  const [introVisible, setIntroVisible] = useState(false);

  useEffect(() => {
    if (!userId) {
      return;
    }
    let seen = true;
    try {
      seen = window.localStorage.getItem(introKey(userId)) === '1';
    } catch {
      // Sin acceso a localStorage (modo privado estricto): no se muestra.
    }
    if (seen) {
      return;
    }
    // Un instante después de cargar, para que no compita con la pantalla.
    const timer = window.setTimeout(() => setIntroVisible(true), 900);
    return () => window.clearTimeout(timer);
  }, [userId]);

  function dismissIntro() {
    setIntroVisible(false);
    try {
      window.localStorage.setItem(introKey(userId), '1');
    } catch {
      // Si no se puede guardar, se volverá a mostrar la próxima vez.
    }
  }

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }
    function onPointer(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointer);
    };
  }, [open]);

  // Al abrir, el panel arranca arriba (recorridos y tutoriales). Solo baja
  // cuando hay una respuesta nueva en el chat.
  useEffect(() => {
    if (messages.length > 0) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (pathname?.endsWith('/mensajes')) {
    return null;
  }

  function startTour(tourId: string) {
    if (introVisible) {
      dismissIntro();
    }
    setOpen(false);
    tour.start(tourId);
  }

  function handleSend() {
    const text = draft.trim();
    if (!text) {
      return;
    }
    setDraft('');
    // Busca el tutorial que mejor responde la pregunta, entre los del perfil.
    const match = findTourForQuestion(tour.profile, text);
    setMessages((prev) => [
      ...prev,
      { id: ++idRef.current, role: 'user', text },
      match
        ? { id: ++idRef.current, role: 'bot', text: `Te lo muestro paso a paso en el tutorial "${match.title}".`, tourId: match.id }
        : {
            id: ++idRef.current,
            role: 'bot',
            text: 'Todavía no tengo un tutorial para eso. Probá con otras palabras o elegí uno de la lista de arriba.',
          },
    ]);
  }

  // Durante un recorrido el panel no se muestra: el protagonista es el globo.
  const touring = Boolean(tour.activeTourId);

  return (
    // En el comprador el asistente usa el azul de ATAR; en ventas hereda el verde del tema.
    <div className={tour.profile === 'buyer' ? 'assistant-buyer' : undefined} ref={rootRef}>
      {open && !touring ? (
        <div aria-label="ATARIA, tu asistente" role="dialog" className="fixed bottom-20 right-4 z-50 flex h-[min(78vh,560px)] w-[min(92vw,380px)] flex-col overflow-hidden rounded-3xl border border-slate-300 bg-white shadow-[0_30px_80px_rgba(2,6,23,0.30)] lg:bottom-6 lg:right-6">
          <div className="flex items-center gap-3 bg-gradient-to-br from-indigo-600 to-indigo-500 px-4 py-3 text-white">
            <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white/15 p-1">
              <BotAvatar />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold leading-tight">ATARIA</p>
              <p className="flex items-center gap-1.5 text-[11px] text-white/80">
                Tu guía en ATAR
              </p>
            </div>
            <button
              aria-label="Cerrar"
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/90 transition hover:bg-white/15"
              onClick={() => setOpen(false)}
              type="button"
            >
              <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto bg-[linear-gradient(180deg,#f8f9fc_0%,#f3f5fb_100%)] px-3 py-4">
            <div className="flex items-end gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-300 bg-white p-0.5">
                <BotAvatar />
              </span>
              <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-slate-300 bg-white px-3 py-2 text-[13px] leading-5 text-slate-700 shadow-sm">
                ¡Hola! Soy <span className="font-semibold text-indigo-600">ATARIA</span>. Puedo mostrarte la plataforma paso a paso, sobre la pantalla real.
              </div>
            </div>

            {/* Recorridos: continuar o empezar, y el de la pantalla actual. */}
            <div className="flex flex-col gap-2">
              {tour.paused ? (
                <button
                  className="flex items-center justify-between gap-3 rounded-2xl bg-indigo-600 px-3.5 py-3 text-left text-white transition hover:bg-indigo-700"
                  onClick={() => {
                    setOpen(false);
                    tour.resume();
                  }}
                  type="button"
                >
                  <span>
                    <span className="block text-[13px] font-bold">Continuar el recorrido</span>
                    <span className="block text-[12px] text-white/85">
                      {tour.paused.tour.title} · paso {tour.paused.index + 1} de {tour.paused.tour.steps.length}
                    </span>
                  </span>
                  <ArrowIcon />
                </button>
              ) : welcomeTour ? (
                <button
                  className="flex items-center justify-between gap-3 rounded-2xl bg-indigo-600 px-3.5 py-3 text-left text-white transition hover:bg-indigo-700"
                  onClick={() => startTour(welcomeTour.id)}
                  type="button"
                >
                  <span>
                    <span className="block text-[13px] font-bold">
                      {tour.isCompleted(welcomeTour.id) ? 'Repetir el recorrido inicial' : 'Empezar el recorrido inicial'}
                    </span>
                    <span className="block text-[12px] text-white/85">{welcomeTour.description}</span>
                  </span>
                  <ArrowIcon />
                </button>
              ) : null}

              {sectionTour && sectionTour.id !== welcomeTour?.id ? (
                <button
                  className="flex items-center justify-between gap-3 rounded-2xl border border-indigo-300 bg-indigo-50 px-3.5 py-3 text-left transition hover:bg-indigo-100"
                  onClick={() => startTour(sectionTour.id)}
                  type="button"
                >
                  <span>
                    <span className="block text-[13px] font-bold text-indigo-900">Aprender esta sección</span>
                    <span className="block text-[12px] text-slate-700">{sectionTour.title}</span>
                  </span>
                  <span className="text-indigo-700">
                    <ArrowIcon />
                  </span>
                </button>
              ) : null}
            </div>

            {/* Tutoriales del perfil. */}
            <div>
              <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">¿Cómo hago para…?</p>
              <ul className="overflow-hidden rounded-2xl border border-slate-300 bg-white">
                {tutorials.map((item) => (
                  <li key={item.id} className="border-b border-slate-200 last:border-b-0">
                    <button
                      className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left transition hover:bg-indigo-50"
                      onClick={() => startTour(item.id)}
                      type="button"
                    >
                      <span className="min-w-0">
                        <span className="block text-[13px] font-semibold text-slate-900">{item.title}</span>
                        <span className="block text-[12px] leading-4 text-slate-600">{item.description}</span>
                      </span>
                      {tour.isCompleted(item.id) ? (
                        <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">Visto</span>
                      ) : (
                        <span className="shrink-0 text-indigo-600">
                          <ArrowIcon />
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
              <button
                className="mt-2 px-1 text-[12px] font-semibold text-slate-600 underline underline-offset-2 transition hover:text-slate-950"
                onClick={() => {
                  tour.reset();
                  if (welcomeTour) {
                    startTour(welcomeTour.id);
                  }
                }}
                type="button"
              >
                Reiniciar los recorridos
              </button>
            </div>

            {messages.map((message) =>
              message.role === 'user' ? (
                <div key={message.id} className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-br-md bg-gradient-to-br from-indigo-600 to-indigo-500 px-3 py-2 text-[13px] leading-5 text-white shadow-[0_8px_20px_rgba(79,70,229,0.22)]">
                    {message.text}
                  </div>
                </div>
              ) : (
                <div key={message.id} className="flex items-end gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-300 bg-white p-0.5">
                    <BotAvatar />
                  </span>
                  <div className="max-w-[80%] rounded-2xl rounded-bl-md border border-slate-300 bg-white px-3 py-2 text-[13px] leading-5 text-slate-700 shadow-sm">
                    {message.text}
                    {message.tourId ? (
                      <button
                        className="mt-2 flex h-8 items-center rounded-lg bg-indigo-600 px-3 text-[12px] font-semibold text-white transition hover:bg-indigo-700"
                        onClick={() => startTour(message.tourId as string)}
                        type="button"
                      >
                        Mostrame cómo
                      </button>
                    ) : null}
                  </div>
                </div>
              ),
            )}

            <div ref={endRef} />
          </div>

          <div className="border-t border-slate-300 bg-white p-3">
            <form
              className="flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-3 py-2"
              onSubmit={(event) => {
                event.preventDefault();
                handleSend();
              }}
            >
              <input
                className="w-full bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
                onChange={(event) => setDraft(event.target.value)}
                aria-label="Preguntale a ATARIA cómo hacer algo"
                placeholder="Preguntame cómo hacer algo…"
                value={draft}
              />
              <button
                aria-label="Enviar"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-500 disabled:opacity-40"
                disabled={!draft.trim()}
                type="submit"
              >
                <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      ) : (
        <>
          {introVisible && !touring ? (
            <div
              className="animate-fade-up fixed bottom-20 right-[84px] z-50 w-[min(300px,calc(100vw-104px))] rounded-2xl rounded-br-md border border-slate-300 bg-white p-4 shadow-[0_24px_60px_rgba(2,6,23,0.22)] lg:bottom-6 lg:right-[100px]"
              role="dialog"
              aria-label="Presentación de ATARIA"
            >
              <p className="text-[14px] font-bold text-slate-950">
                ¡Hola! Soy <span className="text-indigo-600">ATARIA</span> 👋
              </p>
              <p className="mt-1.5 text-[13px] leading-5 text-slate-700">
                ¿Te muestro la plataforma en un minuto? Si preferís verla por tu cuenta, me quedo escondida acá al costado: tocame cuando
                quieras.
              </p>
              <div className="mt-3 flex items-center gap-2">
                {welcomeTour ? (
                  <button
                    className="inline-flex h-9 items-center whitespace-nowrap rounded-xl bg-indigo-600 px-4 text-[13px] font-semibold text-white transition hover:bg-indigo-700"
                    onClick={() => startTour(welcomeTour.id)}
                    type="button"
                  >
                    Empezar recorrido
                  </button>
                ) : null}
                <button
                  className="inline-flex h-9 items-center whitespace-nowrap rounded-xl border border-slate-300 px-3 text-[13px] font-semibold text-slate-800 transition hover:bg-slate-100"
                  onClick={dismissIntro}
                  type="button"
                >
                  Ahora no
                </button>
              </div>
            </div>
          ) : null}
          <button
            aria-label="Abrir ATARIA, tu asistente"
            data-tour="assistant-fab"
            className={`group fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-slate-300 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.22)] transition duration-300 hover:shadow-[0_22px_48px_rgba(15,23,42,0.30)] lg:bottom-6 lg:right-6 lg:h-16 lg:w-16 ${
              introVisible
                ? ''
                : 'translate-x-[calc(50%+16px)] opacity-80 hover:translate-x-0 hover:opacity-100 focus-visible:translate-x-0 focus-visible:opacity-100 lg:translate-x-[calc(50%+24px)]'
            }`}
            onClick={() => {
              if (introVisible) {
                dismissIntro();
              }
              setOpen(true);
            }}
            type="button"
          >
            <span className="pointer-events-none absolute right-full top-1/2 mr-3 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition group-hover:opacity-100 lg:block">
              Abrir ATARIA
            </span>
            <BotAvatar className="h-full w-full p-1" />
          </button>
        </>
      )}
    </div>
  );
}
