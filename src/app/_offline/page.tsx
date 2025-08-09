
'use client';

import { WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OfflinePage() {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
       <div className="p-6 bg-primary/10 rounded-full mb-8">
        <WifiOff className="w-12 h-12 sm:w-16 sm:h-16 text-primary" />
       </div>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
        You're Currently Offline
      </h1>
      <p className="max-w-md mx-auto text-muted-foreground text-base md:text-lg mb-8">
        It seems you've lost your connection. Please check your network status and try again.
      </p>
      <Button onClick={handleReload}>
        Try Reloading
      </Button>
    </div>
  );
}
