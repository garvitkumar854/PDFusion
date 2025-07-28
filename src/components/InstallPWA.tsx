
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
    // Check if running as a standalone PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true);
      return;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      // Ensure we are not in standalone mode before showing install button
      if (!window.matchMedia('(display-mode: standalone)').matches) {
        setCanInstall(true);
      }
    };
    
    // Check for iOS
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);
    if (isIosDevice) {
      // On iOS, we always show the "install" button which gives manual instructions
      setCanInstall(true);
    }
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (isIOS) {
        toast({
            title: "Installation Guide",
            description: "To install, tap the Share button and then 'Add to Home Screen'.",
            duration: 8000,
        });
        return;
    }
    
    if (!installPrompt) return;
    
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setCanInstall(false); // Hide the button after successful installation
    }
    setInstallPrompt(null);
  }, [installPrompt, isIOS, toast]);

  const handleOpenApp = () => {
    // This logic is for when the user is on the website and the app is installed.
    // It opens the PWA. A simple window.open is usually sufficient.
    window.open(window.location.origin, '_blank');
  };
  
  const buttonClassName = inSheet
    ? "w-full justify-start text-muted-foreground hover:text-primary"
    : "inline-flex items-center gap-2 rounded-full font-semibold";
  
  const buttonVariant = inSheet ? "ghost" : "default";
  const buttonSize = inSheet ? "default" : "sm";

  // The "Open App" button should only show if the PWA is installed BUT we are currently in a browser tab.
  // It should NOT show inside the PWA itself.
  if (isStandalone && inSheet) {
    return null; // Don't show anything in the sheet menu inside the PWA
  }
  if (isStandalone && !inSheet) {
      return (
          <Button
            onClick={handleOpenApp}
            variant="default"
            size="sm"
            className={cn(buttonClassName, "bg-green-600 hover:bg-green-700")}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open App
          </Button>
      );
  }
  
  if (canInstall && !isStandalone) {
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
