
'use client';

import { useEffect } from 'react';

export function usePwa() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const wb = (window as any).workbox;
      if (wb) {
        wb.register();
      }
    }
  }, []);
}
