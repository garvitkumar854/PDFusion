
"use client";

import React, { useState, useEffect, useCallback, useReducer } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colord, extend, Colord } from 'colord';
import namesPlugin from 'colord/plugins/names';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Wand2, Plus, Undo, Redo, GripVertical, Lock, Unlock, Pencil, Trash2, Link } from 'lucide-react';

extend([namesPlugin]);

// Types
type ColorInfo = {
  hex: string;
  isLocked: boolean;
  id: string;
};

type Palette = ColorInfo[];

type HistoryState = {
  past: Palette[];
  present: Palette;
  future: Palette[];
};

// Reducer for history management
type HistoryAction =
  | { type: 'SET'; newPresent: Palette }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'CLEAR'; initialState: Palette };

const historyReducer = (state: HistoryState, action: HistoryAction): HistoryState => {
  const { past, present, future } = state;
  switch (action.type) {
    case 'SET':
      if (action.newPresent === present) {
        return state;
      }
      return {
        past: [...past, present],
        present: action.newPresent,
        future: [],
      };
    case 'UNDO':
      if (past.length === 0) return state;
      const previous = past[past.length - 1];
      const newPast = past.slice(0, past.length - 1);
      return {
        past: newPast,
        present: previous,
        future: [present, ...future],
      };
    case 'REDO':
      if (future.length === 0) return state;
      const next = future[0];
      const newFuture = future.slice(1);
      return {
        past: [...past, present],
        present: next,
        future: newFuture,
      };
    case 'CLEAR':
      return {
          past: [],
          present: action.initialState,
          future: [],
      }
    default:
      return state;
  }
};


// Constants
const MIN_COLORS = 2;
const MAX_COLORS = 10;

// Helper Functions
const getTextColor = (hex: string) => colord(hex).isDark() ? '#FFFFFF' : '#000000';

const generateRandomColor = (palette?: Palette): ColorInfo => {
    const existingHues = palette ? palette.filter(c => c.isLocked).map(c => colord(c.hex).toHsv().h) : [];
    let hue = Math.floor(Math.random() * 360);
    
    for (let i=0; i<10; i++) {
        const isTooClose = existingHues.some(h => Math.abs(h - hue) < 25 || Math.abs(h - hue) > 335);
        if (!isTooClose) break;
        hue = Math.floor(Math.random() * 360);
    }

    const saturation = 50 + Math.floor(Math.random() * 40);
    const value = 65 + Math.floor(Math.random() * 25);
    const hex = colord({ h: hue, s: saturation, v: value }).toHex();
    return { hex, isLocked: false, id: crypto.randomUUID() };
};

const initialPalette = Array.from({ length: 5 }, () => generateRandomColor());

const ColorPanel = React.memo(({ color, onUpdate, onRemove, onDragStart, onDragEnd, onDragEnter, isDragging }: { 
    color: ColorInfo,
    onUpdate: (id: string, newColor: Partial<ColorInfo>) => void,
    onRemove: (id: string) => void,
    onDragStart: (e: React.PointerEvent<HTMLDivElement>) => void,
    onDragEnd: (e: React.PointerEvent<HTMLDivElement>) => void,
    onDragEnter: (e: React.PointerEvent<HTMLDivElement>) => void,
    isDragging: boolean
}) => {
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
            className={cn(
                "relative flex-1 group font-inter rounded-lg min-h-[16rem] md:min-h-0",
                isDragging ? 'cursor-grabbing' : 'cursor-default'
            )}
        >
            <div className="absolute top-4 right-2 flex flex-col items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <button onPointerDown={onDragStart} onPointerUp={onDragEnd} onPointerMove={onDragEnter} className="cursor-grab active:cursor-grabbing"><GripVertical className="h-5 w-5" /></button>
                <button onClick={() => onUpdate(color.id, { isLocked: !color.isLocked })}>{color.isLocked ? <Lock className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}</button>
                <Popover>
                    <PopoverTrigger asChild>
                        <button><Pencil className="h-5 w-5" /></button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 border-none">
                        <input type="color" value={color.hex} onChange={handleHexChange} className="w-full h-12 cursor-pointer" />
                    </PopoverContent>
                </Popover>
                <button onClick={() => onRemove(color.id)}><Trash2 className="h-5 w-5" /></button>
            </div>
            
            <div className="absolute bottom-4 left-4 text-left">
                <span className="text-xs uppercase opacity-80 block">Hex</span>
                <span className="font-bold text-lg tracking-wider">{color.hex}</span>
            </div>
        </motion.div>
    );
});
ColorPanel.displayName = 'ColorPanel';

// Main Component
export default function ColorPaletteGenerator() {
    const [state, dispatch] = useReducer(historyReducer, {
        past: [],
        present: [],
        future: [],
    });
    const { present: palette } = state;
    const { toast } = useToast();
    const dragItem = React.useRef<string | null>(null);

    useEffect(() => {
        dispatch({ type: 'SET', newPresent: initialPalette});
    }, []);

    const setPalette = (newPalette: Palette | ((p: Palette) => Palette)) => {
        const updatedPalette = typeof newPalette === 'function' ? newPalette(palette) : newPalette;
        dispatch({ type: 'SET', newPresent: updatedPalette });
    };

    const generatePalette = useCallback(() => {
        setPalette(currentPalette =>
            currentPalette.map(color => color.isLocked ? color : generateRandomColor(currentPalette))
        );
    }, []);
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && !/input|textarea/i.test((e.target as HTMLElement).tagName)) {
                e.preventDefault();
                generatePalette();
            }
             if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                dispatch({ type: 'UNDO' });
            }
            if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                dispatch({ type: 'REDO' });
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [generatePalette]);

    const handleAddColor = useCallback(() => {
        if (palette.length < MAX_COLORS) {
            const newColor = generateRandomColor(palette);
            setPalette(p => [...p, newColor]);
        } else {
            toast({ variant: 'destructive', title: `Cannot have more than ${MAX_COLORS} colors.`});
        }
    }, [palette, toast]);

    const handleRemoveColor = useCallback((id: string) => {
        if (palette.length > MIN_COLORS) {
            setPalette(p => p.filter(c => c.id !== id));
        } else {
            toast({ variant: 'destructive', title: `Cannot have less than ${MIN_COLORS} colors.`});
        }
    }, [palette.length, toast]);

    const handleUpdateColor = useCallback((id: string, newColor: Partial<ColorInfo>) => {
        setPalette(p => p.map(c => c.id === id ? { ...c, ...newColor } : c));
    }, []);

    const copyLink = () => {
        const url = new URL(window.location.href);
        url.hash = palette.map(c => c.hex.substring(1)).join('-');
        navigator.clipboard.writeText(url.toString());
        toast({ variant: 'success', title: 'Link copied to clipboard!' });
    };

    // Drag and Drop handlers
    const onDragStart = (e: React.PointerEvent<HTMLDivElement>, id: string) => {
        dragItem.current = id;
        (e.target as HTMLElement).style.cursor = 'grabbing';
    };

    const onDragEnter = (id: string) => {
        if (dragItem.current && dragItem.current !== id) {
            const dragItemIndex = palette.findIndex(p => p.id === dragItem.current);
            const hoverItemIndex = palette.findIndex(p => p.id === id);

            if (dragItemIndex !== -1 && hoverItemIndex !== -1) {
                const newPalette = [...palette];
                const [draggedItem] = newPalette.splice(dragItemIndex, 1);
                newPalette.splice(hoverItemIndex, 0, draggedItem);
                setPalette(newPalette);
            }
        }
    };

    const onDragEnd = (e: React.PointerEvent<HTMLDivElement>) => {
        dragItem.current = null;
        (e.target as HTMLElement).style.cursor = 'grab';
    };

    if (palette.length === 0) {
        return <div className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div></div>
    }

    return (
        <div className="flex flex-col h-full p-4 gap-4 bg-background">
            <header className="flex justify-between items-center h-12 shrink-0">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={generatePalette}><Wand2 className="h-4 w-4 mr-2" />Random palette</Button>
                    <Button variant="ghost" onClick={handleAddColor}><Plus className="h-4 w-4 mr-2" />Add color</Button>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => dispatch({ type: 'UNDO' })} disabled={state.past.length === 0}><Undo className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => dispatch({ type: 'REDO' })} disabled={state.future.length === 0}><Redo className="h-4 w-4" /></Button>
                </div>
            </header>

            <main className="flex-1 flex flex-col md:flex-row gap-2 w-full overflow-hidden">
                <AnimatePresence>
                    {palette.map((color) => (
                         <ColorPanel
                            key={color.id}
                            color={color}
                            onUpdate={handleUpdateColor}
                            onRemove={handleRemoveColor}
                            onDragStart={(e) => onDragStart(e, color.id)}
                            onDragEnter={() => onDragEnter(color.id)}
                            onDragEnd={onDragEnd}
                            isDragging={dragItem.current === color.id}
                        />
                    ))}
                </AnimatePresence>
            </main>

            <footer className="flex justify-between items-center h-12 shrink-0">
                <Button variant="ghost" onClick={copyLink}><Link className="h-4 w-4 mr-2"/>Copy link</Button>
                <Button onClick={generatePalette}>Get color palette</Button>
            </footer>
        </div>
    );
}

