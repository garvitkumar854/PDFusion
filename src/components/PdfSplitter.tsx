
"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
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
  GripVertical,
  Minus,
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
import { Progress } from "./ui/progress";

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
  pdfDoc: PDFDocument;
  pdfjsDoc: pdfjsLib.PDFDocumentProxy;
};

type SplitResult = {
  filename: string;
  url: string;
};

type PagePreview = {
  pageNumber: number;
  dataUrl: string;
};

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const PagePreviewCard = ({ pageNumber, dataUrl, isSelected, onToggle, showCheckbox }: { pageNumber: number, dataUrl: string, isSelected?: boolean, onToggle?: (page: number) => void, showCheckbox: boolean }) => (
    <div 
        key={pageNumber}
        onClick={onToggle ? () => onToggle(pageNumber) : undefined}
        className={cn(
            "relative rounded-md overflow-hidden border-2 transition-all aspect-[7/10] bg-muted",
            onToggle && "cursor-pointer",
            isSelected ? "border-primary shadow-lg" : "border-transparent",
            onToggle && !isSelected && "hover:border-primary/50"
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
                <Checkbox checked={isSelected} className="bg-white/80" readOnly />
            </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-0.5 font-medium">
            {pageNumber}
        </div>
    </div>
);


export function PdfSplitter() {
  const [file, setFile] = useState<PDFFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSplitting, setIsSplitting] = useState(false);
  const [splitResults, setSplitResults] = useState<SplitResult[]>([]);
  const [pagePreviews, setPagePreviews] = useState<PagePreview[]>([]);
  const [isRenderingPreviews, setIsRenderingPreviews] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(0);

  const [splitMode, setSplitMode] = useState<"range" | "extract">("range");
  const [rangeMode, setRangeMode] = useState<"custom" | "fixed">("custom");
  const [extractMode, setExtractMode] = useState<"all" | "select">("all");

  const [customRanges, setCustomRanges] = useState("");
  const [fixedRangeSize, setFixedRangeSize] = useState(1);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());

  const [splitError, setSplitError] = useState<string | null>(null);

  const { toast } = useToast();
  
  const renderPdfPage = useCallback(async (pdfjsDoc: pdfjsLib.PDFDocumentProxy, pageNum: number): Promise<PagePreview | null> => {
    try {
        const page = await pdfjsDoc.getPage(pageNum);
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
            return {
                pageNumber: pageNum,
                dataUrl: canvas.toDataURL('image/jpeg', 0.8),
            };
        }
    } catch (e) {
        console.error(`Error rendering page ${pageNum}:`, e);
    }
    return null;
  }, []);

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: any[]) => {
      if (acceptedFiles.length === 0) {
        if (rejectedFiles.length > 0) {
          toast({ variant: "destructive", title: "Invalid file(s) rejected", description: "The file was not a PDF or exceeded size limits." });
        }
        return;
      }
      
      const singleFile = acceptedFiles[0];
      if (singleFile.size > MAX_FILE_SIZE_BYTES) {
        toast({ variant: "destructive", title: "File too large", description: `"${singleFile.name}" exceeds the ${MAX_FILE_SIZE_MB}MB file size limit.` });
        return;
      }
      
      setIsProcessing(true);
      try {
        const pdfBytes = await singleFile.arrayBuffer();
        const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
        const pdfjsDoc = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
        const totalPages = pdfDoc.getPageCount();

        setFile({ id: `${singleFile.name}-${Date.now()}`, file: singleFile, totalPages, pdfDoc, pdfjsDoc });
        setCustomRanges(`1-${totalPages}`);
        setFixedRangeSize(1);
        setSelectedPages(new Set());
        setSplitResults([]);
        setSplitError(null);
        
        setIsRenderingPreviews(true);
        setPreviewProgress(0);
        const previews: PagePreview[] = Array(totalPages).fill(null).map((_, i) => ({ pageNumber: i + 1, dataUrl: '' }));
        setPagePreviews(previews);

        for (let i = 1; i <= totalPages; i++) {
          renderPdfPage(pdfjsDoc, i).then(renderedPage => {
            if(renderedPage) {
              setPagePreviews(prev => {
                  const newPreviews = [...prev];
                  const index = newPreviews.findIndex(p => p.pageNumber === renderedPage.pageNumber);
                  if (index !== -1) {
                      newPreviews[index] = renderedPage;
                  }
                  return newPreviews;
              });
            }
          });
          setPreviewProgress(Math.round((i / totalPages) * 100));
        }
        setIsRenderingPreviews(false);

      } catch (error) {
        console.error("Error loading PDF:", error);
        toast({ variant: "destructive", title: "Could not read PDF", description: "The file might be corrupted or encrypted." });
      } finally {
        setIsProcessing(false);
      }
    },
    [toast, renderPdfPage]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
    noClick: true,
    noKeyboard: true,
  });

  const removeFile = () => {
    setFile(null);
    setCustomRanges("");
    setSplitResults([]);
    setPagePreviews([]);
    setSplitError(null);
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
    if (!file) return;
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
      
      if (pageGroups.length === 0 || pageGroups.every(g => g.length === 0)) {
         setSplitError("No pages selected or ranges defined for splitting.");
         setIsSplitting(false);
         return;
      }
      
      const results: SplitResult[] = [];
      const originalName = file.file.name.replace(/\.pdf$/i, '');

      for (const group of pageGroups) {
        if (group.length === 0) continue;
        
        const newPdf = await PDFDocument.create();
        const copiedPages = await newPdf.copyPages(file.pdfDoc, group);
        copiedPages.forEach(page => newPdf.addPage(page));
        
        const newPdfBytes = await newPdf.save();
        const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        const firstPage = group[0] + 1;
        const lastPage = group[group.length - 1] + 1;
        const rangeText = firstPage === lastPage ? `page_${firstPage}` : `pages_${firstPage}-${lastPage}`;
        results.push({
            filename: `${originalName}_${rangeText}.pdf`,
            url,
        });
      }
      setSplitResults(results);
      toast({
        title: "Split Successful!",
        description: `Your PDF has been split into ${results.length} new document(s).`,
        action: <div className="p-1 rounded-full bg-primary"><CheckCircle className="w-5 h-5 text-white" /></div>
      });

    } catch (error: any) {
      console.error("Split failed:", error);
      toast({ variant: "destructive", title: "Split Failed", description: error.message || "An unexpected error occurred." });
    } finally {
      setIsSplitting(false);
    }
  };
  
  const handleSplitAgain = () => {
    splitResults.forEach(r => URL.revokeObjectURL(r.url));
    setSplitResults([]);
    removeFile();
  };
  
  const handleDownloadAll = () => {
    splitResults.forEach((result, index) => {
      setTimeout(() => {
        const link = document.createElement("a");
        link.href = result.url;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, index * 300);
    });
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
  };

  const toggleSelectAllPages = (checked: boolean) => {
    if (checked) {
      setSelectedPages(new Set(Array.from({ length: file?.totalPages || 0 }, (_, i) => i + 1)));
    } else {
      setSelectedPages(new Set());
    }
  };

  const customRangePreviewPages = useMemo(() => {
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

  if (splitResults.length > 0) {
    return (
      <div className="text-center flex flex-col items-center justify-center py-12 animate-in fade-in duration-500 bg-white dark:bg-card p-6 sm:p-8 rounded-xl shadow-lg border">
        <CheckCircle className="w-16 h-16 sm:w-20 sm:h-20 text-primary mb-6" />
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">PDF Split Successfully!</h2>
        <p className="text-muted-foreground mb-8 text-sm sm:text-base">Your new documents are ready for download.</p>
        <div className="w-full max-w-md space-y-3 my-4 max-h-60 overflow-y-auto pr-2">
            {splitResults.map(result => (
                <div key={result.filename} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <FileIcon className="w-6 h-6 text-destructive shrink-0" />
                        <span className="text-sm font-medium truncate" title={result.filename}>{result.filename}</span>
                    </div>
                    <a href={result.url} download={result.filename}>
                      <Button size="sm" variant="ghost">
                        <Download className="w-4 h-4" />
                      </Button>
                    </a>
                </div>
            ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4">
          <Button size="lg" onClick={handleDownloadAll} className="w-full sm:w-auto text-base font-bold bg-primary hover:bg-primary/90">
            <Download className="mr-2 h-5 w-5" />
            Download All ({splitResults.length})
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
      <Card className="bg-white dark:bg-card shadow-lg">
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
                "hover:border-primary/50",
                isDragActive && "border-primary bg-primary/10"
              )}
            >
              <input {...getInputProps()} />
              <UploadCloud className="w-10 h-10 text-muted-foreground sm:w-12 sm:h-12" />
              <p className="mt-2 text-base font-semibold text-foreground sm:text-lg">
                Drop a PDF file here
              </p>
              <p className="text-xs text-muted-foreground sm:text-sm">or click the button below</p>
              <Button type="button" onClick={open} className="mt-4">
                <FolderOpen className="mr-2 h-4 w-4" />
                Choose File
              </Button>
              <p className="w-full px-2 text-center text-xs text-muted-foreground mt-6">
                Max file size: {MAX_FILE_SIZE_MB}MB
              </p>
            </div>
          ) : (
             <div className="p-2 sm:p-3 rounded-lg border bg-card/50 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                    <FileIcon className="w-6 h-6 text-destructive sm:w-8 sm:h-8 shrink-0" />
                    <div className="flex flex-col overflow-hidden">
                        {file ? (
                          <>
                            <span className="text-sm font-medium truncate" title={file.file.name}>{file.file.name}</span>
                            <span className="text-xs text-muted-foreground">
                                {formatBytes(file.file.size)} • {file.totalPages} pages
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
                {file && (
                    <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground/70 hover:bg-destructive/10 hover:text-destructive" onClick={removeFile}>
                        <X className="w-4 h-4" />
                    </Button>
                )}
             </div>
          )}
        </CardContent>
      </Card>

      {file && (
        <Card className="bg-white dark:bg-card shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Split Options</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={splitMode} onValueChange={(v) => setSplitMode(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="range">Split by range</TabsTrigger>
                <TabsTrigger value="extract">Extract pages</TabsTrigger>
              </TabsList>
              
              <TabsContent value="range" className="mt-6">
                <RadioGroup value={rangeMode} onValueChange={(v) => setRangeMode(v as any)} className="space-y-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value="custom" id="r-custom" />
                      <Label htmlFor="r-custom" className="font-semibold">Custom ranges</Label>
                    </div>
                    <Input 
                      disabled={rangeMode !== 'custom'}
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
                        disabled={rangeMode !== 'fixed'}
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
                <RadioGroup value={extractMode} onValueChange={(v) => setExtractMode(v as any)} className="space-y-4">
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
            
            {/* Preview Section */}
            <div className="mt-6 border-t pt-6">
                <Label className="font-semibold text-base">Preview</Label>
                 {isRenderingPreviews ? (
                    <div className="flex flex-col justify-center items-center h-48">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="mt-4 mb-2">Rendering page previews...</p>
                        <Progress value={previewProgress} className="w-full max-w-xs h-2" />
                    </div>
                ) : (
                    <>
                        {/* Custom Range Preview */}
                        {splitMode === 'range' && rangeMode === 'custom' && (
                             <div className="mt-4 flex items-center justify-center gap-4">
                                {customRangePreviewPages.length > 0 ? (
                                    <>
                                        <div className="w-1/3">
                                            <PagePreviewCard
                                                pageNumber={customRangePreviewPages[0]}
                                                dataUrl={pagePreviews.find(p => p.pageNumber === customRangePreviewPages[0])?.dataUrl || ''}
                                                showCheckbox={false}
                                            />
                                        </div>
                                        {customRangePreviewPages.length > 1 && (
                                            <>
                                                <Minus className="w-8 h-8 text-muted-foreground shrink-0" />
                                                <div className="w-1/3">
                                                    <PagePreviewCard
                                                        pageNumber={customRangePreviewPages[1]}
                                                        dataUrl={pagePreviews.find(p => p.pageNumber === customRangePreviewPages[1])?.dataUrl || ''}
                                                        showCheckbox={false}
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-muted-foreground text-sm">Enter a valid range to see a preview.</p>
                                )}
                            </div>
                        )}

                        {/* Fixed Range Preview */}
                        {splitMode === 'range' && rangeMode === 'fixed' && fixedRangeSize > 0 && (
                            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-x-4 gap-y-2 items-center max-h-96 overflow-y-auto pr-2">
                                {pagePreviews.map((preview, index) => (
                                    <React.Fragment key={preview.pageNumber}>
                                        <PagePreviewCard {...preview} showCheckbox={false} />
                                        {(index + 1) % fixedRangeSize === 0 && index < pagePreviews.length - 1 && (
                                            <div className="col-span-full h-px border-t-2 border-dashed border-primary/50 my-2"></div>
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        )}
                        
                        {/* Extract Pages Preview (both modes) */}
                        {splitMode === 'extract' && (
                            <div className="mt-4 border rounded-lg p-4">
                                <div className="flex justify-between items-center mb-4">
                                    <Label className="font-semibold">
                                        Selected Pages: {selectedPages.size} / {file.totalPages}
                                    </Label>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="select-all"
                                            checked={selectedPages.size === file.totalPages && file.totalPages > 0}
                                            onCheckedChange={(checked) => toggleSelectAllPages(Boolean(checked))}
                                            disabled={isRenderingPreviews || extractMode === 'all'}
                                        />
                                        <Label htmlFor="select-all">Select All</Label>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 max-h-96 overflow-y-auto pr-2">
                                    {pagePreviews.map(preview => (
                                        <PagePreviewCard 
                                            key={preview.pageNumber}
                                            {...preview}
                                            isSelected={extractMode === 'all' || selectedPages.has(preview.pageNumber)}
                                            onToggle={extractMode === 'select' ? toggleSelectPage : undefined}
                                            showCheckbox={extractMode === 'select'}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>


            {splitError && (
                <p className="text-sm text-destructive mt-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> {splitError}
                </p>
            )}
            <div className="mt-8">
              {isSplitting ? (
                <Button size="lg" className="w-full text-base font-bold" disabled>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Splitting...
                </Button>
              ) : (
                <Button size="lg" className="w-full text-base font-bold" onClick={handleSplit} disabled={isSplitting || isRenderingPreviews}>
                  <Scissors className="mr-2 h-5 w-5" />
                  Split PDF
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

    