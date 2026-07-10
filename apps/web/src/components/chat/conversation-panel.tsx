'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  atarApi,
  type MembershipRole,
  type ConversationRecord,
  type SendConversationMessagePayload,
} from '@/lib/atar-api';
import { getConversationSocket } from '@/lib/conversation-socket';
import { SUPPLIER_COUNTERS_REFRESH_EVENT } from '@/lib/dashboard-hooks';
import { loadSession, type WebSession } from '@/lib/session';
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardInfoBadge,
  dashboardInputClassName,
  dashboardGhostButtonClassName,
  dashboardPrimaryButtonClassName,
  dashboardSecondaryButtonClassName,
  dashboardTextareaClassName,
} from '../dashboard/dashboard-ui';

type ConversationPanelProps = {
  mode: 'quote' | 'product' | 'existing';
  conversationId?: string;
  quoteId?: string;
  productName?: string;
  supplierCompanyName?: string;
  session?: WebSession | null;
  title?: string;
  description?: string;
  loginHref?: string;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function getInitials(value: string | null | undefined) {
  const cleaned = (value ?? '').replace(/\bS\.?\s*A\.?\b/gi, '').trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  const raw = words.length > 1 ? words.slice(0, 2).map((word) => word[0]).join('') : cleaned.slice(0, 2);
  return raw.toUpperCase() || 'AT';
}

function resolveParticipantRole(
  session: WebSession | null,
  conversation: ConversationRecord | null,
): Extract<MembershipRole, 'BUYER' | 'SUPPLIER'> | null {
  if (!session || !conversation) {
    return null;
  }

  const buyerMatch = session.user.memberships.some(
    (membership) => membership.role === 'BUYER' && membership.company.id === conversation.buyerCompanyId,
  );
  if (buyerMatch) {
    return 'BUYER';
  }

  const supplierMatch = session.user.memberships.some(
    (membership) =>
      membership.role === 'SUPPLIER' && membership.company.id === conversation.supplierCompanyId,
  );
  if (supplierMatch) {
    return 'SUPPLIER';
  }

  return null;
}

function getRolePath(
  session: WebSession | null,
  participantRole: Extract<MembershipRole, 'BUYER' | 'SUPPLIER'> | null,
) {
  if (participantRole === 'SUPPLIER') {
    return 'proveedor';
  }

  if (participantRole === 'BUYER') {
    return 'comprador';
  }

  const hasSupplierRole = session?.user.memberships.some((membership) => membership.role === 'SUPPLIER');
  return hasSupplierRole ? 'proveedor' : 'comprador';
}

function getContextLabel(contextType: ConversationRecord['contextType']) {
  if (contextType === 'PRODUCT') {
    return 'Producto';
  }

  if (contextType === 'QUOTE') {
    return 'Cotizacion';
  }

  return 'Solicitud';
}

function getContextTone(contextType: ConversationRecord['contextType']) {
  if (contextType === 'PRODUCT') {
    return 'sky' as const;
  }

  if (contextType === 'QUOTE') {
    return 'indigo' as const;
  }

  return 'amber' as const;
}

async function fileToBase64(file: File) {
  const reader = new FileReader();

  return new Promise<string>((resolve, reject) => {
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const [, base64 = ''] = result.split(',');
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('No se pudo leer el archivo adjunto.'));
    reader.readAsDataURL(file);
  });
}

export default function ConversationPanel({
  mode,
  conversationId,
  quoteId,
  productName,
  supplierCompanyName,
  session,
  title = 'Chat contextual',
  description = 'Intercambia mensajes y archivos sin salir del flujo comercial.',
  loginHref = '/acceso',
}: ConversationPanelProps) {
  const [activeSession, setActiveSession] = useState<WebSession | null>(session ?? null);
  const [conversation, setConversation] = useState<ConversationRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [liveConnected, setLiveConnected] = useState(false);
  const [typingState, setTypingState] = useState<{
    senderRole: MembershipRole;
    isTyping: boolean;
  } | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (session) {
      setActiveSession(session);
      return;
    }

    setActiveSession(loadSession());
  }, [session]);

  const refreshConversation = useCallback(async (options?: { silent?: boolean }) => {
    if (!activeSession?.accessToken) {
      return;
    }

    if (!options?.silent) {
      setLoading(true);
    }
    setError(null);

    try {
      let ensuredConversation: ConversationRecord;

      if (mode === 'existing') {
        if (!conversationId) {
          throw new Error('Falta la conversacion para abrir el chat.');
        }

        ensuredConversation = await atarApi.getConversation(
          conversationId,
          undefined,
          activeSession.accessToken,
        );
      } else if (mode === 'quote') {
        if (!quoteId) {
          throw new Error('Falta la cotizacion para abrir el chat.');
        }

        ensuredConversation = await atarApi.getOrCreateQuoteConversation(
          quoteId,
          activeSession.accessToken,
        );
      } else {
        if (!productName || !supplierCompanyName) {
          throw new Error('Faltan datos del producto para iniciar el chat.');
        }

        ensuredConversation = await atarApi.getOrCreateProductConversation(
          {
            productName,
            supplierCompanyName,
          },
          activeSession.accessToken,
        );
      }

      let detail = await atarApi.getConversation(
        ensuredConversation.id,
        {
          search: search || undefined,
          from: from || undefined,
          to: to || undefined,
        },
        activeSession.accessToken,
      );

      if (detail.unreadCount > 0) {
        await atarApi.markConversationRead(detail.id, activeSession.accessToken);
        detail = await atarApi.getConversation(
          detail.id,
          {
            search: search || undefined,
            from: from || undefined,
            to: to || undefined,
          },
          activeSession.accessToken,
        );
        window.dispatchEvent(new Event(SUPPLIER_COUNTERS_REFRESH_EVENT));
      }

      setConversation(detail);
    } catch (conversationError) {
      setError(
        conversationError instanceof Error
          ? conversationError.message
          : 'No se pudo abrir la conversacion.',
      );
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }, [activeSession?.accessToken, conversationId, from, mode, productName, quoteId, search, supplierCompanyName, to]);

  useEffect(() => {
    void refreshConversation();
  }, [refreshConversation]);

  const participantRole = useMemo(
    () => resolveParticipantRole(activeSession, conversation),
    [activeSession, conversation],
  );

  useEffect(() => {
    if (!activeSession?.accessToken) {
      setLiveConnected(false);
      return;
    }

    const socket = getConversationSocket(activeSession.accessToken);
    const syncConversation = (payload: { conversationId: string }) => {
      if (conversation?.id && payload.conversationId === conversation.id) {
        void refreshConversation({ silent: true });
      }
    };
    const handleTyping = (payload: {
      conversationId: string;
      senderRole: MembershipRole;
      isTyping: boolean;
    }) => {
      if (!conversation?.id || payload.conversationId !== conversation.id) {
        return;
      }

      if (participantRole && payload.senderRole === participantRole) {
        return;
      }

      setTypingState(
        payload.isTyping
          ? {
              senderRole: payload.senderRole,
              isTyping: true,
            }
          : null,
      );
    };
    const handleConnect = () => setLiveConnected(true);
    const handleDisconnect = () => setLiveConnected(false);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('conversation:updated', syncConversation);
    socket.on('conversation:read', syncConversation);
    socket.on('conversation:typing', handleTyping);

    if (socket.connected) {
      setLiveConnected(true);
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('conversation:updated', syncConversation);
      socket.off('conversation:read', syncConversation);
      socket.off('conversation:typing', handleTyping);
    };
  }, [activeSession?.accessToken, conversation?.id, participantRole, refreshConversation]);

  useEffect(() => {
    if (!activeSession?.accessToken || !conversation?.id) {
      return;
    }

    const socket = getConversationSocket(activeSession.accessToken);
    socket.emit('conversation:join', {
      conversationId: conversation.id,
    });

    return () => {
      socket.emit('conversation:leave', {
        conversationId: conversation.id,
      });
    };
  }, [activeSession?.accessToken, conversation?.id]);

  const attachmentHint = useMemo(() => {
    if (!selectedFile) {
      return 'Adjuntos hasta 10 MB.';
    }

    return `${selectedFile.name} (${Math.round(selectedFile.size / 1024)} KB)`;
  }, [selectedFile]);

  const typingLabel = useMemo(() => {
    if (!typingState?.isTyping || !conversation) {
      return null;
    }

    if (typingState.senderRole === 'BUYER') {
      return `${conversation.buyerCompanyName} esta escribiendo...`;
    }

    if (typingState.senderRole === 'SUPPLIER') {
      return `${conversation.supplierCompanyName} esta escribiendo...`;
    }

    return 'La otra parte esta escribiendo...';
  }, [conversation, typingState]);

  const rolePath = useMemo(
    () => getRolePath(activeSession, participantRole),
    [activeSession, participantRole],
  );

  const detailHref = useMemo(() => {
    if (!conversation) {
      return null;
    }

    if (conversation.quoteId) {
      return `/dashboard/${rolePath}/cotizaciones/${conversation.quoteId}`;
    }

    if (conversation.requestId && rolePath === 'comprador') {
      return `/dashboard/comprador/solicitudes/${conversation.requestId}`;
    }

    return null;
  }, [conversation, rolePath]);

  const detailLabel = useMemo(() => {
    if (!conversation) {
      return null;
    }

    if (conversation.quoteId) {
      return 'Ver cotizacion';
    }

    if (conversation.requestId && rolePath === 'comprador') {
      return 'Ver solicitud';
    }

    return null;
  }, [conversation, rolePath]);

  const counterpartLabel = useMemo(() => {
    if (!conversation) {
      return null;
    }

    return rolePath === 'comprador'
      ? conversation.supplierCompanyName
      : conversation.buyerCompanyName;
  }, [conversation, rolePath]);

  const messageCount = conversation?.messages?.length ?? 0;
  const attachmentCount =
    conversation?.messages?.filter((item) => item.attachmentBase64 && item.attachmentName).length ?? 0;
  const hasActiveFilters = search.length > 0 || from.length > 0 || to.length > 0;
  const canSend = message.trim().length > 0 || Boolean(selectedFile);

  function resetFilters() {
    setSearch('');
    setFrom('');
    setTo('');
  }

  const emitTypingState = useCallback(
    (isTyping: boolean) => {
      if (!activeSession?.accessToken || !conversation?.id) {
        return;
      }

      const socket = getConversationSocket(activeSession.accessToken);
      socket.emit('conversation:typing', {
        conversationId: conversation.id,
        isTyping,
      });
    },
    [activeSession?.accessToken, conversation?.id],
  );

  async function handleSend() {
    if (!activeSession?.accessToken || !conversation) {
      return;
    }

    try {
      setSending(true);
      setError(null);
      emitTypingState(false);

      const payload: SendConversationMessagePayload = {
        body: message.trim() || undefined,
      };

      if (selectedFile) {
        if (selectedFile.size > 10 * 1024 * 1024) {
          throw new Error('El archivo adjunto supera el maximo permitido de 10 MB.');
        }

        payload.attachmentName = selectedFile.name;
        payload.attachmentMimeType = selectedFile.type || 'application/octet-stream';
        payload.attachmentSize = selectedFile.size;
        payload.attachmentBase64 = await fileToBase64(selectedFile);
      }

      const nextConversation = await atarApi.sendConversationMessage(
        conversation.id,
        payload,
        activeSession.accessToken,
      );

      setConversation(nextConversation);
      setMessage('');
      setSelectedFile(null);
      setTypingState(null);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'No se pudo enviar el mensaje.');
    } finally {
      setSending(false);
    }
  }

  function handleMessageChange(nextValue: string) {
    setMessage(nextValue);

    if (!conversation?.id || !liveConnected) {
      return;
    }

    emitTypingState(nextValue.trim().length > 0);

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      emitTypingState(false);
      typingTimeoutRef.current = null;
    }, 1200);
  }

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }

      if (conversation?.id && liveConnected) {
        emitTypingState(false);
      }
    };
  }, [conversation?.id, emitTypingState, liveConnected]);

  if (!activeSession?.accessToken) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center gap-4 bg-white px-6 text-center">
        <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
        <p className="max-w-sm text-sm leading-7 text-slate-600">{description}</p>
        <Link className={dashboardPrimaryButtonClassName} href={loginHref}>
          Iniciar sesión para conversar
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5 sm:py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-[11px] font-bold text-indigo-600">
            {getInitials(counterpartLabel ?? title)}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold text-slate-950">{counterpartLabel ?? title}</p>
              {conversation ? (
                <span className="hidden shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-indigo-600 sm:inline">
                  {getContextLabel(conversation.contextType)}
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
              <span className={`h-1.5 w-1.5 rounded-full ${liveConnected ? 'bg-emerald-500' : 'bg-amber-400'}`} />
              {liveConnected ? 'En línea · tiempo real' : 'Reconectando...'}
            </p>
          </div>
        </div>
        {detailHref && detailLabel ? (
          <Link
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 px-4 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
            href={detailHref}
          >
            {detailLabel}
          </Link>
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-end overflow-y-auto bg-[linear-gradient(180deg,#f8f9fc_0%,#f3f5fb_100%)] px-4 py-4 sm:px-5">
        <div className="mx-auto w-full max-w-[880px] space-y-4">
          {loading ? (
            <p className="py-8 text-center text-sm text-slate-500">Cargando conversación...</p>
          ) : !conversation || (conversation.messages?.length ?? 0) === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">Todavía no hay mensajes. Escribí el primero 👇</p>
          ) : (
            conversation.messages?.map((item) => {
              const isOwn = participantRole ? item.senderRole === participantRole : item.senderRole === 'BUYER';
              const readAt =
                participantRole === 'BUYER'
                  ? item.supplierReadAt
                  : participantRole === 'SUPPLIER'
                    ? item.buyerReadAt
                    : null;

              return (
                <div key={item.id} className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  {!isOwn ? (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-[10px] font-bold text-slate-600">
                      {getInitials(item.senderCompanyName ?? counterpartLabel)}
                    </span>
                  ) : null}
                  <div
                    className={`max-w-[80%] rounded-[1.35rem] px-4 py-2.5 text-sm ${
                      isOwn
                        ? 'rounded-br-md bg-gradient-to-br from-indigo-600 to-indigo-500 text-white shadow-[0_10px_26px_rgba(79,70,229,0.22)]'
                        : 'rounded-bl-md border border-slate-200 bg-white text-slate-700 shadow-[0_6px_18px_rgba(15,23,42,0.05)]'
                    }`}
                  >
                    {item.body ? <p className="whitespace-pre-wrap leading-6">{item.body}</p> : null}
                    {item.attachmentBase64 && item.attachmentName ? (
                      <a
                        className={`mt-2 inline-flex items-center gap-1 text-xs font-semibold underline ${isOwn ? 'text-indigo-100' : 'text-indigo-600'}`}
                        download={item.attachmentName}
                        href={`data:${item.attachmentMimeType ?? 'application/octet-stream'};base64,${item.attachmentBase64}`}
                      >
                        {item.attachmentName}
                      </a>
                    ) : null}
                    <div className={`mt-1 flex items-center justify-end gap-1 text-[11px] ${isOwn ? 'text-indigo-100' : 'text-slate-400'}`}>
                      {formatTime(item.createdAt)}
                      {isOwn ? <span>{readAt ? '✓✓' : '✓'}</span> : null}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {typingLabel ? (
            <div className="flex justify-start">
              <div className="rounded-[1.35rem] rounded-bl-md border border-slate-200 bg-white px-4 py-2.5 text-xs italic text-slate-400 shadow-sm">
                {typingLabel}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="border-t border-slate-200 bg-white px-4 py-3 sm:px-5 sm:py-4">
        {error ? <div className="mb-3 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</div> : null}
        <div className="mx-auto w-full max-w-[880px]">
          <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-[0_6px_18px_rgba(15,23,42,0.05)]">
            <label className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50">
              <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                <path d="M21.44 11.05l-8.49 8.49a6 6 0 01-8.49-8.49l8.49-8.49a4 4 0 115.66 5.66L9.41 17.4a2 2 0 01-2.83-2.83l8.49-8.48" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
              <input className="hidden" onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} type="file" />
            </label>
            <textarea
              className="max-h-28 min-h-[36px] w-full resize-none bg-transparent py-1.5 text-sm text-slate-950 outline-none placeholder:text-slate-400"
              onChange={(event) => handleMessageChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  if (canSend && !sending) {
                    void handleSend();
                  }
                }
              }}
              placeholder="Escribí un mensaje..."
              rows={1}
              value={message}
            />
            <button
              aria-label="Enviar"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-[0_10px_26px_rgba(79,70,229,0.25)] transition hover:bg-indigo-500 disabled:opacity-40"
              disabled={sending || !canSend}
              onClick={() => void handleSend()}
              type="button"
            >
              <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </button>
          </div>
          {selectedFile ? (
            <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
              <span className="truncate">{attachmentHint}</span>
              <button className="font-semibold text-slate-400 hover:text-slate-700" onClick={() => setSelectedFile(null)} type="button">
                Quitar
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
