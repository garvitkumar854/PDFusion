
"use client";

import { useState, useEffect } from 'react';

export const usePWAUpdater = () => {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const handleUpdate = (registration: ServiceWorkerRegistration) => {
      if (registration.waiting) {
        setWaitingWorker(registration.waiting);
        setIsUpdateAvailable(true);
      }
    };

    navigator.serviceWorker.getRegistration().then(reg => {
      if (reg) {
        // Listen for new worker installation
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New worker is waiting for activation.
                handleUpdate(reg);
              }
            });
          }
        });
        
        // Initial check
        handleUpdate(reg);
      }
    });

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
    });

  }, []);

  const updateApp = () => {
    if (waitingWorker) {
      // Send message to SW to skip the waiting and activate the new worker
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  return { isUpdateAvailable, updateApp };
};
