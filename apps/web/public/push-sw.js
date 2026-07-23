// Toma control apenas se instala una version nueva, sin esperar a que se
// cierren las pestanas abiertas.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Chrome solo ofrece "Instalar app" si el service worker declara un handler de
// fetch. No interceptamos nada: sin respondWith, el navegador resuelve cada
// request normalmente y no hay riesgo de servir contenido cacheado viejo.
self.addEventListener('fetch', () => {});

self.addEventListener('push', (event) => {
  const payload = event.data ? event.data.json() : {};
  const title = payload.title || 'ATAR';
  const options = {
    body: payload.body || 'Tenes una nueva notificacion.',
    icon: '/logoatar.png',
    badge: '/logoatar.png',
    data: {
      url: payload.url || '/dashboard/comprador/notificaciones',
    },
    tag: payload.tag || 'atar-notification',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client && client.url.includes(self.location.origin)) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }

      return undefined;
    }),
  );
});
