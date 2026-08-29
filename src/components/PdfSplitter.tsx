
"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud,
  File as FileIcon,
  Download,
  X,
  Check,
  Scissors,
  FolderOpen,
  Loader2,
  AlertTriangle,
  Minus,
  Ban,
  Lock,
  ShieldAlert,
  Plus,
  Trash2,
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
import { createPdfBlob } from '@/lib/pdf-blob';
import * as pdfjsLib from '@/lib/pdfjs';
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import JSZip from "jszip";
import { motion, AnimatePresence } from 'framer-motion';

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

/**
 * Fallback page shape used until the real one is measured. A hardcoded box is
 * what made borders look uneven: a Letter page (0.773) letterboxed inside a
 * 7/10 box (0.700) leaves ~10% of dead space inside the border.
 */
const DEFAULT_PAGE_ASPECT = 7 / 10;

type PagePreview = {
  pageNumber: number;
  dataUrl: string | null;
  /** Rendered width / height, so the card box matches the page exactly. */
  aspect: number;
};

/** Suggests a default for a new range row: the first page not covered yet. */
function suggestNextRange(entries: string[], max: number): string {
  let highestCovered = 0;
  for (const entry of entries) {
    for (const token of entry.split(',')) {
      const part = token.trim();
      if (!part) continue;
      const endStr = part.includes('-') ? part.split('-')[1] : part;
      const end = parseInt(endStr, 10);
      if (!isNaN(end) && end > highestCovered) highestCovered = end;
    }
  }
  if (highestCovered >= max) return "";
  return String(highestCovered + 1);
}

/**
 * Turns range entries such as ["1-3", "5", "8-10"] into groups of 0-based page
 * indices. Commas inside an entry are accepted too. Returns null when any
 * entry is out of bounds or malformed.
 */
function parseRangeEntries(entries: string[], max: number): number[][] | null {
  const groups: number[][] = [];

  for (const entry of entries) {
    for (const token of entry.split(',')) {
      const part = token.trim();
      if (!part) continue;

      if (part.includes('-')) {
        const [startStr, endStr] = part.split('-');
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (isNaN(start) || isNaN(end) || start < 1 || end > max || start > end) {
          return null;
        }
        const range: number[] = [];
        for (let i = start; i <= end; i++) range.push(i - 1);
        groups.push(range);
      } else {
        const pageNum = parseInt(part, 10);
        if (isNaN(pageNum) || pageNum < 1 || pageNum > max) {
          return null;
        }
        groups.push([pageNum - 1]);
      }
    }
  }

  return groups;
}

type CustomRangePreview = {
    label: string;
    /** Pages worth showing: the first and last of the span. */
    pages: number[];
    /** How many pages the range actually covers. */
    pageCount: number;
};

/**
 * Renders the first (and last) page of a range as paper-shaped cards, with an
 * ellipsis between them when the span covers more than those two.
 */
const RangeThumbRow = ({ pages, previewByPage, thumbMaxClass }: {
    pages: number[];
    previewByPage: Map<number, PagePreview>;
    /** Upper bound on each page's width; pages shrink to fit the container. */
    thumbMaxClass: string;
}) => (
    <div className="flex w-full items-center justify-center gap-2 sm:gap-3">
        {pages.map((pageNumber, i) => {
            const preview = previewByPage.get(pageNumber);
            return (
                <React.Fragment key={pageNumber}>
                    {i > 0 && (
                        <span aria-hidden="true" className="shrink-0 text-xl font-bold leading-none text-muted-foreground/60">&hellip;</span>
                    )}
                    {/* min-w-0 lets the page shrink instead of overflowing the tile. */}
                    <div className={cn("min-w-0 flex-1 basis-0", thumbMaxClass)}>
                        <PagePreviewCard
                            pageNumber={pageNumber}
                            dataUrl={preview?.dataUrl || null}
                            aspect={preview?.aspect}
                            showCheckbox={false}
                            className="border-border shadow-sm"
                        />
                    </div>
                </React.Fragment>
            );
        })}
    </div>
);

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

type PagePreviewCardProps = {
    pageNumber: number;
    dataUrl: string | null;
    /** Rendered page shape; the card box follows it so the border hugs the page. */
    aspect?: number;
    isSelected?: boolean;
    onToggle?: (page: number) => void;
    showCheckbox: boolean;
    className?: string;
    disabled?: boolean;
};

const PagePreviewCard = React.memo(({ pageNumber, dataUrl, aspect, isSelected, onToggle, showCheckbox, className, disabled }: PagePreviewCardProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const { onVisible } = usePageVisibility();

    useEffect(() => {
        // Capture the node: React can null out ref.current before this effect's
        // cleanup runs, which would leak the observer on unmounted pages.
        const node = ref.current;
        if (!node) return;

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !dataUrl) {
                onVisible(pageNumber);
                observer.unobserve(node);
            }
        }, { threshold: 0.1 });

        observer.observe(node);

        return () => observer.disconnect();
    }, [pageNumber, onVisible, dataUrl]);
    
    return (
        <div 
            ref={ref}
            key={pageNumber}
            onClick={!disabled && onToggle ? () => onToggle(pageNumber) : undefined}
            style={{ aspectRatio: String(aspect ?? DEFAULT_PAGE_ASPECT) }}
            className={cn(
                "relative rounded-md overflow-hidden border-2 transition-all bg-muted",
                !disabled && onToggle && "cursor-pointer",
                isSelected ? "border-primary shadow-lg" : "border-transparent",
                !disabled && onToggle && !isSelected && "hover:border-primary/50",
                disabled && "cursor-not-allowed",
                className
            )}
        >
            {dataUrl ? (
            <img src={dataUrl} alt={`Page ${pageNumber}`} className="block w-full h-full object-contain"/>
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
                    <Checkbox checked={isSelected} className="bg-white/80" disabled={disabled} />
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
  // Shape of the document's pages, measured on load.
  const [pageAspect, setPageAspect] = useState<number>(DEFAULT_PAGE_ASPECT);

  const [splitMode, setSplitMode] = useState<"range" | "extract">("range");
  const [rangeMode, setRangeMode] = useState<"custom" | "fixed">("custom");
  const [extractMode, setExtractMode] = useState<"all" | "select">("select");

  const [customRanges, setCustomRanges] = useState<string[]>([]);
  const [mergeCustomRanges, setMergeCustomRanges] = useState(false);
  const [fixedRangeSize, setFixedRangeSize] = useState(1);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());

  const [splitError, setSplitError] = useState<string | null>(null);
  

  const { toast } = useToast();
  
  const operationId = useRef<number>(0);
  // Pages we have already asked the renderer for, so scrolling back and forth
  // (or React StrictMode re-running an effect) cannot queue the same page twice.
  const requestedPages = useRef<Set<number>>(new Set());

  const renderPdfPage = useCallback(async (
    pdfjsDoc: pdfjsLib.PDFDocumentProxy,
    pageNum: number,
    currentOperationId: number
  ): Promise<{ dataUrl: string; aspect: number } | null> => {
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
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            // Read the ratio back off the canvas (already integer-rounded by the
            // browser) so the card box and the bitmap agree to the pixel.
            const aspect = canvas.height > 0 ? canvas.width / canvas.height : DEFAULT_PAGE_ASPECT;
            // Release the backing store; the data URL has already copied it out.
            canvas.width = 0;
            canvas.height = 0;
            if (operationId.current !== currentOperationId) return null;
            return { dataUrl, aspect };
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

        // Measure page 1 up front so every placeholder already has the right
        // shape; without this the grid reflows as thumbnails stream in.
        const firstViewport = (await pdfjsDoc.getPage(1)).getViewport({ scale: 1 });
        const docAspect = firstViewport.height > 0
            ? firstViewport.width / firstViewport.height
            : DEFAULT_PAGE_ASPECT;

        if (operationId.current !== currentOperationId) {
          pdfjsDoc.destroy();
          return;
        }

        setFile({ id: `${fileToLoad.name}-${Date.now()}`, file: fileToLoad, totalPages, pdfjsDoc, isEncrypted: false });
        setCustomRanges([`1-${totalPages}`]);
        setMergeCustomRanges(false);
        setFixedRangeSize(1);
        setSelectedPages(new Set());
        setSplitResults([]);
        setSplitError(null);
        requestedPages.current.clear();
        setPageAspect(docAspect);
        setPagePreviews(Array.from({ length: totalPages }, (_, i) => ({
            pageNumber: i + 1,
            dataUrl: null,
            aspect: docAspect,
        })));
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
    const pdfjsDoc = file?.pdfjsDoc;
    if (!pdfjsDoc || requestedPages.current.has(pageNumber)) return;

    requestedPages.current.add(pageNumber);
    const currentOperationId = operationId.current;

    renderPdfPage(pdfjsDoc, pageNumber, currentOperationId).then((result) => {
      if (!result || operationId.current !== currentOperationId) return;
      setPagePreviews(prev =>
        prev.map(p => (p.pageNumber === pageNumber ? { ...p, dataUrl: result.dataUrl, aspect: result.aspect } : p))
      );
    });
  }, [file, renderPdfPage]);

  // A mount-only effect would close over the first render's values, so the
  // resources to release are tracked in a ref and read at teardown time.
  const teardownRef = useRef<{ results: SplitResult[]; pdfjsDoc: pdfjsLib.PDFDocumentProxy | null }>({
    results: [],
    pdfjsDoc: null,
  });
  teardownRef.current.results = splitResults;
  teardownRef.current.pdfjsDoc = file?.pdfjsDoc ?? null;

  useEffect(() => {
    return () => {
      operationId.current++;
      teardownRef.current.results.forEach(r => URL.revokeObjectURL(r.url));
      teardownRef.current.pdfjsDoc?.destroy();
    };
  }, []);

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
    setCustomRanges([]);
    setMergeCustomRanges(false);
    setSplitResults([]);
    setPagePreviews([]);
    setSplitError(null);
    requestedPages.current.clear();
    if (fileName) {
      toast({ variant: 'info', title: `Removed "${fileName}"` });
    }
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
    let mergedIntoOne = false;
    
    try {
      if (splitMode === 'range') {
        if (rangeMode === 'custom') {
          const parsed = parseRangeEntries(customRanges, file.totalPages);
          if (!parsed) {
            setSplitError("Invalid page ranges. Please use formats like '1-3', '5', '7-9'.");
            setIsSplitting(false);
            return;
          }
          pageGroups = parsed;
          if (mergeCustomRanges && pageGroups.length > 1) {
            // Ranges keep the order the user listed them in.
            pageGroups = [pageGroups.flat()];
            mergedIntoOne = true;
          }
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
        const filename = mergedIntoOne
            ? `${originalName}_merged.pdf`
            : `${originalName}_${rangeText}.pdf`;

        if (pageGroups.length > 1) {
            zip.file(filename, newPdfBytes);
        } else {
             const blob = createPdfBlob(newPdfBytes);
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

  const updateCustomRange = (index: number, value: string) => {
    setCustomRanges(prev => prev.map((entry, i) => (i === index ? value : entry)));
    setSplitError(null);
  };

  const addCustomRange = () => {
    setCustomRanges(prev => [...prev, suggestNextRange(prev, file?.totalPages ?? 0)]);
    setSplitError(null);
  };

  const removeCustomRange = (index: number) => {
    setCustomRanges(prev => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
    setSplitError(null);
  };

  const toggleSelectAllPages = (checked: boolean) => {
    if (checked) {
      setSelectedPages(new Set(Array.from({ length: file?.totalPages || 0 }, (_, i) => i + 1)));
    } else {
      setSelectedPages(new Set());
    }
  };

  const previewByPage = React.useMemo(() => {
    const map = new Map<number, PagePreview>();
    pagePreviews.forEach(preview => map.set(preview.pageNumber, preview));
    return map;
  }, [pagePreviews]);

  // One card per range the user typed, showing the first and last page of the
  // span. The JSX that renders this is already gated on range+custom mode.
  const customRangePreviews = React.useMemo(() => {
    if (!file) return [];

    const max = file.totalPages;
    const previews: CustomRangePreview[] = [];

    for (const entry of customRanges) {
      for (const token of entry.split(',')) {
        const part = token.trim();
        if (!part) continue;

        if (part.includes('-')) {
          const [startStr, endStr] = part.split('-');
          const start = parseInt(startStr, 10);
          const end = parseInt(endStr, 10);
          if (isNaN(start) || start < 1 || start > max) continue;
          const endIsValid = !isNaN(end) && end > start && end <= max;
          previews.push({
            label: part,
            pages: endIsValid ? [start, end] : [start],
            pageCount: endIsValid ? end - start + 1 : 1,
          });
        } else {
          const pageNum = parseInt(part, 10);
          if (isNaN(pageNum) || pageNum < 1 || pageNum > max) continue;
          previews.push({ label: part, pages: [pageNum], pageCount: 1 });
        }
      }
    }

    return previews;
  }, [customRanges, file]);

  // Drives the "N files from M pages" hint and the merge checkbox description.
  const customRangeSummary = React.useMemo(() => {
    if (!file) return { valid: true, files: 0, pages: 0 };
    const parsed = parseRangeEntries(customRanges, file.totalPages);
    if (!parsed) return { valid: false, files: 0, pages: 0 };
    return {
      valid: true,
      files: parsed.length,
      pages: parsed.reduce((count, group) => count + group.length, 0),
    };
  }, [customRanges, file]);

  const fixedRangeGroups = React.useMemo(() => {
    if (!file || splitMode !== 'range' || rangeMode !== 'fixed' || fixedRangeSize < 1) return [];
    const groups: (PagePreview | { pageNumber: number; dataUrl: null })[][] = [];
    for (let i = 0; i < file.totalPages; i += fixedRangeSize) {
        const group: (PagePreview | { pageNumber: number; dataUrl: null })[] = [];
        for(let j = 0; j < fixedRangeSize && (i + j) < file.totalPages; j++) {
            const pageNum = i + j + 1;
            group.push(previewByPage.get(pageNum) || { pageNumber: pageNum, dataUrl: null, aspect: pageAspect });
        }
        groups.push(group);
    }
    return groups;
  }, [previewByPage, splitMode, rangeMode, fixedRangeSize, file, pageAspect]);


  if (splitResults.length > 0) {
    return (
      <div className="text-center flex flex-col items-center justify-center py-12 animate-in fade-in duration-500 bg-transparent p-4 sm:p-8 rounded-xl">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-500 rounded-full flex items-center justify-center mb-6">
            <Check className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
        </div>
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
            <div className="xl:grid xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] xl:items-start xl:gap-10">
            <div className={cn(isSplitting && "opacity-70 pointer-events-none")}>
                <Tabs value={splitMode} onValueChange={(v) => setSplitMode(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="range" disabled={isSplitting}>Split by range</TabsTrigger>
                    <TabsTrigger value="extract" disabled={isSplitting}>Extract pages</TabsTrigger>
                </TabsList>
                
                <TabsContent value="range" className="mt-6">
                    <RadioGroup value={rangeMode} onValueChange={(v) => setRangeMode(v as any)} className="space-y-4" disabled={isSplitting}>
                    <div>
                        <Label htmlFor="r-custom" className="flex items-center space-x-2 mb-2 cursor-pointer">
                            <RadioGroupItem value="custom" id="r-custom" />
                            <span className="font-semibold">Custom ranges</span>
                        </Label>
                        <div className="mt-1 space-y-2">
                          <AnimatePresence initial={false}>
                            {customRanges.map((entry, index) => (
                              <motion.div
                                key={index}
                                layout
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: 0.18 }}
                                className="flex items-center gap-2"
                              >
                                <span className="w-14 shrink-0 text-xs font-medium text-muted-foreground tabular-nums">
                                  Range {index + 1}
                                </span>
                                <Input
                                  disabled={rangeMode !== 'custom' || isSplitting}
                                  id={`split-range-${index}`}
                                  value={entry}
                                  onChange={(e) => updateCustomRange(index, e.target.value)}
                                  className={cn(
                                    "flex-1",
                                    splitError && rangeMode === 'custom' && "border-destructive focus-visible:ring-destructive"
                                  )}
                                  placeholder={index === 0 ? "e.g. 1-3" : "e.g. 7 or 12-15"}
                                  aria-label={`Page range ${index + 1}`}
                                  inputMode="numeric"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9 shrink-0 text-muted-foreground/70 hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
                                  onClick={() => removeCustomRange(index)}
                                  disabled={rangeMode !== 'custom' || isSplitting || customRanges.length === 1}
                                  title={customRanges.length === 1 ? "At least one range is required" : `Remove range ${index + 1}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Remove range {index + 1}</span>
                                </Button>
                              </motion.div>
                            ))}
                          </AnimatePresence>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addCustomRange}
                            disabled={rangeMode !== 'custom' || isSplitting}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add range
                          </Button>
                        </div>

                        <p className="text-xs text-muted-foreground mt-2">
                          A single page (<span className="font-mono bg-muted/80 px-1 py-0.5 rounded">7</span>) or a span
                          (<span className="font-mono bg-muted/80 px-1 py-0.5 rounded">1-3</span>).
                          {customRangeSummary.valid && customRangeSummary.files > 0 && (
                            <>
                              {" "}Right now: <span className="font-semibold text-foreground">{customRangeSummary.files}</span>
                              {" "}{customRangeSummary.files === 1 ? 'PDF' : 'PDFs'} from
                              {" "}<span className="font-semibold text-foreground">{customRangeSummary.pages}</span>
                              {" "}{customRangeSummary.pages === 1 ? 'page' : 'pages'}.
                            </>
                          )}
                        </p>

                        <div className="mt-3 flex items-start gap-3 rounded-lg border bg-muted/40 p-3">
                          <Checkbox
                            id="merge-custom-ranges"
                            checked={mergeCustomRanges}
                            onCheckedChange={(checked) => setMergeCustomRanges(Boolean(checked))}
                            disabled={rangeMode !== 'custom' || isSplitting}
                            className="mt-0.5"
                          />
                          <div className="grid gap-1 leading-none">
                            <Label htmlFor="merge-custom-ranges" className="cursor-pointer text-sm font-semibold">
                              Merge all ranges into a single PDF
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              {mergeCustomRanges
                                ? 'One PDF containing every range, in the order listed above.'
                                : `Each range becomes its own PDF${customRangeSummary.valid && customRangeSummary.files > 1 ? ' (bundled in a ZIP)' : ''}.`}
                            </p>
                          </div>
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="r-fixed" className="flex items-center space-x-2 mb-2 cursor-pointer">
                            <RadioGroupItem value="fixed" id="r-fixed" />
                            <span className="font-semibold">Fixed ranges</span>
                        </Label>
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
                    <Label htmlFor="r-all" className="flex items-center space-x-2 cursor-pointer">
                        <RadioGroupItem value="all" id="r-all" />
                        <span>Extract all pages into separate PDFs</span>
                    </Label>
                    <div>
                        <Label htmlFor="r-select" className="flex items-center space-x-2 cursor-pointer">
                            <RadioGroupItem value="select" id="r-select" />
                            <span>Select pages to extract into one PDF</span>
                        </Label>
                    </div>
                    </RadioGroup>
                </TabsContent>
                </Tabs>
            </div>

            <div className="mt-6 border-t pt-6 xl:mt-0 xl:pt-0 xl:border-t-0 xl:border-l xl:pl-10">
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
                                customRangePreviews.length === 0 ? (
                                    <p className="text-muted-foreground text-sm py-8 text-center">Enter a valid range to see a preview.</p>
                                ) : customRangePreviews.length === 1 ? (
                                    /* A single range gets the full preview width and a larger page. */
                                    <div className="mt-4 rounded-lg border bg-muted/40 p-4 sm:p-6">
                                        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                                            <span className="font-mono text-sm font-semibold">{customRangePreviews[0].label}</span>
                                            <span className="text-xs text-muted-foreground">
                                                1 PDF &middot; {customRangePreviews[0].pageCount} {customRangePreviews[0].pageCount === 1 ? 'page' : 'pages'}
                                            </span>
                                        </div>
                                        <RangeThumbRow
                                            pages={customRangePreviews[0].pages}
                                            previewByPage={previewByPage}
                                            thumbMaxClass={customRangePreviews[0].pages.length > 1
                                                ? "max-w-[9rem] sm:max-w-[11rem]"
                                                : "max-w-[11rem] sm:max-w-[13rem]"}
                                        />
                                    </div>
                                ) : (
                                    /* Several ranges: columns reflow to fit the width and the count. */
                                    <div className="mt-4 grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(12rem,1fr))]">
                                        {customRangePreviews.map((preview, index) => (
                                            <div key={index} className="min-w-0 overflow-hidden rounded-lg border bg-muted/40 p-3">
                                                <div className="mb-3 flex items-center justify-between gap-2">
                                                    <span className="truncate font-mono text-xs font-semibold">{preview.label}</span>
                                                    <span className="shrink-0 text-[11px] text-muted-foreground">
                                                        {mergeCustomRanges ? `Range ${index + 1}` : `PDF ${index + 1}`} &middot; {preview.pageCount} {preview.pageCount === 1 ? 'page' : 'pages'}
                                                    </span>
                                                </div>
                                                <RangeThumbRow
                                                    pages={preview.pages}
                                                    previewByPage={previewByPage}
                                                    thumbMaxClass={preview.pages.length > 1 ? "max-w-[6.5rem]" : "max-w-[7.5rem]"}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )
                            )}

                            {splitMode === 'range' && rangeMode === 'fixed' && (
                                <ScrollArea className="w-full whitespace-nowrap rounded-lg border mt-4">
                                    <div className="flex w-max items-stretch gap-3 p-3 sm:gap-4 sm:p-4">
                                        {fixedRangeGroups.map((group, groupIndex) => {
                                            // One row for small groups; otherwise the closest thing to a
                                            // square. A fixed grid-cols-2 left a hole on every odd group.
                                            const columns = group.length <= 4
                                                ? group.length
                                                : Math.ceil(Math.sqrt(group.length));
                                            const first = group[0].pageNumber;
                                            const last = group[group.length - 1].pageNumber;
                                            return (
                                                <Card key={groupIndex} className="shrink-0 rounded-xl p-3">
                                                    <CardContent className="p-0">
                                                        {/* flex-wrap (not grid) so a partial last row is
                                                            centred instead of leaving a gap on the right. */}
                                                        <div
                                                            className="flex flex-wrap justify-center gap-2"
                                                            style={{ maxWidth: `calc(${columns} * 6rem + ${columns - 1} * 0.5rem)` }}
                                                        >
                                                            {group.map(preview => (
                                                                <PagePreviewCard
                                                                    key={preview.pageNumber}
                                                                    {...preview}
                                                                    showCheckbox={false}
                                                                    className="w-24 border-border"
                                                                />
                                                            ))}
                                                        </div>
                                                        <div className="mt-2.5 border-t pt-2 text-center">
                                                            <span className="text-[11px] font-medium text-muted-foreground">
                                                                PDF {groupIndex + 1} &middot; {first === last ? `Page ${first}` : `Pages ${first}&ndash;${last}`}
                                                            </span>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}
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
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 2xl:grid-cols-8 gap-2 sm:gap-4 max-h-96 overflow-y-auto pr-2">
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

