
'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { BellRing, RefreshCw } from 'lucide-react';

export default function NotificationPermissionRequester() {
  const [permission, setPermission] = useState<NotificationPermission | 'default'>('default');
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const handleServiceWorkerUpdate = (registration: ServiceWorkerRegistration) => {
        // This logic is based on: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/onupdatefound
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // At this point, the old content is still being served and the new service worker is waiting to take control.
                  // We can now prompt the user to refresh the page to see the new content.
                  toast({
                    title: "New Update Available",
                    description: "Click refresh to get the latest version.",
                    variant: "info",
                    duration: 20000, // Keep it open longer
                    action: (
                      <Button onClick={() => {
                        installingWorker.postMessage({ type: 'SKIP_WAITING' });
                        // The controllerchange event will fire when the new service worker has taken control.
                        // We can listen for that to safely reload the page.
                        let refreshing = false;
                        navigator.serviceWorker.addEventListener('controllerchange', () => {
                          if (refreshing) return;
                          window.location.reload();
                          refreshing = true;
                        });
                      }} size="sm">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                      </Button>
                    )
                  });
                }
              }
            };
          }
        };
      };

      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          // Check for updates immediately
          registration.update();
          // And then listen for future updates
          handleServiceWorkerUpdate(registration);
        });
    }

    // Permission request logic remains the same
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, [toast]);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      toast({
        variant: 'destructive',
        title: 'Unsupported Browser',
        description: 'This browser does not support desktop notifications.',
      });
      return;
    }

    const currentPermission = await Notification.requestPermission();
    setPermission(currentPermission);

    if (currentPermission === 'granted') {
      toast({
        variant: 'success',
        title: 'Notifications Enabled!',
        description: 'You will now receive updates.',
      });
    } else {
      toast({
        variant: 'warning',
        title: 'Notifications Blocked',
        description: 'You can enable notifications in your browser settings.',
      });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (permission === 'default') {
        toast({
          variant: 'info',
          title: 'Stay Updated!',
          description: 'Enable notifications to get the latest updates from PDFusion.',
          duration: 10000,
          action: (
            <Button onClick={requestPermission} size="sm">
              <BellRing className="mr-2 h-4 w-4" />
              Enable
            </Button>
          ),
        });
      }
    }, 5000); // Wait 5 seconds before showing the prompt

    return () => clearTimeout(timer);
  }, [permission, toast]);

  return null;
}
