
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';
import random from 'random';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Lock, Unlock, Copy, Check, Palette, Sparkles, Plus, Library, RefreshCcw, Minus, X } from 'lucide-react';
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

const ColorPanel = React.memo(({ color, onToggleLock, onRemove, onCopy }: { color: ColorInfo; onToggleLock: () => void; onRemove: () => void; onCopy: () => void; }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [onCopy]);

  return (
    <div
      style={{ backgroundColor: color.hex, color: getTextColor(color.hex) }}
      className="relative flex-1 flex flex-col justify-end items-center p-4 text-center group min-h-[100px] md:min-h-0"
    >
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-bold uppercase cursor-pointer" onClick={handleCopy}>
          {color.hex.substring(1)}
        </h2>
        <p className="text-sm sm:text-base capitalize">{color.name}</p>
      </div>
      <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
         <TooltipProvider>
           <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/10 hover:bg-black/20" onClick={onRemove}>
                <X className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Remove</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
});
ColorPanel.displayName = 'ColorPanel';

const FloatingActions = React.memo(({ onGenerate, onAdd, onLockAll, canAdd, palette, onRemove, canRemove }: { onGenerate: () => void; onAdd: () => void; onLockAll: () => void; canAdd: boolean, palette: Palette, onRemove: () => void, canRemove: boolean }) => {
  const { toast } = useToast();
  
  const copyPalette = (format: 'css' | 'json' | 'url') => {
    const colors = palette.map(c => c.hex);
    let textToCopy = '';
    if (format === 'css') {
      textToCopy = colors.map((c, i) => `--color-${i+1}: ${c};`).join('\n');
    } else if (format === 'json') {
      textToCopy = JSON.stringify(colors, null, 2);
    } else if (format === 'url') {
      textToCopy = `${window.location.origin}${window.location.pathname}?colors=${colors.map(c => c.hex.substring(1)).join('-')}`;
    }
    navigator.clipboard.writeText(textToCopy);
    toast({ variant: 'success', title: `Copied as ${format.toUpperCase()}!` });
  }

  return (
    <>
      <div className="flex items-center justify-center p-4">
        <div className="flex items-center gap-2 p-2 bg-card/80 dark:bg-card/50 backdrop-blur-md border rounded-full shadow-lg">
          <Button onClick={onGenerate} className="font-semibold" size="sm">
            <Sparkles className="h-4 w-4 mr-2" />
            Generate
          </Button>
          <TooltipProvider>
              <Tooltip>
                  <TooltipTrigger asChild>
                      <Button onClick={onAdd} variant="outline" size="icon" className="h-9 w-9" disabled={!canAdd}>
                          <Plus className="h-4 w-4" />
                      </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Add Color</p></TooltipContent>
              </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
              <Tooltip>
                  <TooltipTrigger asChild>
                      <Button onClick={onRemove} variant="outline" size="icon" className="h-9 w-9" disabled={!canRemove}>
                          <Minus className="h-4 w-4" />
                      </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Remove Color</p></TooltipContent>
              </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
              <Tooltip>
                  <TooltipTrigger asChild>
                      <Button onClick={onLockAll} variant="outline" size="icon" className="h-9 w-9">
                          <Lock className="h-4 w-4" />
                      </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Lock All</p></TooltipContent>
              </Tooltip>
          </TooltipProvider>
          <Popover>
            <PopoverTrigger asChild>
              <TooltipProvider>
                  <Tooltip>
                      <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" className="h-9 w-9">
                              <Library className="h-4 w-4" />
                          </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Export Palette</p></TooltipContent>
                  </Tooltip>
              </TooltipProvider>
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
      <div className="hidden sm:flex items-center justify-center gap-2 text-sm font-medium pb-4 text-muted-foreground">
          <RefreshCcw className="w-4 h-4"/>
          <p>Press the <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-md">Spacebar</kbd> to generate new palettes!</p>
      </div>
    </>
  );
});
FloatingActions.displayName = 'FloatingActions';

export default function ColorPaletteGenerator() {
  const [palette, setPalette] = useState<Palette>([]);
  const { toast } = useToast();

  const handleGenerate = useCallback(() => {
    setPalette(currentPalette => 
      currentPalette.map(color => color.isLocked ? color : generateRandomColor())
    );
  }, []);

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
        return;
      }
    }
    // Generate initial palette if no valid URL params
    setPalette(Array.from({ length: 5 }, generateRandomColor));
  }, []);

  useEffect(() => {
    const handleSpacebar = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA', 'BUTTON'].includes((e.target as HTMLElement).tagName)) {
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

  const removeColor = useCallback((id: string) => {
    if (palette.length <= MIN_COLORS) return;
    setPalette(prev => prev.filter(c => c.id !== id));
  }, [palette.length]);

  const lockAll = useCallback(() => {
    setPalette(prev => prev.map(c => ({...c, isLocked: true})));
  }, []);

  const handleCopy = useCallback((hex: string) => {
    navigator.clipboard.writeText(hex);
    toast({ variant: 'success', title: 'Copied to clipboard!', description: hex });
  }, [toast]);
  
  return (
    <div className="w-full flex-1 flex flex-col rounded-lg overflow-hidden">
      <div className="flex-1 flex flex-col md:flex-row">
        {palette.map((color) => (
            <ColorPanel
            key={color.id}
            color={color}
            onToggleLock={() => toggleLock(color.id)}
            onRemove={() => removeColor(color.id)}
            onCopy={() => handleCopy(color.hex)}
            />
        ))}
      </div>
      
      <div className="shrink-0">
        <FloatingActions 
            onGenerate={handleGenerate}
            onAdd={addColor}
            onLockAll={lockAll}
            canAdd={palette.length < MAX_COLORS}
            palette={palette}
            onRemove={() => {
                const unlockedIndex = palette.findLastIndex(c => !c.isLocked);
                if(unlockedIndex !== -1) {
                    removeColor(palette[unlockedIndex].id);
                } else {
                    removeColor(palette[palette.length - 1].id);
                }
            }}
            canRemove={palette.length > MIN_COLORS}
        />
      </div>
    </div>
  );
}
