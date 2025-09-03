
"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';
import random from 'random';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Lock, Unlock, Copy, Check, Palette, Sparkles, RefreshCcw, GripVertical, Trash2, Library, Link as LinkIcon, Plus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-is-mobile';
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

// --- Helper Functions ---
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

// --- Sub-Components ---
const ShadesPanel = React.memo(({
  baseColor,
  onClose,
}: {
  baseColor: ColorInfo;
  onClose: () => void;
}) => {
  const { toast } = useToast();
  const shades = useMemo(() => {
    const baseHsl = colord(baseColor.hex).toHsl();
    const count = 11; 
    return Array.from({ length: count }, (_, i) => {
      const lightness = 100 - (i * 100) / (count - 1);
      const newHex = colord({ ...baseHsl, l: lightness }).toHex();
      return { hex: newHex, name: colord(newHex).toName({ closest: true }) || 'Unknown' };
    });
  }, [baseColor.hex]);

  const handleCopy = (hex: string) => {
    navigator.clipboard.writeText(hex);
    toast({ variant: 'success', title: 'Copied to clipboard!', description: hex });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 flex flex-col backdrop-blur-sm"
      onClick={onClose}
    >
      {shades.map((shade) => (
        <div
          key={shade.hex}
          style={{ backgroundColor: shade.hex }}
          onClick={(e) => { e.stopPropagation(); handleCopy(shade.hex); }}
          className="flex-grow flex items-center justify-center cursor-pointer group/shade"
        >
          <div
            className="opacity-0 group-hover/shade:opacity-100 transition-opacity flex items-center gap-4 font-mono"
            style={{ color: getTextColor(shade.hex) }}
          >
            <span className="font-bold uppercase">{shade.hex}</span>
            <span className="text-xs capitalize hidden sm:inline">{shade.name}</span>
          </div>
        </div>
      ))}
    </motion.div>
  );
});
ShadesPanel.displayName = 'ShadesPanel';


const ColorPanel = React.memo(({ 
  color,
  onToggleLock, 
  onRemove,
  onDragStart,
  onDragEnter,
  onDragEnd,
  isDragging,
  canRemove,
}: { 
  color: ColorInfo,
  onToggleLock: () => void,
  onRemove: () => void,
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnter: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  canRemove: boolean;
}) => {
  const [copied, setCopied] = useState(false);
  const [showShades, setShowShades] = useState(false);
  const isMobile = useIsMobile();
  const textColor = getTextColor(color.hex);
  const { toast } = useToast();

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(color.hex);
    setCopied(true);
    toast({ variant: 'success', title: 'Copied to clipboard!', description: color.hex });
    setTimeout(() => setCopied(false), 2000);
  }, [color.hex, toast]);
  
  const actionIcons = [
    { label: 'Copy Hex', onClick: handleCopy, icon: copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />, visible: true },
    { label: color.isLocked ? 'Unlock' : 'Lock', onClick: onToggleLock, icon: color.isLocked ? <Lock className="h-5 w-5 text-amber-400" /> : <Unlock className="h-5 w-5" />, visible: true },
    { label: 'View Shades', onClick: () => setShowShades(s => !s), icon: <Palette className="h-5 w-5" />, visible: true },
    { label: 'Drag to Reorder', icon: <GripVertical className="h-5 w-5 cursor-grab"/>, visible: !isMobile, isDragHandle: true },
    { label: 'Remove Color', onClick: onRemove, icon: <Trash2 className="h-5 w-5"/>, visible: canRemove, className: "hover:text-red-500" },
  ];

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{ backgroundColor: color.hex }}
      className={cn(
        "relative h-full flex-1 w-full md:w-0 flex flex-col justify-end items-center p-6 text-center transition-all duration-300 ease-in-out group",
        isDragging && 'opacity-50 scale-95'
      )}
      draggable={!isMobile && !showShades}
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
    >
      <div 
        className="relative z-10 space-y-1" style={{ color: textColor }}>
        <h2 className="text-xl sm:text-2xl font-bold uppercase cursor-pointer" onClick={handleCopy}>
          {color.hex.substring(1)}
        </h2>
        <p className="text-sm sm:text-base capitalize">{color.name}</p>
      </div>
      
      <div className={cn(
        "absolute z-30 flex items-center transition-all duration-300 opacity-0 group-hover:opacity-100",
        isMobile ? 'bottom-6 right-6 flex-col gap-3 p-2 bg-black/10 backdrop-blur-sm rounded-full' : 'top-6 right-6 gap-2'
      )}>
        {actionIcons.filter(a => a.visible).map((action) => (
          <TooltipProvider key={action.label}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => { e.stopPropagation(); action.onClick?.(); }}
                  style={{ color: textColor }}
                  className={cn(
                    "rounded-full p-2.5 transition-transform duration-200 hover:scale-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black/20 focus-visible:ring-white",
                    action.isDragHandle && 'cursor-grab',
                    action.className
                  )}
                  aria-label={action.label}
                >
                  {action.icon}
                </button>
              </TooltipTrigger>
              {!isMobile && <TooltipContent side="left" className="bg-background/80 backdrop-blur-sm"><p>{action.label}</p></TooltipContent>}
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
      <AnimatePresence>
        {showShades && <ShadesPanel baseColor={color} onClose={() => setShowShades(false)} />}
      </AnimatePresence>
    </motion.div>
  );
});
ColorPanel.displayName = 'ColorPanel';

const FloatingActions = React.memo(({ onGenerate, onAdd, onLockAll, canAdd, palette }: { onGenerate: () => void; onAdd: () => void; onLockAll: () => void; canAdd: boolean, palette: Palette }) => {
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
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.2 }}
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40"
    >
      <div className="flex items-center gap-2 p-2 bg-background/80 backdrop-blur-md border rounded-full shadow-lg">
        <Button onClick={onGenerate} className="font-semibold" size="sm">
          <Sparkles className="h-4 w-4 mr-2" />
          Generate
        </Button>
        <Button onClick={onAdd} variant="outline" size="sm" disabled={!canAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add
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
          <PopoverContent className="w-auto p-1 mb-2">
            <div className="flex flex-col">
              <Button variant="ghost" onClick={() => copyPalette('css')} className="justify-start">CSS Variables</Button>
              <Button variant="ghost" onClick={() => copyPalette('json')} className="justify-start">JSON Array</Button>
              <Button variant="ghost" onClick={() => copyPalette('url')} className="justify-start">Share URL</Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </motion.div>
  );
});
FloatingActions.displayName = 'FloatingActions';


// --- Main Component ---
export default function ColorPaletteGenerator() {
  const isMobile = useIsMobile();
  const [palette, setPalette] = useState<Palette>(() => Array.from({ length: isMobile ? 3 : 5 }, generateRandomColor));
  const [showHelper, setShowHelper] = useState(true);

  const dragItem = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT' && document.activeElement?.tagName !== 'BUTTON') {
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
  
  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, index: number) => {
    dragItem.current = index;
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => setIsDragging(true), 0);
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (dragItem.current === null || dragItem.current === index) return;
    
    setPalette(currentPalette => {
        const paletteCopy = [...currentPalette];
        const draggedItemContent = paletteCopy.splice(dragItem.current!, 1)[0];
        paletteCopy.splice(index, 0, draggedItemContent);
        dragItem.current = index;
        return paletteCopy;
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    dragItem.current = null;
  }, []);
  
  return (
    <div className="h-full w-full flex flex-col md:flex-row relative bg-background overflow-hidden">
      <AnimatePresence>
        {showHelper && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute top-6 left-1/2 -translate-x-1/2 z-40"
          >
            <div className="hidden sm:flex items-center gap-2 text-sm font-medium bg-background/50 backdrop-blur-sm py-2 px-4 rounded-lg border shadow-sm">
                <RefreshCcw className="w-4 h-4"/>
                <p>Press the <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-md">Spacebar</kbd> to generate new palettes!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {palette.map((color, index) => (
            <ColorPanel
              key={color.id}
              color={color}
              onToggleLock={() => toggleLock(color.id)}
              onRemove={() => removeColor(color.id)}
              canRemove={palette.length > MIN_COLORS}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnter={(e) => handleDragEnter(e, index)}
              onDragEnd={handleDragEnd}
              isDragging={isDragging && dragItem.current === index}
            />
        ))}
      </AnimatePresence>
      
      <FloatingActions 
        onGenerate={handleGenerate}
        onAdd={addColor}
        onLockAll={lockAll}
        canAdd={palette.length < MAX_COLORS}
        palette={palette}
      />
    </div>
  );
}
