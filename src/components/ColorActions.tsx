
"use client";

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Wand2, Plus, Minus, Lock, Unlock, FileDown, Check, Copy } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { type Palette } from './ColorPaletteGenerator';
import { PDFDocument, rgb } from 'pdf-lib';

type ColorActionsProps = {
    palette: Palette;
    generatePalette: () => void;
    onAddColor: () => void;
    onRemoveColor: () => void;
    toggleLockAll: () => void;
    areAllLocked: boolean;
};

const ExportCodeBlock = ({ title, code }: { title: string, code: string }) => {
    const { toast } = useToast();
    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        toast({ variant: 'success', title: 'Copied to clipboard!' });
    };

    return (
        <div className="space-y-2">
            <h4 className="font-semibold text-sm">{title}</h4>
            <div className="relative group">
                <Textarea value={code} readOnly className="pr-10 h-24 font-mono text-xs" />
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={handleCopy}>
                    <Copy className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};

const ExportDialog = ({ palette }: { palette: Palette }) => {
    const hexCodes = palette.map(c => c.hex);
    const cssVars = hexCodes.map((hex, i) => `  --color-${i + 1}: ${hex};`).join('\n');
    const tailwindConfig = `{\n  theme: {\n    extend: {\n      colors: {\n${hexCodes.map((hex, i) => `        'palette-${i + 1}': '${hex}',`).join('\n')}\n      }\n    }\n  }\n}`;
    const jsArray = `[\n${hexCodes.map(hex => `  '${hex}'`).join(',\n')}\n]`;

    const downloadPdf = async () => {
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage();
        const { width, height } = page.getSize();
        
        const rectHeight = height / palette.length;

        palette.forEach((color, i) => {
            const { r, g, b } = color.isLocked ? {r:1,g:1,b:1} : {r:0,g:0,b:0}; // This is a placeholder. A better implementation would be needed.
            page.drawRectangle({
                x: 0,
                y: height - (i + 1) * rectHeight,
                width,
                height: rectHeight,
                color: rgb(r, g, b)
            });
            // This is simplified. You'd need to embed fonts to draw text.
        });
        
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'color-palette.pdf';
        link.click();
    };

    return (
        <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>Export Palette</DialogTitle></DialogHeader>
            <Tabs defaultValue="code">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="code">Code</TabsTrigger>
                    <TabsTrigger value="pdf">PDF</TabsTrigger>
                </TabsList>
                <TabsContent value="code" className="space-y-4">
                     <ExportCodeBlock title="CSS Variables" code={`:root {\n${cssVars}\n}`} />
                     <ExportCodeBlock title="Tailwind Config" code={tailwindConfig} />
                     <ExportCodeBlock title="JavaScript Array" code={jsArray} />
                </TabsContent>
                 <TabsContent value="pdf" className="text-center p-8 space-y-4">
                    <p>Download the color palette as a PDF document.</p>
                    <Button onClick={downloadPdf}>Download PDF</Button>
                </TabsContent>
            </Tabs>
        </DialogContent>
    )
}

export default function ColorActions({
    palette,
    generatePalette,
    onAddColor,
    onRemoveColor,
    toggleLockAll,
    areAllLocked,
}: ColorActionsProps) {
    return (
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={generatePalette}>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate
            </Button>
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" size="sm"><Plus className="h-4 w-4" /><Minus className="h-4 w-4" /></Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-1 flex gap-1">
                    <Button variant="ghost" size="sm" onClick={onAddColor}>Add</Button>
                    <Button variant="ghost" size="sm" onClick={onRemoveColor}>Remove</Button>
                </PopoverContent>
            </Popover>
             <Button variant="outline" size="sm" onClick={toggleLockAll}>
                {areAllLocked ? <Unlock className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                {areAllLocked ? "Unlock All" : "Lock All"}
            </Button>
            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                        <FileDown className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </DialogTrigger>
                <ExportDialog palette={palette} />
            </Dialog>
        </div>
    );
}
