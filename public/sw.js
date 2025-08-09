/// <reference lib="webworker" />

import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: any;
};

// Precache all assets injected by Workbox
precacheAndRoute(self.__WB_MANIFEST);

// Cache pages using a Network First strategy
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'pages',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
    ],
  })
);

// Cache static assets using a Stale While Revalidate strategy
registerRoute(
  ({ request }) =>
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'worker' ||
    request.destination === 'font',
  new StaleWhileRevalidate({
    cacheName: 'assets',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
    ],
  })
);

// Cache images using a Stale While Revalidate strategy
registerRoute(
  ({ request }) => request.destination === 'image',
  new StaleWhileRevalidate({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
    ],
  })
);

// Handle push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json();
  if (data && data.type === 'new-version-available') {
    const title = 'Update Available!';
    const options = {
      body: 'A new version of PDFusion is ready. Click here to update.',
      icon: '/icons/192x192.png',
      badge: '/icons/96x96.png',
      data: {
        url: self.registration.scope, // Opens the app's root URL
      },
    };
    event.waitUntil(self.registration.showNotification(title, options));
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const url = event.notification.data.url;
      if (clientList.length > 0) {
        let client = clientList[0];
        for (const c of clientList) {
          if (c.focused) {
            client = c;
            break;
          }
        }
        client.focus();
        // A simple way to signal the client to refresh
        client.postMessage({ type: 'new-version-installed' });
      } else {
        clients.openWindow(url);
      }
    })
  );
});

// Periodic background sync for updates
self.addEventListener('periodicsync', (event) => {
  if ((event as any).tag === 'get-latest-version') {
    (event as any).waitUntil(
      // This is a placeholder for a function that would check for updates from your server
      // For now, it just demonstrates that periodic sync is handled.
      Promise.resolve()
    );
  }
});

// Background sync for failed POST requests
self.addEventListener('fetch', (event) => {
  if (event.request.method === 'POST') {
    event.respondWith(
      fetch(event.request).catch(() => {
        if ('sync' in self.registration) {
          (self.registration as any).sync.register('failed-post-sync');
        }
        return new Response(JSON.stringify({ error: 'Network error, request queued.' }), {
          headers: { 'Content-Type': 'application/json' },
          status: 503,
        });
      })
    );
  }
});

self.addEventListener('sync', (event) => {
  if ((event as any).tag === 'failed-post-sync') {
    (event as any).waitUntil(
      // This is a placeholder for replaying queued requests.
      // A full implementation would use IndexedDB to store and replay failed requests.
      Promise.resolve()
    );
  }
});
