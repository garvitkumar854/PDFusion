
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute, Route } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';

// This is a placeholder for the Workbox manifest.
// The next-pwa library will inject the actual manifest here.
precacheAndRoute(self.__WB_MANIFEST);

const staleWhileRevalidate = new StaleWhileRevalidate({
  cacheName: 'next-pwa-cache',
});

const allRoute = new Route(({ request }) => {
  return request.destination === 'document' ||
         request.destination === 'script' ||
         request.destination === 'style' ||
         request.destination === 'font';
}, staleWhileRevalidate);

registerRoute(allRoute);

// Handle push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || 'PDFusion';
  const options = {
    body: data.body || 'You have a new message.',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/icon-72x72.png',
    data: {
      path: data.path || '/',
    },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const fullPath = self.location.origin + (event.notification.data.path || '/');
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      // If a window is already open, focus it.
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === fullPath && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window.
      if (clients.openWindow) {
        return clients.openWindow(fullPath);
      }
    })
  );
});

// Handle messages from the main app (for testing notifications)
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SHOW_TEST_NOTIFICATION') {
    const { title, options } = event.data;
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  }
});

self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.clients.claim().then(() => {
        // After the service worker is activated, show a notification
        self.registration.showNotification('PDFusion Updated!', {
            body: 'A new version is available. The app is ready to use offline.',
            icon: '/icons/icon-192x192.png',
        });
    })
  );
});
