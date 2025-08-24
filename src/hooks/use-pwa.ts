
'use client';

import { useEffect } from 'react';
import { app } from '@/lib/firebase';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { toast } from './use-toast';

export function usePwa() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const wb = (window as any).workbox;
      if (wb) {
        wb.register();
      }
      
      const setupFCM = async () => {
        const messaging = getMessaging(app);

        // Request permission
        try {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            console.log('Notification permission granted.');

            // Get token
            const currentToken = await getToken(messaging, { vapidKey: 'YOUR_VAPID_KEY_HERE' }); // Replace with your VAPID key
            if (currentToken) {
              console.log('FCM Token:', currentToken);
              // Send this token to your server to store it
            } else {
              console.log('No registration token available. Request permission to generate one.');
            }
          } else {
            console.log('Unable to get permission to notify.');
          }
        } catch (err) {
          console.log('An error occurred while retrieving token. ', err);
        }

        // Handle foreground messages
        onMessage(messaging, (payload) => {
          console.log('Message received. ', payload);
          toast({
            title: payload.notification?.title,
            description: payload.notification?.body,
            variant: "info",
          });
        });
      };
      
      setupFCM();
    }
  }, []);
}
