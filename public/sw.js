
// This is a placeholder for the manifest that will be injected by next-pwa.
// The list of files to cache will be injected here automatically.
const manifest = self.__WB_MANIFEST;

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || 'PDFusion';
  const options = {
    body: data.body || 'You have a new notification.',
    icon: '/images/icons/icon-192x192.png',
    badge: '/images/icons/icon-72x72.png',
    data: {
        path: data.path || '/'
    }
  };
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const fullPath = self.location.origin + event.notification.data.path;
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(clientsArr => {
            const hadWindowToFocus = clientsArr.some(windowClient => windowClient.url === fullPath ? (windowClient.focus(), true) : false);

            if (!hadWindowToFocus) {
                clients.openWindow(fullPath).then(windowClient => windowClient ? windowClient.focus() : null);
            }
        })
    );
});
