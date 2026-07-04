'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  atarApi,
  type ConversationContextType,
  type ConversationRecord,
} from '@/lib/atar-api';
import { getConversationSocket } from '@/lib/conversation-socket';
import { loadSession, type WebSession } from '@/lib/session';
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardInfoBadge,
  DashboardStatCard,
  dashboardInputClassName,
  dashboardSecondaryButtonClassName,
} from '../dashboard/dashboard-ui';

type ConversationsInboxProps = {
  session?: WebSession | null;
  rolePath: 'comprador' | 'proveedor';
};

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return 'Sin actividad';
  }

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function getContextLabel(contextType: ConversationContextType) {
  if (contextType === 'PRODUCT') {
    return 'Producto';
  }

  if (contextType === 'QUOTE') {
    return 'Cotizacion';
  }

  return 'Solicitud';
}

function getContextTone(contextType: ConversationContextType) {
  if (contextType === 'PRODUCT') {
    return 'sky' as const;
  }

  if (contextType === 'QUOTE') {
    return 'indigo' as const;
  }

  return 'amber' as const;
}

function getLastMessagePreview(conversation: ConversationRecord) {
  if (!conversation.lastMessage) {
    return 'Sin mensajes recientes.';
  }

  const prefix = conversation.lastMessage.senderCompanyName
    ? `${conversation.lastMessage.senderCompanyName}: `
    : '';
  const body = conversation.lastMessage.body?.trim();

  if (body) {
    return `${prefix}${body}`;
  }

  return `${prefix}Adjunto sin texto adicional.`;
}

export default function ConversationsInbox({
  session,
  rolePath,
}: ConversationsInboxProps) {
  const [activeSession, setActiveSession] = useState<WebSession | null>(session ?? null);
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [contextType, setContextType] = useState<'ALL' | ConversationContextType>('ALL');
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [liveConnected, setLiveConnected] = useState(false);

  useEffect(() => {
    if (session) {
      setActiveSession(session);
      return;
    }

    setActiveSession(loadSession());
  }, [session]);

  const loadConversations = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!activeSession?.accessToken) {
        setLoading(false);
        return;
      }

      try {
        if (!options?.silent) {
          setLoading(true);
        }
        setError(null);
        const items = await atarApi.getConversations(
          {
            contextType: contextType === 'ALL' ? undefined : contextType,
            search: search || undefined,
            from: from || undefined,
            to: to || undefined,
          },
          activeSession.accessToken,
        );

        setConversations(items);
      } catch (inboxError) {
        setError(
          inboxError instanceof Error
            ? inboxError.message
            : 'No se pudieron cargar las conversaciones.',
        );
      } finally {
        if (!options?.silent) {
          setLoading(false);
        }
      }
    },
    [activeSession?.accessToken, contextType, from, search, to],
  );

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!activeSession?.accessToken) {
      setLiveConnected(false);
      return;
    }

    const socket = getConversationSocket(activeSession.accessToken);
    const handleConversationEvent = () => {
      void loadConversations({ silent: true });
    };
    const handleConnect = () => setLiveConnected(true);
    const handleDisconnect = () => setLiveConnected(false);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('conversation:updated', handleConversationEvent);
    socket.on('conversation:read', handleConversationEvent);

    if (socket.connected) {
      setLiveConnected(true);
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('conversation:updated', handleConversationEvent);
      socket.off('conversation:read', handleConversationEvent);
    };
  }, [activeSession?.accessToken, loadConversations]);

  const unreadTotal = useMemo(
    () => conversations.reduce((total, item) => total + item.unreadCount, 0),
    [conversations],
  );

  const visibleConversations = useMemo(
    () => conversations.filter((item) => !onlyUnread || item.unreadCount > 0),
    [conversations, onlyUnread],
  );

  const productCount = useMemo(
    () => visibleConversations.filter((item) => item.contextType === 'PRODUCT').length,
    [visibleConversations],
  );
  const quoteCount = useMemo(
    () => visibleConversations.filter((item) => item.contextType === 'QUOTE').length,
    [visibleConversations],
  );
  const requestCount = useMemo(
    () => visibleConversations.filter((item) => item.contextType === 'REQUEST').length,
    [visibleConversations],
  );

  function resetFilters() {
    setSearch('');
    setFrom('');
    setTo('');
    setContextType('ALL');
    setOnlyUnread(false);
  }

  return (
    <div className="space-y-4">
      <DashboardCard>
        <div className="flex flex-col gap-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_200px_180px_180px]">
            <input
              className={dashboardInputClassName}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por contexto o contenido"
              value={search}
            />
            <select
              className={dashboardInputClassName}
              onChange={(event) =>
                setContextType(event.target.value as 'ALL' | ConversationContextType)
              }
              value={contextType}
            >
              <option value="ALL">Todos los contextos</option>
              <option value="PRODUCT">Producto</option>
              <option value="QUOTE">Cotizacion</option>
              <option value="REQUEST">Solicitud</option>
            </select>
            <input
              className={dashboardInputClassName}
              onChange={(event) => setFrom(event.target.value)}
              type="date"
              value={from}
            />
            <input
              className={dashboardInputClassName}
              onChange={(event) => setTo(event.target.value)}
              type="date"
              value={to}
            />
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <button
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  !onlyUnread
                    ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
                onClick={() => setOnlyUnread(false)}
                type="button"
              >
                Todas
              </button>
              <button
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  onlyUnread
                    ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
                onClick={() => setOnlyUnread(true)}
                type="button"
              >
                Solo sin leer
              </button>
            </div>

            <button
              className={dashboardSecondaryButtonClassName}
              onClick={resetFilters}
              type="button"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </DashboardCard>

      {error ? (
        <div className="rounded-[1.5rem] bg-rose-100 px-5 py-4 text-sm text-rose-800">{error}</div>
      ) : null}

      <DashboardCard>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Conversaciones activas</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{visibleConversations.length}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                liveConnected
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              {liveConnected ? 'Tiempo real activo' : 'Reconectando chat'}
            </div>
            <div className="rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700">
              {unreadTotal} mensajes sin leer
            </div>
          </div>
        </div>
      </DashboardCard>

      <div className="grid gap-4 md:grid-cols-4">
        <DashboardStatCard helper="Vista actual" label="Total visible" value={visibleConversations.length} />
        <DashboardStatCard helper="Mensajes pendientes" label="Sin leer" value={unreadTotal} />
        <DashboardStatCard helper="Chats por producto" label="Producto" value={productCount} />
        <DashboardStatCard helper={`${quoteCount} cotizaciones · ${requestCount} solicitudes`} label="Negociacion" value={quoteCount + requestCount} />
      </div>

      <div className="space-y-4">
        {loading ? (
          <DashboardEmptyState
            description="Estamos sincronizando tus conversaciones."
            title="Cargando conversaciones..."
          />
        ) : conversations.length === 0 ? (
          <DashboardEmptyState
            description="No encontramos conversaciones con esos filtros."
            title="Sin conversaciones"
          />
        ) : visibleConversations.length === 0 ? (
          <DashboardEmptyState
            description="No hay conversaciones sin leer con los filtros actuales. Puedes volver a mostrar todas o limpiar la busqueda."
            title="Sin conversaciones pendientes"
          />
        ) : (
          visibleConversations.map((conversation) => (
            <DashboardCard key={conversation.id}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <DashboardInfoBadge tone={getContextTone(conversation.contextType)}>
                      {getContextLabel(conversation.contextType)}
                    </DashboardInfoBadge>
                    {conversation.unreadCount > 0 ? (
                      <DashboardInfoBadge tone="rose">
                        {conversation.unreadCount} sin leer
                      </DashboardInfoBadge>
                    ) : (
                      <DashboardInfoBadge tone="emerald">Al dia</DashboardInfoBadge>
                    )}
                  </div>
                  <h2 className="mt-2 text-xl font-semibold text-slate-950">
                    {conversation.contextTitle}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {rolePath === 'comprador'
                      ? `Proveedor: ${conversation.supplierCompanyName}`
                      : `Comprador: ${conversation.buyerCompanyName}`}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {getLastMessagePreview(conversation)}
                  </p>
                </div>
                <div className="flex min-w-[240px] flex-col gap-3">
                  <div className="rounded-[1.25rem] bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <p>Ultima actividad</p>
                    <p className="mt-1 font-semibold text-slate-950">
                      {formatDateTime(conversation.lastMessageAt)}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                      {conversation.quoteId
                        ? `Cotizacion ${conversation.quoteId.slice(0, 8)}`
                        : conversation.requestId
                          ? `Solicitud ${conversation.requestId.slice(0, 8)}`
                          : 'Conversacion directa'}
                    </p>
                  </div>
                  <Link
                    className="inline-flex items-center justify-center rounded-full border border-indigo-200 bg-indigo-50 px-5 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
                    href={`/dashboard/${rolePath}/mensajes/${conversation.id}`}
                  >
                    Abrir conversacion
                  </Link>
                </div>
              </div>
            </DashboardCard>
          ))
        )}
      </div>
    </div>
  );
}
