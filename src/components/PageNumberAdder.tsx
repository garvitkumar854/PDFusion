
"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud,
  Download,
  X,
  Check,
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

type Position = "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
type Font = "Helvetica" | "TimesRoman" | "Courier";
type FormatType = 'n' | 'n_of_N' | 'page_n' | 'page_n_of_N' | 'custom';
type PageMode = "single" | "facing";
type MarginSize = 'small' | 'recommended' | 'big';


type PagePreviewInfo = {
  pageNumber: number;
  dataUrl?: string;
  width?: number;
  height?: number;
  aspectRatio: number;
};

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

const MARGIN_MAP: Record<MarginSize, number> = {
    small: 24,
    recommended: 36,
    big: 72,
}

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16) / 255, g: parseInt(result[2], 16) / 255, b: parseInt(result[3], 16) / 255 }
    : { r: 0, g: 0, b: 0 };
};

const PageVisibilityContext = React.createContext<{ onVisible: (pageNumber: number) => void }>({ onVisible: () => {} });
const usePageVisibility = () => React.useContext(PageVisibilityContext);

const PagePreviewCard = React.memo(({ pageInfo, text, textOptions, className }: { pageInfo: PagePreviewInfo, text: string, textOptions: any, className?: string }) => {
    const ref = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const { onVisible } = usePageVisibility();

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                onVisible(pageInfo.pageNumber);
                if (containerRef.current) observer.unobserve(containerRef.current);
            }
        }, { rootMargin: "200px" });

        if (containerRef.current) observer.observe(containerRef.current);
        
        return () => {
            if (containerRef.current) observer.unobserve(containerRef.current);
        };
    }, [pageInfo.pageNumber, onVisible]);

    useEffect(() => {
        if (!ref.current || !pageInfo.dataUrl) return;

        const canvas = ref.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const img = new Image();
        img.onload = () => {
          canvas.width = pageInfo.width!;
          canvas.height = pageInfo.height!;
          ctx.drawImage(img, 0, 0);

          if (pageInfo.pageNumber >= textOptions.startPage && pageInfo.pageNumber <= textOptions.endPage) {
              const { font, isBold, isItalic, fontSize, textColor, isUnderline, margin, pageMode } = textOptions;
              let { position } = textOptions;
              
              if (pageMode === 'facing') {
                  const isLeftPage = (pageInfo.pageNumber - 1) % 2 === 0;
                  if (pageInfo.pageNumber > 0) { // All pages except first in facing mode
                    if (isLeftPage && position.includes('right')) {
                        position = position.replace('right', 'left');
                    } else if (!isLeftPage && position.includes('left')) {
                        position = position.replace('left', 'right');
                    }
                  }
              }

              ctx.font = `${isItalic ? 'italic' : ''} ${isBold ? 'bold' : ''} ${fontSize}px ${font}`;
              ctx.fillStyle = textColor;
              const textMetrics = ctx.measureText(text);
              const textHeight = fontSize;

              let x = 0, y = 0;
              const [vPos, hPos] = position.split('-');

              if (vPos === 'top') y = margin + textHeight;
              else y = canvas.height - margin;

              if (hPos === 'left') x = margin;
              else if (hPos === 'center') x = (canvas.width - textMetrics.width) / 2;
              else x = canvas.width - margin - textMetrics.width;

              ctx.fillText(text, x, y);
              
              if (isUnderline) {
                ctx.beginPath();
                ctx.moveTo(x, y + 2);
                ctx.lineTo(x + textMetrics.width, y + 2);
                ctx.strokeStyle = textColor;
                ctx.lineWidth = Math.max(1, fontSize / 15);
                ctx.stroke();
              }
          }
        };
        img.src = pageInfo.dataUrl;
    }, [pageInfo.dataUrl, text, textOptions, pageInfo.width, pageInfo.height]);

    return (
        <div ref={containerRef} className={cn("relative transition-all bg-background shadow-sm flex items-center justify-center", className)} style={{ aspectRatio: pageInfo.aspectRatio }}>
            <div className="relative w-full h-full">
            {pageInfo.dataUrl ? (
                <canvas ref={ref} className="w-full h-full object-contain rounded-md border" />
            ) : (
                 <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground text-xs p-2 text-center rounded-md border">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="mt-2">Page {pageInfo.pageNumber}</span>
                </div>
            )}
            </div>
        </div>
    );
});
PagePreviewCard.displayName = 'PagePreviewCard';


export function PageNumberAdder() {
  const [file, setFile] = useState<PDFFile | null>(null);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pagePreviews, setPagePreviews] = useState<PagePreviewInfo[]>([]);

  // Options
  const [position, setPosition] = useState<Position>("bottom-center");
  const [marginSize, setMarginSize] = useState<MarginSize>('recommended');
  const [fontSize, setFontSize] = useState<number | string>(12);
  const [font, setFont] = useState<Font>("Helvetica");
  const [textColor, setTextColor] = useState("#000000");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [pageMode, setPageMode] = useState<PageMode>("single");
  
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(1);
  const [formatType, setFormatType] = useState<FormatType>('n');
  const [customFormat, setCustomFormat] = useState("{p} / {n}");
  

  const operationId = useRef<number>(0);
  const { toast } = useToast();

  const renderPage = useCallback(async (pdfjsDoc: pdfjsLib.PDFDocumentProxy, pageNum: number, currentOperationId: number) => {
    if (operationId.current !== currentOperationId) return null;
    try {
      const page = await pdfjsDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better quality
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext('2d');
      if (context) {
          await page.render({ canvasContext: context, viewport }).promise;
           if (operationId.current !== currentOperationId) return null;
          const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
          return { dataUrl, width: viewport.width, height: viewport.height, aspectRatio: viewport.width / viewport.height };
      }
    } catch (e) {
      console.error(`Error rendering page ${pageNum}:`, e);
    }
    return null;
  }, []);
  
  const loadPdf = useCallback(async (fileToLoad: File) => {
    const currentOperationId = ++operationId.current;
    if (file?.pdfjsDoc) file.pdfjsDoc.destroy();
    setFile(null);
    setResult(null);
    setIsProcessing(true);
    setPagePreviews([]);
    
    try {
      const pdfBytes = await fileToLoad.arrayBuffer();
      const pdfjsDoc = await pdfjsLib.getDocument({ data: pdfBytes }).promise;

      if (operationId.current !== currentOperationId) {
        pdfjsDoc.destroy();
        return;
      }

      setFile({ id: `${fileToLoad.name}-${Date.now()}`, file: fileToLoad, pdfjsDoc, isEncrypted: false });
      setStartPage(1);
      setEndPage(pdfjsDoc.numPages);
      
      const previews: PagePreviewInfo[] = [];
      for(let i=1; i<=pdfjsDoc.numPages; i++) {
        const page = await pdfjsDoc.getPage(i);
        const viewport = page.getViewport({ scale: 1 });
        previews.push({ pageNumber: i, aspectRatio: viewport.width / viewport.height });
      }

      setPagePreviews(previews);
      toast({ variant: 'success', title: 'File Uploaded', description: `"${fileToLoad.name}" is ready.` });

    } catch (e: any) {
        if (operationId.current === currentOperationId) {
            if (e.name === 'PasswordException') {
                setFile({ id: `${fileToLoad.name}-${Date.now()}`, file: fileToLoad, isEncrypted: true, pdfjsDoc: null! });
            } else {
                console.error("Failed to load PDF", e);
                toast({ variant: "destructive", title: "Could not read PDF", description: "The file might be corrupted or an unsupported format." });
            }
        }
    } finally {
       if (operationId.current === currentOperationId) {
          setIsProcessing(false);
       }
    }
  }, [file, toast]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) loadPdf(acceptedFiles[0]);
    }, [loadPdf]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxSize: MAX_FILE_SIZE_BYTES,
    multiple: false,
    noClick: true,
    noKeyboard: true,
    disabled: isProcessing,
  });

  const onPageVisible = useCallback((pageNumber: number) => {
    if (!file || !file.pdfjsDoc) return;
    const currentOperationId = operationId.current;

    setPagePreviews(prev => {
        const pageIndex = prev.findIndex(p => p.pageNumber === pageNumber);
        if (pageIndex === -1 || prev[pageIndex].dataUrl) return prev;

        const newPreviews = [...prev];
        renderPage(file.pdfjsDoc!, pageNumber, currentOperationId).then(renderResult => {
            if (renderResult && operationId.current === currentOperationId) {
                setPagePreviews(current => {
                    const latestIndex = current.findIndex(p => p.pageNumber === pageNumber);
                    if (latestIndex > -1) {
                       const finalPreviews = [...current];
                       finalPreviews[latestIndex] = { ...finalPreviews[latestIndex], ...renderResult };
                       return finalPreviews;
                    }
                    return current;
                });
            }
        });
        return newPreviews;
    });
  }, [file, renderPage]);

  const removeFile = () => {
    if (file?.pdfjsDoc) file.pdfjsDoc.destroy();
    setFile(null);
    setResult(null);
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

  const handleProcess = async () => {
    const fileToProcess = file?.file;
    if (!fileToProcess || file.isEncrypted) return;

    const currentOperationId = ++operationId.current;
    setIsProcessing(true);
    setProgress(0);
    setResult(null);

    try {
      const pdfBytes = await fileToProcess.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      const totalPages = pdfDoc.getPageCount();
      
      const effectiveStart = Math.max(1, startPage);
      const effectiveEnd = Math.min(totalPages, endPage);

      if (effectiveStart > effectiveEnd) {
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

      for (let i = effectiveStart - 1; i < effectiveEnd; i++) {
        if (operationId.current !== currentOperationId) return;

        const page = pages[i];
        const { width, height } = page.getSize();
        const pageNum = i + 1;
        const text = getPageNumberText(pageNum, totalPages);
        const numFontSize = Number(fontSize);
        const textWidth = embeddedFont.widthOfTextAtSize(text, numFontSize);
        const textHeight = embeddedFont.heightAtSize(numFontSize);
        
        let x = 0, y = 0;
        let effectivePosition = position;
        
        if (pageMode === 'facing') {
            const isLeftPage = (pageNum -1) % 2 === 0; 
            if (pageNum > 0) {
              if (isLeftPage && position.includes('right')) {
                  effectivePosition = position.replace('right', 'left') as Position;
              } else if (!isLeftPage && position.includes('left')) {
                  effectivePosition = position.replace('left', 'right') as Position;
              }
            }
        }
        
        const [vPos, hPos] = effectivePosition.split('-');
        
        const margin = MARGIN_MAP[marginSize];

        if (vPos === 'top') y = height - margin - textHeight;
        else y = margin;
        
        let baselineOffset = textHeight * 0.25; 
        y += baselineOffset;

        if (hPos === 'left') x = margin;
        else if (hPos === 'center') x = width / 2 - textWidth / 2;
        else x = width - margin - textWidth;

        page.drawText(text, { x, y, size: numFontSize, font: embeddedFont, color: rgb(colorRgb.r, colorRgb.g, colorRgb.b) });

        if (isUnderline) {
          page.drawLine({
            start: { x: x, y: y - 2 },
            end: { x: x + textWidth, y: y - 2 },
            thickness: Math.max(0.5, numFontSize / 15),
            color: rgb(colorRgb.r, colorRgb.g, colorRgb.b),
          });
        }
        
        setProgress(Math.round(((i - effectiveStart + 2) / (effectiveEnd - effectiveStart + 1)) * 100));
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
      
      toast({ variant: "success", title: "Processing Complete!", description: "Page numbers have been added." });

    } catch (error: any) {
      if (operationId.current === currentOperationId) {
        toast({ variant: "destructive", title: "Processing Failed", description: error.message });
      }
    } finally {
        if (operationId.current === currentOperationId) setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    operationId.current++;
    setIsProcessing(false);
    setProgress(0);
    toast({ variant: "info", title: "Processing cancelled." });
  };
  
  const handleProcessAgain = () => {
    if (result) URL.revokeObjectURL(result.url);
    removeFile();
  };
  
  const handleDownload = () => {
    if (!result) return;
    const link = document.createElement("a");
    link.href = result.url;
    link.download = result.filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => { document.body.removeChild(link) }, 100);
  };

  const textOptions = { startPage, endPage, font, isBold, isItalic, fontSize: Number(fontSize), textColor, isUnderline, position, margin: MARGIN_MAP[marginSize], pageMode };
  const totalPages = file?.pdfjsDoc?.numPages || 0;

  if (result) {
    return (
      <div className="text-center flex flex-col items-center justify-center py-12 animate-in fade-in duration-500 bg-transparent p-4 sm:p-8 rounded-xl">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-500 rounded-full flex items-center justify-center mb-6">
            <Check className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">PDF Updated Successfully!</h2>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4">
            <Button size="lg" onClick={handleDownload} className="w-full sm:w-auto text-base font-bold bg-green-600 hover:bg-green-700 text-white">
              <Download className="mr-2 h-5 w-5" /> Download PDF
            </Button>
            <Button size="lg" variant="outline" onClick={handleProcessAgain}>Add Numbers to Another PDF</Button>
        </div>
      </div>
    );
  }

  const positions: Position[] = ["top-left", "top-center", "top-right", "bottom-left", "bottom-center", "bottom-right"];

  return (
    <div className="space-y-6">
      {!file && (
        <Card className="bg-transparent shadow-lg">
          <CardHeader><CardTitle className="text-xl sm:text-2xl">Upload PDF</CardTitle><CardDescription>Select a PDF file to add page numbers to.</CardDescription></CardHeader>
          <CardContent>
            <div {...getRootProps()} className={cn("flex flex-col items-center justify-center p-6 sm:p-10 rounded-lg border-2 border-dashed transition-colors duration-300", !isProcessing && "hover:border-primary/50", isDragActive && "border-primary bg-primary/10", isProcessing && "opacity-70 pointer-events-none")}>
              <input {...getInputProps()} />
              <UploadCloud className="w-10 h-10 text-muted-foreground sm:w-12 sm:h-12" />
              <p className="mt-2 text-base font-semibold text-foreground sm:text-lg">Drop a PDF file here</p>
              <p className="text-xs text-muted-foreground sm:text-sm">or click the button below</p>
              <motion.div whileHover={{ scale: 1.05, y: -2 }} transition={{ type: 'spring', stiffness: 400, damping: 10 }}>
                  <Button type="button" onClick={open} className="mt-4" disabled={isProcessing}><FolderOpen className="mr-2 h-4 w-4" />Choose File</Button>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      )}

      {file && (
        <>
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 order-2 lg:order-1">
                    <Card className="bg-transparent shadow-lg h-full">
                        <CardHeader><CardTitle className="text-xl">Preview</CardTitle></CardHeader>
                        <CardContent className="h-full">
                          <PageVisibilityContext.Provider value={{ onVisible: onPageVisible }}>
                            <div className="overflow-y-auto lg:h-[calc(100vh-22rem)] pr-2">
                                <div className={cn("grid gap-4", pageMode === 'single' ? "grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5" : "grid-cols-1 md:grid-cols-2")}>
                                {pagePreviews.map((p, i) => {
                                    if (pageMode === 'facing') {
                                        if ((i-1) % 2 !== 0) return null; // We render pairs starting from even indices (0, 2, 4...)
                                        
                                        const firstPageInPair = pagePreviews[i];
                                        const secondPageInPair = pagePreviews[i+1];
                                        
                                        return (
                                            <div key={p.pageNumber} className="grid grid-cols-2 gap-1 md:col-span-2">
                                                {firstPageInPair && <PagePreviewCard pageInfo={firstPageInPair} text={getPageNumberText(firstPageInPair.pageNumber, totalPages)} textOptions={textOptions} />}
                                                {secondPageInPair ? (
                                                    <PagePreviewCard pageInfo={secondPageInPair} text={getPageNumberText(secondPageInPair.pageNumber, totalPages)} textOptions={textOptions} />
                                                ) : <div />}
                                            </div>
                                        );
                                    } else {
                                        return (
                                            <PagePreviewCard key={p.pageNumber} pageInfo={p} text={getPageNumberText(p.pageNumber, totalPages)} textOptions={textOptions} className="w-full"/>
                                        );
                                    }
                                })}
                                </div>
                            </div>
                          </PageVisibilityContext.Provider>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1 order-1 lg:order-2 space-y-6 lg:sticky lg:top-24">
                    <Card className="bg-transparent shadow-lg">
                        <CardHeader><CardTitle className="text-xl">Numbering Options</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                        <div className={cn((isProcessing || file.isEncrypted) && "opacity-70 pointer-events-none")}>
                            <div>
                                <Label className="font-semibold">Page mode</Label>
                                <RadioGroup value={pageMode} onValueChange={v => setPageMode(v as PageMode)} className="mt-2 grid grid-cols-2 gap-2" disabled={isProcessing || file.isEncrypted}>
                                    <Label htmlFor="pm-s" className={cn("flex items-center justify-center space-x-2 border rounded-md p-2 cursor-pointer", pageMode === 'single' && 'border-primary')}>
                                      <RadioGroupItem value="single" id="pm-s" /><span>Single page</span>
                                    </Label>
                                    <Label htmlFor="pm-f" className={cn("flex items-center justify-center space-x-2 border rounded-md p-2 cursor-pointer", pageMode === 'facing' && 'border-primary')}>
                                      <RadioGroupItem value="facing" id="pm-f" /><span>Facing pages</span>
                                    </Label>
                                </RadioGroup>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="font-semibold">Position</Label>
                                    <div className="mt-2 grid grid-cols-3 grid-rows-2 gap-1 h-16 p-1 rounded-lg bg-muted">
                                        {positions.map(p => ( <button key={p} onClick={() => setPosition(p)} disabled={isProcessing || file.isEncrypted} className={cn("rounded-md transition-colors", position === p ? "bg-primary" : "hover:bg-muted-foreground/20")}></button> ))}
                                    </div>
                                </div>
                                <div>
                                    <Label className="font-semibold">Format</Label>
                                    <Select value={formatType} onValueChange={(v) => setFormatType(v as FormatType)} disabled={isProcessing || file.isEncrypted}>
                                        <SelectTrigger className="mt-2">
                                            <SelectValue placeholder="Select format" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="n">1</SelectItem>
                                            <SelectItem value="page_n">Page 1</SelectItem>
                                            <SelectItem value="n_of_N">1 / {totalPages || 'N'}</SelectItem>
                                            <SelectItem value="page_n_of_N">Page 1 of {totalPages || 'N'}</SelectItem>
                                            <SelectItem value="custom">Custom</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            
                            {formatType === 'custom' && (
                                <Input type="text" value={customFormat} onChange={e => setCustomFormat(e.target.value)} className="mt-2" disabled={isProcessing || file.isEncrypted} placeholder="{p} of {n}"/>
                            )}
                             <div>
                                <Label className="font-semibold">Pages</Label>
                                <div className="grid grid-cols-2 gap-2 mt-1">
                                    <Input placeholder="Start" type="number" value={startPage} min="1" max={totalPages || 1} onChange={e => setStartPage(Math.max(1, parseInt(e.target.value)) || 1)} disabled={isProcessing || file.isEncrypted}/>
                                    <Input placeholder="End" type="number" value={endPage} min={startPage} max={totalPages || 1} onChange={e => setEndPage(Math.max(startPage, parseInt(e.target.value)) || startPage)} disabled={isProcessing || file.isEncrypted}/>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                 <div>
                                    <Label htmlFor="margin" className="font-semibold">Margin</Label>
                                    <Select value={marginSize} onValueChange={v => setMarginSize(v as MarginSize)} disabled={isProcessing || file.isEncrypted}>
                                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="small">Small</SelectItem>
                                            <SelectItem value="recommended">Recommended</SelectItem>
                                            <SelectItem value="big">Big</SelectItem>
                                        </SelectContent>
                                    </Select>
                                 </div>
                                <div>
                                    <Label htmlFor="font-size" className="font-semibold">Font Size</Label>
                                    <Input id="font-size" type="number" value={fontSize} onChange={e => setFontSize(e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value)))} className="mt-1" disabled={isProcessing || file.isEncrypted}/>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><Label htmlFor="font" className="font-semibold">Font</Label><Select value={font} onValueChange={v => setFont(v as Font)} disabled={isProcessing || file.isEncrypted}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Helvetica">Helvetica</SelectItem><SelectItem value="TimesRoman">Times New Roman</SelectItem><SelectItem value="Courier">Courier</SelectItem></SelectContent></Select></div>
                                <div><Label className="font-semibold">Style</Label><div className="mt-1 flex items-center gap-2"><Button variant={isBold ? "secondary" : "outline"} size="icon" onClick={() => setIsBold(!isBold)} disabled={isProcessing || file.isEncrypted}><Bold className="w-4 h-4" /></Button><Button variant={isItalic ? "secondary" : "outline"} size="icon" onClick={() => setIsItalic(!isItalic)} disabled={isProcessing || file.isEncrypted}><Italic className="w-4 h-4" /></Button><Button variant={isUnderline ? "secondary" : "outline"} size="icon" onClick={() => setIsUnderline(!isUnderline)} disabled={isProcessing || file.isEncrypted}><Underline className="w-4 h-4" /></Button></div></div>
                            </div>
                             <div>
                                <Label htmlFor="textColor" className="font-semibold">Text Color</Label>
                                <div className="relative mt-1"><Input id="textColor" type="text" value={textColor} onChange={e => setTextColor(e.target.value)} className="w-full pr-12" disabled={isProcessing || file.isEncrypted}/><Input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-10 p-1 cursor-pointer" disabled={isProcessing || file.isEncrypted} /></div>
                            </div>
                        </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-transparent shadow-lg">
                        <CardContent className="p-6">
                            <AnimatePresence mode="wait">
                                {isProcessing ? (
                                    <motion.div key="progress" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.2 }} className="space-y-4">
                                        <div className="p-4 border rounded-lg bg-primary/5 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2"><Loader2 className="w-5 h-5 text-primary animate-spin" /><p className="text-sm font-medium text-primary">Adding page numbers...</p></div>
                                                <p className="text-sm font-medium text-primary">{Math.round(progress)}%</p>
                                            </div>
                                            <Progress value={progress} className="h-2" />
                                        </div>
                                        <Button size="sm" variant="destructive" onClick={handleCancel} className="w-full"><Ban className="mr-2 h-4 w-4" />Cancel</Button>
                                    </motion.div>
                                ) : (
                                    <motion.div key="button" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.2 }}>
                                        <Button size="lg" className="w-full text-base font-bold" onClick={handleProcess} disabled={!file || isProcessing || file.isEncrypted}><Hash className="mr-2 h-5 w-5" />Add Page Numbers</Button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
      )}
    </div>
  );
}
