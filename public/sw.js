
if (!self.define) {
  let e,
    s = {};
  const t = (t, n) => (
    (t = new URL(t + '.js', n).href),
    s[t] ||
      new Promise((s) => {
        if ('document' in self) {
          const e = document.createElement('script');
          (e.src = t), (e.onload = s), document.head.appendChild(e);
        } else (e = t), importScripts(t), s();
      }).then(() => {
        if (!s[t]) throw new Error(`Module ${t} did not register`);
        return s[t];
      })
  );
  self.define = (n, i) => {
    const o =
      e ||
      ('document' in self ? document.currentScript.src : '') ||
      location.href;
    if (s[o]) return;
    let r = {};
    const c = (e) => t(e, o),
      l = { module: { uri: o }, exports: r, require: c };
    s[o] = Promise.all(n.map((e) => l[e] || c(e))).then((e) => (i(...e), r));
  };
}
define(['./workbox-a56347a3'], function (e) {
  'use strict';
  self.addEventListener('message', (e) => {
    e.data && 'SKIP_WAITING' === e.data.type && self.skipWaiting();
  });
  const s = 'pdfusion-pwa';
  e.registerRoute(
    '/',
    new e.NetworkFirst({
      cacheName: s,
      plugins: [
        new e.ExpirationPlugin({ maxEntries: 1, maxAgeSeconds: 86400 }),
      ],
    }),
    'GET'
  ),
    e.registerRoute(
      /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      new e.CacheFirst({
        cacheName: 'google-fonts',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 31536e3 }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'static-font-assets',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 2592e3 }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'static-image-assets',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 2592e3 }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /\.(?:js|css)$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'static-js-css-assets',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 2592e3 }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /.*/i,
      new e.NetworkFirst({
        cacheName: 'others',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
        networkTimeoutSeconds: 10,
      }),
      'GET'
    );

  // Push notification event listener
  self.addEventListener('push', function (event) {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'PDFusion';
    const options = {
      body: data.body || 'You have a new notification.',
      icon: data.icon || '/icon-192x192.png',
      badge: data.badge || '/badge-72x72.png',
      data: {
        url: data.url || '/',
      },
    };
    event.waitUntil(self.registration.showNotification(title, options));
  });

  // Notification click event listener
  self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    const urlToOpen = event.notification.data.url || '/';

    event.waitUntil(
      clients
        .matchAll({
          type: 'window',
          includeUncontrolled: true,
        })
        .then(function (clientList) {
          if (clientList.length > 0) {
            let client = clientList[0];
            for (let i = 0; i < clientList.length; i++) {
              if (clientList[i].focused) {
                client = clientList[i];
              }
            }
            return client.focus().then((c) => c.navigate(urlToOpen));
          }
          return clients.openWindow(urlToOpen);
        })
    );
  });
});
