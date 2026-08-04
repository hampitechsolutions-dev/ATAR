'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import {
  disableWebPush,
  enableWebPush,
  getWebPushPermission,
  isIosWithoutInstall,
  type WebPushPermission,
} from '@/lib/push-notifications';

export default function PushOptIn() {
  const { session } = useAuth();
  const [permission, setPermission] = useState<WebPushPermission | null>(null);
  const [needsInstall, setNeedsInstall] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // El estado del permiso solo existe en el navegador: se lee despues del
  // montaje para no romper el render del servidor.
  useEffect(() => {
    setPermission(getWebPushPermission());
    setNeedsInstall(isIosWithoutInstall());
  }, []);

  if (permission === null) {
    return null;
  }

  async function handleEnable() {
    if (!session?.accessToken) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      await enableWebPush(session.accessToken, { promptIfNeeded: true });
      const next = getWebPushPermission();
      setPermission(next);

      if (next !== 'granted') {
        setError('No se activaron las notificaciones. Revisa los permisos del navegador.');
      }
    } catch {
      setError('No se pudieron activar las notificaciones. Intenta de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDisable() {
    if (!session?.accessToken) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      await disableWebPush(session.accessToken);
      setPermission(getWebPushPermission());
    } catch {
      setError('No se pudieron desactivar las notificaciones.');
    } finally {
      setBusy(false);
    }
  }

  if (permission === 'unsupported') {
    // En iPhone esto pasa siempre hasta que la app se instala, asi que el
    // mensaje generico de "no compatible" seria enganoso.
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-medium text-slate-900">Notificaciones push</p>
        <p className="mt-1 text-sm text-slate-600">
          {needsInstall
            ? 'Para recibir notificaciones en iPhone, primero agrega ATAR a tu pantalla de inicio desde Compartir → Agregar a inicio.'
            : 'Este navegador no soporta notificaciones push.'}
        </p>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-medium text-amber-900">Notificaciones bloqueadas</p>
        <p className="mt-1 text-sm text-amber-800">
          Bloqueaste las notificaciones para este sitio. Habilitalas desde la configuracion
          del navegador para volver a recibirlas.
        </p>
      </div>
    );
  }

  const isGranted = permission === 'granted';

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-900">Notificaciones push</p>
          <p className="mt-1 text-sm text-slate-600">
            {isGranted
              ? 'Estas recibiendo avisos de mensajes, cotizaciones y pedidos en este dispositivo.'
              : 'Activalas para enterarte de mensajes, cotizaciones y pedidos al instante.'}
          </p>
        </div>

        <button
          type="button"
          onClick={isGranted ? handleDisable : handleEnable}
          disabled={busy || !session?.accessToken}
          className={
            isGranted
              ? 'rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50'
              : 'rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50'
          }
        >
          {busy ? 'Procesando...' : isGranted ? 'Desactivar' : 'Activar notificaciones'}
        </button>
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
