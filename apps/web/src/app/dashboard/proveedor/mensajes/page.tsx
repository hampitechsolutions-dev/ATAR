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
          <h1 className="text-[32px] font-semibold tracking-[-0.03em] text-[#1f2373]">
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

        <div className="grid gap-4 xl:grid-cols-[340px_1fr]">
          <div className="rounded-[24px] border border-[#e7eaf3] bg-white p-3 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
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

          <div className="rounded-[24px] border border-[#e7eaf3] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
            {activeConversation ? (
              <>
                <div className="border-b border-[#edf0fb] pb-4">
                  <p className="text-lg font-semibold text-[#33407a]">{activeConversation.company}</p>
                  <p className="mt-1 text-sm text-[#7e85b2]">{activeConversation.topic}</p>
                </div>

                <div className="space-y-4 py-5">
                  <div className="max-w-[78%] rounded-[20px] rounded-bl-md bg-[#f4f6ff] px-4 py-3 text-sm leading-6 text-[#4f5786]">
                    {activeConversation.preview}
                  </div>
                  <div className="ml-auto max-w-[78%] rounded-[20px] rounded-br-md bg-[#5b4bff] px-4 py-3 text-sm leading-6 text-white">
                    Perfecto, te confirmo stock, plazo y condiciones en esta misma conversacion.
                  </div>
                </div>

                <div className="rounded-[18px] border border-[#e7eaf3] bg-[#fbfbff] px-4 py-3 text-sm text-[#8d95be]">
                  Escribi tu respuesta desde aqui en la siguiente iteracion del dashboard.
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
