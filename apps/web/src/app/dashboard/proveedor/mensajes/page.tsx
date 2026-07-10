'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import ConversationPanel from '@/components/chat/conversation-panel';
import SupplierDashboardShell from '@/components/dashboard/supplier-dashboard-shell';
import { atarApi, type ConversationRecord } from '@/lib/atar-api';
import { useSupplierDashboardData } from '@/lib/dashboard-hooks';

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
    return 'Cotizacion';
  }

  if (contextType === 'REQUEST') {
    return 'Solicitud';
  }

  return 'Producto';
}

export default function SupplierMessagesPage() {
  const { session, loading: dashboardLoading, error: dashboardError } = useSupplierDashboardData();
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
          conversation.buyerCompanyName,
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
    <SupplierDashboardShell searchPlaceholder="Buscar mensajes o clientes..." session={session}>
      <section className="space-y-4">
        <div className="rounded-[24px] border border-[#e7eaf3] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
          <h1 className="text-[24px] font-semibold tracking-[-0.03em] text-[#1f2373] sm:text-[32px]">
            Mensajes
          </h1>
          <p className="mt-1 text-sm text-[#7e85b2]">
            Bandeja real de conversaciones con compradores, basada en el modulo de chat y las cotizaciones.
          </p>
          <input
            className="mt-5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-400"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por comprador, contexto o ultimo mensaje"
            value={search}
          />
        </div>

        {error ?? dashboardError ? (
          <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {error ?? dashboardError}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="max-h-[48vh] overflow-y-auto rounded-[24px] border border-[#e7eaf3] bg-white p-3 shadow-[0_16px_40px_rgba(15,23,42,0.04)] xl:max-h-none">
            {dashboardLoading || loading ? (
              <div className="rounded-[18px] bg-[#fbfbff] px-4 py-8 text-sm text-[#8d95be]">
                Cargando conversaciones...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="rounded-[18px] border border-dashed border-[#d8ddee] bg-[#fbfbff] px-4 py-8 text-sm text-[#8d95be]">
                Todavia no hay conversaciones para mostrar.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredConversations.map((conversation) => {
                  const isActive = activeConversation?.id === conversation.id;
                  const href = `/dashboard/proveedor/mensajes/${conversation.id}`;

                  return (
                    <div
                      key={conversation.id}
                      className={`rounded-[18px] border px-4 py-3 transition ${
                        isActive
                          ? 'border-[#cfc9ff] bg-[#f5f3ff]'
                          : 'border-transparent bg-white hover:border-[#e7eaf3] hover:bg-[#fbfbff]'
                      }`}
                    >
                      <button
                        className="w-full text-left"
                        onClick={() => setSelectedId(conversation.id)}
                        type="button"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate text-sm font-semibold text-[#33407a]">
                            {conversation.buyerCompanyName}
                          </p>
                          <span className="text-xs text-[#9aa1c8]">
                            {formatRelative(conversation.lastMessageAt ?? conversation.lastMessage?.createdAt)}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6f77a7]">
                            {getContextLabel(conversation.contextType)}
                          </span>
                          {conversation.unreadCount > 0 ? (
                            <span className="rounded-full bg-[#ede9ff] px-2.5 py-1 text-[11px] font-semibold text-[#5b4bff]">
                              {conversation.unreadCount} sin leer
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-2 truncate text-sm text-[#6a729d]">
                          {conversation.contextTitle}
                        </p>
                        <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#8d95be]">
                          {conversation.lastMessage?.body ?? 'Sin mensajes recientes.'}
                        </p>
                      </button>

                      <div className="mt-3">
                        <Link className="text-xs font-semibold text-[#4a3df0] hover:text-[#3d31d6]" href={href}>
                          Abrir en pagina completa
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-[24px] border border-[#e7eaf3] bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.04)] sm:p-5">
            {activeConversation ? (
              <ConversationPanel
                conversationId={activeConversation.id}
                mode="existing"
                session={session}
                title={activeConversation.contextTitle}
                description={`Conversacion activa con ${activeConversation.buyerCompanyName}.`}
              />
            ) : (
              <div className="rounded-[18px] border border-dashed border-[#d8ddee] bg-[#fbfbff] px-4 py-8 text-sm text-[#8d95be]">
                Selecciona una conversacion para ver el detalle.
              </div>
            )}
          </div>
        </div>
      </section>
    </SupplierDashboardShell>
  );
}
