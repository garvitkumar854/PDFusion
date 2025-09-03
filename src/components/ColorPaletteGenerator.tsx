
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';
import random from 'random';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Lock, Unlock, Copy, Check, Palette, Sparkles, Plus, Library, RefreshCcw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

extend([namesPlugin]);

type ColorInfo = {
  hex: string;
  name: string;
  isLocked: boolean;
  id: string;
};

type Palette = ColorInfo[];

const MIN_COLORS = 2;
const MAX_COLORS = 7;

function generateRandomColor(): ColorInfo {
  const hue = random.int(0, 359);
  const saturation = random.int(40, 70);
  const lightness = random.int(50, 80);
  const hex = colord({ h: hue, s: saturation, l: lightness }).toHex();
  return {
    hex,
    name: colord(hex).toName({ closest: true }) || 'Unknown',
    isLocked: false,
    id: `${hex}-${Date.now()}-${Math.random()}`
  };
}

const getTextColor = (hex: string) => colord(hex).isDark() ? '#FFFFFF' : '#000000';

const ColorPanel = React.memo(({ color, onToggleLock }: { color: ColorInfo; onToggleLock: () => void; }) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(color.hex);
    setCopied(true);
    toast({ variant: 'success', title: 'Copied to clipboard!', description: color.hex });
    setTimeout(() => setCopied(false), 2000);
  }, [color.hex, toast]);
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{ backgroundColor: color.hex, color: getTextColor(color.hex) }}
      className="relative h-48 sm:h-56 md:h-64 flex-1 flex flex-col justify-end items-center p-4 text-center group"
    >
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-bold uppercase cursor-pointer" onClick={handleCopy}>
          {color.hex.substring(1)}
        </h2>
        <p className="text-sm sm:text-base capitalize">{color.name}</p>
      </div>

      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/10 hover:bg-black/20" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Copy Hex</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
           <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/10 hover:bg-black/20" onClick={onToggleLock}>
                {color.isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>{color.isLocked ? 'Unlock' : 'Lock'}</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </motion.div>
  );
});
ColorPanel.displayName = 'ColorPanel';

const FloatingActions = React.memo(({ onGenerate, onAdd, onLockAll, canAdd, palette, onRemove }: { onGenerate: () => void; onAdd: () => void; onLockAll: () => void; canAdd: boolean, palette: Palette, onRemove: () => void }) => {
  const { toast } = useToast();
  
  const copyPalette = (format: 'css' | 'json' | 'url') => {
    const colors = palette.map(c => c.hex);
    let textToCopy = '';
    if (format === 'css') {
      textToCopy = colors.map((c, i) => `--color-${i+1}: ${c};`).join('\n');
    } else if (format === 'json') {
      textToCopy = JSON.stringify(colors, null, 2);
    } else if (format === 'url') {
      textToCopy = `${window.location.origin}${window.location.pathname}?colors=${colors.map(c => c.substring(1)).join('-')}`;
    }
    navigator.clipboard.writeText(textToCopy);
    toast({ variant: 'success', title: `Copied as ${format.toUpperCase()}!` });
  }

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
      <div className="flex items-center gap-2 p-2 bg-background/80 backdrop-blur-md border rounded-full shadow-lg">
        <Button onClick={onGenerate} className="font-semibold" size="sm">
          <Sparkles className="h-4 w-4 mr-2" />
          Generate
        </Button>
        <Button onClick={onAdd} variant="outline" size="icon" className="h-9 w-9" disabled={!canAdd}>
          <Plus className="h-4 w-4" />
        </Button>
         <Button onClick={onRemove} variant="outline" size="icon" className="h-9 w-9" disabled={palette.length <= MIN_COLORS}>
          <Palette className="h-4 w-4" />
        </Button>
         <Button onClick={onLockAll} variant="outline" size="icon" className="h-9 w-9">
          <Lock className="h-4 w-4" />
        </Button>
        <Popover>
          <PopoverTrigger asChild>
             <Button variant="outline" size="icon" className="h-9 w-9">
              <Library className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-1 mt-2">
            <div className="flex flex-col">
              <Button variant="ghost" onClick={() => copyPalette('css')} className="justify-start">CSS Variables</Button>
              <Button variant="ghost" onClick={() => copyPalette('json')} className="justify-start">JSON Array</Button>
              <Button variant="ghost" onClick={() => copyPalette('url')} className="justify-start">Share URL</Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
});
FloatingActions.displayName = 'FloatingActions';

export default function ColorPaletteGenerator() {
  const [palette, setPalette] = useState<Palette>(() => Array.from({ length: 5 }, generateRandomColor));
  const [showHelper, setShowHelper] = useState(true);

  useEffect(() => {
    const colorsFromUrl = new URLSearchParams(window.location.search).get('colors');
    if (colorsFromUrl) {
      const hexes = colorsFromUrl.split('-');
      if (hexes.length >= MIN_COLORS && hexes.length <= MAX_COLORS) {
         const newPalette = hexes.map(hex => {
          const fullHex = `#${hex}`;
          return {
            hex: fullHex,
            name: colord(fullHex).toName({ closest: true }) || 'Unknown',
            isLocked: false,
            id: `${fullHex}-${Date.now()}-${Math.random()}`
          };
        });
        setPalette(newPalette);
      }
    }
  }, []);

  const handleGenerate = useCallback(() => {
    setShowHelper(false);
    setPalette(currentPalette => 
      currentPalette.map(color => color.isLocked ? color : generateRandomColor())
    );
  }, []);

  useEffect(() => {
    const handleSpacebar = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA' && document.activeElement?.tagName !== 'BUTTON') {
        e.preventDefault();
        handleGenerate();
      }
    };
    window.addEventListener('keydown', handleSpacebar);
    return () => window.removeEventListener('keydown', handleSpacebar);
  }, [handleGenerate]);

  const toggleLock = useCallback((id: string) => {
    setPalette(prev =>
      prev.map(c => (c.id === id ? { ...c, isLocked: !c.isLocked } : c))
    );
  }, []);
  
  const addColor = useCallback(() => {
    if (palette.length >= MAX_COLORS) return;
    setPalette(prev => [...prev, generateRandomColor()]);
  }, [palette.length]);

  const removeColor = useCallback(() => {
    if (palette.length <= MIN_COLORS) return;
    const unlockedIndex = palette.findLastIndex(c => !c.isLocked);
    if(unlockedIndex !== -1) {
        setPalette(prev => prev.filter((_, i) => i !== unlockedIndex));
    } else {
        setPalette(prev => prev.slice(0, prev.length - 1));
    }
  }, [palette]);

  const lockAll = useCallback(() => {
    setPalette(prev => prev.map(c => ({...c, isLocked: true})));
  }, []);
  
  return (
    <div className="relative w-full rounded-lg overflow-hidden shadow-lg border">
      <AnimatePresence>
        {showHelper && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20"
          >
            <div className="hidden sm:flex items-center gap-2 text-sm font-medium bg-background/50 backdrop-blur-sm py-2 px-4 rounded-lg border shadow-sm">
                <RefreshCcw className="w-4 h-4"/>
                <p>Press the <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-md">Spacebar</kbd> to generate new palettes!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="flex flex-col sm:flex-row relative">
        <AnimatePresence>
            {palette.map((color) => (
                <ColorPanel
                key={color.id}
                color={color}
                onToggleLock={() => toggleLock(color.id)}
                />
            ))}
        </AnimatePresence>
        
        <FloatingActions 
            onGenerate={handleGenerate}
            onAdd={addColor}
            onRemove={removeColor}
            onLockAll={lockAll}
            canAdd={palette.length < MAX_COLORS}
            palette={palette}
        />
      </div>
    </div>
  );
}
