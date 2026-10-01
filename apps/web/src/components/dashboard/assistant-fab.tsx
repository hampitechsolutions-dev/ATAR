'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';

type ChatMessage = { id: number; role: 'bot' | 'user'; text: string };

const SUGGESTIONS: { q: string; a: string }[] = [
  {
    q: '¿Cómo creo una solicitud de cotización?',
    a: 'Tocá "Iniciar cotización" desde el inicio, elegí la categoría y completá los pasos (entrega, cantidad y especificaciones). En minutos la publicás y empezás a recibir propuestas.',
  },
  {
    q: '¿Cómo comparo las cotizaciones?',
    a: 'En "Cotizaciones" ves todas las propuestas por solicitud con precio, plazo y condiciones, para compararlas y elegir la mejor opción.',
  },
  {
    q: '¿Cómo contacto a un proveedor?',
    a: 'Desde "Proveedores" podés explorar el directorio, guardarlos en favoritos y escribirles por el chat para coordinar los detalles.',
  },
  {
    q: '¿Cómo sigo el estado de un pedido?',
    a: 'En "Pedidos" seguís cada compra por estado (confirmado, en producción, en tránsito y entregado) con todo su detalle.',
  },
];

// La presentación se muestra una sola vez por usuario en cada navegador.
const INTRO_KEY = 'atar:assistant:intro-seen';

function introKey(userId?: string) {
  return userId ? `${INTRO_KEY}:${userId}` : INTRO_KEY;
}

function BotAvatar({ className = 'h-full w-full' }: { className?: string }) {
  return (
    <Image
      alt="ATAR AI"
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

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  if (pathname?.endsWith('/mensajes')) {
    return null;
  }

  function pushPair(question: string, answer: string) {
    setMessages((prev) => [
      ...prev,
      { id: ++idRef.current, role: 'user', text: question },
      { id: ++idRef.current, role: 'bot', text: answer },
    ]);
  }

  function handleSuggestion(item: { q: string; a: string }) {
    pushPair(item.q, item.a);
  }

  function handleSend() {
    const text = draft.trim();
    if (!text) {
      return;
    }
    setDraft('');
    pushPair(
      text,
      'Gracias por tu consulta. Un asesor de ATAR te va a responder a la brevedad. Mientras tanto, probá con las preguntas frecuentes 👇',
    );
  }

  return (
    <div ref={rootRef}>
      {open ? (
        <div className="fixed bottom-20 right-4 z-50 flex h-[min(72vh,470px)] w-[min(92vw,360px)] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_30px_80px_rgba(2,6,23,0.30)] lg:bottom-6 lg:right-6">
          <div className="flex items-center gap-3 bg-gradient-to-br from-indigo-600 to-indigo-500 px-4 py-3 text-white">
            <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white/15 p-1">
              <BotAvatar />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold leading-tight">ATAR AI</p>
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
              <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white p-0.5">
                <BotAvatar />
              </span>
              <div className="max-w-[80%] rounded-2xl rounded-bl-md border border-slate-200 bg-white px-3 py-2 text-[13px] leading-5 text-slate-700 shadow-sm">
                ¡Hola! Soy <span className="font-semibold text-indigo-600">ATAR AI</span>. ¿En qué te puedo ayudar?
              </div>
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
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white p-0.5">
                    <BotAvatar />
                  </span>
                  <div className="max-w-[80%] rounded-2xl rounded-bl-md border border-slate-200 bg-white px-3 py-2 text-[13px] leading-5 text-slate-700 shadow-sm">
                    {message.text}
                  </div>
                </div>
              ),
            )}

            <div className="mt-1">
              <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Preguntas frecuentes</p>
              <div className="flex flex-col gap-2">
                {SUGGESTIONS.map((item) => (
                  <button
                    key={item.q}
                    className="rounded-2xl border border-indigo-100 bg-white px-3 py-2 text-left text-[13px] font-medium text-indigo-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50"
                    onClick={() => handleSuggestion(item)}
                    type="button"
                  >
                    {item.q}
                  </button>
                ))}
              </div>
            </div>

            <div ref={endRef} />
          </div>

          <div className="border-t border-slate-200 bg-white p-3">
            <form
              className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2"
              onSubmit={(event) => {
                event.preventDefault();
                handleSend();
              }}
            >
              <input
                className="w-full bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Escribí tu consulta..."
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
          {introVisible ? (
            <div
              className="animate-fade-up fixed bottom-20 right-[84px] z-50 w-[min(290px,calc(100vw-104px))] rounded-2xl rounded-br-md border border-slate-200 bg-white p-4 shadow-[0_24px_60px_rgba(2,6,23,0.22)] lg:bottom-6 lg:right-[100px]"
              role="dialog"
              aria-label="Presentación de ATAR AI"
            >
              <p className="text-[14px] font-bold text-slate-950">
                ¡Hola! Soy <span className="text-indigo-600">ATAR AI</span> 👋
              </p>
              <p className="mt-1.5 text-[13px] leading-5 text-slate-600">
                Estoy acá para ayudarte con tus solicitudes, cotizaciones y pedidos. Mientras no me necesites voy a quedarme escondido acá al
                costado: tocame cuando quieras.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  className="inline-flex h-9 items-center rounded-xl bg-indigo-600 px-4 text-[13px] font-semibold text-white transition hover:bg-indigo-500"
                  onClick={dismissIntro}
                  type="button"
                >
                  Entendido
                </button>
                <button
                  className="inline-flex h-9 items-center whitespace-nowrap rounded-xl px-3 text-[13px] font-semibold text-indigo-700 transition hover:bg-indigo-50"
                  onClick={() => {
                    dismissIntro();
                    setOpen(true);
                  }}
                  type="button"
                >
                  Consultar ahora
                </button>
              </div>
            </div>
          ) : null}
          <button
            aria-label="Hablar con ATAR AI"
            className={`group fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.22)] transition duration-300 hover:shadow-[0_22px_48px_rgba(15,23,42,0.30)] lg:bottom-6 lg:right-6 lg:h-16 lg:w-16 ${
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
              Hablar con ATAR AI
            </span>
            <BotAvatar className="h-full w-full p-1" />
          </button>
        </>
      )}
    </div>
  );
}
