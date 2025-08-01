
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
  const [canInstall, setCanInstall] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    setMounted(true);

    const checkStandalone = () => {
      if (typeof window !== 'undefined') {
        if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
          setIsStandalone(true);
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
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
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
    
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    
    if (outcome === 'accepted') {
      toast({
        variant: "success",
        title: "App Installed!",
        description: "PDFusion has been added to your home screen.",
      });
      setCanInstall(false);
    }
    setInstallPrompt(null);
  }, [installPrompt, toast, isIos]);

  const handleOpenApp = () => {
    window.open(window.location.origin, '_blank');
  };
  
  const buttonClassName = inSheet
    ? "w-full justify-start text-muted-foreground hover:text-primary"
    : "inline-flex items-center gap-2 rounded-full font-semibold";
  
  const buttonVariant = inSheet ? "ghost" : "default";
  const buttonSize = inSheet ? "default" : "sm";

  if (!mounted) {
    return null; // Don't render on the server or before hydration
  }

  // App is installed and running in the browser tab, show "Open App"
  if (isStandalone === false && (navigator as any).standalone === false) { 
     if (installPrompt === null && !isIos) {
        if (!window.matchMedia('(display-mode: standalone)').matches) {
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
     }
  }

  // App is not installed, show "Install" button
  if ((canInstall || isIos) && !isStandalone) {
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
