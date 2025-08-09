/**
 * Welcome to your Workbox-powered service worker!
 *
 * You'll need to register this file in your web app.
 * See https://goo.gl/yCJYRv
 *
 * The documentation for Workbox is available at https://developers.google.com/web/tools/workbox/
 */

if (typeof importScripts === 'function') {
  importScripts(
    'https://storage.googleapis.com/workbox-cdn/releases/7.1.0/workbox-sw.js'
  );
  
  /* global workbox */
  if (workbox) {
    console.log('Workbox is loaded');

    // Prevent debugging messages in production
    workbox.setConfig({ debug: false });

    // Precaching: This will be populated by next-pwa with the list of assets to cache
    // The manifest will be injected by the build process
    workbox.precaching.precacheAndRoute(self.__WB_MANIFEST);

    // Cache the Google Fonts stylesheets with a stale-while-revalidate strategy.
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
            maxAgeSeconds: 60 * 60 * 24 * 365,
            maxEntries: 30,
          }),
        ],
      })
    );
    
    // Default caching strategy for pages and assets: Stale-While-Revalidate
    workbox.routing.registerRoute(
      ({ request }) => request.destination === 'document' ||
                       request.destination === 'script' ||
                       request.destination === 'style',
      new workbox.strategies.StaleWhileRevalidate({
        cacheName: 'pages-and-assets',
        plugins: [
          new workbox.expiration.ExpirationPlugin({
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
          }),
        ],
      })
    );
    
    // Cache images with a cache-first strategy
    workbox.routing.registerRoute(
      ({ request }) => request.destination === 'image',
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

    // Offline fallback
    const offlineFallback = '/_offline';
    workbox.routing.setCatchHandler(({ event }) => {
        switch (event.request.destination) {
            case 'document':
                return caches.match(offlineFallback);
            default:
                return Response.error();
        }
    });

  } else {
    console.log('Workbox could not be loaded. No offline support.');
  }
}
