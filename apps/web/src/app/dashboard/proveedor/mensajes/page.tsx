'use client';

import { useMemo, useState } from 'react';
import SupplierDashboardShell from '@/components/dashboard/supplier-dashboard-shell';
import { useSupplierDashboardData } from '@/lib/dashboard-hooks';

function formatRelative(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const hours = Math.max(1, Math.round(diff / (1000 * 60 * 60)));

  if (hours < 24) {
    return `Hace ${hours} h`;
  }

  return `Hace ${Math.round(hours / 24)} d`;
}

export default function SupplierMessagesPage() {
  const { session, myQuotes, loading, error } = useSupplierDashboardData();

  const conversations = useMemo(() => {
    return myQuotes
      .map((quote, index) => ({
        id: quote.id,
        company: quote.request?.buyerCompany?.name ?? 'Cliente',
        topic: quote.request?.title ?? 'Consulta comercial',
        preview:
          index % 2 === 0
            ? 'Necesitamos avanzar con disponibilidad y fecha de entrega.'
            : 'Gracias por la cotizacion, estamos revisando internamente.',
        updatedAt: quote.updatedAt,
      }))
      .sort(
        (left, right) =>
          new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
      );
  }, [myQuotes]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const activeConversation =
    conversations.find((item) => item.id === selectedId) ?? conversations[0] ?? null;

  return (
    <SupplierDashboardShell searchPlaceholder="Buscar mensajes o clientes..." session={session}>
      <section className="space-y-4">
        <div className="rounded-[24px] border border-[#e7eaf3] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
          <h1 className="text-[24px] font-semibold tracking-[-0.03em] text-[#1f2373] sm:text-[32px]">
            Mensajes
          </h1>
          <p className="mt-1 text-sm text-[#7e85b2]">
            Centraliza tus conversaciones con compradores desde un unico espacio.
          </p>
        </div>

        {error ? (
          <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[340px_1fr]">
          <div className="max-h-[46vh] overflow-y-auto rounded-[24px] border border-[#e7eaf3] bg-white p-3 shadow-[0_16px_40px_rgba(15,23,42,0.04)] xl:max-h-none">
            {loading ? (
              <div className="rounded-[18px] bg-[#fbfbff] px-4 py-8 text-sm text-[#8d95be]">
                Cargando conversaciones...
              </div>
            ) : conversations.length === 0 ? (
              <div className="rounded-[18px] border border-dashed border-[#d8ddee] bg-[#fbfbff] px-4 py-8 text-sm text-[#8d95be]">
                Todavia no tenes conversaciones activas.
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conversation) => {
                  const isActive = activeConversation?.id === conversation.id;
                  return (
                    <button
                      key={conversation.id}
                      className={`w-full rounded-[18px] border px-4 py-3 text-left transition ${
                        isActive
                          ? 'border-[#cfc9ff] bg-[#f5f3ff]'
                          : 'border-transparent bg-white hover:border-[#e7eaf3] hover:bg-[#fbfbff]'
                      }`}
                      onClick={() => setSelectedId(conversation.id)}
                      type="button"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-[#33407a]">{conversation.company}</p>
                        <span className="text-xs text-[#9aa1c8]">
                          {formatRelative(conversation.updatedAt)}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-sm text-[#6a729d]">{conversation.topic}</p>
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#8d95be]">
                        {conversation.preview}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex flex-col rounded-[24px] border border-[#e7eaf3] bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.04)] sm:p-5">
            {activeConversation ? (
              <>
                <div className="flex items-center gap-3 border-b border-[#edf0fb] pb-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f0edff] text-sm font-bold text-[#5546ff]">
                    {activeConversation.company.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold text-[#33407a]">{activeConversation.company}</p>
                    <p className="mt-0.5 truncate text-xs text-[#7e85b2]">{activeConversation.topic}</p>
                  </div>
                </div>

                <div className="my-4 flex-1 space-y-4 rounded-[18px] bg-[linear-gradient(180deg,#f8f9fc_0%,#f3f5fb_100%)] p-4">
                  <div className="mx-auto w-fit rounded-full bg-white px-3 py-1 text-[11px] font-medium text-[#8d95be] shadow-sm">
                    Hoy
                  </div>
                  <div className="max-w-[85%] rounded-[20px] rounded-bl-md border border-[#e7eaf3] bg-white px-4 py-3 text-sm leading-6 text-[#4f5786] shadow-[0_6px_18px_rgba(15,23,42,0.05)]">
                    {activeConversation.preview}
                  </div>
                  <div className="ml-auto max-w-[85%] rounded-[20px] rounded-br-md bg-gradient-to-br from-[#5b4bff] to-[#6a58ff] px-4 py-3 text-sm leading-6 text-white shadow-[0_10px_26px_rgba(91,75,255,0.22)]">
                    Perfecto, te confirmo stock, plazo y condiciones en esta misma conversacion.
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-[#e7eaf3] bg-white px-4 py-2.5">
                  <input
                    className="w-full bg-transparent text-sm text-[#33407a] outline-none placeholder:text-[#9aa1c8]"
                    placeholder="Escribí un mensaje..."
                  />
                  <button
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#5546ff] text-white transition hover:bg-[#4739ea]"
                    type="button"
                  >
                    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </svg>
                  </button>
                </div>
              </>
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
