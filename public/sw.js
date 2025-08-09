
import { precacheAndRoute } from 'workbox-precaching';

// The self.__WB_MANIFEST is a placeholder that will be replaced by the Workbox build process
// with a list of assets to cache.
precacheAndRoute(self.__WB_MANIFEST || []);

self.addEventListener('install', (event) => {
  // Automatically activate the new service worker as soon as it's installed.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Claim all clients (open tabs/windows) to ensure they are controlled by this service worker.
      await self.clients.claim();
      // After activating, show a notification that the app has been updated.
      self.registration.showNotification('PDFusion has been updated!', {
        body: 'A new version is available. Restart the app to see the changes.',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        data: {
            path: '/'
        }
      });
    })()
  );
});

self.addEventListener('push', (event) => {
  event.waitUntil(
    self.registration.showNotification('PDFusion', {
      body: 'You have a new notification.',
      icon: '/icons/icon-192x192.png',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  var fullPath = self.location.origin + (event.notification.data?.path || '/');
  event.waitUntil(
      clients.matchAll({type: 'window'}).then(clientsArr => {
          const hadWindowToFocus = clientsArr.some(windowClient => windowClient.url === fullPath ? (windowClient.focus(), true) : false);

          if (!hadWindowToFocus) {
              clients.openWindow(fullPath).then(windowClient => windowClient ? windowClient.focus() : null);
          }
      })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_TEST_NOTIFICATION') {
    const { title, options } = event.data;
    event.waitUntil(self.registration.showNotification(title, options));
  } else if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const preloadResponse = await event.preloadResponse;
          if (preloadResponse) {
            return preloadResponse;
          }

          const networkResponse = await fetch(event.request);
          return networkResponse;
        } catch (error) {
          console.log('Fetch failed; returning offline page instead.', error);
          const cache = await caches.open('offline-fallback');
          const cachedResponse = await cache.match('/_offline');
          return cachedResponse;
        }
      })()
    );
  }
});
