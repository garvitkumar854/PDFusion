
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowDownToLine, Loader2 } from 'lucide-react';
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
  const [isInstalling, setIsInstalling] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    const checkStandalone = () => {
      return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    };

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setIsInstalling(false);
      setIsStandalone(true);
    };

    setIsStandalone(checkStandalone());
    
    if (typeof navigator !== 'undefined') {
      const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      setIsIos(isIosDevice);
    }
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = () => setIsStandalone(checkStandalone());
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (isIos) {
        toast({
            variant: "info",
            title: "Installation Guide",
            description: "To install, tap the Share button and then 'Add to Home Screen'.",
            duration: 8000,
        });
        return;
    }
    
    if (!installPrompt) return;
    
    setIsInstalling(true);
    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      
      if (outcome === 'accepted') {
          toast({
              variant: "success",
              title: "App Installed!",
              description: "PDFusion has been added to your device.",
          });
      }
    } catch (e) {
        // Silently catch errors if user dismisses prompt on some browsers
    } finally {
      setIsInstalling(false);
      setInstallPrompt(null);
    }

  }, [installPrompt, toast, isIos]);
  
  // Don't show any button if the app is running as an installed PWA
  if (isStandalone) {
     return null;
  }

  const canInstall = installPrompt || isIos;
  
  if (canInstall) {
    const buttonClassName = inSheet
      ? "w-full justify-start text-muted-foreground hover:text-primary"
      : "inline-flex items-center gap-2 rounded-full font-semibold";
    
    const buttonVariant = inSheet ? "ghost" : "default";

    return (
      <Button
        onClick={handleInstallClick}
        variant={buttonVariant}
        size="sm"
        className={cn(buttonClassName, !inSheet && "h-8 px-3")}
        disabled={isInstalling}
      >
        {isInstalling ? <Loader2 className={cn("w-4 h-4 animate-spin", !inSheet && "sm:mr-2")} /> : <ArrowDownToLine className={cn("w-4 h-4", !inSheet && "sm:mr-2")} />}
        <span className={cn(inSheet ? "inline-block" : "inline-block")}>{isInstalling ? 'Installing...' : 'Install App'}</span>
      </Button>
    );
  }

  return null;
};

export default InstallPWA;
