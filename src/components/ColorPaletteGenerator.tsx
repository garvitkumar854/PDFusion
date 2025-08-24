
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';
import random from 'random';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Lock, Unlock, Copy, Check, Palette, Sparkles, RefreshCcw, Plus, X as XIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

extend([namesPlugin]);

type ColorInfo = {
  hex: string;
  name: string;
  isLocked: boolean;
  id: string;
};

type Palette = ColorInfo[];

const MIN_COLORS = 2;
const MAX_COLORS = 10;


function generateRandomColor(): ColorInfo {
  const hue = random.int(0, 359);
  const hex = colord({ h: hue, s: 90, l: 65 }).toHex();
  return {
    hex,
    name: colord(hex).toName({ closest: true }) || 'Unknown',
    isLocked: false,
    id: `${hex}-${Date.now()}-${Math.random()}`
  };
}

const ColorPanel = ({ color, onToggleLock, onCopy, onRemove, canRemove, isMobile }: { color: ColorInfo, onToggleLock: () => void, onCopy: () => void, onRemove: () => void; canRemove: boolean; isMobile: boolean }) => {
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
      visible: true
    },
    {
      label: color.isLocked ? 'Unlock' : 'Lock',
      onClick: onToggleLock,
      icon: color.isLocked ? <Lock className="h-5 w-5 text-red-500" /> : <Unlock className="h-5 w-5" />,
      visible: true
    },
    {
      label: 'Remove Color',
      onClick: onRemove,
      icon: <XIcon className="h-5 w-5"/>,
      visible: canRemove,
      className: "hover:bg-destructive/80 hover:text-white"
    }
  ];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, flexBasis: '0%' }}
      animate={{ opacity: 1, flexBasis: '100%' }}
      exit={{ opacity: 0, flexBasis: '0%' }}
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
        {actionIcons.filter(a => a.visible).map((action) => (
          <TooltipProvider key={action.label}>
            <Tooltip>
              <TooltipTrigger asChild>
                <ActionButton
                  variant="ghost"
                  size="icon"
                  onClick={(e) => { e.stopPropagation(); action.onClick(); }}
                  className={cn(
                    "rounded-full bg-white/30 text-black/80 backdrop-blur-sm hover:bg-white/50 w-10 h-10 flex items-center justify-center",
                    action.className
                  )}
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

const AddColorButton = ({ onClick, disabled }: { onClick: () => void, disabled: boolean }) => (
    <div className="relative h-full flex-shrink-0 w-0 group">
        <div className="absolute inset-y-0 -left-5 w-10 z-20 flex items-center justify-center">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                         <button
                            onClick={onClick}
                            disabled={disabled}
                            className={cn(
                                "w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-lg transition-all duration-200 scale-0 group-hover:scale-100",
                                disabled ? "cursor-not-allowed opacity-50" : "hover:scale-110 hover:bg-gray-100"
                            )}
                        >
                            <Plus className="h-5 w-5"/>
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>Add Color</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    </div>
)


export default function ColorPaletteGenerator() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const generatePalette = useCallback((size: number) => 
      Array.from({ length: size }, generateRandomColor)
  , []);
  
  const [palette, setPalette] = useState<Palette>(() => generatePalette(isMobile ? 3 : 5));

  const handleGenerate = useCallback(() => {
    setPalette(currentPalette => {
        return currentPalette.map(color => {
            if (color.isLocked) return color;
            return generateRandomColor();
        })
    });
  }, []);

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

  const toggleLock = (id: string) => {
    setPalette(prev =>
      prev.map((c) => (c.id === id ? { ...c, isLocked: !c.isLocked } : c))
    );
  };
  
  const addColor = (index: number) => {
    if (palette.length >= MAX_COLORS) {
        toast({ variant: 'warning', title: "Maximum colors reached" });
        return;
    }
    setPalette(prev => {
        const newPalette = [...prev];
        newPalette.splice(index, 0, generateRandomColor());
        return newPalette;
    });
  };

  const removeColor = (id: string) => {
     if (palette.length <= MIN_COLORS) {
        toast({ variant: 'warning', title: "Minimum colors reached" });
        return;
    }
    setPalette(prev => prev.filter(c => c.id !== id));
  };


  const copyColor = (hex: string) => {
    navigator.clipboard.writeText(hex);
    toast({ variant: 'success', title: 'Copied to clipboard!', description: hex });
  };
  
  if (isMobile) {
    return (
      <div className="h-full w-full flex flex-col">
        <div className="p-4 border-b flex justify-between items-center shrink-0">
            <h1 className="text-lg font-semibold">Color Palette ({palette.length})</h1>
            <Button onClick={handleGenerate} size="sm">
                <RefreshCcw className="mr-2 h-4 w-4"/>
                Generate
            </Button>
        </div>
        <div className="flex-grow w-full flex flex-col">
            <AnimatePresence>
                {palette.map((color, index) => (
                    <ColorPanel
                        key={color.id}
                        color={color}
                        onToggleLock={() => toggleLock(color.id)}
                        onCopy={() => copyColor(color.hex)}
                        onRemove={() => removeColor(color.id)}
                        canRemove={palette.length > MIN_COLORS}
                        isMobile={true}
                    />
                ))}
            </AnimatePresence>
        </div>
        <div className="p-4 border-t flex justify-around">
            <Button 
              onClick={() => addColor(palette.length)}
              disabled={palette.length >= MAX_COLORS}
            >
              <Plus className="mr-2 h-4 w-4"/> Add Color
            </Button>
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
            <React.Fragment key={color.id}>
                {index === 0 && <AddColorButton onClick={() => addColor(0)} disabled={palette.length >= MAX_COLORS} />}
                <ColorPanel
                  color={color}
                  onToggleLock={() => toggleLock(color.id)}
                  onCopy={() => copyColor(color.hex)}
                  onRemove={() => removeColor(color.id)}
                  canRemove={palette.length > MIN_COLORS}
                  isMobile={false}
                />
                <AddColorButton onClick={() => addColor(index + 1)} disabled={palette.length >= MAX_COLORS} />
            </React.Fragment>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
