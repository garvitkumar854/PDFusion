
/**
 * @fileoverview Service Worker for PWA functionality.
 * This file handles caching, offline support, push notifications, and background sync.
 */

// Make sure to use importScripts to load the Workbox library.
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

if (workbox) {
  // 1. Pre-caching configuration
  // The __WB_MANIFEST is a placeholder that will be replaced by the build process
  // with a list of files to cache.
  workbox.precaching.precacheAndRoute(self.__WB_MANIFEST);

  // 2. Caching Strategies for different types of assets
  
  // Cache Google Fonts with a stale-while-revalidate strategy.
  workbox.routing.registerRoute(
    ({url}) => url.origin === 'https://fonts.googleapis.com',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'google-fonts-stylesheets',
    })
  );

  // Cache the underlying font files with a cache-first strategy for 1 year.
  workbox.routing.registerRoute(
    ({url}) => url.origin === 'https://fonts.gstatic.com',
    new workbox.strategies.CacheFirst({
      cacheName: 'google-fonts-webfonts',
      plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        new workbox.expiration.ExpirationPlugin({
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 Year
          maxEntries: 30,
        }),
      ],
    })
  );

  // Cache images with a cache-first strategy.
  workbox.routing.registerRoute(
    ({request}) => request.destination === 'image',
    new workbox.strategies.CacheFirst({
      cacheName: 'images',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
        }),
      ],
    })
  );

  // Fallback to offline page if a navigation request fails.
  const offlineFallback = '/_offline';
  workbox.routing.setCatchHandler(({ event }) => {
    switch (event.request.destination) {
      case 'document':
        return caches.match(offlineFallback);
      default:
        return Response.error();
    }
  });


  // 3. Push Notification Handling
  self.addEventListener('push', (event) => {
    const data = event.data?.json() ?? {};
    const title = data.title || 'PDFusion';
    const message = data.message || 'You have a new notification.';
    const options = {
        body: message,
        icon: '/icons/192x192.png',
        badge: '/icons/badge.png',
        actions: data.actions || [],
        data: data.data || {}, // Store any additional data
    };
    event.waitUntil(self.registration.showNotification(title, options));
  });

  self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    // Check if there's an action and a URL in the notification data
    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(windowClients => {
            // Check if there is already a window open with the same URL.
            const matchingClient = windowClients.find(client => {
                let clientUrl = new URL(client.url);
                let targetUrl = new URL(urlToOpen, self.location.origin);
                return clientUrl.pathname === targetUrl.pathname;
            });
            
            if (matchingClient) {
                // If found, focus the existing window.
                return matchingClient.focus();
            } else {
                // Otherwise, open a new window.
                return clients.openWindow(urlToOpen);
            }
        })
    );
  });
  
  // 4. Background Sync for failed POST requests
  const bgSyncPlugin = new workbox.backgroundSync.BackgroundSyncPlugin('pdfusion-queue', {
    maxRetentionTime: 24 * 60, // Retry for up to 24 hours
  });

  workbox.routing.registerRoute(
    ({request}) => request.method === 'POST',
    new workbox.strategies.NetworkOnly({
        plugins: [bgSyncPlugin]
    })
  );

  // 5. Update handling - prompt user to reload
  self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
  });
  
} else {
  console.log(`Workbox didn't load`);
}
