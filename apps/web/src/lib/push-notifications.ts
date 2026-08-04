'use client';

import { atarApi } from './atar-api';

const REGISTERED_ENDPOINT_KEY = 'atar.push.endpoint';

function base64UrlToUint8Array(value: string) {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);

  return Uint8Array.from(rawData, (character) => character.charCodeAt(0));
}

function getRegisteredEndpoint() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(REGISTERED_ENDPOINT_KEY);
}

function setRegisteredEndpoint(endpoint: string | null) {
  if (typeof window === 'undefined') {
    return;
  }

  if (!endpoint) {
    window.localStorage.removeItem(REGISTERED_ENDPOINT_KEY);
    return;
  }

  window.localStorage.setItem(REGISTERED_ENDPOINT_KEY, endpoint);
}

export function isWebPushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    typeof Notification !== 'undefined'
  );
}

export type WebPushPermission = 'unsupported' | 'default' | 'granted' | 'denied';

export function getWebPushPermission(): WebPushPermission {
  if (!isWebPushSupported()) {
    return 'unsupported';
  }

  return Notification.permission as WebPushPermission;
}

/**
 * En iOS el push solo existe si la app fue agregada a la pantalla de inicio.
 * En el navegador normal `PushManager` ni siquiera esta definido, asi que
 * conviene explicarle al usuario que primero tiene que instalarla.
 */
export function isIosWithoutInstall() {
  if (typeof window === 'undefined') {
    return false;
  }

  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

  return isIos && !isStandalone;
}

/**
 * `promptIfNeeded` decide si se puede abrir el dialogo nativo de permisos.
 * Por defecto NO: los navegadores penalizan (y Safari ignora) los pedidos que
 * no vienen de un gesto del usuario, y un "no" queda bloqueado para siempre.
 * El arranque de sesion lo llama en false para re-suscribir en silencio a quien
 * ya acepto; el boton de la UI lo llama en true.
 */
export async function enableWebPush(
  accessToken: string,
  { promptIfNeeded = false }: { promptIfNeeded?: boolean } = {},
) {
  if (!isWebPushSupported()) {
    return;
  }

  const config = await atarApi.getPushConfig(accessToken);
  if (!config.webPushEnabled || !config.webPushPublicKey) {
    return;
  }

  if (Notification.permission === 'denied') {
    return;
  }

  if (Notification.permission !== 'granted' && !promptIfNeeded) {
    return;
  }

  const permission =
    Notification.permission === 'granted'
      ? 'granted'
      : await Notification.requestPermission();

  if (permission !== 'granted') {
    return;
  }

  const registration = await navigator.serviceWorker.register('/push-sw.js');
  const existingSubscription = await registration.pushManager.getSubscription();
  const subscription =
    existingSubscription ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlToUint8Array(config.webPushPublicKey),
    }));

  const endpointChanged = getRegisteredEndpoint() !== subscription.endpoint;
  if (!endpointChanged) {
    return;
  }

  const serialized = subscription.toJSON();
  await atarApi.registerPushEndpoint(
    {
      channel: 'WEB',
      endpoint: subscription.endpoint,
      payload: serialized as Record<string, unknown>,
      userAgent: typeof navigator.userAgent === 'string' ? navigator.userAgent : undefined,
      deviceName: 'Web Browser',
    },
    accessToken,
  );

  setRegisteredEndpoint(subscription.endpoint);
}

export async function disableWebPush(accessToken: string) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  const registration = await navigator.serviceWorker.getRegistration('/push-sw.js');
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) {
    setRegisteredEndpoint(null);
    return;
  }

  await atarApi.removePushEndpoint(subscription.endpoint, accessToken);
  await subscription.unsubscribe();
  setRegisteredEndpoint(null);
}
