
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

const registerRoute = workbox.routing.registerRoute;
const precacheAndRoute = workbox.precaching.precacheAndRoute;
const NetworkFirst = workbox.strategies.NetworkFirst;
const StaleWhileRevalidate = workbox.strategies.StaleWhileRevalidate;
const CacheFirst = workbox.strategies.CacheFirst;
const CacheableResponsePlugin = workbox.cacheableResponse.CacheableResponsePlugin;
const ExpirationPlugin = workbox.expiration.ExpirationPlugin;
const BackgroundSyncPlugin = workbox.backgroundSync.BackgroundSyncPlugin;


self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  // The precacheAndRoute() is called here inside the install event.
  // self.__WB_MANIFEST is a placeholder that will be replaced by the list of assets to precache.
  try {
    precacheAndRoute(self.__WB_MANIFEST || []);
  } catch (e) {
    console.error('Service Worker: Precache failed', e);
  }
});


// Cache pages
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'pages',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [200],
      }),
    ],
  })
);

// Cache CSS, JS, and other worker files
registerRoute(
  ({ request }) =>
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'worker',
  new StaleWhileRevalidate({
    cacheName: 'assets',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [200],
      }),
    ],
  })
);

// Cache images
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 Days
      }),
    ],
  })
);


// Background Sync for failed POST requests
const bgSyncPlugin = new BackgroundSyncPlugin('retry-post-requests', {
  maxRetentionTime: 24 * 60, // Retry for up to 24 hours
});

registerRoute(
  ({ request }) => request.method === 'POST',
  new NetworkFirst({
    plugins: [bgSyncPlugin],
  })
);


// Push Notification Handler
self.addEventListener('push', (event) => {
    const data = event.data.json();
    const title = data.title || 'New Update';
    const options = {
        body: data.body || 'A new version of the app is available. Click to update.',
        icon: '/icons/192x192.png',
        badge: '/icons/96x96.png',
        data: {
            url: data.url || '/',
        }
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            const url = event.notification.data.url;
            // Check if there's already a window open with the target URL
            for (const client of clientList) {
                if (client.url === url && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not, open a new window
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});
