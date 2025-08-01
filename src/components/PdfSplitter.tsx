
"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud,
  File as FileIcon,
  Download,
  X,
  CheckCircle,
  Scissors,
  FolderOpen,
  Loader2,
  AlertTriangle,
  Minus,
  Ban,
  Lock,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import JSZip from "jszip";
import { motion, AnimatePresence } from 'framer-motion';


// Set worker path for pdf.js
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

const MAX_FILE_SIZE_MB = 100;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

type PDFFile = {
  id: string;
  file: File;
  totalPages: number;
  pdfjsDoc: pdfjsLib.PDFDocumentProxy | null;
  isEncrypted: boolean;
};

type SplitResult = {
  filename: string;
  url: string;
};

type PagePreview = {
  pageNumber: number;
  dataUrl: string | null;
  isVisible: boolean;
};

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const PageVisibilityContext = React.createContext<{ onVisible: (pageNumber: number) => void }>({ onVisible: () => {} });
const usePageVisibility = () => React.useContext(PageVisibilityContext);

const PagePreviewCard = React.memo(({ pageNumber, dataUrl, isSelected, onToggle, showCheckbox, className, disabled }: { pageNumber: number, dataUrl: string | null, isSelected?: boolean, onToggle?: (page: number) => void, showCheckbox: boolean, className?: string, disabled?: boolean }) => {
    const ref = useRef<HTMLDivElement>(null);
    const { onVisible } = usePageVisibility();

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !dataUrl) {
                onVisible(pageNumber);
                 if (ref.current) {
                   observer.unobserve(ref.current);
                }
            }
        }, { threshold: 0.1 });

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) {
                observer.unobserve(ref.current);
            }
        };
    }, [pageNumber, onVisible, dataUrl]);
    
    return (
        <div 
            ref={ref}
            key={pageNumber}
            onClick={!disabled && onToggle ? () => onToggle(pageNumber) : undefined}
            className={cn(
                "relative rounded-md overflow-hidden border-2 transition-all aspect-[7/10] bg-muted",
                !disabled && onToggle && "cursor-pointer",
                isSelected ? "border-primary shadow-lg" : "border-transparent",
                !disabled && onToggle && !isSelected && "hover:border-primary/50",
                disabled && "cursor-not-allowed",
                className
            )}
        >
            {dataUrl ? (
            <img src={dataUrl} alt={`Page ${pageNumber}`} className="w-full h-full object-contain"/>
            ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs p-2 text-center">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span>Page {pageNumber}</span>
                </div>
            </div>
            )}
            {showCheckbox && onToggle && (
                <div className="absolute top-1 right-1">
                    <Checkbox checked={isSelected} className="bg-white/80" readOnly disabled={disabled} />
                </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-0.5 font-medium">
                {pageNumber}
            </div>
        </div>
    )
});
PagePreviewCard.displayName = 'PagePreviewCard';


export function PdfSplitter() {
  const [file, setFile] = useState<PDFFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSplitting, setIsSplitting] = useState(false);
  const [splitResults, setSplitResults] = useState<SplitResult[]>([]);
  const [pagePreviews, setPagePreviews] = useState<PagePreview[]>([]);

  const [splitMode, setSplitMode] = useState<"range" | "extract">("range");
  const [rangeMode, setRangeMode] = useState<"custom" | "fixed">("custom");
  const [extractMode, setExtractMode] = useState<"all" | "select">("select");

  const [customRanges, setCustomRanges] = useState("");
  const [fixedRangeSize, setFixedRangeSize] = useState(1);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());

  const [splitError, setSplitError] = useState<string | null>(null);
  

  const { toast } = useToast();
  
  const operationId = useRef<number>(0);

  const renderPdfPage = useCallback(async (pdfjsDoc: pdfjsLib.PDFDocumentProxy, pageNum: number, currentOperationId: number): Promise<string | null> => {
    if (operationId.current !== currentOperationId) return null;
    try {
        const page = await pdfjsDoc.getPage(pageNum);
        if (operationId.current !== currentOperationId) return null;

        const viewport = page.getViewport({ scale: 0.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };
            await page.render(renderContext).promise;
             if (operationId.current !== currentOperationId) return null;
            return canvas.toDataURL('image/jpeg', 0.8);
        }
    } catch (e) {
        if (operationId.current === currentOperationId) {
          console.error(`Error rendering page ${pageNum}:`, e);
        }
    }
    return null;
  }, []);
  
  const initFile = useCallback(async (fileToLoad: File) => {
    const currentOperationId = ++operationId.current;
    setIsProcessing(true);
    setPagePreviews([]);
    
    try {
        const pdfBytes = await fileToLoad.arrayBuffer();
        const pdfjsDoc = await pdfjsLib.getDocument({ data: new Uint8Array(pdfBytes) }).promise;
        const totalPages = pdfjsDoc.numPages;

        if (operationId.current !== currentOperationId) {
          pdfjsDoc.destroy();
          return;
        }

        setFile({ id: `${fileToLoad.name}-${Date.now()}`, file: fileToLoad, totalPages, pdfjsDoc, isEncrypted: false });
        setCustomRanges(`1-${totalPages}`);
        setFixedRangeSize(1);
        setSelectedPages(new Set());
        setSplitResults([]);
        setSplitError(null);
        
        const previews: PagePreview[] = Array(totalPages).fill(null).map((_, i) => ({ pageNumber: i + 1, dataUrl: null, isVisible: false }));
        setPagePreviews(previews);
        toast({
          variant: 'success',
          title: "File Uploaded",
          description: `"${fileToLoad.name}" is ready for splitting.`
        });
    } catch (error: any) {
        if (operationId.current !== currentOperationId) return;

        if (error.name === 'PasswordException') {
            setFile({ id: `${fileToLoad.name}-${Date.now()}`, file: fileToLoad, totalPages: 0, pdfjsDoc: null, isEncrypted: true });
        } else {
            console.error("Error loading PDF:", error);
            toast({ variant: "destructive", title: "Could not read PDF", description: "The file might be corrupted or in an unsupported format." });
        }
    } finally {
        if (operationId.current === currentOperationId) {
          setIsProcessing(false);
        }
    }
  }, [toast]);
  

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: any[]) => {
      if (rejectedFiles.length > 0) {
        toast({ variant: "destructive", title: "Invalid file", description: "The file was not a PDF or exceeded size limits." });
        return;
      }
      if (acceptedFiles.length === 0) return;
      
      const singleFile = acceptedFiles[0];
      initFile(singleFile);
    },
    [toast, initFile]
  );
  
  const onPageVisible = useCallback((pageNumber: number) => {
    if (!file || !file.pdfjsDoc) return;
    const currentOperationId = operationId.current;

    setPagePreviews(prev => {
        const pageIndex = prev.findIndex(p => p.pageNumber === pageNumber);
        if (pageIndex === -1 || prev[pageIndex].dataUrl || prev[pageIndex].isVisible) {
            return prev;
        }

        const newPreviews = [...prev];
        newPreviews[pageIndex] = { ...newPreviews[pageIndex], isVisible: true };
        
        renderPdfPage(file.pdfjsDoc!, pageNumber, currentOperationId).then(dataUrl => {
            if (dataUrl && operationId.current === currentOperationId) {
                setPagePreviews(currentPreviews => {
                    const latestIndex = currentPreviews.findIndex(p => p.pageNumber === pageNumber);
                    if (latestIndex > -1) {
                       const finalPreviews = [...currentPreviews];
                       finalPreviews[latestIndex] = { ...finalPreviews[latestIndex], dataUrl };
                       return finalPreviews;
                    }
                    return currentPreviews;
                });
            }
        });
        
        return newPreviews;
    });
  }, [file, renderPdfPage]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxSize: MAX_FILE_SIZE_BYTES,
    multiple: false,
    noClick: true,
    noKeyboard: true,
    disabled: isProcessing || isSplitting,
  });

  const removeFile = () => {
    operationId.current++; // Invalidate any running operations
    const fileName = file?.file.name;
    if (file?.pdfjsDoc) file.pdfjsDoc.destroy();
    setFile(null);
    setIsProcessing(false);
    setCustomRanges("");
    setSplitResults([]);
    setPagePreviews([]);
    setSplitError(null);
    if (fileName) {
      toast({ variant: 'info', title: `Removed "${fileName}"` });
    }
  };
  
  const parseCustomRanges = (ranges: string, max: number): number[][] | null => {
    const result: number[][] = [];
    if (!ranges.trim()) return [];
    const parts = ranges.split(',').map(part => part.trim());

    for (const part of parts) {
      if (part.includes('-')) {
        const [startStr, endStr] = part.split('-');
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (isNaN(start) || isNaN(end) || start < 1 || end > max || start > end) {
          return null;
        }
        const range = [];
        for (let i = start; i <= end; i++) {
          range.push(i - 1);
        }
        result.push(range);
      } else {
        const pageNum = parseInt(part, 10);
        if (isNaN(pageNum) || pageNum < 1 || pageNum > max) {
          return null;
        }
        result.push([pageNum - 1]);
      }
    }
    return result;
  };

  const handleSplit = async () => {
    if (!file || !file.pdfjsDoc) return;

    if (file.isEncrypted) {
      return;
    }

    const currentOperationId = ++operationId.current;
    
    setIsSplitting(true);
    setSplitError(null);
    setSplitResults([]);

    let pageGroups: number[][] = [];
    
    try {
      if (splitMode === 'range') {
        if (rangeMode === 'custom') {
          const parsed = parseCustomRanges(customRanges, file.totalPages);
          if (!parsed) {
            setSplitError("Invalid page ranges. Please use formats like '1-3', '5', '7-9'.");
            setIsSplitting(false);
            return;
          }
          pageGroups = parsed;
        } else { // fixed range
          if (fixedRangeSize < 1) {
            setSplitError("Fixed range size must be at least 1.");
            setIsSplitting(false);
            return;
          }
          for (let i = 0; i < file.totalPages; i += fixedRangeSize) {
            const range = [];
            for (let j = 0; j < fixedRangeSize && i + j < file.totalPages; j++) {
                range.push(i + j);
            }
            pageGroups.push(range);
          }
        }
      } else { // extract mode
        if (extractMode === 'all') {
          pageGroups = Array.from({ length: file.totalPages }, (_, i) => [i]);
        } else { // select pages
          if (selectedPages.size === 0) {
            setSplitError("Please select at least one page to extract.");
            setIsSplitting(false);
            return;
          }
          pageGroups = [[...selectedPages].sort((a, b) => a - b).map(p => p - 1)];
        }
      }
      
      if (operationId.current !== currentOperationId) return;

      if (pageGroups.length === 0 || pageGroups.every(g => g.length === 0)) {
         setSplitError("No pages selected or ranges defined for splitting.");
         setIsSplitting(false);
         return;
      }
      
      const results: SplitResult[] = [];
      const originalName = file.file.name.replace(/\.pdf$/i, '');
      const zip = new JSZip();

      const sourcePdfBytes = await file.file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(sourcePdfBytes, { ignoreEncryption: true });

      for (const group of pageGroups) {
        if (operationId.current !== currentOperationId) return;
        if (group.length === 0) continue;
        
        const newPdf = await PDFDocument.create();
        const copiedPages = await newPdf.copyPages(pdfDoc, group);
        copiedPages.forEach(page => newPdf.addPage(page));
        
        const newPdfBytes = await newPdf.save();
        
        const firstPage = group[0] + 1;
        const lastPage = group[group.length - 1] + 1;
        const rangeText = firstPage === lastPage ? `page_${firstPage}` : `pages_${firstPage}-${lastPage}`;
        const filename = `${originalName}_${rangeText}.pdf`

        if (pageGroups.length > 1) {
            zip.file(filename, newPdfBytes);
        } else {
             const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
             const url = URL.createObjectURL(blob);
             results.push({ filename, url });
        }
      }

      if (operationId.current !== currentOperationId) {
        results.forEach(r => URL.revokeObjectURL(r.url));
        return;
      }
      
      if (pageGroups.length > 1) {
        const zipBlob = await zip.generateAsync({type:"blob"});
        const url = URL.createObjectURL(zipBlob);
        results.push({ filename: `${originalName}_split.zip`, url });
      }

      setSplitResults(results);
      toast({
        variant: "success",
        title: "Split Successful!",
        description: `Your PDF has been split.`,
      });

    } catch (error: any) {
      if (operationId.current === currentOperationId) {
         console.error("Split failed:", error);
         toast({ variant: "destructive", title: "Split Failed", description: error.message || "An unexpected error occurred." });
      }
    } finally {
      if (operationId.current === currentOperationId) {
        setIsSplitting(false);
      }
    }
  };

  const handleCancelSplit = () => {
    operationId.current++; // Invalidate current operation
    setIsSplitting(false);
    setSplitError(null);
    toast({ variant: "info", title: "Split cancelled." });
  };
  
  const handleSplitAgain = () => {
    splitResults.forEach(r => URL.revokeObjectURL(r.url));
    setSplitResults([]);
    removeFile();
  };
  
  const handleDownloadAll = () => {
    const resultToDownload = splitResults[0]; // either single PDF or the zip
     if (!resultToDownload) return;
     const link = document.createElement("a");
     link.href = resultToDownload.url;
     link.download = resultToDownload.filename;
     document.body.appendChild(link);
     link.click();
     setTimeout(() => {
        document.body.removeChild(link);
     }, 100);
  };

  const toggleSelectPage = (pageNumber: number) => {
    setSelectedPages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pageNumber)) {
        newSet.delete(pageNumber);
      } else {
        newSet.add(pageNumber);
      }
      return newSet;
    });
    setSplitError(null);
  };

  const toggleSelectAllPages = (checked: boolean) => {
    if (checked) {
      setSelectedPages(new Set(Array.from({ length: file?.totalPages || 0 }, (_, i) => i + 1)));
    } else {
      setSelectedPages(new Set());
    }
  };

  const customRangePreviewPages = React.useMemo(() => {
    if (!file || splitMode !== 'range' || rangeMode !== 'custom') return [];
    
    const firstPart = customRanges.split(',')[0].trim();
    if (firstPart.includes('-')) {
        const [startStr, endStr] = firstPart.split('-');
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (!isNaN(start) && start >= 1 && start <= file.totalPages) {
            const pages = [start];
            if (!isNaN(end) && end >= 1 && end <= file.totalPages && end > start) {
                pages.push(end);
            }
            return pages;
        }
    } else {
        const pageNum = parseInt(firstPart, 10);
        if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= file.totalPages) {
            return [pageNum];
        }
    }
    return [];
  }, [customRanges, file, splitMode, rangeMode]);
  
  const fixedRangeGroups = React.useMemo(() => {
    if (!file || splitMode !== 'range' || rangeMode !== 'fixed' || fixedRangeSize < 1) return [];
    const groups: (PagePreview | { pageNumber: number; dataUrl: null })[][] = [];
    for (let i = 0; i < file.totalPages; i += fixedRangeSize) {
        const group: (PagePreview | { pageNumber: number; dataUrl: null })[] = [];
        for(let j = 0; j < fixedRangeSize && (i + j) < file.totalPages; j++) {
            const pageNum = i + j + 1;
            const preview = pagePreviews.find(p => p.pageNumber === pageNum);
            group.push(preview || { pageNumber: pageNum, dataUrl: null, isVisible: false });
        }
        groups.push(group);
    }
    return groups;
  }, [pagePreviews, splitMode, rangeMode, fixedRangeSize, file]);


  if (splitResults.length > 0) {
    return (
      <div className="text-center flex flex-col items-center justify-center py-12 animate-in fade-in duration-500 bg-transparent p-4 sm:p-8 rounded-xl">
        <CheckCircle className="w-16 h-16 sm:w-20 sm:h-20 text-green-500 mb-6" />
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">PDF Split Successfully!</h2>
        <p className="text-muted-foreground mb-8 text-sm sm:text-base">Your new document is ready for download.</p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4">
          <Button size="lg" onClick={handleDownloadAll} className="w-full sm:w-auto text-base font-bold bg-green-600 hover:bg-green-700 text-white">
            <Download className="mr-2 h-5 w-5" />
            Download {splitResults[0].filename.endsWith('.zip') ? 'ZIP' : 'PDF'}
          </Button>
          <Button size="lg" variant="outline" onClick={handleSplitAgain} className="w-full sm:w-auto text-base">
            Split Another PDF
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-transparent shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Upload PDF to Split</CardTitle>
          <CardDescription>
            Select a single PDF file to start the splitting process.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!file && !isProcessing ? (
            <div
              {...getRootProps()}
              className={cn(
                "flex flex-col items-center justify-center p-6 sm:p-10 rounded-lg border-2 border-dashed transition-colors duration-300",
                !isSplitting && "hover:border-primary/50",
                isDragActive && "border-primary bg-primary/10",
                isSplitting && "opacity-70 pointer-events-none"
              )}
            >
              <input {...getInputProps()} />
              <UploadCloud className="w-10 h-10 text-muted-foreground sm:w-12 sm:h-12" />
              <p className="mt-2 text-base font-semibold text-foreground sm:text-lg">
                Drop a PDF file here
              </p>
              <p className="text-xs text-muted-foreground sm:text-sm">or click the button below</p>
              <motion.div whileHover={{ scale: 1.05, y: -2 }} transition={{ type: 'spring', stiffness: 400, damping: 10 }}>
                <Button type="button" onClick={open} className="mt-4" disabled={isProcessing || isSplitting}>
                    <FolderOpen className="mr-2 h-4 w-4" />
                    Choose File
                </Button>
              </motion.div>
              <p className="w-full px-2 text-center text-xs text-muted-foreground mt-6">
                Max file size: {MAX_FILE_SIZE_MB}MB
              </p>
            </div>
          ) : (
             <div className="p-2 sm:p-3 rounded-lg border bg-card/50 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                    {file?.isEncrypted ? (
                        <Lock className="w-6 h-6 text-yellow-500 sm:w-8 sm:h-8 shrink-0" />
                    ) : (
                        <FileIcon className="w-6 h-6 text-destructive shrink-0" />
                    )}
                    <div className="flex flex-col overflow-hidden">
                        {file ? (
                          <>
                            <span className="text-sm font-medium truncate" title={file.file.name}>{file.file.name}</span>
                            <span className="text-xs text-muted-foreground">
                                {formatBytes(file.file.size)} {file.isEncrypted ? "(Encrypted)" : `• ${file.totalPages} pages`}
                            </span>
                          </>
                        ) : (
                          <>
                             <span className="text-sm font-medium truncate">Processing PDF...</span>
                             <span className="text-xs text-muted-foreground">Please wait a moment.</span>
                          </>
                        )}
                    </div>
                </div>
                 {isProcessing ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : (file && (
                    <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground/70 hover:bg-destructive/10 hover:text-destructive shrink-0" onClick={removeFile} disabled={isSplitting}>
                        <X className="w-4 h-4" />
                    </Button>
                ))}
             </div>
          )}
        </CardContent>
      </Card>

      {file && (
        <Card className={cn("bg-transparent shadow-lg")}>
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Split Options</CardTitle>
          </CardHeader>
          <CardContent>
           {file.isEncrypted ? (
                <div className="flex items-center gap-3 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3 text-sm text-yellow-700 dark:text-yellow-400">
                    <ShieldAlert className="h-5 w-5 shrink-0" />
                    <div>This PDF is password-protected and cannot be processed. Please upload an unlocked file.</div>
                </div>
            ) : (
            <>
            <div className={cn(isSplitting && "opacity-70 pointer-events-none")}>
                <Tabs value={splitMode} onValueChange={(v) => setSplitMode(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="range" disabled={isSplitting}>Split by range</TabsTrigger>
                    <TabsTrigger value="extract" disabled={isSplitting}>Extract pages</TabsTrigger>
                </TabsList>
                
                <TabsContent value="range" className="mt-6">
                    <RadioGroup value={rangeMode} onValueChange={(v) => setRangeMode(v as any)} className="space-y-4" disabled={isSplitting}>
                    <div>
                        <div className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value="custom" id="r-custom" />
                        <Label htmlFor="r-custom" className="font-semibold">Custom ranges</Label>
                        </div>
                        <Input 
                        disabled={rangeMode !== 'custom' || isSplitting}
                        id="split-ranges" 
                        value={customRanges} 
                        onChange={(e) => {
                            setCustomRanges(e.target.value);
                            if(splitError) setSplitError(null);
                        }}
                        className={cn("mt-1", splitError && rangeMode === 'custom' && "border-destructive focus-visible:ring-destructive")}
                        placeholder="e.g., 1-3, 5, 8-10"
                        />
                        <p className="text-xs text-muted-foreground mt-1.5">
                        Each range creates a new PDF. Example: <span className="font-mono bg-muted/80 px-1 py-0.5 rounded">1-3, 5, 8-10</span>
                        </p>
                    </div>
                    <div>
                        <div className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value="fixed" id="r-fixed" />
                        <Label htmlFor="r-fixed" className="font-semibold">Fixed ranges</Label>
                        </div>
                        <div className="flex items-center gap-2">
                        <Input
                            disabled={rangeMode !== 'fixed' || isSplitting}
                            id="fixed-range-size"
                            type="number"
                            min="1"
                            value={fixedRangeSize}
                            onChange={(e) => setFixedRangeSize(Math.max(1, parseInt(e.target.value)) || 1)}
                            className="w-24"
                        />
                        <Label htmlFor="fixed-range-size" className="text-muted-foreground">pages per file</Label>
                        </div>
                    </div>
                    </RadioGroup>
                </TabsContent>

                <TabsContent value="extract" className="mt-6">
                    <RadioGroup value={extractMode} onValueChange={(v) => setExtractMode(v as any)} className="space-y-4" disabled={isSplitting}>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="all" id="r-all" />
                        <Label htmlFor="r-all">Extract all pages into separate PDFs</Label>
                    </div>
                    <div>
                        <div className="flex items-center space-x-2">
                        <RadioGroupItem value="select" id="r-select" />
                        <Label htmlFor="r-select">Select pages to extract into one PDF</Label>
                        </div>
                    </div>
                    </RadioGroup>
                </TabsContent>
                </Tabs>
            </div>
            
            <div className="mt-6 border-t pt-6">
                <Label className="font-semibold text-base">Preview</Label>
                 {isProcessing ? (
                    <div className="flex flex-col justify-center items-center h-48">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="mt-4 mb-2">Processing PDF...</p>
                    </div>
                ) : (
                    <PageVisibilityContext.Provider value={{ onVisible: onPageVisible }}>
                        <div className={cn(isSplitting && "opacity-70 pointer-events-none")}>
                            {splitMode === 'range' && rangeMode === 'custom' && (
                                <div className="mt-4 flex items-center justify-center gap-2 sm:gap-4 p-4 bg-muted/50 rounded-lg">
                                    {customRangePreviewPages.length > 0 ? (
                                        <>
                                            <div className="w-1/3 max-w-32">
                                                <PagePreviewCard
                                                    pageNumber={customRangePreviewPages[0]}
                                                    dataUrl={pagePreviews.find(p => p.pageNumber === customRangePreviewPages[0])?.dataUrl || null}
                                                    showCheckbox={false}
                                                />
                                            </div>
                                            {customRangePreviewPages.length > 1 && (
                                                <>
                                                    <Minus className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground shrink-0" />
                                                    <div className="w-1/3 max-w-32">
                                                        <PagePreviewCard
                                                            pageNumber={customRangePreviewPages[1]}
                                                            dataUrl={pagePreviews.find(p => p.pageNumber === customRangePreviewPages[1])?.dataUrl || null}
                                                            showCheckbox={false}
                                                        />
                                                    </div>
                                                </>
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-muted-foreground text-sm py-8 text-center">Enter a valid range to see a preview.</p>
                                    )}
                                </div>
                            )}

                            {splitMode === 'range' && rangeMode === 'fixed' && (
                                <ScrollArea className="w-full whitespace-nowrap rounded-md mt-4">
                                    <div className="flex w-max space-x-4 p-4">
                                        {fixedRangeGroups.map((group, groupIndex) => (
                                            <Card key={groupIndex} className="p-2 shrink-0">
                                                <CardContent className="p-0">
                                                    <div className={cn(
                                                        "grid gap-2 w-max",
                                                        fixedRangeSize > 1 ? "grid-cols-2" : "grid-cols-1"
                                                    )}>
                                                        {group.map(preview => (
                                                            <PagePreviewCard 
                                                                key={preview.pageNumber} 
                                                                {...preview} 
                                                                showCheckbox={false} 
                                                                className="w-24"
                                                            />
                                                        ))}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                    <ScrollBar orientation="horizontal" />
                                </ScrollArea>
                            )}
                            
                            {splitMode === 'extract' && (
                                <div className={cn("mt-4 border rounded-lg p-2 sm:p-4", isSplitting && "opacity-70 pointer-events-none")}>
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                                        <Label className="font-semibold text-base sm:text-lg">
                                            Selected Pages: {selectedPages.size} / {file.totalPages}
                                        </Label>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="select-all"
                                                checked={selectedPages.size === file.totalPages && file.totalPages > 0}
                                                onCheckedChange={(checked) => toggleSelectAllPages(Boolean(checked))}
                                                disabled={extractMode === 'all' || isSplitting}
                                            />
                                            <Label htmlFor="select-all">Select All</Label>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-4 max-h-96 overflow-y-auto pr-2">
                                        {pagePreviews.map(preview => (
                                            <PagePreviewCard 
                                                key={preview.pageNumber}
                                                {...preview}
                                                isSelected={extractMode === 'all' || selectedPages.has(preview.pageNumber)}
                                                onToggle={extractMode === 'select' ? toggleSelectPage : undefined}
                                                showCheckbox={extractMode === 'select'}
                                                disabled={isSplitting}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </PageVisibilityContext.Provider>
                )}
            </div>
            </>
            )}

            {splitError && (
                <p className="text-sm text-destructive mt-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> {splitError}
                </p>
            )}
            <div className="mt-8 h-20 flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  {isSplitting ? (
                     <motion.div
                        key="progress"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="flex items-center justify-center gap-2">
                            <Loader2 className="w-5 h-5 text-primary animate-spin" />
                            <p className="text-sm font-medium text-primary">Splitting PDF...</p>
                        </div>
                        <Button size="sm" variant="destructive" onClick={handleCancelSplit} className="w-full mt-4">
                            <Ban className="mr-2 h-4 h-4" />
                            Cancel
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
                        <Button size="lg" className="w-full text-base font-bold" onClick={handleSplit} disabled={isSplitting || isProcessing || !file || file.isEncrypted}>
                        <Scissors className="mr-2 h-5 w-5" />
                        Split PDF
                        </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

    
