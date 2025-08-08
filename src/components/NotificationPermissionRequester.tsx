
'use client';

import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { RefreshCw } from 'lucide-react';

export default function NotificationPermissionRequester() {
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const handleServiceWorkerUpdate = (registration: ServiceWorkerRegistration) => {
        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New update available
                  toast({
                    title: "New Update Available",
                    description: "Click refresh to get the latest version.",
                    variant: "info",
                    duration: 20000, // Keep it open longer
                    action: (
                      <Button onClick={() => {
                        installingWorker.postMessage({ type: 'SKIP_WAITING' });
                      }} size="sm">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                      </Button>
                    )
                  });
                }
              }
            });
          }
        });
      };

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (refreshing) return;
          window.location.reload();
          refreshing = true;
      });

      navigator.serviceWorker.ready.then(registration => {
         // Check for updates every hour
         setInterval(() => {
            registration.update();
         }, 1000 * 60 * 60);
        handleServiceWorkerUpdate(registration);
      });
    }
  }, [toast]);

  return null; // This component does not render anything
}
