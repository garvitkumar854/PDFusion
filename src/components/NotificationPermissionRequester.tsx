
'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { Bell, BellRing, RefreshCw } from 'lucide-react';

export default function NotificationPermissionRequester() {
  const [permission, setPermission] = useState<NotificationPermission | 'default'>('default');
  const { toast } = useToast();

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    const handleControllerChange = () => {
      // This event fires when the service worker controlling this page changes.
      toast({
        title: "New Update Available",
        description: "Click to refresh and get the latest version.",
        variant: "info",
        duration: 10000,
        action: (
          <Button onClick={() => window.location.reload()} size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        )
      })
    }
    
    if('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    }

    return () => {
      if('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      }
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
      // Here you would typically send the subscription to your server
      // const subscription = await navigator.serviceWorker.ready.then(reg => reg.pushManager.getSubscription());
      // await fetch('/api/subscribe', { method: 'POST', body: JSON.stringify(subscription), headers: { 'Content-Type': 'application/json' }});
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
