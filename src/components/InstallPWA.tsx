
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
  const [isInstalled, setIsInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    setMounted(true);

    const checkStandalone = () => {
      if (typeof window !== 'undefined') {
        const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
        setIsStandalone(isStandaloneMode);
        if(isStandaloneMode) {
          setIsInstalled(true);
        }
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
      if (!window.matchMedia('(display-mode: standalone)').matches) {
        setCanInstall(true);
      }
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setCanInstall(false);
      setIsInstalled(true);
      setIsStandalone(true);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (isIos && !isInstalled) {
        toast({
            variant: "info",
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
      toast({
        variant: "success",
        title: "App Installed!",
        description: "PDFusion has been added to your home screen.",
      });
      setIsInstalled(true);
      setCanInstall(false);
    }
    setInstallPrompt(null);
  }, [installPrompt, toast, isIos, isInstalled]);

  const handleOpenApp = () => {
    window.open(window.location.origin, '_blank');
  };
  
  const buttonClassName = inSheet
    ? "w-full justify-start text-muted-foreground hover:text-primary"
    : "inline-flex items-center gap-2 rounded-full font-semibold";
  
  const buttonVariant = inSheet ? "ghost" : "default";

  if (!mounted || isStandalone) {
    return null; // Don't render on server or when running as installed PWA
  }

  // App is installed, but viewed in browser -> show Open App button
  if (isInstalled && !isStandalone) {
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

  // App is not installed, show "Install" button
  if (canInstall || (isIos && !isInstalled)) {
    return (
      <Button
        onClick={handleInstallClick}
        variant={buttonVariant}
        size="sm"
        className={cn(buttonClassName, !inSheet && "h-8 px-3")}
      >
        <ArrowDownToLine className={cn("w-4 h-4", !inSheet && "sm:mr-2")} />
        <span className={cn(inSheet ? "inline-block" : "hidden sm:inline-block")}>Install App</span>
      </Button>
    );
  }

  return null;
};

export default InstallPWA;
