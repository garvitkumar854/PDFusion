
import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
      <WifiOff className="w-16 h-16 text-muted-foreground mb-4" />
      <h1 className="text-2xl font-bold mb-2">You're Offline</h1>
      <p className="text-muted-foreground">
        It seems you've lost your connection. Please check it and try again.
      </p>
    </div>
  );
}
