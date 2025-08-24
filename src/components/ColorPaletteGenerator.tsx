
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';
import randomPlugin from 'colord/plugins/random';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Lock, Unlock, Copy, Check, Palette, Sparkles, RefreshCcw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

extend([namesPlugin, randomPlugin]);

type ColorInfo = {
  hex: string;
  name: string;
  isLocked: boolean;
};

type Palette = ColorInfo[];

function generateRandomColor(): ColorInfo {
  const hex = colord.random().toHex();
  return {
    hex,
    name: colord(hex).toName({ closest: true }) || 'Unknown',
    isLocked: false,
  };
}

const ColorPanel = ({ color, onToggleLock, onCopy, isMobile }: { color: ColorInfo, onToggleLock: () => void, onCopy: () => void, isMobile: boolean }) => {
  const [copied, setCopied] = useState(false);
  const textColor = colord(color.hex).isDark() ? '#FFFFFF' : '#000000';
  const ActionButton = isMobile ? 'div' : Button;

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const actionIcons = [
    {
      label: 'Copy Hex',
      onClick: handleCopy,
      icon: copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />,
    },
    {
      label: color.isLocked ? 'Unlock' : 'Lock',
      onClick: onToggleLock,
      icon: color.isLocked ? <Lock className="h-5 w-5 text-red-500" /> : <Unlock className="h-5 w-5" />,
    },
  ];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, width: '0%' }}
      animate={{ opacity: 1, width: '100%' }}
      exit={{ opacity: 0, width: '0%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{ backgroundColor: color.hex }}
      className="relative h-full w-full flex flex-col justify-end items-center p-6 text-center group"
    >
      <div className="relative z-10 space-y-1" style={{ color: textColor }}>
        <h2 className="text-xl font-bold uppercase cursor-pointer" onClick={handleCopy}>
          {color.hex.substring(1)}
        </h2>
        <p className="text-sm capitalize">{color.name}</p>
      </div>

      <div className={cn(
        "absolute z-20 flex transition-opacity duration-300",
        isMobile ? 'bottom-6 right-6 flex-col gap-3' : 'top-1/2 -translate-y-1/2 flex-col gap-4 opacity-0 group-hover:opacity-100'
      )}>
        {actionIcons.map((action) => (
          <TooltipProvider key={action.label}>
            <Tooltip>
              <TooltipTrigger asChild>
                <ActionButton
                  variant="ghost"
                  size="icon"
                  onClick={(e) => { e.stopPropagation(); action.onClick(); }}
                  className="rounded-full bg-white/30 text-black/80 backdrop-blur-sm hover:bg-white/50 w-10 h-10 flex items-center justify-center"
                >
                  {action.icon}
                </ActionButton>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{action.label}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </motion.div>
  );
};

export default function ColorPaletteGenerator() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const paletteSize = isMobile ? 3 : 5;
  
  const generatePalette = useCallback((size: number) => 
      Array.from({ length: size }, generateRandomColor)
  , []);
  
  const [palette, setPalette] = useState<Palette>(() => generatePalette(paletteSize));

  const handleGenerate = useCallback(() => {
    setPalette(currentPalette => {
      const newPalette: Palette = [];
      const currentLength = currentPalette.length || paletteSize;
      for (let i = 0; i < currentLength; i++) {
        if (currentPalette[i] && currentPalette[i].isLocked) {
          newPalette.push(currentPalette[i]);
        } else {
          newPalette.push(generateRandomColor());
        }
      }
      // Ensure the palette size is correct
      while (newPalette.length < paletteSize) {
        newPalette.push(generateRandomColor());
      }
      return newPalette.slice(0, paletteSize);
    });
  }, [paletteSize]);


  useEffect(() => {
    const handleSpacebar = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT') {
        e.preventDefault();
        handleGenerate();
      }
    };
    window.addEventListener('keydown', handleSpacebar);
    return () => window.removeEventListener('keydown', handleSpacebar);
  }, [handleGenerate]);
  
  useEffect(() => {
    setPalette(currentPalette => {
       const lockedColors = currentPalette.filter(c => c.isLocked);
       const newColorsCount = paletteSize - lockedColors.length;

       if (newColorsCount > 0) {
         return [...lockedColors, ...generatePalette(newColorsCount)];
       }
       return lockedColors.slice(0, paletteSize);
    });
  }, [paletteSize, generatePalette]);

  const toggleLock = (index: number) => {
    setPalette(prev =>
      prev.map((c, i) => (i === index ? { ...c, isLocked: !c.isLocked } : c))
    );
  };

  const copyColor = (hex: string) => {
    navigator.clipboard.writeText(hex);
    toast({ variant: 'success', title: 'Copied to clipboard!', description: hex });
  };
  
  if (isMobile) {
    return (
      <div className="h-full w-full flex flex-col">
        <div className="p-4 border-b flex justify-between items-center shrink-0">
            <h1 className="text-lg font-semibold">Color Palette</h1>
            <Button onClick={handleGenerate} size="sm">
                <RefreshCcw className="mr-2 h-4 w-4"/>
                Generate
            </Button>
        </div>
        <div className="flex-grow w-full flex flex-col">
            <AnimatePresence>
                {palette.map((color, index) => (
                    <ColorPanel
                        key={color.hex + index}
                        color={color}
                        onToggleLock={() => toggleLock(index)}
                        onCopy={() => copyColor(color.hex)}
                        isMobile={true}
                    />
                ))}
            </AnimatePresence>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full flex flex-col relative">
      <header className="absolute top-0 left-0 right-0 z-30 p-4">
        <div className="flex justify-between items-center">
          <p className="hidden sm:block text-sm font-medium bg-background/50 backdrop-blur-sm py-1 px-3 rounded-lg">
            Press the spacebar to generate color palettes!
          </p>
          <Button onClick={handleGenerate} className="ml-auto">
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Palette
          </Button>
        </div>
      </header>
      <div className="flex-grow w-full flex">
        <AnimatePresence>
          {palette.map((color, index) => (
            <ColorPanel
              key={color.hex + index}
              color={color}
              onToggleLock={() => toggleLock(index)}
              onCopy={() => copyColor(color.hex)}
              isMobile={false}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
