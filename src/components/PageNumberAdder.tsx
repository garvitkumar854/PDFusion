
"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud,
  Download,
  X,
  CheckCircle,
  FolderOpen,
  Loader2,
  Ban,
  Hash,
  Bold,
  Italic,
  Underline,
  Lock,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { Progress } from "./ui/progress";
import { motion, AnimatePresence } from "framer-motion";

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

const MAX_FILE_SIZE_MB = 100;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

type PDFFile = {
  id: string;
  file: File;
  pdfjsDoc: pdfjsLib.PDFDocumentProxy;
  isEncrypted: boolean;
};

type ProcessResult = {
  url: string;
  filename: string;
};

type Position = "top-left" | "top-center" | "top-right" | "middle-left" | "middle-center" | "middle-right" | "bottom-left" | "bottom-center" | "bottom-right";
type Font = "Helvetica" | "TimesRoman" | "Courier";
type FormatType = 'n' | 'n_of_N' | 'page_n' | 'page_n_of_N' | 'custom';

const FONT_MAP: Record<Font, StandardFonts> = {
  Helvetica: StandardFonts.Helvetica,
  TimesRoman: StandardFonts.TimesRoman,
  Courier: StandardFonts.Courier,
};

const FONT_STYLE_MAP: Record<Font, { bold: StandardFonts, italic: StandardFonts, boldItalic: StandardFonts }> = {
    Helvetica: { bold: StandardFonts.HelveticaBold, italic: StandardFonts.HelveticaOblique, boldItalic: StandardFonts.HelveticaBoldOblique },
    TimesRoman: { bold: StandardFonts.TimesRomanBold, italic: StandardFonts.TimesRomanItalic, boldItalic: StandardFonts.TimesRomanBoldItalic },
    Courier: { bold: StandardFonts.CourierBold, italic: StandardFonts.CourierOblique, boldItalic: StandardFonts.CourierBoldOblique },
}

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : { r: 0, g: 0, b: 0 };
};

export function PageNumberAdder() {
  const [file, setFile] = useState<PDFFile | null>(null);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  // Options
  const [position, setPosition] = useState<Position>("bottom-center");
  const [margin, setMargin] = useState(36);
  const [fontSize, setFontSize] = useState(12);
  const [font, setFont] = useState<Font>("Helvetica");
  const [textColor, setTextColor] = useState("#000000");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(1);
  const [formatType, setFormatType] = useState<FormatType>('n');
  const [customFormat, setCustomFormat] = useState("{p} / {n}");
  
  const [firstPagePreviewUrl, setFirstPagePreviewUrl] = useState<string | null>(null);

  const operationId = useRef<number>(0);
  const { toast } = useToast();
  
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const loadPdf = useCallback(async (fileToLoad: File) => {
    const currentOperationId = ++operationId.current;
    setIsProcessing(true);
    setFirstPagePreviewUrl(null);
    setFile(null);
    
    let isEncrypted = false;
    let pdfjsDoc: pdfjsLib.PDFDocumentProxy | null = null;
    
    try {
      const pdfBytes = await fileToLoad.arrayBuffer();
      try {
        pdfjsDoc = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
      } catch (e: any) {
        if (e.name === 'PasswordException') {
          isEncrypted = true;
        } else {
          throw e; // Re-throw other errors
        }
      }
      
      if (operationId.current !== currentOperationId) {
        pdfjsDoc?.destroy();
        return;
      }

      setFile({ id: `${fileToLoad.name}-${Date.now()}`, file: fileToLoad, pdfjsDoc: pdfjsDoc!, isEncrypted });
      setResult(null);
      
      if (isEncrypted) {
        return;
      }

      setStartPage(1);
      setEndPage(pdfjsDoc!.numPages);

      // Render first page for preview
      const page = await pdfjsDoc!.getPage(1);
      const viewport = page.getViewport({ scale: 1 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext('2d');
      if (context) {
          await page.render({ canvasContext: context, viewport }).promise;
           if (operationId.current !== currentOperationId) return;
          setFirstPagePreviewUrl(canvas.toDataURL());
      }
    } catch (e: any) {
        if (operationId.current === currentOperationId) {
            console.error("Failed to load PDF", e);
            toast({ variant: "destructive", title: "Could not read PDF", description: "The file might be corrupted or an unsupported format." });
        }
    } finally {
       if (operationId.current === currentOperationId) {
          setIsProcessing(false);
       }
    }
  }, [toast]);


  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
      if (rejectedFiles.length > 0) {
        toast({ variant: "destructive", title: "Invalid file", description: "The file was not a PDF or exceeded size limits." });
        return;
      }
      const singleFile = acceptedFiles[0];
      if (singleFile) {
        loadPdf(singleFile);
      }
    }, [loadPdf, toast]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxSize: MAX_FILE_SIZE_BYTES,
    multiple: false,
    noClick: true,
    noKeyboard: true,
    disabled: isProcessing,
  });

  const removeFile = () => {
    if (file?.pdfjsDoc) {
      file.pdfjsDoc.destroy();
    }
    setFile(null);
    setFirstPagePreviewUrl(null);
  };

  const getPageNumberText = (page: number, total: number) => {
    const format = formatType === 'custom' ? customFormat : formatType;
    switch (format) {
        case 'n': return `${page}`;
        case 'page_n': return `Page ${page}`;
        case 'n_of_N': return `${page} / ${total}`;
        case 'page_n_of_N': return `Page ${page} of ${total}`;
        default: return customFormat.replace(/\{p\}/g, String(page)).replace(/\{n\}/g, String(total));
    }
  }
  
  const drawPreview = useCallback(() => {
    if (!previewCanvasRef.current || !firstPagePreviewUrl || !file || file.isEncrypted) return;

    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Now draw text
      const totalPages = file.pdfjsDoc?.numPages || 0;
      const pageNum = getPageNumberText(startPage, totalPages);
      ctx.font = `${isItalic ? 'italic' : ''} ${isBold ? 'bold' : ''} ${fontSize}px ${font}`;
      ctx.fillStyle = textColor;
      const textMetrics = ctx.measureText(pageNum);

      let x = 0, y = 0;
      const [vPos, hPos] = position.split('-');

      if (vPos === 'top') y = margin;
      else if (vPos === 'middle') y = canvas.height / 2 + textMetrics.actualBoundingBoxAscent / 2;
      else y = canvas.height - margin;

      if (hPos === 'left') x = margin;
      else if (hPos === 'center') x = canvas.width / 2 - textMetrics.width / 2;
      else x = canvas.width - margin - textMetrics.width;

      ctx.fillText(pageNum, x, y);
      
      if (isUnderline) {
        ctx.beginPath();
        ctx.moveTo(x, y + 2);
        ctx.lineTo(x + textMetrics.width, y + 2);
        ctx.strokeStyle = textColor;
        ctx.lineWidth = Math.max(1, fontSize / 12);
        ctx.stroke();
      }
    };
    img.src = firstPagePreviewUrl;

  }, [firstPagePreviewUrl, position, margin, fontSize, font, isBold, isItalic, isUnderline, startPage, formatType, customFormat, file, textColor]);

  useEffect(() => {
    drawPreview();
  }, [drawPreview]);

  const handleProcess = async () => {
    const fileToProcess = file?.file;
    if (!fileToProcess || file.isEncrypted) {
      return;
    }

    const currentOperationId = ++operationId.current;
    setIsProcessing(true);
    setProgress(0);
    setResult(null);

    try {
      const pdfBytes = await fileToProcess.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      const totalPages = pdfDoc.getPageCount();
      
      const effectiveStart = Math.max(0, startPage - 1);
      const effectiveEnd = Math.min(totalPages, endPage);

      if (effectiveStart >= effectiveEnd) {
          toast({ variant: "destructive", title: "Invalid Range", description: "Start page must be before or the same as the end page." });
          setIsProcessing(false);
          return;
      }

      let selectedFont = FONT_MAP[font];
      if (isBold && isItalic) selectedFont = FONT_STYLE_MAP[font].boldItalic;
      else if (isBold) selectedFont = FONT_STYLE_MAP[font].bold;
      else if (isItalic) selectedFont = FONT_STYLE_MAP[font].italic;

      const embeddedFont = await pdfDoc.embedFont(selectedFont, { subset: true });
      const colorRgb = hexToRgb(textColor);
      
      const pages = pdfDoc.getPages();

      for (let i = effectiveStart; i < effectiveEnd; i++) {
        if (operationId.current !== currentOperationId) return;

        const page = pages[i];
        const { width, height } = page.getSize();
        const text = getPageNumberText(i + 1, totalPages);
        const textWidth = embeddedFont.widthOfTextAtSize(text, fontSize);
        const textHeight = embeddedFont.heightAtSize(fontSize);
        
        let x = 0, y = 0;
        const [vPos, hPos] = position.split('-');
        
        if (vPos === 'top') y = height - margin;
        else if (vPos === 'middle') y = height / 2;
        else y = margin;
        
        let baselineOffset = textHeight * 0.25; // A small adjustment for better visual alignment
        y -= baselineOffset;

        if (hPos === 'left') x = margin;
        else if (hPos === 'center') x = width / 2 - textWidth / 2;
        else x = width - margin - textWidth;

        page.drawText(text, { x, y, size: fontSize, font: embeddedFont, color: rgb(colorRgb.r, colorRgb.g, colorRgb.b) });

        if (isUnderline) {
          page.drawLine({
            start: { x: x, y: y - 2 },
            end: { x: x + textWidth, y: y - 2 },
            thickness: Math.max(0.5, fontSize / 15),
            color: rgb(colorRgb.r, colorRgb.g, colorRgb.b),
          });
        }
        
        setProgress(Math.round(((i - effectiveStart + 1) / (effectiveEnd - effectiveStart)) * 100));
      }

      if (operationId.current !== currentOperationId) return;

      const newPdfBytes = await pdfDoc.save();
      const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      if (operationId.current !== currentOperationId) {
        URL.revokeObjectURL(url);
        return;
      }
      
      const originalName = file.file.name.replace(/\.pdf$/i, '');
      setResult({ url, filename: `${originalName}_numbered.pdf` });
      
      toast({
        title: "Processing Complete!",
        description: "Page numbers have been added to your PDF.",
        action: <div className="p-1 rounded-full bg-green-500"><CheckCircle className="w-5 h-5 text-white" /></div>
      });

    } catch (error: any) {
      if (operationId.current === currentOperationId) {
        console.error("Processing failed:", error);
        toast({ variant: "destructive", title: "Processing Failed", description: error.message || "An unexpected error occurred." });
      }
    } finally {
        if (operationId.current === currentOperationId) {
           setIsProcessing(false);
        }
    }
  };

  const handleCancel = () => {
    operationId.current++;
    setIsProcessing(false);
    setProgress(0);
    toast({ title: "Processing cancelled." });
  };
  
  const handleProcessAgain = () => {
    if (result) { URL.revokeObjectURL(result.url); }
    setFile(null);
    setResult(null);
    setFirstPagePreviewUrl(null);
  };
  
  const handleDownload = () => {
    if (!result) return;
    const link = document.createElement("a");
    link.href = result.url;
    link.download = result.filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
        document.body.removeChild(link);
    }, 100);
  };

  if (result) {
    return (
      <div className="text-center flex flex-col items-center justify-center py-12 animate-in fade-in duration-500 bg-transparent p-4 sm:p-8 rounded-xl">
        <CheckCircle className="w-16 h-16 sm:w-20 sm:h-20 text-green-500 mb-6" />
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">PDF Updated Successfully!</h2>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4">
            <Button size="lg" onClick={handleDownload} className="w-full sm:w-auto text-base font-bold bg-green-600 hover:bg-green-700 text-white">
              <Download className="mr-2 h-5 w-5" /> Download PDF
            </Button>
          <Button size="lg" variant="outline" onClick={handleProcessAgain} className="w-full sm:w-auto text-base">
            Add Numbers to Another PDF
          </Button>
        </div>
      </div>
    );
  }

  const positions: Position[] = ["top-left", "top-center", "top-right", "middle-left", "middle-center", "middle-right", "bottom-left", "bottom-center", "bottom-right"];

  return (
    <div className="space-y-6">
      {!file && (
        <Card className="bg-transparent shadow-lg">
            <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Upload PDF</CardTitle>
            <CardDescription>Select a PDF file to add page numbers to.</CardDescription>
            </CardHeader>
            <CardContent>
            <div
                {...getRootProps()}
                className={cn(
                "flex flex-col items-center justify-center p-6 sm:p-10 rounded-lg border-2 border-dashed transition-colors duration-300",
                !isProcessing && "hover:border-primary/50",
                isDragActive && "border-primary bg-primary/10",
                isProcessing && "opacity-70 pointer-events-none"
                )}
            >
                <input {...getInputProps()} />
                <UploadCloud className="w-10 h-10 text-muted-foreground sm:w-12 sm:h-12" />
                <p className="mt-2 text-base font-semibold text-foreground sm:text-lg">Drop a PDF file here</p>
                <p className="text-xs text-muted-foreground sm:text-sm">or click the button below</p>
                <motion.div whileHover={{ scale: 1.05, y: -2 }} transition={{ type: 'spring', stiffness: 400, damping: 10 }}>
                    <Button type="button" onClick={open} className="mt-4" disabled={isProcessing}>
                        <FolderOpen className="mr-2 h-4 w-4" />Choose File
                    </Button>
                </motion.div>
                <p className="w-full px-2 text-center text-xs text-muted-foreground mt-6">Max file size: {MAX_FILE_SIZE_MB}MB</p>
            </div>
            </CardContent>
        </Card>
      )}

      {file && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <div className="space-y-6">
                <Card className="bg-transparent shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-xl">Uploaded File</CardTitle>
                            <CardDescription className="truncate max-w-[200px] sm:max-w-xs" title={file.file.name}>{file.file.name}</CardDescription>
                        </div>
                        <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground/70 hover:bg-destructive/10 hover:text-destructive shrink-0" onClick={removeFile} disabled={isProcessing}>
                            <X className="w-4 h-4" />
                        </Button>
                    </CardHeader>
                    {file.isEncrypted && (
                        <CardContent className="pt-0">
                             <div className="flex items-center gap-3 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3 text-sm text-yellow-700 dark:text-yellow-400">
                                <ShieldAlert className="h-5 w-5 shrink-0" />
                                <div>This PDF is password-protected and cannot be processed. Please upload an unlocked file.</div>
                            </div>
                        </CardContent>
                    )}
                </Card>
                <Card className="bg-transparent shadow-lg">
                    <CardHeader><CardTitle className="text-xl">Numbering Options</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                       <div className={cn((isProcessing || file.isEncrypted) && "opacity-70 pointer-events-none")}>
                            <div>
                                <Label className="font-semibold">Position</Label>
                                <div className="mt-2 grid grid-cols-3 grid-rows-3 gap-1 w-24 h-24 p-1 rounded-lg bg-muted">
                                    {positions.map(p => (
                                    <button key={p} onClick={() => setPosition(p)} disabled={isProcessing || file.isEncrypted} className={cn("rounded-md transition-colors", position === p ? "bg-primary" : "hover:bg-muted-foreground/20")}></button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <Label className="font-semibold">Format</Label>
                                <RadioGroup value={formatType} onValueChange={(v) => setFormatType(v as FormatType)} className="mt-2 space-y-2" disabled={isProcessing || file.isEncrypted}>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="n" id="f-n" /><Label htmlFor="f-n">Only page number (1)</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="page_n" id="f-pn" /><Label htmlFor="f-pn">Page n (Page 1)</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="n_of_N" id="f-nn" /><Label htmlFor="f-nn">n / N (1 / {file.pdfjsDoc?.numPages || 'N'})</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="page_n_of_N" id="f-pnn" /><Label htmlFor="f-pnn">Page n of N (Page 1 of {file.pdfjsDoc?.numPages || 'N'})</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="custom" id="f-c" /><Label htmlFor="f-c">Custom</Label></div>
                                </RadioGroup>
                                {formatType === 'custom' && (
                                    <Input type="text" value={customFormat} onChange={e => setCustomFormat(e.target.value)} className="mt-2" disabled={isProcessing || file.isEncrypted} placeholder="e.g. {p} of {n}"/>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label className="font-semibold">Page Range</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input id="startPage" type="number" value={startPage} min="1" max={file.pdfjsDoc?.numPages || 1} onChange={e => setStartPage(Math.max(1, parseInt(e.target.value)) || 1)} className="mt-1" disabled={isProcessing || file.isEncrypted}/>
                                    <Input id="endPage" type="number" value={endPage} min={startPage} max={file.pdfjsDoc?.numPages || 1} onChange={e => setEndPage(Math.max(startPage, parseInt(e.target.value)) || startPage)} className="mt-1" disabled={isProcessing || file.isEncrypted}/>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                 <div>
                                    <Label htmlFor="margin" className="font-semibold">Margin (points)</Label>
                                    <Input id="margin" type="number" value={margin} onChange={e => setMargin(Number(e.target.value))} className="mt-1" disabled={isProcessing || file.isEncrypted}/>
                                </div>
                                <div>
                                    <Label htmlFor="font-size" className="font-semibold">Font Size (points)</Label>
                                    <Input id="font-size" type="number" value={fontSize} onChange={e => setFontSize(Number(e.target.value))} className="mt-1" disabled={isProcessing || file.isEncrypted}/>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="font" className="font-semibold">Font</Label>
                                    <Select value={font} onValueChange={v => setFont(v as Font)} disabled={isProcessing || file.isEncrypted}>
                                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Helvetica">Helvetica</SelectItem>
                                            <SelectItem value="TimesRoman">Times New Roman</SelectItem>
                                            <SelectItem value="Courier">Courier</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="font-semibold">Style</Label>
                                    <div className="mt-1 flex items-center gap-2">
                                        <Button variant={isBold ? "secondary" : "outline"} size="icon" onClick={() => setIsBold(!isBold)} disabled={isProcessing || file.isEncrypted}><Bold className="w-4 h-4" /></Button>
                                        <Button variant={isItalic ? "secondary" : "outline"} size="icon" onClick={() => setIsItalic(!isItalic)} disabled={isProcessing || file.isEncrypted}><Italic className="w-4 h-4" /></Button>
                                        <Button variant={isUnderline ? "secondary" : "outline"} size="icon" onClick={() => setIsUnderline(!isUnderline)} disabled={isProcessing || file.isEncrypted}><Underline className="w-4 h-4" /></Button>
                                    </div>
                                </div>
                            </div>
                             <div>
                                <Label htmlFor="textColor" className="font-semibold">Text Color</Label>
                                <div className="relative mt-1">
                                    <Input id="textColor" type="text" value={textColor} onChange={e => setTextColor(e.target.value)} className="w-full pr-12" disabled={isProcessing || file.isEncrypted}/>
                                    <Input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-10 p-1 cursor-pointer" disabled={isProcessing || file.isEncrypted} />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="space-y-6 sticky top-24">
                 <Card className="bg-transparent shadow-lg">
                    <CardHeader><CardTitle className="text-xl">Live Preview</CardTitle></CardHeader>
                    <CardContent className="flex items-center justify-center p-4 bg-muted/50 rounded-b-lg">
                        {isProcessing ? (
                             <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                <p className="mt-2">Loading preview...</p>
                            </div>
                        ) : firstPagePreviewUrl && !file.isEncrypted ? (
                            <canvas ref={previewCanvasRef} className="max-w-full h-auto max-h-[500px] lg:max-h-[600px] object-contain shadow-md border rounded-md" />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-96 text-muted-foreground p-4 text-center">
                                {file.isEncrypted ? (
                                    <>
                                        <Lock className="w-12 h-12 text-muted-foreground mb-4" />
                                        <h3 className="font-semibold text-lg">Encrypted File</h3>
                                        <p className="text-muted-foreground">Preview is unavailable for locked files.</p>
                                    </>
                                ) : (
                                    <p>Could not load preview.</p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
                 <Card className="bg-transparent shadow-lg">
                    <CardContent className="p-6 h-[104px] flex flex-col justify-center">
                         <AnimatePresence mode="wait">
                            {isProcessing ? (
                                <motion.div
                                    key="progress"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-4"
                                >
                                    <div className="p-4 border rounded-lg bg-primary/5 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                                                <p className="text-sm font-medium text-primary">Adding page numbers...</p>
                                            </div>
                                            <p className="text-sm font-medium text-primary">{Math.round(progress)}%</p>
                                        </div>
                                        <Progress value={progress} className="h-2" />
                                    </div>
                                    <Button size="sm" variant="destructive" onClick={handleCancel} className="w-full">
                                        <Ban className="mr-2 h-4 w-4" />Cancel
                                    </Button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="button"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    transition={{ duration: 0.2 }}
                                >
                                <Button size="lg" className="w-full text-base font-bold" onClick={handleProcess} disabled={!file || isProcessing || file.isEncrypted}><Hash className="mr-2 h-5 w-5" />Add Page Numbers</Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </CardContent>
                </Card>
            </div>
        </div>
      )}
    </div>
  );
}
