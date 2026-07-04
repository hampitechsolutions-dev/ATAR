'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import ConversationPanel from '@/components/chat/conversation-panel';
import { atarApi, type ConversationRecord } from '@/lib/atar-api';
import { useBuyerDashboardData } from '@/lib/dashboard-hooks';

function formatRelative(value: string | null | undefined) {
  if (!value) {
    return 'Sin actividad';
  }

  const diff = Date.now() - new Date(value).getTime();
  const hours = Math.max(1, Math.round(diff / (1000 * 60 * 60)));

  if (hours < 24) {
    return `Hace ${hours} h`;
  }

  return `Hace ${Math.round(hours / 24)} d`;
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

export default function BuyerMessagesPage() {
  const { session, loading: dashboardLoading, error: dashboardError } = useBuyerDashboardData();
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
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
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'No se pudieron cargar las conversaciones.',
          );
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

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...conversations]
      .filter((conversation) => {
        if (!query) {
          return true;
        }

        return [
          conversation.supplierCompanyName,
          conversation.contextTitle,
          conversation.lastMessage?.body ?? '',
          conversation.request?.category ?? '',
        ]
          .join(' ')
          .toLowerCase()
          .includes(query);
      })
      .sort((left, right) => {
        const leftTime = new Date(left.lastMessageAt ?? left.lastMessage?.createdAt ?? 0).getTime();
        const rightTime = new Date(right.lastMessageAt ?? right.lastMessage?.createdAt ?? 0).getTime();
        return rightTime - leftTime;
      });
  }, [conversations, search]);

  useEffect(() => {
    if (selectedId && filteredConversations.some((conversation) => conversation.id === selectedId)) {
      return;
    }

    setSelectedId(filteredConversations[0]?.id ?? null);
  }, [filteredConversations, selectedId]);

  const activeConversation =
    filteredConversations.find((conversation) => conversation.id === selectedId) ?? null;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Comunicaciones</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Mensajes</h1>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          Bandeja real de conversaciones con proveedores, ligada a solicitudes y cotizaciones.
        </p>
        <input
          className="mt-5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-400"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por proveedor, contexto o mensaje"
          value={search}
        />
      </div>

      {error ?? dashboardError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {error ?? dashboardError}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="max-h-[48vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-sm xl:max-h-none">
          {dashboardLoading || loading ? (
            <div className="rounded-2xl bg-slate-50 px-4 py-8 text-sm text-slate-500">
              Cargando conversaciones...
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-500">
              Todavía no hay conversaciones para mostrar.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredConversations.map((conversation) => {
                const isActive = activeConversation?.id === conversation.id;
                const href = `/dashboard/comprador/mensajes/${conversation.id}`;

                return (
                  <div
                    key={conversation.id}
                    className={`rounded-2xl border px-4 py-3 transition ${
                      isActive
                        ? 'border-indigo-200 bg-indigo-50'
                        : 'border-transparent bg-white hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <button
                      className="w-full text-left"
                      onClick={() => setSelectedId(conversation.id)}
                      type="button"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {conversation.supplierCompanyName}
                        </p>
                        <span className="text-xs text-slate-400">
                          {formatRelative(conversation.lastMessageAt ?? conversation.lastMessage?.createdAt)}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                          {getContextLabel(conversation.contextType)}
                        </span>
                        {conversation.unreadCount > 0 ? (
                          <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
                            {conversation.unreadCount} sin leer
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-2 truncate text-sm text-slate-700">{conversation.contextTitle}</p>
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
                        {conversation.lastMessage?.body ?? 'Sin mensajes recientes.'}
                      </p>
                    </button>

                    <div className="mt-3">
                      <Link className="text-xs font-semibold text-indigo-600 hover:text-indigo-500" href={href}>
                        Abrir en página completa
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          {activeConversation ? (
            <ConversationPanel
              conversationId={activeConversation.id}
              mode="existing"
              session={session}
              title={activeConversation.contextTitle}
              description={`Conversación activa con ${activeConversation.supplierCompanyName}.`}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-500">
              Selecciona una conversación para ver el detalle.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
