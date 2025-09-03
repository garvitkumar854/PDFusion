
"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { colord, extend, Colord } from 'colord';
import namesPlugin from 'colord/plugins/names';
import cmykPlugin from 'colord/plugins/cmyk';
import labPlugin from 'colord/plugins/lab';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Lock, Unlock, Trash2, Plus, Sparkles, Wand2, FileDown, Check, Settings, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';
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
    const existingHues = p ? p.map(c => colord(c.hex).toHsv().h) : [];
    let hue = Math.floor(Math.random() * 360);
    
    for (let i=0; i<10; i++) {
        const isTooClose = existingHues.some(h => Math.abs(h - hue) < 20 || Math.abs(h - hue) > 340);
        if (!isTooClose) break;
        hue = Math.floor(Math.random() * 360);
    }

    const saturation = 50 + Math.floor(Math.random() * 40);
    const lightness = 45 + Math.floor(Math.random() * 30);
    const hex = colord({ h: hue, s: saturation, l: lightness }).toHex();
    return { hex, isLocked: false, id: self.crypto.randomUUID() };
};

const ColorSettings = ({ color, onUpdate }: { color: ColorInfo, onUpdate: (id: string, newColor: Partial<ColorInfo>) => void }) => {
    const [secondaryInfo, setSecondaryInfo] = useState<SecondaryInfoType>('name');
    const [isIsolated, setIsIsolated] = useState(false);
    return (
      <PopoverContent className="w-64 p-4">
        <div className="space-y-4">
            <h4 className="font-medium leading-none">Settings</h4>
             <div className="flex items-center justify-between">
                <Label htmlFor="secondary-info">Secondary Info</Label>
                <Select value={secondaryInfo} onValueChange={v => setSecondaryInfo(v as SecondaryInfoType)}>
                    <SelectTrigger className="w-32"><SelectValue/></SelectTrigger>
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
                <Label htmlFor="isolate-colors">Isolate Color</Label>
                <Switch id="isolate-colors" checked={isIsolated} onCheckedChange={setIsIsolated} />
            </div>
        </div>
      </PopoverContent>
    )
}


const ColorPanel = React.memo(({ color, onUpdate, onRemove, onCopy, onAdd, secondaryInfo }: { 
    color: ColorInfo,
    onUpdate: (id: string, newColor: Partial<ColorInfo>) => void,
    onRemove: (id: string) => void,
    onCopy: (text: string) => void,
    onAdd: () => void,
    secondaryInfo: SecondaryInfoType
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
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            style={{ backgroundColor: color.hex, color: textColor }}
            className="relative flex-1 group font-inter"
        >
            <div className="absolute top-0 right-0 p-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <TooltipProvider><Tooltip><TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/10 hover:bg-black/20" onClick={() => onCopy(color.hex)}><Copy className="h-4 w-4" /></Button>
                </TooltipTrigger><TooltipContent>Copy Hex</TooltipContent></Tooltip></TooltipProvider>
                <TooltipProvider><Tooltip><TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/10 hover:bg-black/20" onClick={() => onUpdate(color.id, { isLocked: !color.isLocked })}>{color.isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}</Button>
                </TooltipTrigger><TooltipContent>{color.isLocked ? "Unlock" : "Lock"}</TooltipContent></Tooltip></TooltipProvider>
                <TooltipProvider><Tooltip><TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/10 hover:bg-black/20" onClick={() => onRemove(color.id)}><Trash2 className="h-4 w-4" /></Button>
                </TooltipTrigger><TooltipContent>Remove Color</TooltipContent></Tooltip></TooltipProvider>
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

                <Popover>
                    <PopoverTrigger asChild>
                        <motion.button whileHover={{ scale: 1.05 }} className="font-medium text-sm capitalize opacity-80 h-5 flex items-center gap-1 focus:outline-none">{formatColorValue(secondaryInfo, colorInstance)}<ChevronDown className="w-3 h-3"/></motion.button>
                    </PopoverTrigger>
                    <ColorSettings color={color} onUpdate={onUpdate} />
                </Popover>
            </div>

            <div className="w-0 h-full relative group/add-btn flex items-center justify-center -mr-3">
                <button 
                    onClick={onAdd}
                    className="absolute z-10 w-8 h-8 bg-white text-black rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover/add-btn:opacity-100 transition-opacity hover:scale-110"
                >
                    <Plus className="w-4 h-4"/>
                </button>
            </div>
        </motion.div>
    );
});
ColorPanel.displayName = 'ColorPanel';

const PaletteDisplay = ({ palette, setPalette }: { palette: Palette, setPalette: React.Dispatch<React.SetStateAction<Palette>> }) => {
    const { toast } = useToast();
    const [secondaryInfo, setSecondaryInfo] = useState<SecondaryInfoType>('name');
    
    const handleUpdateColor = useCallback((id: string, newColor: Partial<ColorInfo>) => {
        setPalette(p => p.map(c => c.id === id ? { ...c, ...newColor } : c));
    }, [setPalette]);

    const handleRemoveColor = useCallback((id: string) => {
        if (palette.length > MIN_COLORS) {
            setPalette(p => p.filter(c => c.id !== id));
        } else {
            toast({ variant: 'warning', title: `Cannot have less than ${MIN_COLORS} colors.`});
        }
    }, [palette.length, setPalette, toast]);
    
    const handleAddColor = useCallback((index: number) => {
        if (palette.length < MAX_COLORS) {
            const newColor = generateRandomColor(palette);
            const newPalette = [...palette];
            newPalette.splice(index, 0, newColor);
            setPalette(newPalette);
        } else {
            toast({ variant: 'warning', title: `Cannot have more than ${MAX_COLORS} colors.`});
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
                        onUpdate={handleUpdateColor}
                        onRemove={handleRemoveColor}
                        onCopy={handleCopy}
                        onAdd={() => handleAddColor(index + 1)}
                        secondaryInfo={secondaryInfo}
                    />
                ))}
            </AnimatePresence>
        </div>
    )
};


export default function ColorPaletteGenerator() {
    const [palette, setPalette] = useState<Palette>([]);
    
    const generatePalette = useCallback((animate = false) => {
        if (!animate) {
            setPalette(currentPalette =>
                currentPalette.map(color => color.isLocked ? color : generateRandomColor(currentPalette))
            );
        } else {
            // instant generation
            const newPalette = Array.from({ length: palette.length > 0 ? palette.length : 5 }, (_, i) => {
                const existing = palette[i];
                return existing?.isLocked ? existing : generateRandomColor(palette);
            });
            setPalette(newPalette);
        }
    }, [palette]);
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
                e.preventDefault();
                generatePalette(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [generatePalette]);
    
    useEffect(() => {
        // Generate initial palette
        setPalette(Array.from({ length: 5 }, () => generateRandomColor()));
    }, []);
    

    return (
        <div className="flex flex-col h-full p-4 gap-4">
            <header className="flex justify-between items-center h-12">
                <div className="text-sm text-muted-foreground">Press <kbd className="px-2 py-1.5 text-xs font-semibold text-foreground bg-muted rounded-md border">Spacebar</kbd> to generate</div>
                <ColorActions palette={palette} setPalette={setPalette} generatePalette={() => generatePalette(true)} />
            </header>

            <PaletteDisplay 
                palette={palette}
                setPalette={setPalette}
            />
        </div>
    );
}
