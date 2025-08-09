
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowDownToLine, ExternalLink, Loader2 } from 'lucide-react';
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
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    setMounted(true);

    const checkStandalone = () => {
      if (typeof window !== 'undefined') {
        const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
        setIsStandalone(isStandaloneMode);
      }
    };
    checkStandalone();
    
    if (typeof navigator !== 'undefined') {
      const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      setIsIos(isIosDevice);
    }
    
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setIsInstalling(false);
      setIsStandalone(true);
      toast({
        variant: "success",
        title: "App Installed!",
        description: "PDFusion has been added to your device.",
      });
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [toast]);

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
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    
    if (outcome === 'accepted') {
        // The 'appinstalled' event will handle the rest.
    } else {
        setIsInstalling(false);
    }
    setInstallPrompt(null);
  }, [installPrompt, toast, isIos]);

  const handleOpenApp = () => {
      if (isInstalling) {
          toast({
              variant: "info",
              title: "Installation in Progress",
              description: "Please wait a moment while the app is being installed.",
          });
          return;
      }
      window.open(window.location.origin, '_blank');
  };
  
  const buttonClassName = inSheet
    ? "w-full justify-start text-muted-foreground hover:text-primary"
    : "inline-flex items-center gap-2 rounded-full font-semibold";
  
  const buttonVariant = inSheet ? "ghost" : "default";

  if (!mounted) {
    return null;
  }

  const canInstall = installPrompt || isIos;
  
  if (isStandalone) {
     return (
      <Button
        onClick={handleOpenApp}
        variant="default"
        size="sm"
        className={cn(buttonClassName, "bg-green-600 hover:bg-green-700 h-8 px-3")}
      >
        <ExternalLink className="w-4 h-4 sm:mr-2" />
        <span className="hidden sm:inline-block">Open App</span>
      </Button>
    );
  }

  if (canInstall) {
    return (
      <Button
        onClick={handleInstallClick}
        variant={buttonVariant}
        size="sm"
        className={cn(buttonClassName, !inSheet && "h-8 px-3")}
        disabled={isInstalling}
      >
        {isInstalling ? <Loader2 className={cn("w-4 h-4 animate-spin", !inSheet && "sm:mr-2")} /> : <ArrowDownToLine className={cn("w-4 h-4", !inSheet && "sm:mr-2")} />}
        <span className={cn(inSheet ? "inline-block" : "hidden sm:inline-block")}>{isInstalling ? 'Installing...' : 'Install App'}</span>
      </Button>
    );
  }

  return null;
};

export default InstallPWA;
