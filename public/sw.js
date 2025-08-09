
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// This is a placeholder for the Workbox manifest.
// The next-pwa library will inject the actual manifest here.
precacheAndRoute(self.__WB_MANIFEST || []);

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

// Cache assets (CSS, JS, etc.) using a Cache First strategy
registerRoute(
  ({ request }) =>
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'worker',
  new CacheFirst({
    cacheName: 'assets',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
    ],
  })
);

// Cache images using a Cache First strategy
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
    ],
  })
);

// Fallback to offline page
import { setCatchHandler } from 'workbox-routing';

setCatchHandler(({ event }) => {
  switch (event.request.destination) {
    case 'document':
      return caches.match('/_offline');
    default:
      return Response.error();
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'new-version-installed') {
     self.clients.matchAll({type: 'window'}).then(clients => {
       if(clients && clients.length) {
         clients[0].postMessage({type: 'new-version-installed'});
       }
     })
  }
  if (event.data && event.data.type === 'SHOW_TEST_NOTIFICATION') {
    const { title, options } = event.data;
    event.waitUntil(self.registration.showNotification(title, options));
  }
});

// Listen for push notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'PDFusion', body: 'You have a new notification.' };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icons/icon-192x192.png',
      badge: data.badge || '/icons/icon-72x72.png',
      data: {
        path: data.path || '/'
      }
    })
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close(); 
    const fullPath = self.location.origin + (event.notification.data?.path || '/');
    event.waitUntil(clients.openWindow(fullPath));
});
