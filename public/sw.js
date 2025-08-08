
self.addEventListener('install', (event) => {
  const newWorker = event.target;
  
  // When a new service worker is installed, it means an update is available.
  // We can show a native notification here if the user has granted permission.
  if (self.registration.active) { // Only show notification if there's an existing active worker
    self.registration.showNotification('Update Available for PDFusion', {
      body: 'A new version of the app is ready. Click here to update now!',
      icon: '/icons/icon-192x192.png',
      tag: 'pwa-update' // Use a tag to prevent multiple notifications
    }).catch(err => {
      console.log("Update notification failed to show:", err);
    });
  }
});

self.addEventListener('activate', (event) => {
  // This event is fired when the service worker is activated.
  // We claim clients here to take control of the page immediately.
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.notification.tag === 'pwa-update') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clientList) => {
        // Find the most recently focused client
        const focusedClient = clientList.find(c => c.focused);
        const clientToFocus = focusedClient || (clientList.length ? clientList[0] : null);

        if (clientToFocus) {
          // If a client is found, focus it and then reload.
          clientToFocus.focus().then(c => {
            if (c) c.navigate(c.url); // This reloads the page
          });
        } else {
          // If no client is found, open a new one.
          self.clients.openWindow('/');
        }
        
        // Ensure the new service worker activates
        self.skipWaiting();
      })
    );
  }
});

// Basic caching strategy (can be expanded)
self.addEventListener('fetch', (event) => {
    // For now, we'll just go to the network.
    // This file can be enhanced with caching strategies using next-pwa's output.
});
