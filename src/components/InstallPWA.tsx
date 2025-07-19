
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowDownToLine } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// This interface is a subset of the BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed',
    platform: string,
  }>;
  prompt(): Promise<void>;
}

const InstallPWA = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Detect if the user is on an iOS device
    const isIOsDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOsDevice);
    
    // Check if the app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    const handleBeforeInstallPrompt = (event: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      event.preventDefault();
      // Stash the event so it can be triggered later.
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    if (!isStandalone) {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
        toast({
            title: "Installation Guide",
            description: "To install, tap the Share button and then 'Add to Home Screen'.",
            duration: 5000,
        });
        return;
    }
    
    if (!installPrompt) return;
    
    // Show the install prompt
    await installPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await installPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    // We can only use the prompt once, so clear it.
    setInstallPrompt(null);
  };

  if (!installPrompt && !isIOS) {
    return null;
  }
  
  // Don't show the button if the app is already installed.
  if (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) {
    return null;
  }

  return (
    <Button
      onClick={handleInstallClick}
      variant="outline"
      size="sm"
      className="hidden md:inline-flex items-center gap-2 rounded-full font-semibold"
    >
      <ArrowDownToLine className="w-4 h-4" />
      Install App
    </Button>
  );
};

export default InstallPWA;
