/// <reference lib="webworker" />

// This is a placeholder for the self variable, which is available in service workers.
declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: any };

import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, NetworkFirst } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';

// Make sure the precache manifest is injected by next-pwa.
// The `self.__WB_MANIFEST` will be replaced by the list of files to precache.
precacheAndRoute(self.__WB_MANIFEST || []);

// Cache Google Fonts
registerRoute(
  /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
  new StaleWhileRevalidate({
    cacheName: 'google-fonts',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
      }),
    ],
  })
);

// Cache static assets (images, fonts, etc.)
registerRoute(
  /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css|jpg|jpeg|gif|png|svg|ico|webp)$/i,
  new StaleWhileRevalidate({
    cacheName: 'static-assets',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 64,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// Cache static JS and CSS
registerRoute(
  /\.(?:js|css)$/i,
  new StaleWhileRevalidate({
    cacheName: 'static-js-css',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 32,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
      }),
    ],
  })
);

// Cache Next.js data
registerRoute(
  ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith('/_next/data/'),
  new StaleWhileRevalidate({
    cacheName: 'next-data',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 32,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
      }),
    ],
  })
);

// Network-first for online-only pages
registerRoute(
  ({ request, url, sameOrigin }) =>
    request.mode === 'navigate' &&
    sameOrigin &&
    (
      url.pathname.startsWith('/assignment-tracker') ||
      url.pathname.startsWith('/currency-converter') ||
      url.pathname.startsWith('/text-summarizer')
    ),
  new NetworkFirst({
    cacheName: 'online-only-pages',
    networkTimeoutSeconds: 10,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 32,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
      }),
    ],
  })
);

// Stale-while-revalidate for all other navigation requests (offline-first)
registerRoute(
  ({ request, sameOrigin }) => request.mode === 'navigate' && sameOrigin,
  new StaleWhileRevalidate({
    cacheName: 'offline-first-pages',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
    ],
  })
);


// Placeholder for Push Notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'PDFusion';
  const options = {
    body: data.body || 'You have a new notification.',
    icon: '/192x192.png',
    badge: '/72x72.png',
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.openWindow('/')
  );
});

self.addEventListener('install', () => {
    self.skipWaiting();
});
