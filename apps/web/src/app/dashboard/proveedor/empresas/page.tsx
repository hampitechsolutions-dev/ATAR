'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useWorkspace } from '@/components/auth/workspace-provider';
import SupplierDashboardShell from '@/components/dashboard/supplier-dashboard-shell';
import {
  atarApi,
  type RepresentationCompanyOption,
  type RepresentationInboxRecord,
  type RepresentationRequestRecord,
} from '@/lib/atar-api';
import { isSellerAccount, loadSession, type WebSession } from '@/lib/session';

const EMPTY_INBOX: RepresentationInboxRecord = { incoming: [], outgoing: [], history: [] };

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' }).format(
    new Date(value),
  );
}

function statusLabel(request: RepresentationRequestRecord) {
  if (request.status === 'ACCEPTED') {
    return 'Aceptada';
  }

  if (request.status === 'REJECTED') {
    return 'Rechazada';
  }

  if (request.status === 'CANCELLED') {
    return 'Retirada';
  }

  return 'Pendiente';
}

/**
 * Perfil del vendedor: las empresas que representa y los pedidos en curso.
 *
 * Desde aca puede ofrecerse a representar a una proveedora nueva y responder
 * las invitaciones que le mandan las empresas. Al aceptar, la empresa aparece
 * en el selector "Trabajando como".
 */
export default function SellerCompaniesPage() {
  const { workspaces, refreshWorkspaces, selectWorkspace, activeCompanyId } = useWorkspace();
  const [session, setSession] = useState<WebSession | null>(null);
  const [inbox, setInbox] = useState<RepresentationInboxRecord>(EMPTY_INBOX);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Buscador de empresas para pedir representacion.
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState<RepresentationCompanyOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<RepresentationCompanyOption | null>(null);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);

  const refresh = useCallback(async (accessToken: string) => {
    const result = await atarApi.getSellerRepresentation(accessToken);
    setInbox(result);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const storedSession = loadSession();
      if (!storedSession) {
        return;
      }

      setSession(storedSession);

      try {
        setLoading(true);
        setError(null);
        const result = await atarApi.getSellerRepresentation(storedSession.accessToken);
        if (!cancelled) {
          setInbox(result);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : 'No se pudieron cargar tus empresas.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  // El buscador espera a que el vendedor deje de tipear.
  useEffect(() => {
    if (!session?.accessToken) {
      return;
    }

    const token = session.accessToken;
    let cancelled = false;

    const timer = window.setTimeout(async () => {
      try {
        setSearching(true);
        const result = await atarApi.getRepresentableCompanies(search, token);
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
  }, [search, session?.accessToken]);

  const supplierWorkspaces = useMemo(
    () => workspaces.filter((workspace) => workspace.canSell),
    [workspaces],
  );

  // La pantalla es el perfil del vendedor. El dueno de una proveedora o un
  // comprador administran su empresa desde Configuracion: no representan a
  // nadie, invitan vendedores desde Equipo.
  const isSeller = session ? isSellerAccount(session.user) : true;

  async function handleRespond(
    request: RepresentationRequestRecord,
    action: 'accept' | 'reject' | 'cancel',
  ) {
    if (!session?.accessToken) {
      return;
    }

    try {
      setProcessingId(request.id);
      setError(null);
      setMessage(null);

      await atarApi.respondRepresentation(request.id, action, session.accessToken);

      if (action === 'accept') {
        setMessage(`Ya representas a ${request.company.name}. Elegila en el selector de empresa.`);
        // La empresa nueva tiene que aparecer en "Trabajando como".
        await refreshWorkspaces();
      } else if (action === 'reject') {
        setMessage(`Rechazaste la invitacion de ${request.company.name}.`);
      } else {
        setMessage(`Retiraste tu pedido a ${request.company.name}.`);
      }

      await refresh(session.accessToken);
    } catch (actionError) {
      setError(
        actionError instanceof Error ? actionError.message : 'No se pudo actualizar el pedido.',
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function handleSendRequest() {
    if (!session?.accessToken || !selectedCompany) {
      return;
    }

    try {
      setSending(true);
      setError(null);
      setMessage(null);

      await atarApi.requestRepresentation(
        { companyId: selectedCompany.id, message: note.trim() || undefined },
        session.accessToken,
      );

      setMessage(
        `Le mandamos tu pedido a ${selectedCompany.name}. Te avisamos cuando respondan.`,
      );
      setSelectedCompany(null);
      setNote('');
      setSearch('');
      await refresh(session.accessToken);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'No se pudo enviar el pedido.');
    } finally {
      setSending(false);
    }
  }

  const header = (
    <div>
      <p className="text-xs text-slate-500">Mi perfil</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Mis empresas</h1>
      <p className="mt-1 text-xs text-slate-500">
        Las proveedoras que representas y los pedidos que tenes en curso.
      </p>
    </div>
  );

  if (!isSeller) {
    return (
      <SupplierDashboardShell searchPlaceholder="Buscar empresas" session={session}>
        <div className="mx-auto w-full max-w-[900px] space-y-4">
          {header}
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            Esta sección es del perfil de vendedor. Tu cuenta administra una empresa, así que no
            representa a otras: sumá vendedores a tu equipo desde{' '}
            <Link className="font-semibold underline" href="/dashboard/proveedor/equipo">
              Equipo comercial
            </Link>
            .
          </div>
        </div>
      </SupplierDashboardShell>
    );
  }

  return (
    <SupplierDashboardShell searchPlaceholder="Buscar empresas" session={session}>
      <div className="mx-auto w-full max-w-[900px] space-y-4">
        {header}

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

        {/* Invitaciones que tiene que responder. */}
        {inbox.incoming.length > 0 ? (
          <section className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4">
            <p className="text-sm font-semibold text-indigo-900">
              {inbox.incoming.length} invitacion{inbox.incoming.length === 1 ? '' : 'es'} para
              representar a una empresa
            </p>
            <p className="mt-0.5 text-[11px] text-indigo-800">
              Si aceptas, la empresa se suma a tu selector y podes trabajar sus solicitudes.
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
                        {request.company.name.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-slate-950">
                          {request.company.name}
                        </p>
                        <p className="truncate text-[11px] text-slate-500">
                          Te invito {request.createdBy.firstName} · {formatDate(request.createdAt)}
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
          </section>
        ) : null}

        {/* Empresas que ya representa. */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-950">Empresas que representas</p>

          {loading ? (
            <p className="mt-3 text-sm text-slate-500">Cargando...</p>
          ) : supplierWorkspaces.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
              Todavia no representas a ninguna empresa. Pedi sumarte a una desde el buscador de
              abajo.
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {supplierWorkspaces.map((workspace) => {
                const isActive = workspace.companyId === activeCompanyId;

                return (
                  <div
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-3"
                    key={workspace.companyId}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold ${
                          isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {workspace.company.name.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-slate-950">
                          {workspace.company.name}
                        </p>
                        <p className="truncate text-[11px] text-slate-500">
                          {workspace.isManager ? 'Administrador' : 'Vendedor'}
                          {workspace.company.city ? ` · ${workspace.company.city}` : ''}
                        </p>
                      </div>
                    </div>

                    {isActive ? (
                      <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-600">
                        Trabajando aca
                      </span>
                    ) : (
                      <button
                        className="shrink-0 text-[12px] font-semibold text-indigo-600 hover:text-indigo-500"
                        onClick={() => selectWorkspace(workspace.companyId)}
                        type="button"
                      >
                        Trabajar aca
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Pedidos enviados esperando respuesta. */}
        {inbox.outgoing.length > 0 ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-950">Pedidos enviados</p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Esperando que la empresa responda.
            </p>

            <div className="mt-3 space-y-2">
              {inbox.outgoing.map((request) => (
                <div
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-3"
                  key={request.id}
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-slate-950">
                      {request.company.name}
                    </p>
                    <p className="truncate text-[11px] text-slate-500">
                      Enviado el {formatDate(request.createdAt)}
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
          </section>
        ) : null}

        {/* Pedir representar a una empresa nueva. */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-950">Representar a otra empresa</p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Busca la proveedora y mandale tu pedido. Se suma a tu cuenta cuando lo aprueban.
          </p>

          <input
            className="mt-3 h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none transition focus:border-indigo-400"
            onChange={(event) => {
              setSearch(event.target.value);
              setSelectedCompany(null);
            }}
            placeholder="Nombre de la empresa"
            value={search}
          />

          {selectedCompany ? (
            <div className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50/60 px-3.5 py-3">
              <p className="text-[13px] font-semibold text-slate-950">{selectedCompany.name}</p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                {[selectedCompany.city, selectedCompany.country].filter(Boolean).join(', ')}
              </p>

              <textarea
                className="mt-3 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-400"
                maxLength={500}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Contales quien sos y que rubro manejas (opcional)"
                rows={3}
                value={note}
              />

              <div className="mt-2 flex items-center gap-2">
                <button
                  className="inline-flex h-9 items-center rounded-xl bg-indigo-600 px-4 text-[12px] font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
                  disabled={sending}
                  onClick={() => void handleSendRequest()}
                  type="button"
                >
                  {sending ? 'Enviando...' : 'Enviar pedido'}
                </button>
                <button
                  className="inline-flex h-9 items-center rounded-xl border border-slate-200 px-3 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50"
                  onClick={() => setSelectedCompany(null)}
                  type="button"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {searching ? (
                <p className="text-[12px] text-slate-500">Buscando...</p>
              ) : options.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-300 px-4 py-5 text-center text-[12px] text-slate-500">
                  No hay empresas nuevas para pedir con ese nombre.
                </p>
              ) : (
                options.map((company) => (
                  <button
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-3 text-left transition hover:bg-slate-50"
                    key={company.id}
                    onClick={() => setSelectedCompany(company)}
                    type="button"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold text-slate-950">
                        {company.name}
                      </span>
                      <span className="block truncate text-[11px] text-slate-500">
                        {[company.city, company.country].filter(Boolean).join(', ')}
                      </span>
                    </span>
                    <span className="shrink-0 text-[12px] font-semibold text-indigo-600">
                      Pedir
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </section>

        {/* Historial de pedidos ya resueltos. */}
        {inbox.history.length > 0 ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-950">Historial</p>
            <div className="mt-3 space-y-1.5">
              {inbox.history.map((request) => (
                <div
                  className="flex items-center justify-between gap-3 text-[12px]"
                  key={request.id}
                >
                  <span className="min-w-0 truncate text-slate-600">{request.company.name}</span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      request.status === 'ACCEPTED'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {statusLabel(request)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </SupplierDashboardShell>
  );
}
