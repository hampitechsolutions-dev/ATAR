'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  atarApi,
  type ConversationContextType,
  type ConversationRecord,
} from '@/lib/atar-api';
import { loadSession, type WebSession } from '@/lib/session';
import {
  DashboardCard,
  DashboardEmptyState,
  dashboardInputClassName,
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

  useEffect(() => {
    if (session) {
      setActiveSession(session);
      return;
    }

    setActiveSession(loadSession());
  }, [session]);

  useEffect(() => {
    let cancelled = false;

    async function loadConversations() {
      if (!activeSession?.accessToken) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
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

        if (!cancelled) {
          setConversations(items);
        }
      } catch (inboxError) {
        if (!cancelled) {
          setError(
            inboxError instanceof Error
              ? inboxError.message
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

    const interval = window.setInterval(() => {
      void loadConversations();
    }, 2000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [activeSession?.accessToken, contextType, from, search, to]);

  const unreadTotal = useMemo(
    () => conversations.reduce((total, item) => total + item.unreadCount, 0),
    [conversations],
  );

  return (
    <div className="space-y-4">
      <DashboardCard>
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
      </DashboardCard>

      {error ? (
        <div className="rounded-[1.5rem] bg-rose-100 px-5 py-4 text-sm text-rose-800">{error}</div>
      ) : null}

      <DashboardCard>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Conversaciones activas</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{conversations.length}</p>
          </div>
          <div className="rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700">
            {unreadTotal} mensajes sin leer
          </div>
        </div>
      </DashboardCard>

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
        ) : (
          conversations.map((conversation) => (
            <DashboardCard key={conversation.id}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                      {conversation.contextType}
                    </span>
                    <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      {conversation.unreadCount} sin leer
                    </span>
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
                    {conversation.lastMessage?.body || 'Sin mensajes recientes.'}
                  </p>
                </div>
                <div className="flex min-w-[240px] flex-col gap-3">
                  <div className="rounded-[1.25rem] bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <p>Ultima actividad</p>
                    <p className="mt-1 font-semibold text-slate-950">
                      {formatDateTime(conversation.lastMessageAt)}
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
