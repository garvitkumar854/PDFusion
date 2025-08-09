
'use client';

import { useEffect } from 'react';
import { useToast } from './use-toast';
import { ToastAction } from '@/components/ui/toast';
import React from 'react';

export function usePwa() {
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const wb = (window as any).workbox;
      if (wb) {
        // This event fires when a new SW has been installed.
        wb.addEventListener('installed', (event: any) => {
          if (event.isUpdate) {
             // The service worker will show a notification, no need for a toast.
          }
        });

        // This event fires when the new SW has taken control.
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'new-version-installed') {
                window.location.reload();
            }
        };

        navigator.serviceWorker.addEventListener('message', handleMessage);

        wb.register();
      }
    }
  }, [toast]);
}
