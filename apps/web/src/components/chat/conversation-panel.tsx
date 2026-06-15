'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  atarApi,
  type ConversationRecord,
  type SendConversationMessagePayload,
} from '@/lib/atar-api';
import { loadSession, type WebSession } from '@/lib/session';
import {
  DashboardCard,
  DashboardEmptyState,
  dashboardInputClassName,
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
  const markReadAttempted = useRef<string | null>(null);

  useEffect(() => {
    if (session) {
      setActiveSession(session);
      return;
    }

    setActiveSession(loadSession());
  }, [session]);

  const refreshConversation = useCallback(async () => {
    if (!activeSession?.accessToken) {
      return;
    }

    setLoading(true);
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

      const detail = await atarApi.getConversation(
        ensuredConversation.id,
        {
          search: search || undefined,
          from: from || undefined,
          to: to || undefined,
        },
        activeSession.accessToken,
      );

      setConversation(detail);

      if (detail.unreadCount > 0 && markReadAttempted.current !== detail.id) {
        markReadAttempted.current = detail.id;
        await atarApi.markConversationRead(detail.id, activeSession.accessToken);
      }
    } catch (conversationError) {
      setError(
        conversationError instanceof Error
          ? conversationError.message
          : 'No se pudo abrir la conversacion.',
      );
    } finally {
      setLoading(false);
    }
  }, [activeSession?.accessToken, conversationId, from, mode, productName, quoteId, search, supplierCompanyName, to]);

  useEffect(() => {
    void refreshConversation();
  }, [refreshConversation]);

  useEffect(() => {
    if (!activeSession?.accessToken) {
      return;
    }

    const interval = window.setInterval(() => {
      void refreshConversation();
    }, 2000);

    return () => {
      window.clearInterval(interval);
    };
  }, [activeSession?.accessToken, refreshConversation]);

  const attachmentHint = useMemo(() => {
    if (!selectedFile) {
      return 'Adjuntos hasta 10 MB.';
    }

    return `${selectedFile.name} (${Math.round(selectedFile.size / 1024)} KB)`;
  }, [selectedFile]);

  async function handleSend() {
    if (!activeSession?.accessToken || !conversation) {
      return;
    }

    try {
      setSending(true);
      setError(null);

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
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'No se pudo enviar el mensaje.');
    } finally {
      setSending(false);
    }
  }

  if (!activeSession?.accessToken) {
    return (
      <DashboardCard>
        <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
        <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
        <div className="mt-5">
          <Link className={dashboardPrimaryButtonClassName} href={loginHref}>
            Iniciar sesion para conversar
          </Link>
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
        </div>
        {conversation ? (
          <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
            {conversation.unreadCount} sin leer
          </div>
        ) : null}
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_180px_180px]">
        <input
          className={dashboardInputClassName}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar mensajes por contenido"
          value={search}
        />
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

      {error ? (
        <div className="mt-4 rounded-[1.25rem] bg-rose-100 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      <div className="mt-5 space-y-3">
        {loading ? (
          <DashboardEmptyState
            description="Estamos sincronizando la conversacion."
            title="Cargando chat..."
          />
        ) : !conversation || (conversation.messages?.length ?? 0) === 0 ? (
          <DashboardEmptyState
            description="Todavia no hay mensajes en esta conversacion."
            title="Sin mensajes"
          />
        ) : (
          conversation.messages?.map((item) => {
            const isBuyerMessage = item.senderRole === 'BUYER';

            return (
              <article
                key={item.id}
                className={`rounded-[1.5rem] px-4 py-4 ${
                  isBuyerMessage
                    ? 'border border-indigo-200 bg-indigo-50'
                    : 'border border-slate-200 bg-slate-50'
                }`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      {item.senderCompanyName ?? item.senderRole}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-700">
                      {item.body || 'Adjunto sin texto adicional.'}
                    </p>
                    {item.attachmentBase64 && item.attachmentName ? (
                      <a
                        className="mt-3 inline-flex text-sm font-semibold text-indigo-700"
                        download={item.attachmentName}
                        href={`data:${item.attachmentMimeType ?? 'application/octet-stream'};base64,${item.attachmentBase64}`}
                      >
                        Descargar {item.attachmentName}
                      </a>
                    ) : null}
                  </div>
                  <span className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    {formatDateTime(item.createdAt)}
                  </span>
                </div>
              </article>
            );
          })
        )}
      </div>

      <div className="mt-5 space-y-4">
        <textarea
          className={dashboardTextareaClassName}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Escribe tu mensaje o consulta comercial..."
          value={message}
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="inline-flex cursor-pointer items-center gap-3 text-sm text-slate-600">
            <span className={dashboardSecondaryButtonClassName}>Adjuntar archivo</span>
            <input
              className="hidden"
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
              type="file"
            />
            <span>{attachmentHint}</span>
          </label>
          <button
            className={dashboardPrimaryButtonClassName}
            disabled={sending}
            onClick={() => void handleSend()}
            type="button"
          >
            {sending ? 'Enviando...' : 'Enviar mensaje'}
          </button>
        </div>
      </div>
    </DashboardCard>
  );
}
