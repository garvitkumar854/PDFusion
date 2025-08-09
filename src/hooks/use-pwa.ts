
'use client';

import { useEffect } from 'react';

const PERMISSION_REQUESTED_KEY = 'notificationPermissionRequested';

export function usePwa() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const wb = (window as any).workbox;
      if (wb) {
        wb.register();
      }

      // Request notification permission on first visit
      const permissionRequested = localStorage.getItem(PERMISSION_REQUESTED_KEY);
      if (!permissionRequested && Notification.permission === 'default') {
        setTimeout(() => {
          Notification.requestPermission().then(permission => {
            localStorage.setItem(PERMISSION_REQUESTED_KEY, 'true');
          });
        }, 3000);
      }
    }
  }, []);
}
