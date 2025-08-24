
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';
import random from 'random';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Lock, Unlock, Copy, Check, Palette, Sparkles, RefreshCcw, Plus, Trash2, GripVertical } from 'lucide-react';
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
  const saturation = random.int(70, 100);
  const lightness = random.int(60, 85);
  const hex = colord({ h: hue, s: saturation, l: lightness }).toHex();
  return {
    hex,
    name: colord(hex).toName({ closest: true }) || 'Unknown',
    isLocked: false,
    id: `${hex}-${Date.now()}-${Math.random()}`
  };
}

const ColorPanel = ({ 
  color, 
  onToggleLock, 
  onCopy, 
  onRemove, 
  canRemove, 
  isMobile,
  onDragStart,
  onDragEnter,
  onDragEnd,
  isDragging,
}: { 
  color: ColorInfo, 
  onToggleLock: () => void, 
  onCopy: () => void, 
  onRemove: () => void; 
  canRemove: boolean; 
  isMobile: boolean,
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnter: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}) => {
  const [copied, setCopied] = useState(false);
  const textColor = colord(color.hex).isDark() ? '#FFFFFF' : '#000000';

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  
  const handleViewShades = () => {
    // Placeholder for viewing shades functionality
    alert(`Shades for ${color.hex}`);
  };


  const actionIcons = [
    {
      label: 'Remove Color',
      onClick: onRemove,
      icon: <Trash2 className="h-5 w-5"/>,
      visible: canRemove,
      className: "hover:text-red-500"
    },
    {
      label: 'View Shades',
      onClick: handleViewShades,
      icon: <Palette className="h-5 w-5"/>,
      visible: true
    },
    {
      label: 'Drag to Reorder',
      icon: <GripVertical className="h-5 w-5 cursor-grab"/>,
      visible: !isMobile,
      isDragHandle: true,
    },
    {
      label: 'Copy Hex',
      onClick: handleCopy,
      icon: copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />,
      visible: true
    },
    {
      label: color.isLocked ? 'Unlock' : 'Lock',
      onClick: onToggleLock,
      icon: color.isLocked ? <Lock className="h-5 w-5 text-red-400" /> : <Unlock className="h-5 w-5" />,
      visible: true
    },
  ];

  return (
    <div
      style={{ backgroundColor: color.hex }}
      className={cn(
        "relative h-full w-full flex flex-col justify-end items-center p-6 text-center group",
        isDragging ? 'opacity-50' : 'opacity-100'
      )}
      draggable={!isMobile}
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
    >
      <div className="relative z-10 space-y-1" style={{ color: textColor }}>
        <h2 className="text-xl font-bold uppercase cursor-pointer" onClick={handleCopy}>
          {color.hex.substring(1)}
        </h2>
        <p className="text-sm capitalize">{color.name}</p>
      </div>

      <div className={cn(
        "absolute z-20 flex transition-opacity duration-300",
        isMobile ? 'bottom-6 right-6 flex-col gap-3' : 'top-1/2 -translate-y-1/2 flex-col gap-2 opacity-0 group-hover:opacity-100'
      )}>
        {actionIcons.filter(a => a.visible).map((action, index) => (
          <TooltipProvider key={action.label}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => { e.stopPropagation(); action.onClick?.(); }}
                  style={{ color: textColor }}
                  className={cn(
                    "rounded-full p-2 transition-transform duration-200 hover:scale-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black/20 focus-visible:ring-white",
                     action.isDragHandle ? 'cursor-grab' : 'cursor-pointer',
                     action.className
                  )}
                  aria-label={action.label}
                >
                  {action.icon}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{action.label}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
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

  const dragItem = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    dragItem.current = index;
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => setIsDragging(true), 0);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (dragItem.current === null || dragItem.current === index) return;
    
    const paletteCopy = [...palette];
    const draggedItemContent = paletteCopy.splice(dragItem.current, 1)[0];
    paletteCopy.splice(index, 0, draggedItemContent);
    dragItem.current = index;
    setPalette(paletteCopy);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    dragItem.current = null;
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
            {palette.map((color, index) => (
                <ColorPanel
                    key={color.id}
                    color={color}
                    onToggleLock={() => toggleLock(color.id)}
                    onCopy={() => copyColor(color.hex)}
                    onRemove={() => removeColor(color.id)}
                    canRemove={palette.length > MIN_COLORS}
                    isMobile={true}
                    isDragging={false}
                    onDragStart={()=>{}}
                    onDragEnter={()=>{}}
                    onDragEnd={()=>{}}
                />
            ))}
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
      <div className="flex-grow w-full flex" onDragOver={(e) => e.preventDefault()}>
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
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnter={(e) => handleDragEnter(e, index)}
                onDragEnd={handleDragEnd}
                isDragging={isDragging && dragItem.current === index}
              />
              <AddColorButton onClick={() => addColor(index + 1)} disabled={palette.length >= MAX_COLORS} />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
