
'use client';

import { useEffect, useState } from 'react';
import { useToast } from './use-toast';
import { ToastAction } from '@/components/ui/toast';
import React from 'react';

const NOTIFICATION_PERMISSION_REQUESTED_KEY = 'notificationPermissionRequested';

export function usePwa() {
  const { toast } = useToast();
  const [isNotificationPermissionGranted, setIsNotificationPermissionGranted] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const wb = (window as any).workbox;
      if (wb) {
         wb.addEventListener('installed', (event: any) => {
          // This event fires when a new SW has been installed.
          // If this is an update, we want to prompt the user to refresh.
          if (event.isUpdate) {
             const UpdateAction = React.createElement(ToastAction, {
              onClick: () => wb.messageSW({ type: 'SKIP_WAITING' })
            }, 'Reload');
            
             toast({
              variant: "info",
              title: "Update Downloaded",
              description: "A new version of the app is ready. Click reload to update.",
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

        wb.register();
      }
      
      // Request notification permission on first visit only
      if (typeof Notification !== 'undefined') {
        if (Notification.permission === 'default' && !localStorage.getItem(NOTIFICATION_PERMISSION_REQUESTED_KEY)) {
          const timer = setTimeout(() => {
            Notification.requestPermission().then(permission => {
              localStorage.setItem(NOTIFICATION_PERMISSION_REQUESTED_KEY, 'true');
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
        } else if (Notification.permission === 'granted') {
          setIsNotificationPermissionGranted(true);
        }
      }
    }
  }, [toast]);
}
