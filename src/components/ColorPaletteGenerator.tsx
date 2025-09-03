
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { colord, extend, Colord } from 'colord';
import namesPlugin from 'colord/plugins/names';
import cmykPlugin from 'colord/plugins/cmyk';
import labPlugin from 'colord/plugins/lab';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Lock, Unlock, Trash2, Plus, Sparkles, Wand2, FileDown } from 'lucide-react';
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

extend([namesPlugin, cmykPlugin, labPlugin]);

type ColorInfo = {
  hex: string;
  isLocked: boolean;
  id: string;
};

type Palette = ColorInfo[];
type SecondaryInfoType = "name" | "rgb" | "hsl" | "hsv" | "cmyk" | "lab";

const MIN_COLORS = 2;
const MAX_COLORS = 10;

const formatColorValue = (type: SecondaryInfoType, color: Colord): string => {
    switch (type) {
        case "name": return color.toName({ closest: true }) || 'Unknown';
        case "rgb": return color.toRgbString();
        case "hsl": return color.toHslString();
        case "hsv": return color.toHsvString();
        case "cmyk": return color.toCmykString();
        case "lab": return color.toLabString();
        default: return '';
    }
}

const getTextColor = (hex: string) => colord(hex).isDark() ? '#FFFFFF' : '#000000';

const generateRandomColor = (p?: Palette): ColorInfo => {
    const existingHues = p ? p.map(c => colord(c.hex).toHsv().h) : [];
    let hue = Math.floor(Math.random() * 360);
    
    // Attempt to find a distinct hue
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

const ColorPanel = React.memo(({ color, onUpdate, onRemove, onCopy, palette, setPalette, secondaryInfo, isIsolated }: { 
    color: ColorInfo,
    onUpdate: (id: string, newColor: Partial<ColorInfo>) => void,
    onRemove: (id: string) => void,
    onCopy: (text: string) => void,
    palette: Palette,
    setPalette: React.Dispatch<React.SetStateAction<Palette>>,
    secondaryInfo: SecondaryInfoType,
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
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            style={{ backgroundColor: color.hex, color: textColor, minHeight: '16rem' }}
            className="relative flex-1 group"
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
            
            <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
                <Popover>
                    <PopoverTrigger asChild>
                        <motion.button whileHover={{ scale: 1.05 }} className="font-bold text-lg uppercase tracking-wider focus:outline-none">{color.hex.substring(1)}</motion.button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 border-none">
                        <input type="color" value={color.hex} onChange={handleHexChange} className="w-full h-12 cursor-pointer" />
                    </PopoverContent>
                </Popover>
                
                <p className="text-sm capitalize opacity-80 font-medium h-5">{formatColorValue(secondaryInfo, colorInstance)}</p>
            </div>
        </motion.div>
    );
});
ColorPanel.displayName = 'ColorPanel';

const AddColorButton = ({ onClick }: { onClick: () => void }) => (
    <div className="w-0 h-full relative group flex items-center justify-center -mx-3">
        <button 
            onClick={onClick}
            className="absolute z-10 w-8 h-8 bg-background text-foreground rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
        >
            <Plus className="w-4 h-4"/>
        </button>
    </div>
);
AddColorButton.displayName = 'AddColorButton';

const PaletteDisplay = ({ palette, setPalette, secondaryInfo, isIsolated }: {
    palette: Palette,
    setPalette: React.Dispatch<React.SetStateAction<Palette>>,
    secondaryInfo: SecondaryInfoType,
    isIsolated: boolean
}) => {
    const { toast } = useToast();

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

    const displayedPalette = isIsolated ? palette.filter(c => !c.isLocked) : palette;

    return (
        <div className="flex flex-1 w-full bg-muted/20 rounded-lg overflow-hidden relative">
            <AnimatePresence>
                {displayedPalette.map((color, index) => (
                    <React.Fragment key={color.id}>
                        <ColorPanel 
                            color={color} 
                            onUpdate={handleUpdateColor}
                            onRemove={handleRemoveColor}
                            onCopy={handleCopy}
                            palette={palette}
                            setPalette={setPalette}
                            secondaryInfo={secondaryInfo}
                            isIsolated={isIsolated}
                        />
                        {index < displayedPalette.length - 1 && palette.length < MAX_COLORS && (
                             <AddColorButton onClick={() => handleAddColor(index + 1)} />
                        )}
                    </React.Fragment>
                ))}
            </AnimatePresence>
        </div>
    )
}

const ExportDialog = ({ palette }: { palette: Palette }) => {
    const { toast } = useToast();
    const colors = palette.map(c => c.hex);

    const copyToClipboard = (text: string, format: string) => {
        navigator.clipboard.writeText(text);
        toast({ variant: 'success', title: `Copied as ${format}` });
    };
    
    const exportOptions = {
        css: [
            { name: "HEX", generator: () => colors.map((c,i) => `--color-${i+1}: ${c};`).join('\n')},
            { name: "RGB", generator: () => colors.map((c,i) => `--color-${i+1}: ${colord(c).toRgbString()};`).join('\n')},
        ],
        code: [
            { name: "Tailwind", generator: () => `{\n${colors.map((c,i) => `  'color-${i+1}': '${c}',`).join('\n')}\n}` },
            { name: "JS Array", generator: () => `[\n${colors.map(c => `  '${c}'`).join(',\n')}\n]` },
            { name: "JS Object", generator: () => `{\n${colors.map((c,i) => `  color${i+1}: '${c}',`).join('\n')}\n}` },
        ],
        pdf: () => {
          toast({ title: "Coming Soon!", description: "PDF export is not yet available."})
        }
    }

    return (
      <DialogContent>
        <DialogHeader><DialogTitle>Export Palette</DialogTitle></DialogHeader>
        <Tabs defaultValue="css">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="css">CSS</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
            <TabsTrigger value="pdf" onClick={exportOptions.pdf}>PDF</TabsTrigger>
          </TabsList>
          <TabsContent value="css">
            {exportOptions.css.map(opt => (
                <div key={opt.name} className="mt-4"><Label>{opt.name}</Label><Textarea readOnly value={opt.generator()} className="mt-1 h-24 font-mono text-xs" onClick={() => copyToClipboard(opt.generator(), opt.name)} /></div>
            ))}
          </TabsContent>
          <TabsContent value="code">
             {exportOptions.code.map(opt => (
                <div key={opt.name} className="mt-4"><Label>{opt.name}</Label><Textarea readOnly value={opt.generator()} className="mt-1 h-24 font-mono text-xs" onClick={() => copyToClipboard(opt.generator(), opt.name)} /></div>
            ))}
          </TabsContent>
        </Tabs>
      </DialogContent>
    )
}

export default function ColorPaletteGenerator() {
    const [palette, setPalette] = useState<Palette>([]);
    const [secondaryInfo, setSecondaryInfo] = useState<SecondaryInfoType>('name');
    const [isIsolated, setIsIsolated] = useState(false);
    const { toast } = useToast();

    const generatePalette = useCallback(() => {
        setPalette(currentPalette =>
            currentPalette.map(color => color.isLocked ? color : generateRandomColor(currentPalette))
        );
    }, []);

    useEffect(() => {
        const colorsFromUrl = new URLSearchParams(window.location.search).get('colors');
        if (colorsFromUrl) {
            const hexes = colorsFromUrl.split('-');
            if (hexes.length >= MIN_COLORS && hexes.length <= MAX_COLORS) {
                const newPalette = hexes.map(hex => ({ hex: `#${hex}`, isLocked: false, id: self.crypto.randomUUID() }));
                setPalette(newPalette);
                return;
            }
        }
        // Generate initial palette
        setPalette(Array.from({ length: 5 }, (_, i) => generateRandomColor()));
    }, []);
    
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

    const addColor = useCallback(() => {
        if (palette.length < MAX_COLORS) {
            setPalette(p => [...p, generateRandomColor(p)]);
        } else {
             toast({ variant: 'warning', title: `Cannot have more than ${MAX_COLORS} colors.`});
        }
    }, [palette, toast]);

    const removeColor = useCallback(() => {
        if (palette.length > MIN_COLORS) {
            setPalette(p => {
                const unlockedIndex = p.findLastIndex(c => !c.isLocked);
                if (unlockedIndex !== -1) return p.filter((_, i) => i !== unlockedIndex);
                return p.slice(0, -1);
            });
        } else {
            toast({ variant: 'warning', title: `Cannot have less than ${MIN_COLORS} colors.`});
        }
    }, [palette.length, toast]);

    const lockAll = useCallback(() => {
        const allLocked = palette.every(c => c.isLocked);
        setPalette(p => p.map(c => ({...c, isLocked: !allLocked})));
        toast({ title: allLocked ? "All Unlocked" : "All Locked" });
    }, [palette, toast]);

    return (
        <div className="flex flex-col h-full p-4 gap-4">
            <header className="flex justify-between items-center h-12">
                <div className="text-sm text-muted-foreground">Press <kbd className="px-2 py-1.5 text-xs font-semibold text-foreground bg-muted rounded-md border">Spacebar</kbd> to generate</div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={generatePalette}><Sparkles className="h-4 w-4 mr-2"/>Generate</Button>
                    <div className="flex items-center rounded-md border bg-background p-0.5">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={addColor}><Plus className="h-4 w-4"/></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={removeColor}><Trash2 className="h-4 w-4"/></Button>
                    </div>
                    <Button variant="ghost" size="icon" onClick={lockAll}><Lock className="h-4 w-4"/></Button>
                    
                    <Popover>
                        <PopoverTrigger asChild><Button variant="ghost" size="icon"><Wand2 className="h-4 w-4"/></Button></PopoverTrigger>
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
                                    <Label htmlFor="isolate-colors">Isolate Locked</Label>
                                    <Switch id="isolate-colors" checked={isIsolated} onCheckedChange={setIsIsolated} />
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                    
                    <Dialog>
                        <DialogTrigger asChild><Button variant="ghost" size="icon"><FileDown className="h-4 w-4"/></Button></DialogTrigger>
                        <ExportDialog palette={palette} />
                    </Dialog>
                </div>
            </header>

            <PaletteDisplay 
                palette={palette}
                setPalette={setPalette}
                secondaryInfo={secondaryInfo}
                isIsolated={isIsolated}
            />
        </div>
    );
}
