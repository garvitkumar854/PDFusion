/// <reference lib="webworker" />

// This is a placeholder for the self variable, which is available in service workers.
declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: any };

import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { clientsClaim } from 'workbox-core';

self.skipWaiting();
clientsClaim();

// Make sure the precache manifest is injected by next-pwa.
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

// Single, robust routing rule for all navigation requests
registerRoute(
  ({ request, url, sameOrigin }) => request.mode === 'navigate' && sameOrigin,
  ({ url }) => {
    const isOnlineOnlyPage = 
      url.pathname.startsWith('/assignment-tracker') ||
      url.pathname.startsWith('/currency-converter') ||
      url.pathname.startsWith('/text-summarizer');

    if (isOnlineOnlyPage) {
      // For online-only pages, try the network first.
      // If the network fails, it will automatically fall back to the offline page.
      return new NetworkFirst({
        cacheName: 'online-only-pages',
        networkTimeoutSeconds: 10, // Timeout to prevent long waits on poor networks
        plugins: [
          new ExpirationPlugin({
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          }),
        ],
      });
    }

    // For all other pages, use a stale-while-revalidate strategy.
    // This serves content from cache immediately for a fast experience,
    // and updates it in the background if a new version is available.
    return new StaleWhileRevalidate({
      cacheName: 'offline-first-pages',
      plugins: [
        new ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
        }),
      ],
    });
  }
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
