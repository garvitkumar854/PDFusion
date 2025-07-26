
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowDownToLine, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed',
    platform: string,
  }>;
  prompt(): Promise<void>;
}

const InstallPWA = ({ inSheet = false }: { inSheet?: boolean }) => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      if (!isStandalone) {
        setCanInstall(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if the app is running in standalone mode (installed PWA)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true);
      setCanInstall(false);
    }
    
    // Check for iOS
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);
    if(isIosDevice) {
        setCanInstall(true); // Always show manual install button on iOS
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [isStandalone]);

  const handleInstallClick = useCallback(async () => {
    if (isIOS) {
        toast({
            title: "Installation Guide",
            description: "To install, tap the Share button and then 'Add to Home Screen'.",
            duration: 5000,
        });
        return;
    }
    
    if (!installPrompt) return;
    
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setCanInstall(false);
      // The app will likely relaunch in standalone mode, but we hide the button just in case.
    }
    setInstallPrompt(null);
  }, [installPrompt, isIOS, toast]);

  const handleOpenApp = () => {
    window.open(window.location.origin, '_blank');
  };
  
  const buttonClassName = inSheet
    ? "w-full justify-start text-muted-foreground hover:text-primary"
    : "inline-flex items-center gap-2 rounded-full font-semibold";
  
  const buttonVariant = inSheet ? "ghost" : "default";
  const buttonSize = inSheet ? "default" : "sm";


  if (isStandalone) {
      return null; // Don't show anything if already running standalone
  }
  
  if (canInstall) {
    return (
      <Button
        onClick={handleInstallClick}
        variant={buttonVariant}
        size={buttonSize}
        className={cn(buttonClassName)}
      >
        <ArrowDownToLine className="w-4 h-4 mr-2" />
        Install App
      </Button>
    );
  }

  return null;
};

export default InstallPWA;
