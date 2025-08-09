
"use strict";

if (typeof self === "undefined") {
    // Not in a service worker, do nothing
} else {
    // Precache and route handling
    self.addEventListener("install", (event) => {
        // console.log("Service Worker: Installing...");
    });

    self.addEventListener("activate", (event) => {
        // console.log("Service Worker: Activating...");
        event.waitUntil(self.clients.claim());
    });

    self.addEventListener("fetch", (event) => {
        if (event.request.mode === "navigate") {
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
                        // console.log("Fetch failed; returning offline page instead.", error);
                        const cache = await caches.open("offline-fallbacks");
                        const cachedResponse = await cache.match("/_offline");
                        return cachedResponse;
                    }
                })()
            );
        }
    });

    // Handle skip waiting
    self.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SKIP_WAITING') {
            self.skipWaiting();
            // After skipping waiting, notify clients to refresh
            self.clients.matchAll({ type: 'window' }).then((clients) => {
                clients.forEach((client) => {
                    client.postMessage({ type: 'new-version-installed' });
                });
            });
        }
    });
}
