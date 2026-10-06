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

/** Evento para abrir el asistente desde otros botones ("Iniciar chat", "Hablar con el Asistente"). */
export const ASSISTANT_OPEN_EVENT = 'atar:assistant:open';

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
  const firstName = session?.user.firstName ?? '';
  // ATARIA "escribe" un instante antes de responder.
  const [typing, setTyping] = useState(false);
  const replyTimer = useRef<number | null>(null);
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
    const openPanel = () => setOpen(true);
    window.addEventListener(ASSISTANT_OPEN_EVENT, openPanel);
    return () => window.removeEventListener(ASSISTANT_OPEN_EVENT, openPanel);
  }, []);

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
    if (messages.length > 0 || typing) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, typing]);

  useEffect(() => () => {
    if (replyTimer.current) {
      window.clearTimeout(replyTimer.current);
    }
  }, []);

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

  /** Arma la respuesta de ATARIA a lo que escribió el usuario. */
  function buildReply(text: string): Omit<ChatMessage, 'id' | 'role'> {
    const plain = text
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase();
    const lower = (title: string) => title.charAt(0).toLowerCase() + title.slice(1);

    if (plain.includes('reinici')) {
      tour.reset();
      return welcomeTour
        ? { text: 'Listo, dejé los recorridos como nuevos. ¿Arrancamos por el inicial?', tourId: welcomeTour.id }
        : { text: 'Listo, dejé los recorridos como nuevos.' };
    }
    if (/(esta|la) (seccion|pantalla|pagina)|que (es|hago|puedo hacer) (aca|aqui)/.test(plain) && sectionTour) {
      return { text: `Te cuento cómo funciona esta pantalla: ${lower(sectionTour.title)}.`, tourId: sectionTour.id };
    }
    const match = findTourForQuestion(tour.profile, text);
    if (match) {
      return { text: `Claro. Te muestro cómo ${lower(match.title)}, paso a paso sobre la pantalla.`, tourId: match.id };
    }
    if (/tutorial|recorrido|ayuda|que podes|que sabes|que haces|opciones/.test(plain)) {
      return { text: `Te puedo mostrar cómo ${tutorials.map((item) => lower(item.title)).join(', ')}. ¿Con cuál empezamos?` };
    }
    if (/^(hola|buenas|buen dia|que tal)/.test(plain)) {
      return { text: '¡Hola! ¿Qué necesitás hacer hoy?' };
    }
    if (plain.includes('gracias')) {
      return { text: '¡De nada! Cualquier cosa, acá estoy.' };
    }
    return {
      text: 'Mmm, con eso todavía no te puedo ayudar. Contame qué querés hacer, por ejemplo algo sobre tus solicitudes, cotizaciones o pedidos, y te guío.',
    };
  }

  function handleSend() {
    const text = draft.trim();
    if (!text || typing) {
      return;
    }
    setDraft('');
    setMessages((prev) => [...prev, { id: ++idRef.current, role: 'user', text }]);
    setTyping(true);
    replyTimer.current = window.setTimeout(() => {
      const reply = buildReply(text);
      setMessages((prev) => [...prev, { id: ++idRef.current, role: 'bot', ...reply }]);
      setTyping(false);
    }, 750);
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
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                En línea
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
                ¡Hola{firstName ? `, ${firstName}` : ''}! Soy <span className="font-semibold text-indigo-600">ATARIA</span>. Contame qué necesitás hacer y te lo muestro en pantalla.
              </div>
            </div>

            {/* Si quedó un recorrido por la mitad, ATARIA lo menciona como parte de la charla. */}
            {tour.paused ? (
              <div className="flex items-end gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-300 bg-white p-0.5">
                  <BotAvatar />
                </span>
                <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-slate-300 bg-white px-3 py-2 text-[13px] leading-5 text-slate-700 shadow-sm">
                  La última vez dejamos por la mitad “{tour.paused.tour.title}”. ¿Lo seguimos?
                  <button
                    className="mt-2 flex h-8 items-center rounded-lg bg-indigo-600 px-3 text-[12px] font-semibold text-white transition hover:bg-indigo-700"
                    onClick={() => {
                      setOpen(false);
                      tour.resume();
                    }}
                    type="button"
                  >
                    Dale, sigamos
                  </button>
                </div>
              </div>
            ) : null}

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

            {typing ? (
              <div aria-label="ATARIA está escribiendo" className="flex items-end gap-2" role="status">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-300 bg-white p-0.5">
                  <BotAvatar />
                </span>
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-slate-300 bg-white px-3 py-3 shadow-sm">
                  {[0, 150, 300].map((delay) => (
                    <span key={delay} className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 motion-reduce:animate-none" style={{ animationDelay: `${delay}ms` }} />
                  ))}
                </div>
              </div>
            ) : null}

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
                aria-label="Mensaje para ATARIA"
                placeholder="Escribí tu mensaje…"
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
