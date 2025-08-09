
'use client';

import { useEffect, useState } from 'react';
import { useToast } from './use-toast';
import { ToastAction } from '@/components/ui/toast';
import React from 'react';

export function usePwa() {
  const { toast } = useToast();
  const [isNotificationPermissionGranted, setIsNotificationPermissionGranted] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && (window as any).workbox !== undefined) {
       (window as any).workbox.addEventListener('installed', (event: any) => {
        if (event.isUpdate) {
          const UpdateAction = React.createElement(ToastAction, {
            altText: "Update",
            onClick: () => (window as any).workbox.messageSW({ type: 'SKIP_WAITING' })
          }, 'Update');

          toast({
            variant: "info",
            title: "Update Available",
            description: "A new version of the app is available. Click here to update.",
            duration: 10000,
            action: UpdateAction,
          });
        }
      });
      
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'new-version-installed') {
          window.location.reload();
        }
      };

      navigator.serviceWorker.addEventListener('message', handleMessage);

      // Request notification permission on first visit
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        const timer = setTimeout(() => {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              setIsNotificationPermissionGranted(true);
              toast({
                variant: 'success',
                title: 'Notifications Enabled',
                description: 'You will be notified about app updates.',
              });
            }
          });
        }, 5000); // Ask after 5 seconds
        return () => clearTimeout(timer);
      } else if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        setIsNotificationPermissionGranted(true);
      }

      return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      };
    }
  }, [toast]);
}
