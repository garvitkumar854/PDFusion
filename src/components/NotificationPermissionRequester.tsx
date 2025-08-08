
'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { RefreshCw, Bell } from 'lucide-react';

const NOTIFICATION_PERMISSION_KEY = 'notification_permission_status';

export default function NotificationPermissionRequester() {
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);


  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && isOnline) {
      const askForPermission = () => {
        const permissionStatus = localStorage.getItem(NOTIFICATION_PERMISSION_KEY);
        if (Notification.permission === 'default' && permissionStatus !== 'requested') {
          // Use a toast to ask for permission first
          toast({
            title: "Enable Notifications",
            description: "Get notified about important updates, even in the background.",
            variant: "info",
            duration: 10000,
            action: (
              <Button onClick={() => {
                localStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'requested');
                Notification.requestPermission().then(permission => {
                    localStorage.setItem(NOTIFICATION_PERMISSION_KEY, permission);
                });
              }} size="sm">
                <Bell className="mr-2 h-4 w-4" />
                Allow
              </Button>
            )
          });
        } else {
            localStorage.setItem(NOTIFICATION_PERMISSION_KEY, Notification.permission);
        }
      };
      
      // Ask for permission a few seconds after the app loads
      const permissionTimeout = setTimeout(askForPermission, 5000);

      const handleServiceWorkerUpdate = (registration: ServiceWorkerRegistration) => {
        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New update available, show toast inside the app
                  toast({
                    title: "New Update Available",
                    description: "Click refresh to get the latest version.",
                    variant: "info",
                    duration: 20000,
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
        handleServiceWorkerUpdate(registration);
        // Check for updates periodically
        setInterval(() => {
          if(navigator.onLine) {
            registration.update();
          }
        }, 1000 * 60 * 60); // Check every hour
      });
      
      return () => clearTimeout(permissionTimeout);
    }
  }, [toast, isOnline]);

  return null;
}
