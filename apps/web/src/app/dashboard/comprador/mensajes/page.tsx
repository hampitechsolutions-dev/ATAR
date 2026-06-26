'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useBuyerDashboardData } from '@/lib/dashboard-hooks';

type Conversation = {
  id: string;
  company: string;
  logo: string;
  preview: string;
  badge: string;
  time: string;
  unread?: number;
  verified?: boolean;
  founder?: boolean;
  responseRate?: string;
  requestTitle: string;
  requestSubtitle: string;
};

type Message = {
  id: string;
  author: 'supplier' | 'buyer';
  body: string[];
  time: string;
};

function SupplierLogo({ value, active = false }: { value: string; active?: boolean }) {
  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border text-[10px] font-bold leading-none ${
        active
          ? 'border-indigo-200 bg-indigo-50 text-slate-950'
          : 'border-slate-200 bg-white text-slate-950'
      }`}
    >
      <span className="whitespace-pre-line text-center tracking-tight">{value}</span>
    </div>
  );
}

function PaperPlaneIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M22 2L11 13"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M22 2L15 22l-4-9-9-4 20-7z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export default function BuyerMessagesPage() {
  const { session, requests, loading, error } = useBuyerDashboardData();
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'archived'>('all');

  const conversations = useMemo<Conversation[]>(() => {
    const fallbackTitle = requests[0]?.title ?? 'Big Bags para fertilizante';

    return [
      {
        id: 'packbag',
        company: 'PackBag S.A.',
        logo: 'PACK\nBAG',
        preview: 'Claro Juan, el plazo de entrega estimado...',
        badge: 'Pedido #5678',
        time: '10:30',
        unread: 2,
        verified: true,
        founder: true,
        responseRate: '98%',
        requestTitle: 'Pedido #5678',
        requestSubtitle: fallbackTitle,
      },
      {
        id: 'indubolsas',
        company: 'Indubolsas S.A.',
        logo: 'INDU\nBOLSAS',
        preview: 'Te enviamos la cotización solicitada.',
        badge: 'Cotización #C-231',
        time: 'Ayer',
        unread: 1,
        verified: true,
        responseRate: '96%',
        requestTitle: 'Pedido #5672',
        requestSubtitle: '500 unidades',
      },
      {
        id: 'plastflex',
        company: 'PlastFlex S.A.',
        logo: 'PLAST\nFLEX',
        preview: 'Perfecto, quedamos a la espera.',
        badge: 'Pedido #5676',
        time: 'Ayer',
        verified: true,
        responseRate: '95%',
        requestTitle: 'Solicitud #1247',
        requestSubtitle: 'Rafia polipropileno',
      },
      {
        id: 'polymax',
        company: 'Polymax S.A.',
        logo: 'PO',
        preview: '¿Podrías confirmarnos las medidas?',
        badge: 'Cotización #C-230',
        time: '2 días',
        verified: true,
        responseRate: '94%',
        requestTitle: 'Pedido #5681',
        requestSubtitle: 'Film stretch',
      },
      {
        id: 'flexibag',
        company: 'Flexibag S.A.',
        logo: 'FLEXI\nBAG',
        preview: 'Gracias por tu consulta.',
        badge: 'Consulta general',
        time: '3 días',
        verified: true,
        responseRate: '97%',
        requestTitle: 'Consulta técnica',
        requestSubtitle: 'Laminados',
      },
      {
        id: 'quimar',
        company: 'Quimar S.A.',
        logo: 'QU',
        preview: 'Te compartimos ficha técnica del producto.',
        badge: 'Pedido #5672',
        time: '5 días',
        verified: true,
        responseRate: '93%',
        requestTitle: 'Pedido #5672',
        requestSubtitle: 'Pedido de materia prima',
      },
      {
        id: 'envaplast',
        company: 'Envaplast S.A.',
        logo: 'EN',
        preview: 'Hemos actualizado el estado del pedido.',
        badge: 'Pedido #5689',
        time: '7 días',
        verified: true,
        responseRate: '92%',
        requestTitle: 'Pedido #5689',
        requestSubtitle: 'Bobinas industriales',
      },
    ];
  }, [requests]);

  const filteredConversations = useMemo(() => {
    if (activeTab === 'unread') {
      return conversations.filter((item) => (item.unread ?? 0) > 0);
    }

    if (activeTab === 'archived') {
      return conversations.filter((item) => !item.unread);
    }

    return conversations;
  }, [activeTab, conversations]);

  const [selectedId, setSelectedId] = useState(conversations[0]?.id ?? 'packbag');
  const selectedConversation =
    filteredConversations.find((conversation) => conversation.id === selectedId) ??
    conversations[0];

  const firstName = session?.user.firstName ?? 'Juan';
  const unreadCount = conversations.filter((item) => (item.unread ?? 0) > 0).length;

  const chatMessages = useMemo<Record<string, Message[]>>(
    () => ({
      packbag: [
        {
          id: '1',
          author: 'supplier',
          body: [
            `¡Hola ${firstName}!`,
            'Gracias por tu interés en nuestros productos.',
            '¿En qué podemos ayudarte?',
          ],
          time: '10:15',
        },
        {
          id: '2',
          author: 'buyer',
          body: [
            `Hola, buen día.`,
            'Necesito 500 Big Bags para fertilizante.',
            '¿Tienen disponibilidad para entrega en Rosario?',
          ],
          time: '10:18',
        },
        {
          id: '3',
          author: 'supplier',
          body: [
            'Sí, tenemos disponibilidad.',
            'Podemos entregar 500 unidades en 5 días hábiles en Rosario.',
            '¿Te gustaría que te enviemos una cotización formal?',
          ],
          time: '10:20',
        },
        {
          id: '4',
          author: 'buyer',
          body: [
            'Perfecto, sí por favor.',
            'También me gustaría saber las opciones de personalización',
            '(impresión de logo y medidas disponibles).',
          ],
          time: '10:22',
        },
        {
          id: '5',
          author: 'supplier',
          body: [
            `Claro ${firstName}, el plazo de entrega estimado es de 5 días hábiles.`,
            'Te envío la información detallada y la cotización en breve.',
          ],
          time: '10:30',
        },
      ],
      indubolsas: [
        {
          id: '1',
          author: 'supplier',
          body: ['Te enviamos la cotización solicitada.', 'Quedamos atentos a tu devolución.'],
          time: 'Ayer',
        },
      ],
      plastflex: [
        {
          id: '1',
          author: 'supplier',
          body: ['Perfecto, quedamos a la espera.', 'Si querés avanzamos con una muestra.'],
          time: 'Ayer',
        },
      ],
      polymax: [
        {
          id: '1',
          author: 'supplier',
          body: ['¿Podrías confirmarnos las medidas?', 'Así te enviamos una propuesta precisa.'],
          time: '2 días',
        },
      ],
      flexibag: [
        {
          id: '1',
          author: 'supplier',
          body: ['Gracias por tu consulta.', 'Nuestro equipo técnico revisa el caso.'],
          time: '3 días',
        },
      ],
      quimar: [
        {
          id: '1',
          author: 'supplier',
          body: ['Te compartimos ficha técnica del producto.', 'Avisanos si necesitás certificaciones.'],
          time: '5 días',
        },
      ],
      envaplast: [
        {
          id: '1',
          author: 'supplier',
          body: ['Hemos actualizado el estado del pedido.', 'Ya está listo para despacho.'],
          time: '7 días',
        },
      ],
    }),
    [firstName],
  );

  const currentMessages = chatMessages[selectedConversation.id] ?? [];

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white px-6 py-5 text-sm text-slate-600 shadow-sm">
        Cargando mensajes...
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {error ? (
        <div className="mx-4 mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 lg:mx-6">
          {error}
        </div>
      ) : null}

      <div className="grid min-h-0 flex-1 gap-0 overflow-hidden border-t border-slate-200 bg-white xl:items-stretch xl:grid-cols-[320px_minmax(0,1fr)]">
        <section className="flex min-h-0 flex-col border-r border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
              <svg aria-hidden="true" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24">
                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                <path d="M11 19a8 8 0 100-16 8 8 0 000 16z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
              <input
                className="w-full bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
                placeholder="Buscar conversaciones..."
              />
            </div>

            <button className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50" type="button">
              <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                <path d="M4 6h16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                <path d="M7 12h10" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                <path d="M10 18h4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </button>

            <button className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-[0_18px_40px_rgba(79,70,229,0.25)] hover:bg-indigo-500" type="button">
              <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                <path d="M12 5v14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                <path d="M5 12h14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </button>
          </div>

          <div className="mt-4 flex items-center gap-6 border-b border-slate-200 pb-3 text-xs font-semibold">
            {[
              { key: 'all' as const, label: 'Todas', count: conversations.length },
              { key: 'unread' as const, label: 'No leídos', count: unreadCount },
              { key: 'archived' as const, label: 'Archivados', count: conversations.length - unreadCount },
            ].map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  className={`relative pb-2 transition ${
                    isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'
                  }`}
                  onClick={() => setActiveTab(tab.key)}
                  type="button"
                >
                  <span className="flex items-center gap-1.5">
                    {tab.label}
                    <span className={`${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>{tab.count}</span>
                  </span>
                  {isActive ? <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-indigo-600" /> : null}
                </button>
              );
            })}
          </div>

          <div className="mt-2 min-h-0 flex-1 space-y-1 overflow-y-auto">
            {filteredConversations.map((conversation) => {
              const isActive = selectedConversation.id === conversation.id;
              return (
                <button
                  key={conversation.id}
                  className={`flex w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                    isActive
                      ? 'border-indigo-200 bg-indigo-50/60 shadow-sm'
                      : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                  }`}
                  onClick={() => setSelectedId(conversation.id)}
                  type="button"
                >
                  <SupplierLogo active={isActive} value={conversation.logo} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-950">{conversation.company}</p>
                        <p className="mt-1 truncate text-xs text-slate-500">{conversation.preview}</p>
                      </div>
                      <span className="shrink-0 text-[11px] text-slate-400">{conversation.time}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="truncate rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-semibold text-indigo-600">
                        {conversation.badge}
                      </span>
                      {conversation.unread ? (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[10px] font-semibold text-white">
                          {conversation.unread}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="flex min-h-0 flex-col overflow-hidden bg-white xl:h-full">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <SupplierLogo value={selectedConversation.logo} />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-slate-950">{selectedConversation.company}</p>
                  {selectedConversation.verified ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Verificado
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-slate-500">Última conexión: Hoy 10:45</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                className="inline-flex h-9 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 px-4 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                href="/dashboard/comprador/proveedores"
              >
                Ver perfil
              </Link>
              <button className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50" type="button">
                <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <path d="M12 5h.01" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                  <path d="M12 12h.01" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                  <path d="M12 19h.01" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col bg-[linear-gradient(180deg,#ffffff_0%,#fbfcff_100%)]">
            <div className="px-5 py-4">
              <div className="flex items-center justify-center">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-500">
                  Hoy, 20 de Mayo
                </span>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col justify-end overflow-y-auto px-5 pb-4">
              <div className="space-y-4">
                {currentMessages.map((message) => {
                  const isBuyer = message.author === 'buyer';
                  return (
                    <div
                      key={message.id}
                      className={`flex items-end gap-3 ${isBuyer ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isBuyer ? <SupplierLogo value={selectedConversation.logo} /> : null}
                      <div
                        className={`max-w-[78%] rounded-[1.35rem] px-4 py-3 text-sm shadow-sm ${
                          isBuyer
                            ? 'rounded-br-md bg-indigo-50 text-slate-700'
                            : 'rounded-bl-md bg-slate-50 text-slate-700'
                        }`}
                      >
                        {message.body.map((line) => (
                          <p key={line} className="leading-6">
                            {line}
                          </p>
                        ))}
                        <div
                          className={`mt-2 text-[11px] ${
                            isBuyer ? 'text-right text-slate-400' : 'text-slate-400'
                          }`}
                        >
                          {message.time}
                          {isBuyer ? '  ✓✓' : ''}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 px-5 py-4">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <button className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50" type="button">
                <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <path d="M21.44 11.05l-8.49 8.49a6 6 0 01-8.49-8.49l8.49-8.49a4 4 0 115.66 5.66L9.41 17.4a2 2 0 01-2.83-2.83l8.49-8.48" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </button>
              <input
                className="w-full bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
                placeholder="Escribí un mensaje..."
              />
              <button className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-[0_18px_40px_rgba(79,70,229,0.25)] hover:bg-indigo-500" type="button">
                <PaperPlaneIcon />
              </button>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
