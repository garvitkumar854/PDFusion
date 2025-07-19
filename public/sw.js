
// This is a custom service worker file
// While next-pwa handles caching, you can add custom logic here.

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// You can add more listeners here for push notifications, background sync, etc.
// For example:
/*
self.addEventListener('push', (event) => {
  const data = event.data.json();
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/icon-192x192.png'
  });
});
*/
