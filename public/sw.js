
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

workbox.setConfig({ debug: false });

// This is the placeholder for the precache manifest injected by next-pwa.
workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);

const OFFLINE_URL = '/_offline';
const CACHE_NAME = 'pdfusion-offline-cache';

// Cache the offline page during install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.add(OFFLINE_URL);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME && name.startsWith('pdfusion-'))
          .map(name => caches.delete(name))
      );
    })
  );
});


// Offline fallback
workbox.routing.setCatchHandler(({ event }) => {
  switch (event.request.destination) {
    case 'document':
      return caches.match(OFFLINE_URL);
    default:
      return Response.error();
  }
});


// Background Sync for failed POST requests
const bgSyncPlugin = new workbox.backgroundSync.BackgroundSyncPlugin('pdf-post-requests', {
  maxRetentionTime: 24 * 60, // Retry for up to 24 hours
  onSync: async ({ queue }) => {
    let entry;
    while ((entry = await queue.shiftRequest())) {
      try {
        await fetch(entry.request);
      } catch (error) {
        console.error('Replay failed for request', entry.request, error);
        await queue.unshiftRequest(entry);
        throw new Error('queue-replay-failed');
      }
    }
  },
});

workbox.routing.registerRoute(
  ({ request }) => request.method === 'POST',
  new workbox.strategies.NetworkOnly({
    plugins: [bgSyncPlugin],
  })
);
