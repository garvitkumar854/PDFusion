
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowDownToLine, Loader2, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import Image from 'next/image';
import { useTheme } from 'next-themes';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed',
    platform: string,
  }>;
  prompt(): Promise<void>;
}

const IOSInstallGuide = ({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) => {
  const { resolvedTheme } = useTheme();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>How to Install on iOS</DialogTitle>
          <DialogDescription>
            Follow these simple steps to add PDFusion to your Home Screen.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4 text-sm">
          <p>1. Tap the <span className="font-bold">Share</span> button in Safari's toolbar.</p>
          <p>2. Scroll down and tap on <span className="font-bold">"Add to Home Screen"</span>.</p>
          <p>3. Confirm by tapping <span className="font-bold">"Add"</span> in the top right corner.</p>
          <Image
            src={resolvedTheme === 'dark' ? '/ios-install-dark.png' : '/ios-install-light.png'}
            alt="iOS installation guide"
            width={300}
            height={150}
            className="rounded-lg border mx-auto mt-4"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};


const InstallPWA = ({ inSheet = false }: { inSheet?: boolean }) => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

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
        setShowIosGuide(true);
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
     return (
        <Button
            variant={"ghost"}
            size="sm"
            className={cn("w-full justify-start text-muted-foreground hover:text-primary", !inSheet && "hidden")}
            disabled={true}
        >
            <ExternalLink className="w-4 h-4 mr-2" />
            <span className="inline-block">App is Installed</span>
        </Button>
     );
  }

  const canInstall = installPrompt || isIos;
  
  if (canInstall) {
    const buttonClassName = inSheet
      ? "w-full justify-start text-muted-foreground hover:text-primary"
      : "inline-flex items-center gap-2 rounded-full font-semibold";
    
    const buttonVariant = inSheet ? "ghost" : "default";

    return (
        <>
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
        {isIos && <IOSInstallGuide open={showIosGuide} onOpenChange={setShowIosGuide} />}
      </>
    );
  }

  return null;
};

export default InstallPWA;
