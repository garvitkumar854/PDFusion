/**
 * This is a custom service worker file that provides advanced caching and offline capabilities.
 */
if (typeof self !== 'undefined') {
  self.addEventListener('install', (event) => {
    self.skipWaiting();
  });

  self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
  });

  self.addEventListener('fetch', (event) => {
    if (event.request.url.startsWith(self.location.origin)) {
      event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          return caches.open('dynamic').then((cache) => {
            return fetch(event.request).then((response) => {
              if(event.request.method === 'GET') {
                  cache.put(event.request, response.clone());
              }
              return response;
            });
          });
        })
      );
    }
  });

  self.addEventListener('sync', function(event) {
    if (event.tag == 'sync-failed-requests') {
      event.waitUntil(
        (async () => {
          const cache = await caches.open('failed-requests');
          const requests = await cache.keys();
          for (const request of requests) {
            try {
              const response = await fetch(request);
              if (response.ok) {
                await cache.delete(request);
              }
            } catch (error) {
              console.error('Sync failed for request:', request.url, error);
            }
          }
        })()
      );
    }
  });
}
