'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import SupplierDashboardShell from '@/components/dashboard/supplier-dashboard-shell';
import { useSupplierDashboardData } from '@/lib/dashboard-hooks';

type Conversation = {
  id: string;
  company: string;
  logo: string;
  preview: string;
  badge: string;
  time: string;
  unread?: number;
  verified?: boolean;
};

type Message = {
  id: string;
  author: 'me' | 'client';
  body: string[];
  time: string;
};

function CompanyLogo({ value, active = false }: { value: string; active?: boolean }) {
  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border text-[10px] font-bold leading-none ${
        active ? 'border-indigo-200 bg-indigo-50 text-slate-950' : 'border-slate-200 bg-white text-slate-950'
      }`}
    >
      <span className="whitespace-pre-line text-center tracking-tight">{value}</span>
    </div>
  );
}

function PaperPlaneIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M22 2L11 13" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

const CONVERSATIONS: Conversation[] = [
  {
    id: 'compradora',
    company: 'Compradora Demo SA',
    logo: 'COMP\nDEMO',
    preview: 'Necesitamos avanzar con disponibilidad y fecha de entrega...',
    badge: 'Solicitud #1042',
    time: '10:30',
    unread: 2,
    verified: true,
  },
  {
    id: 'textiles',
    company: 'Textiles del Sur',
    logo: 'TEX\nSUR',
    preview: 'Gracias por la cotización, la estamos revisando.',
    badge: 'Cotización #C-231',
    time: 'Ayer',
    unread: 1,
    verified: true,
  },
  {
    id: 'agro',
    company: 'AgroInsumos SA',
    logo: 'AGRO',
    preview: '¿Pueden mejorar el plazo de entrega?',
    badge: 'Pedido #5678',
    time: 'Ayer',
    verified: true,
  },
  {
    id: 'envases',
    company: 'Envases del Litoral',
    logo: 'ENV\nLIT',
    preview: 'Perfecto, confirmamos la compra.',
    badge: 'Pedido #5676',
    time: '2 días',
    verified: true,
  },
  {
    id: 'quimica',
    company: 'Química Andina',
    logo: 'QUIM',
    preview: 'Adjuntamos la orden de compra firmada.',
    badge: 'Orden #OC-88',
    time: '3 días',
    verified: true,
  },
  {
    id: 'norte',
    company: 'Distribuidora Norte',
    logo: 'DIST\nNOR',
    preview: 'Consulta por certificaciones del material.',
    badge: 'Consulta general',
    time: '5 días',
    verified: true,
  },
];

const CHAT_MESSAGES: Record<string, Message[]> = {
  compradora: [
    {
      id: '1',
      author: 'client',
      body: ['Hola, buenas.', 'Necesitamos 500 Big Bags para fertilizante.', '¿Tienen disponibilidad para entrega en Rosario?'],
      time: '10:15',
    },
    {
      id: '2',
      author: 'me',
      body: ['¡Hola! Sí, tenemos disponibilidad.', 'Podemos entregar 500 unidades en 5 días hábiles en Rosario.'],
      time: '10:18',
    },
    {
      id: '3',
      author: 'client',
      body: ['Perfecto.', '¿Nos pasan una cotización formal con las opciones de personalización?'],
      time: '10:22',
    },
    {
      id: '4',
      author: 'me',
      body: ['Claro, te envío la cotización con impresión de logo y medidas disponibles en breve.'],
      time: '10:30',
    },
  ],
  textiles: [
    { id: '1', author: 'me', body: ['Te enviamos la cotización solicitada.', 'Quedamos atentos a tu devolución.'], time: 'Ayer' },
    { id: '2', author: 'client', body: ['Gracias, la estamos revisando internamente.'], time: 'Ayer' },
  ],
  agro: [
    { id: '1', author: 'client', body: ['¿Pueden mejorar el plazo de entrega?'], time: 'Ayer' },
    { id: '2', author: 'me', body: ['Podemos adelantarlo a 4 días hábiles si confirmás esta semana.'], time: 'Ayer' },
  ],
  envases: [
    { id: '1', author: 'client', body: ['Perfecto, confirmamos la compra.'], time: '2 días' },
    { id: '2', author: 'me', body: ['Excelente, generamos la orden y te compartimos el seguimiento.'], time: '2 días' },
  ],
  quimica: [{ id: '1', author: 'client', body: ['Adjuntamos la orden de compra firmada.'], time: '3 días' }],
  norte: [
    { id: '1', author: 'client', body: ['Consulta por certificaciones del material.'], time: '5 días' },
    { id: '2', author: 'me', body: ['Te compartimos las fichas técnicas y certificados en el chat.'], time: '5 días' },
  ],
};

export default function SupplierMessagesPage() {
  const { session, loading, error } = useSupplierDashboardData();
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'archived'>('all');
  const [selectedId, setSelectedId] = useState<string>(CONVERSATIONS[0].id);

  const unreadCount = CONVERSATIONS.filter((item) => (item.unread ?? 0) > 0).length;

  const filteredConversations = useMemo(() => {
    if (activeTab === 'unread') {
      return CONVERSATIONS.filter((item) => (item.unread ?? 0) > 0);
    }
    if (activeTab === 'archived') {
      return CONVERSATIONS.filter((item) => !item.unread);
    }
    return CONVERSATIONS;
  }, [activeTab]);

  const selectedConversation =
    filteredConversations.find((conversation) => conversation.id === selectedId) ?? CONVERSATIONS[0];
  const currentMessages = CHAT_MESSAGES[selectedConversation.id] ?? [];

  return (
    <SupplierDashboardShell fullBleed searchPlaceholder="Buscar mensajes o clientes..." session={session}>
      {loading ? (
        <div className="flex h-full items-center justify-center bg-white text-sm text-slate-600">
          Cargando mensajes...
        </div>
      ) : (
        <div className="flex h-full min-h-0 flex-col bg-white">
          {error ? (
            <div className="shrink-0 border-b border-rose-200 bg-rose-50 px-5 py-3 text-sm text-rose-700">{error}</div>
          ) : null}
          <div className="grid min-h-0 flex-1 gap-0 overflow-hidden border-t border-slate-200 xl:grid-cols-[320px_minmax(0,1fr)]">
            <section className="flex min-h-0 flex-col border-b border-slate-200 bg-white p-4 xl:border-b-0 xl:border-r">
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

                <button className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-[0_18px_40px_rgba(79,70,229,0.25)] hover:bg-indigo-500" type="button">
                  <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <path d="M12 5v14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    <path d="M5 12h14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                </button>
              </div>

              <div className="mt-4 flex items-center gap-6 border-b border-slate-200 pb-3 text-xs font-semibold">
                {[
                  { key: 'all' as const, label: 'Todas', count: CONVERSATIONS.length },
                  { key: 'unread' as const, label: 'No leídos', count: unreadCount },
                  { key: 'archived' as const, label: 'Archivados', count: CONVERSATIONS.length - unreadCount },
                ].map((tab) => {
                  const isActive = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      className={`relative pb-2 transition ${isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                      onClick={() => setActiveTab(tab.key)}
                      type="button"
                    >
                      <span className="flex items-center gap-1.5">
                        {tab.label}
                        <span className={isActive ? 'text-indigo-600' : 'text-slate-400'}>{tab.count}</span>
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
                        isActive ? 'border-indigo-200 bg-indigo-50/60 shadow-sm' : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                      }`}
                      onClick={() => setSelectedId(conversation.id)}
                      type="button"
                    >
                      <CompanyLogo active={isActive} value={conversation.logo} />
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

            <section className="flex min-h-0 flex-col overflow-hidden bg-white">
              <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <CompanyLogo value={selectedConversation.logo} />
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
                    href="/dashboard/proveedor/clientes"
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

              <div className="flex min-h-0 flex-1 flex-col bg-[linear-gradient(180deg,#f8f9fc_0%,#f3f5fb_100%)]">
                <div className="px-5 py-4">
                  <div className="flex items-center justify-center">
                    <span className="rounded-full bg-white px-3 py-1 text-[11px] font-medium text-slate-500 shadow-sm">Hoy</span>
                  </div>
                </div>

                <div className="flex min-h-0 flex-1 flex-col justify-end overflow-y-auto px-5 pb-4">
                  <div className="mx-auto w-full max-w-[880px] space-y-5">
                    {currentMessages.map((message) => {
                      const isMe = message.author === 'me';
                      return (
                        <div key={message.id} className={`flex items-end gap-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
                          {!isMe ? <CompanyLogo value={selectedConversation.logo} /> : null}
                          <div
                            className={`max-w-[78%] rounded-[1.35rem] px-4 py-3 text-sm ${
                              isMe
                                ? 'rounded-br-md bg-gradient-to-br from-indigo-600 to-indigo-500 text-white shadow-[0_10px_26px_rgba(79,70,229,0.22)]'
                                : 'rounded-bl-md border border-slate-200 bg-white text-slate-700 shadow-[0_6px_18px_rgba(15,23,42,0.05)]'
                            }`}
                          >
                            {message.body.map((line) => (
                              <p key={line} className="leading-6">
                                {line}
                              </p>
                            ))}
                            <div className={`mt-1.5 flex items-center gap-1 text-[11px] ${isMe ? 'justify-end text-indigo-100' : 'text-slate-400'}`}>
                              {message.time}
                              {isMe ? <span>✓✓</span> : null}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 bg-white px-5 py-4">
                <div className="mx-auto flex w-full max-w-[880px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_6px_18px_rgba(15,23,42,0.05)]">
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
      )}
    </SupplierDashboardShell>
  );
}
