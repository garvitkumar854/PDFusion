
"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { colord, extend, Colord } from 'colord';
import namesPlugin from 'colord/plugins/names';
import cmykPlugin from 'colord/plugins/cmyk';
import labPlugin from 'colord/plugins/lab';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Lock, Unlock, Trash2, Plus, ChevronDown, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Button } from './ui/button';
import { Label } from './ui/label';
import ColorActions from './ColorActions';

extend([namesPlugin, cmykPlugin, labPlugin]);

export type ColorInfo = {
  hex: string;
  isLocked: boolean;
  id: string;
};

export type Palette = ColorInfo[];
export type SecondaryInfoType = "name" | "rgb" | "hsl" | "hsv" | "cmyk" | "lab";

const MIN_COLORS = 2;
const MAX_COLORS = 10;

const formatColorValue = (type: SecondaryInfoType, color: Colord): string => {
    switch (type) {
        case "name": return color.toName({ closest: true }) || 'Unknown';
        case "rgb": return color.toRgbString();
        case "hsl": return color.toHslString();
        case "hsv": return color.toHsvString();
        case "cmyk": return color.toCmykString();
        case "lab": {
            const { l, a, b } = color.toLab();
            return `lab(${Math.round(l)} ${Math.round(a)} ${Math.round(b)})`;
        }
        default: return '';
    }
}

const getTextColor = (hex: string) => colord(hex).isDark() ? '#FFFFFF' : '#000000';

export const generateRandomColor = (p?: Palette): ColorInfo => {
    const existingHues = p ? p.filter(c => c.isLocked).map(c => colord(c.hex).toHsv().h) : [];
    let hue = Math.floor(Math.random() * 360);
    
    // Try to find a hue that's not too close to locked colors
    for (let i=0; i<10; i++) {
        const isTooClose = existingHues.some(h => Math.abs(h - hue) < 25 || Math.abs(h - hue) > 335);
        if (!isTooClose) break;
        hue = Math.floor(Math.random() * 360);
    }

    const saturation = 50 + Math.floor(Math.random() * 40);
    const lightness = 45 + Math.floor(Math.random() * 30);
    const hex = colord({ h: hue, s: saturation, l: lightness }).toHex();
    return { hex, isLocked: false, id: self.crypto.randomUUID() };
};

const ColorSettings = ({ secondaryInfo, setSecondaryInfo, isIsolated, setIsIsolated }: { secondaryInfo: SecondaryInfoType, setSecondaryInfo: (v: SecondaryInfoType) => void, isIsolated: boolean, setIsIsolated: (v: boolean) => void }) => {
    return (
      <PopoverContent className="w-64 p-4">
        <div className="space-y-4">
            <h4 className="font-medium leading-none">Settings</h4>
             <div className="flex items-center justify-between">
                <Label htmlFor="secondary-info">Info Display</Label>
                <Select value={secondaryInfo} onValueChange={v => setSecondaryInfo(v as SecondaryInfoType)}>
                    <SelectTrigger id="secondary-info" className="w-32"><SelectValue/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="rgb">RGB</SelectItem>
                        <SelectItem value="hsl">HSL</SelectItem>
                        <SelectItem value="hsv">HSV</SelectItem>
                        <SelectItem value="cmyk">CMYK</SelectItem>
                        <SelectItem value="lab">LAB</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="flex items-center justify-between">
                <Label htmlFor="isolate-colors">Isolate Colors</Label>
                <Switch id="isolate-colors" checked={isIsolated} onCheckedChange={setIsIsolated} />
            </div>
        </div>
      </PopoverContent>
    )
}


const ColorPanel = React.memo(({ color, secondaryInfo, onUpdate, onRemove, onCopy, onAdd, paletteLength, isIsolated }: { 
    color: ColorInfo,
    secondaryInfo: SecondaryInfoType,
    onUpdate: (id: string, newColor: Partial<ColorInfo>) => void,
    onRemove: (id: string) => void,
    onCopy: (text: string) => void,
    onAdd: () => void,
    paletteLength: number,
    isIsolated: boolean
}) => {
    const colorInstance = colord(color.hex);
    const textColor = getTextColor(color.hex);

    const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newHex = e.target.value;
        if (colord(newHex).isValid()) {
            onUpdate(color.id, { hex: newHex });
        }
    };
    
    return (
        <motion.div
            layout
            initial={{ opacity: 0, flexBasis: 0 }}
            animate={{ opacity: 1, flexBasis: 'auto' }}
            exit={{ opacity: 0, flexBasis: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            style={{ backgroundColor: color.hex, color: textColor }}
            className={cn("relative flex-1 group font-inter", isIsolated && 'flex-[2]')}
        >
            <div className="absolute top-0 right-0 p-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <TooltipProvider><Tooltip><TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/10 hover:bg-black/20" onClick={() => onCopy(color.hex)}><Copy className="h-4 w-4" /></Button>
                </TooltipTrigger><TooltipContent>Copy Hex</TooltipContent></Tooltip></TooltipProvider>
                <TooltipProvider><Tooltip><TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/10 hover:bg-black/20" onClick={() => onUpdate(color.id, { isLocked: !color.isLocked })}>{color.isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}</Button>
                </TooltipTrigger><TooltipContent>{color.isLocked ? "Unlock" : "Lock"}</TooltipContent></Tooltip></TooltipProvider>
                {paletteLength > MIN_COLORS && (
                    <TooltipProvider><Tooltip><TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/10 hover:bg-black/20" onClick={() => onRemove(color.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TooltipTrigger><TooltipContent>Remove Color</TooltipContent></Tooltip></TooltipProvider>
                )}
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 p-4 text-center space-y-1">
                <Popover>
                    <PopoverTrigger asChild>
                        <motion.button whileHover={{ scale: 1.05 }} className="font-bold text-lg uppercase tracking-wider focus:outline-none">{color.hex.substring(1)}</motion.button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 border-none">
                        <input type="color" value={color.hex} onChange={handleHexChange} className="w-full h-12 cursor-pointer" />
                    </PopoverContent>
                </Popover>

                <div className="text-sm capitalize opacity-80 h-5">
                  {formatColorValue(secondaryInfo, colorInstance)}
                </div>
            </div>

            {paletteLength < MAX_COLORS && (
              <div className="w-0 h-full relative group/add-btn flex items-center justify-center -mr-3">
                  <button 
                      onClick={onAdd}
                      className="absolute z-10 w-8 h-8 bg-white text-black rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover/add-btn:opacity-100 transition-opacity hover:scale-110"
                  >
                      <Plus className="w-4 h-4"/>
                  </button>
              </div>
            )}
        </motion.div>
    );
});
ColorPanel.displayName = 'ColorPanel';

const PaletteDisplay = ({ palette, secondaryInfo, setPalette, isIsolated }: { palette: Palette, secondaryInfo: SecondaryInfoType, setPalette: React.Dispatch<React.SetStateAction<Palette>>, isIsolated: boolean }) => {
    const { toast } = useToast();
    
    const handleUpdateColor = useCallback((id: string, newColor: Partial<ColorInfo>) => {
        setPalette(p => p.map(c => c.id === id ? { ...c, ...newColor } : c));
    }, [setPalette]);

    const handleRemoveColor = useCallback((id: string) => {
        if (palette.length > MIN_COLORS) {
            setPalette(p => p.filter(c => c.id !== id));
        } else {
            toast({ variant: 'destructive', title: `Cannot have less than ${MIN_COLORS} colors.`});
        }
    }, [palette.length, setPalette, toast]);
    
    const handleAddColor = useCallback((index: number) => {
        if (palette.length < MAX_COLORS) {
            const newColor = generateRandomColor(palette);
            const newPalette = [...palette];
            newPalette.splice(index, 0, newColor);
            setPalette(newPalette);
        } else {
            toast({ variant: 'destructive', title: `Cannot have more than ${MAX_COLORS} colors.`});
        }
    }, [palette, setPalette, toast]);

    const handleCopy = useCallback((text: string) => {
        navigator.clipboard.writeText(text);
        toast({ variant: 'success', title: 'Copied to clipboard!', description: text });
    }, [toast]);

    return (
        <div className="flex flex-1 w-full bg-muted/20 rounded-lg overflow-hidden relative">
            <AnimatePresence>
                {palette.map((color, index) => (
                    <ColorPanel 
                        key={color.id}
                        color={color}
                        secondaryInfo={secondaryInfo}
                        onUpdate={handleUpdateColor}
                        onRemove={handleRemoveColor}
                        onCopy={handleCopy}
                        onAdd={() => handleAddColor(index + 1)}
                        paletteLength={palette.length}
                        isIsolated={isIsolated}
                    />
                ))}
            </AnimatePresence>
        </div>
    )
};


export default function ColorPaletteGenerator() {
    const [palette, setPalette] = useState<Palette>([]);
    const [secondaryInfo, setSecondaryInfo] = useState<SecondaryInfoType>('name');
    const [isIsolated, setIsIsolated] = useState(false);
    
    const generatePalette = useCallback(() => {
        setPalette(currentPalette =>
            currentPalette.map(color => color.isLocked ? color : generateRandomColor(currentPalette))
        );
    }, []);

    const { toast } = useToast();

    const handleAddColor = useCallback((index: number) => {
        if (palette.length < MAX_COLORS) {
            const newColor = generateRandomColor(palette);
            const newPalette = [...palette];
            newPalette.splice(index, 0, newColor);
            setPalette(newPalette);
        } else {
            toast({ variant: 'destructive', title: `Cannot have more than ${MAX_COLORS} colors.`});
        }
    }, [palette, toast]);

    const handleRemoveColor = useCallback(() => {
        if (palette.length > MIN_COLORS) {
            // Find last unlocked color to remove
            for(let i = palette.length - 1; i >= 0; i--) {
                if (!palette[i].isLocked) {
                    setPalette(p => p.filter(c => c.id !== palette[i].id));
                    return;
                }
            }
            // If all are locked, remove the last one
            setPalette(p => p.slice(0, p.length - 1));
        } else {
            toast({ variant: 'destructive', title: `Cannot have less than ${MIN_COLORS} colors.`});
        }
    }, [palette, toast]);

    const areAllLocked = useMemo(() => palette.every(c => c.isLocked), [palette]);

    const toggleLockAll = useCallback(() => {
        const allCurrentlyLocked = palette.every(c => c.isLocked);
        setPalette(p => p.map(c => ({...c, isLocked: !allCurrentlyLocked })));
    }, [palette]);
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
                e.preventDefault();
                generatePalette();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [generatePalette]);
    
    useEffect(() => {
        // Generate initial palette on client-side mount
        setPalette(Array.from({ length: 5 }, () => generateRandomColor()));
    }, []);

    return (
        <div className="flex flex-col h-full p-4 gap-4 font-inter">
            <header className="flex justify-between items-center h-12">
                <div className="text-sm text-muted-foreground">Press <kbd className="px-2 py-1.5 text-xs font-semibold text-foreground bg-muted rounded-md border">Spacebar</kbd> to generate</div>
                <div className="flex items-center gap-2">
                    <ColorActions 
                        palette={palette} 
                        generatePalette={generatePalette}
                        onAddColor={() => handleAddColor(palette.length)} 
                        onRemoveColor={handleRemoveColor}
                        toggleLockAll={toggleLockAll}
                        areAllLocked={areAllLocked}
                     />
                     <Popover>
                        <PopoverTrigger asChild><Button variant="outline" size="icon" className="h-9 w-9"><Wand2 className="h-4 w-4"/></Button></PopoverTrigger>
                        <ColorSettings secondaryInfo={secondaryInfo} setSecondaryInfo={setSecondaryInfo} isIsolated={isIsolated} setIsIsolated={setIsIsolated} />
                    </Popover>
                </div>
            </header>

            <PaletteDisplay 
                palette={palette}
                secondaryInfo={secondaryInfo}
                setPalette={setPalette}
                isIsolated={isIsolated}
            />
        </div>
    );
}
