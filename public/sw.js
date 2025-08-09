
'use strict';

// This is a basic service worker that allows the app to be installed and work offline.

// The self.__WB_MANIFEST is a placeholder that will be replaced by the Workbox build process
// with a list of assets to precache.
const precacheManifest = self.__WB_MANIFEST || [];

const OFFLINE_URL = '/_offline';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('offline-cache').then((cache) => {
      return cache.add(OFFLINE_URL);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Enable navigation preloading if it's supported.
      if ('navigationPreload' in self.registration) {
        await self.registration.navigationPreload.enable();
      }
    })()
  );
  // Tell the active service worker to take control of the page immediately.
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // First, try to use the navigation preload response if it's supported.
          const preloadResponse = await event.preloadResponse;
          if (preloadResponse) {
            return preloadResponse;
          }

          const networkResponse = await fetch(event.request);
          return networkResponse;
        } catch (error) {
          // catch is only triggered if an exception is thrown, which is likely
          // due to a network error.
          // If fetch() returns a valid HTTP response with a 4xx or 5xx status,
          // the catch() will NOT be called.
          console.log('Fetch failed; returning offline page instead.', error);

          const cache = await caches.open('offline-cache');
          const cachedResponse = await cache.match(OFFLINE_URL);
          return cachedResponse;
        }
      })()
    );
  }
});
