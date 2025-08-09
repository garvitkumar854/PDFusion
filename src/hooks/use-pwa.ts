
'use client';

import { useEffect, useState } from 'react';
import { useToast } from './use-toast';

export function usePwa() {
  const { toast } = useToast();
  const [isNotificationPermissionGranted, setIsNotificationPermissionGranted] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'new-version-installed') {
          window.location.reload();
        }
      };

      navigator.serviceWorker.addEventListener('message', handleMessage);

      // Request notification permission on first visit
      if (Notification.permission === 'default') {
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
      } else if (Notification.permission === 'granted') {
        setIsNotificationPermissionGranted(true);
      }

      return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      };
    }
  }, [toast]);
}
