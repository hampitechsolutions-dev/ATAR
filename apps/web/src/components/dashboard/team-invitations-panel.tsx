'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  atarApi,
  type RepresentationInboxRecord,
  type RepresentationRequestRecord,
  type RepresentationSellerOption,
} from '@/lib/atar-api';

const EMPTY_INBOX: RepresentationInboxRecord = { incoming: [], outgoing: [], history: [] };

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' }).format(
    new Date(value),
  );
}

function sellerName(request: RepresentationRequestRecord) {
  return `${request.seller.firstName} ${request.seller.lastName}`.trim();
}

/**
 * Lado empresa del vinculo con vendedores.
 *
 * Muestra los pedidos que mandaron los vendedores para representar a la
 * empresa, las invitaciones que la empresa envio, y el buscador para invitar a
 * alguien nuevo (por nombre si ya vende en ATAR, o por email si no).
 */
export default function TeamInvitationsPanel({
  accessToken,
  companyName,
  onTeamChanged,
}: {
  accessToken?: string;
  companyName: string;
  onTeamChanged?: () => void | Promise<void>;
}) {
  const [inbox, setInbox] = useState<RepresentationInboxRecord>(EMPTY_INBOX);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [options, setOptions] = useState<RepresentationSellerOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);

  const refresh = useCallback(async () => {
    if (!accessToken) {
      return;
    }

    try {
      setInbox(await atarApi.getCompanyRepresentation(accessToken));
    } catch {
      setInbox(EMPTY_INBOX);
    }
  }, [accessToken]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // El buscador solo trae vendedores que ya operan en ATAR.
  useEffect(() => {
    if (!accessToken || search.trim().length < 2) {
      setOptions([]);
      return;
    }

    const token = accessToken;
    const term = search;
    let cancelled = false;

    const timer = window.setTimeout(async () => {
      try {
        setSearching(true);
        const result = await atarApi.searchSellersToInvite(term, token);
        if (!cancelled) {
          setOptions(result);
        }
      } catch {
        if (!cancelled) {
          setOptions([]);
        }
      } finally {
        if (!cancelled) {
          setSearching(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [accessToken, search]);

  async function handleRespond(
    request: RepresentationRequestRecord,
    action: 'accept' | 'reject' | 'cancel',
  ) {
    if (!accessToken) {
      return;
    }

    try {
      setProcessingId(request.id);
      setError(null);
      setMessage(null);

      await atarApi.respondRepresentation(request.id, action, accessToken);

      if (action === 'accept') {
        setMessage(`${sellerName(request)} se sumo al equipo.`);
        await onTeamChanged?.();
      } else if (action === 'reject') {
        setMessage(`Rechazaste el pedido de ${sellerName(request)}.`);
      } else {
        setMessage(`Retiraste la invitacion a ${sellerName(request)}.`);
      }

      await refresh();
    } catch (actionError) {
      setError(
        actionError instanceof Error ? actionError.message : 'No se pudo actualizar el pedido.',
      );
    } finally {
      setProcessingId(null);
    }
  }

  /** `target` es un vendedor del buscador o el email escrito a mano. */
  async function handleInvite(target: RepresentationSellerOption | { email: string }) {
    if (!accessToken) {
      return;
    }

    try {
      setSending(true);
      setError(null);
      setMessage(null);

      const payload =
        'id' in target
          ? { sellerUserId: target.id, message: note.trim() || undefined }
          : { email: target.email, message: note.trim() || undefined };

      await atarApi.inviteSeller(payload, accessToken);

      setMessage(
        `Invitacion enviada a ${'id' in target ? target.name : target.email}. Te avisamos cuando responda.`,
      );
      setSearch('');
      setOptions([]);
      setNote('');
      await refresh();
    } catch (inviteError) {
      setError(
        inviteError instanceof Error ? inviteError.message : 'No se pudo enviar la invitacion.',
      );
    } finally {
      setSending(false);
    }
  }

  const trimmedSearch = search.trim();
  const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedSearch);

  return (
    <section className="space-y-4">
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}

      {/* Vendedores que pidieron representar a la empresa. */}
      {inbox.incoming.length > 0 ? (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4">
          <p className="text-sm font-semibold text-indigo-900">
            {inbox.incoming.length} vendedor{inbox.incoming.length === 1 ? '' : 'es'} quiere
            representar a {companyName}
          </p>
          <p className="mt-0.5 text-[11px] text-indigo-800">
            Al aceptar se suma al equipo y podes asignarle solicitudes.
          </p>

          <div className="mt-3 space-y-2">
            {inbox.incoming.map((request) => (
              <article
                className="rounded-xl border border-indigo-200 bg-white px-3.5 py-3"
                key={request.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-[11px] font-bold text-indigo-700">
                      {sellerName(request).slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-slate-950">
                        {sellerName(request)}
                      </p>
                      <p className="truncate text-[11px] text-slate-500">
                        {request.seller.email} · {formatDate(request.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      className="inline-flex h-9 items-center rounded-xl border border-slate-200 px-3 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                      disabled={processingId === request.id}
                      onClick={() => void handleRespond(request, 'reject')}
                      type="button"
                    >
                      Rechazar
                    </button>
                    <button
                      className="inline-flex h-9 items-center rounded-xl bg-indigo-600 px-4 text-[12px] font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
                      disabled={processingId === request.id}
                      onClick={() => void handleRespond(request, 'accept')}
                      type="button"
                    >
                      {processingId === request.id ? 'Guardando...' : 'Aceptar'}
                    </button>
                  </div>
                </div>

                {request.message ? (
                  <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-[12px] text-slate-600">
                    &ldquo;{request.message}&rdquo;
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {/* Invitar a un vendedor. */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-slate-950">Invitar a un vendedor</p>
        <p className="mt-0.5 text-[11px] text-slate-500">
          Busca por nombre si ya vende en ATAR, o escribi su email para invitarlo directo.
        </p>

        <input
          className="mt-3 h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none transition focus:border-indigo-400"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Nombre o email del vendedor"
          value={search}
        />

        {trimmedSearch.length >= 2 ? (
          <>
            <textarea
              className="mt-3 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-400"
              maxLength={500}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Mensaje para el vendedor (opcional)"
              rows={2}
              value={note}
            />

            <div className="mt-2 space-y-2">
              {searching ? <p className="text-[12px] text-slate-500">Buscando...</p> : null}

              {options.map((option) => (
                <div
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-3"
                  key={option.id}
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-slate-950">
                      {option.name}
                    </p>
                    <p className="truncate text-[11px] text-slate-500">
                      {option.email}
                      {option.companies.length > 0 ? ` · ${option.companies.join(', ')}` : ''}
                    </p>
                  </div>
                  <button
                    className="inline-flex h-9 shrink-0 items-center rounded-xl bg-indigo-600 px-4 text-[12px] font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
                    disabled={sending}
                    onClick={() => void handleInvite(option)}
                    type="button"
                  >
                    Invitar
                  </button>
                </div>
              ))}

              {/* Salida para vendedores que todavia no aparecen en el buscador. */}
              {!searching && options.length === 0 ? (
                looksLikeEmail ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-3">
                    <p className="min-w-0 truncate text-[12px] text-slate-600">
                      Invitar a <span className="font-semibold">{trimmedSearch}</span>
                    </p>
                    <button
                      className="inline-flex h-9 shrink-0 items-center rounded-xl bg-indigo-600 px-4 text-[12px] font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
                      disabled={sending}
                      onClick={() => void handleInvite({ email: trimmedSearch })}
                      type="button"
                    >
                      {sending ? 'Enviando...' : 'Invitar'}
                    </button>
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed border-slate-300 px-4 py-5 text-center text-[12px] text-slate-500">
                    No encontramos vendedores con ese nombre. Escribi su email para invitarlo.
                  </p>
                )
              ) : null}
            </div>
          </>
        ) : null}
      </div>

      {/* Invitaciones enviadas esperando respuesta. */}
      {inbox.outgoing.length > 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-950">Invitaciones enviadas</p>
          <p className="mt-0.5 text-[11px] text-slate-500">Esperando que el vendedor responda.</p>

          <div className="mt-3 space-y-2">
            {inbox.outgoing.map((request) => (
              <div
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-3"
                key={request.id}
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-slate-950">
                    {sellerName(request)}
                  </p>
                  <p className="truncate text-[11px] text-slate-500">
                    {request.seller.email} · enviada el {formatDate(request.createdAt)}
                  </p>
                </div>
                <button
                  className="shrink-0 text-[12px] font-semibold text-slate-500 transition hover:text-rose-600 disabled:opacity-60"
                  disabled={processingId === request.id}
                  onClick={() => void handleRespond(request, 'cancel')}
                  type="button"
                >
                  Retirar
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
