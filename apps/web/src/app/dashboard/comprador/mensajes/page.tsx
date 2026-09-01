'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import CompanyLogo from '@/components/dashboard/company-logo';
import ConversationPanel from '@/components/chat/conversation-panel';
import { atarApi, type ConversationRecord } from '@/lib/atar-api';
import { useBuyerDashboardData } from '@/lib/dashboard-hooks';

function formatRelative(value: string | null | undefined) {
  if (!value) {
    return '';
  }
  const diff = Date.now() - new Date(value).getTime();
  const hours = Math.max(1, Math.round(diff / (1000 * 60 * 60)));
  if (hours < 24) {
    return `${hours} h`;
  }
  return `${Math.round(hours / 24)} d`;
}

function getContextLabel(contextType: ConversationRecord['contextType']) {
  if (contextType === 'QUOTE') {
    return 'Cotización';
  }
  if (contextType === 'REQUEST') {
    return 'Solicitud';
  }
  return 'Producto';
}

function getInitials(value: string | null | undefined) {
  const cleaned = (value ?? '').replace(/\bS\.?\s*A\.?\b/gi, '').trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  const raw = words.length > 1 ? words.slice(0, 2).map((word) => word[0]).join('') : cleaned.slice(0, 2);
  return raw.toUpperCase() || 'AT';
}

export default function BuyerMessagesPage() {
  const { session, loading: dashboardLoading, error: dashboardError } = useBuyerDashboardData();
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.accessToken) {
      return;
    }
    const accessToken = session.accessToken;
    let cancelled = false;

    async function loadConversations() {
      try {
        setLoading(true);
        setError(null);
        const items = await atarApi.getConversations(undefined, accessToken);
        if (!cancelled) {
          setConversations(items);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar las conversaciones.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadConversations();
    return () => {
      cancelled = true;
    };
  }, [session?.accessToken]);

  const unreadTotal = conversations.filter((conversation) => conversation.unreadCount > 0).length;

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...conversations]
      .filter((conversation) => {
        if (activeTab === 'unread' && conversation.unreadCount === 0) {
          return false;
        }
        if (!query) {
          return true;
        }
        return [conversation.supplierCompanyName, conversation.contextTitle, conversation.lastMessage?.body ?? '']
          .join(' ')
          .toLowerCase()
          .includes(query);
      })
      .sort((left, right) => {
        const leftTime = new Date(left.lastMessageAt ?? left.lastMessage?.createdAt ?? 0).getTime();
        const rightTime = new Date(right.lastMessageAt ?? right.lastMessage?.createdAt ?? 0).getTime();
        return rightTime - leftTime;
      });
  }, [conversations, search, activeTab]);

  // Preseleccion por deep-link (?c=) al abrir desde una notificacion de mensaje.
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const target = new URLSearchParams(window.location.search).get('c');
    if (target) {
      setSelectedId(target);
    }
  }, []);

  useEffect(() => {
    if (selectedId && conversations.some((conversation) => conversation.id === selectedId)) {
      return;
    }
    // Mientras carga, respeta una posible conversación deep-linked que todavía
    // no llegó en la lista.
    if (loading) {
      return;
    }
    setSelectedId(filteredConversations[0]?.id ?? null);
  }, [filteredConversations, conversations, selectedId, loading]);

  const activeConversation = conversations.find((conversation) => conversation.id === selectedId) ?? null;

  const detailLink = useMemo(() => {
    if (!activeConversation) {
      return null;
    }
    if (activeConversation.contextType === 'REQUEST' && activeConversation.requestId) {
      return { href: `/dashboard/comprador/solicitudes/${activeConversation.requestId}`, label: 'Ver solicitud' };
    }
    if (activeConversation.contextType === 'QUOTE' && activeConversation.quoteId) {
      return { href: `/dashboard/comprador/cotizaciones/${activeConversation.quoteId}`, label: 'Ver cotización' };
    }
    return null;
  }, [activeConversation]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {error ?? dashboardError ? (
        <div className="shrink-0 border-b border-rose-200 bg-rose-50 px-5 py-3 text-sm text-rose-700">
          {error ?? dashboardError}
        </div>
      ) : null}

      <div className="grid min-h-0 flex-1 gap-0 overflow-hidden border-t border-slate-200 bg-white xl:grid-cols-[340px_minmax(0,1fr)]">
        <section className="flex min-h-0 flex-col border-b border-slate-200 bg-white p-4 xl:border-b-0 xl:border-r">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
            <svg aria-hidden="true" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24">
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              <path d="M11 19a8 8 0 100-16 8 8 0 000 16z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
            <input
              className="w-full bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar conversaciones..."
              value={search}
            />
          </div>

          <div className="mt-4 flex items-center gap-6 border-b border-slate-200 pb-3 text-xs font-semibold">
            {[
              { key: 'all' as const, label: 'Todas', count: conversations.length },
              { key: 'unread' as const, label: 'No leídos', count: unreadTotal },
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
            {dashboardLoading || loading ? (
              <div className="rounded-2xl bg-slate-50 px-4 py-8 text-sm text-slate-500">Cargando conversaciones...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                Todavía no hay conversaciones.
              </div>
            ) : (
              filteredConversations.map((conversation) => {
                const isActive = activeConversation?.id === conversation.id;
                return (
                  <button
                    key={conversation.id}
                    className={`flex w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                      isActive ? 'border-indigo-200 bg-indigo-50/60 shadow-sm' : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                    }`}
                    onClick={() => setSelectedId(conversation.id)}
                    type="button"
                  >
                    <CompanyLogo
                      className="h-11 w-11"
                      logoUrl={conversation.supplierCompanyLogoUrl}
                      name={conversation.supplierCompanyName}
                      rounded="rounded-2xl"
                      tone="border border-slate-200 bg-white text-slate-950"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="truncate text-sm font-semibold text-slate-950">{conversation.supplierCompanyName}</p>
                        <span className="shrink-0 text-[11px] text-slate-400">
                          {formatRelative(conversation.lastMessageAt ?? conversation.lastMessage?.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {conversation.lastMessage?.body ?? 'Sin mensajes recientes.'}
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="truncate rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-semibold text-indigo-600">
                          {getContextLabel(conversation.contextType)}
                        </span>
                        {conversation.unreadCount > 0 ? (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[10px] font-semibold text-white">
                            {conversation.unreadCount}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        <section className="flex min-h-0 flex-col overflow-hidden bg-white">
          {selectedId ? (
            <>
              {detailLink ? (
                <div className="flex shrink-0 items-center justify-end border-b border-slate-200 bg-white px-4 py-2">
                  <Link
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 transition hover:text-indigo-700"
                    href={detailLink.href}
                  >
                    {detailLink.label}
                    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </svg>
                  </Link>
                </div>
              ) : null}
              <div className="min-h-0 flex-1">
                <ConversationPanel
                  conversationId={selectedId}
                  description={activeConversation ? `Conversación con ${activeConversation.supplierCompanyName}.` : 'Conversación'}
                  mode="existing"
                  session={session}
                  title={activeConversation?.contextTitle ?? 'Conversación'}
                />
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm text-slate-500">
              Seleccioná una conversación para ver el detalle.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
