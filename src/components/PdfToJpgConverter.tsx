
"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud,
  Download,
  X,
  CheckCircle,
  Image as ImageIcon,
  FolderOpen,
  Loader2,
  Ban,
  FileArchive,
  Lock,
  ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import * as pdfjsLib from 'pdfjs-dist';
import { Progress } from "./ui/progress";
import JSZip from "jszip";
import { Label } from "./ui/label";
import { motion, AnimatePresence } from "framer-motion";

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

type ConversionResult = {
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
    );
});
PagePreviewCard.displayName = 'PagePreviewCard';

export function PdfToJpgConverter() {
  const [file, setFile] = useState<PDFFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionResults, setConversionResults] = useState<ConversionResult[]>([]);
  const [pagePreviews, setPagePreviews] = useState<PagePreview[]>([]);
  
  const [conversionProgress, setConversionProgress] = useState(0);

  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();
  
  const operationId = useRef<number>(0);
  
  useEffect(() => {
    // Cleanup on unmount
    return () => {
      operationId.current++; // Invalidate any running operations
      if(file?.pdfjsDoc) {
          file.pdfjsDoc.destroy();
      }
      conversionResults.forEach(r => URL.revokeObjectURL(r.url));
    }
  }, [file, conversionResults]);

  const renderPdfPage = useCallback(async (pdfjsDoc: pdfjsLib.PDFDocumentProxy, pageNum: number, currentOperationId: number, scale: number = 0.5): Promise<string | null> => {
    if (operationId.current !== currentOperationId) return null;
    try {
        const page = await pdfjsDoc.getPage(pageNum);
        if (operationId.current !== currentOperationId) return null;
        
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
            context.fillStyle = 'white';
            context.fillRect(0, 0, canvas.width, canvas.height);
            const renderContext = {
                canvasContext: context,
                viewport: viewport,
                renderInteractiveForms: false,
                enableWebGL: false,
            };
            const renderTask = page.render(renderContext);
            await renderTask.promise;
             if (operationId.current !== currentOperationId) return null;
            return canvas.toDataURL('image/jpeg', 0.9);
        }
    } catch (e) {
        if (operationId.current === currentOperationId) {
            console.error(`Error rendering page ${pageNum}:`, e);
        }
    }
    return null;
  }, []);
  
  const loadPdf = useCallback(async (fileToLoad: File) => {
    const currentOperationId = ++operationId.current;
    setIsProcessing(true);
    setPagePreviews([]);
    
    let isEncrypted = false;
    try {
        const pdfBytes = await fileToLoad.arrayBuffer();
        const pdfjsDoc = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
        const totalPages = pdfjsDoc.numPages;

        setFile({ id: `${fileToLoad.name}-${Date.now()}`, file: fileToLoad, totalPages, pdfjsDoc, isEncrypted: false });
        setSelectedPages(new Set(Array.from({ length: totalPages }, (_, i) => i + 1))); // Select all by default
        setConversionResults([]);
        setError(null);
        
        const previews: PagePreview[] = Array(totalPages).fill(null).map((_, i) => ({ pageNumber: i + 1, dataUrl: null, isVisible: false }));
        setPagePreviews(previews);

        toast({
            variant: "success",
            title: "File Uploaded",
            description: `"${fileToLoad.name}" is ready for conversion.`
        });

    } catch (error: any) {
        if (operationId.current !== currentOperationId) return;

        if (error.name === 'PasswordException') {
            isEncrypted = true;
            setFile({ id: `${fileToLoad.name}-${Date.now()}`, file: fileToLoad, isEncrypted: true, totalPages: 0, pdfjsDoc: null });
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
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 1) {
        toast({ variant: "destructive", title: "One file at a time", description: "This tool only supports processing one PDF at a time. Please upload a single file." });
        return;
      }
      if (acceptedFiles.length === 0) return;
      const singleFile = acceptedFiles[0];
      loadPdf(singleFile);
    },
    [loadPdf, toast]
  );
  
  const onPageVisible = useCallback((pageNumber: number) => {
    if (!file || isConverting || file.isEncrypted || !file.pdfjsDoc) return;
    const currentOperationId = operationId.current;

    setPagePreviews(prev => {
        const pageIndex = prev.findIndex(p => p.pageNumber === pageNumber);
        if (pageIndex === -1 || prev[pageIndex].dataUrl || prev[pageIndex].isVisible) {
            return prev;
        }

        const newPreviews = [...prev];
        newPreviews[pageIndex] = { ...newPreviews[pageIndex], isVisible: true };
        
        renderPdfPage(file.pdfjsDoc!, pageNumber, currentOperationId, 0.5).then(dataUrl => {
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
  }, [file, renderPdfPage, isConverting]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
    noClick: true,
    noKeyboard: true,
    maxSize: MAX_FILE_SIZE_BYTES,
    disabled: isProcessing || isConverting,
  });

  const removeFile = () => {
    const fileName = file?.file.name;
    operationId.current++;
    if (file?.pdfjsDoc) file.pdfjsDoc.destroy();
    setFile(null);
    setIsProcessing(false);
    setConversionResults([]);
    setPagePreviews([]);
    setError(null);
    if (fileName) {
        toast({ variant: "info", title: `Removed "${fileName}"` });
    }
  };
  
  const handleConvert = async () => {
    const fileToProcess = file?.file;
    
    if (!fileToProcess || !file?.pdfjsDoc) {
        setError("Please upload a PDF file first.");
        return;
    }
    if (file.isEncrypted) {
        setError("This PDF is password-protected and cannot be converted.");
        return;
    }
    if (selectedPages.size === 0) {
        setError("Please select at least one page to convert.");
        return;
    }
    
    const currentOperationId = ++operationId.current;

    setIsConverting(true);
    setConversionProgress(0);
    setError(null);

    try {
        const zip = new JSZip();
        const results: ConversionResult[] = [];
        const pagesToConvert = Array.from(selectedPages).sort((a,b)=>a-b);
        const totalToConvert = pagesToConvert.length;
        
        for (let i = 0; i < totalToConvert; i++) {
            if (operationId.current !== currentOperationId) break;
            const pageNum = pagesToConvert[i];
            
            const dataUrl = await renderPdfPage(file.pdfjsDoc, pageNum, currentOperationId, 2.0); // Higher scale for quality
            if(dataUrl) {
                const blob = await (await fetch(dataUrl)).blob();
                const filename = `${file.file.name.replace(/\.pdf$/i, '')}_page_${pageNum}.jpg`;
                zip.file(filename, blob);
                
                if (totalToConvert === 1) {
                    results.push({ filename, url: URL.createObjectURL(blob) });
                }
            }
            setConversionProgress(((i + 1) / totalToConvert) * 100);
        }

        if (operationId.current !== currentOperationId) {
            results.forEach(r => URL.revokeObjectURL(r.url));
            return;
        }

        if (totalToConvert > 1) {
            const zipBlob = await zip.generateAsync({ type: "blob" });
            results.push({
                filename: `${file.file.name.replace(/\.pdf$/i, '')}_images.zip`,
                url: URL.createObjectURL(zipBlob),
            });
        }
        
        setConversionResults(results);
        toast({
            variant: "success",
            title: "Conversion Successful!",
            description: `Converted ${totalToConvert} page(s) to JPG.`,
        });
    } catch (err: any) {
        if (operationId.current === currentOperationId) {
            setError("An error occurred during conversion.");
            toast({ variant: "destructive", title: "Conversion Failed", description: err.message || "Please try again." });
        }
    } finally {
        if (operationId.current === currentOperationId) {
            setIsConverting(false);
        }
    }
  };

  const handleCancelConvert = () => {
    operationId.current++;
    setIsConverting(false);
    setConversionProgress(0);
    setError(null);
    toast({ variant: "info", title: "Conversion cancelled." });
  };
  
  const handleConvertAgain = () => {
    conversionResults.forEach(r => URL.revokeObjectURL(r.url));
    setConversionResults([]);
    removeFile();
  };
  
  const handleDownload = () => {
    if (conversionResults.length === 0) return;
    const result = conversionResults[0];
    const link = document.createElement("a");
    link.href = result.url;
    link.download = result.filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(result.url);
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
    setError(null);
  };

  const toggleSelectAllPages = (checked: boolean) => {
    if (checked) {
      setSelectedPages(new Set(Array.from({ length: file?.totalPages || 0 }, (_, i) => i + 1)));
    } else {
      setSelectedPages(new Set());
    }
  };


  if (conversionResults.length > 0) {
    return (
      <div className="text-center flex flex-col items-center justify-center py-12 animate-in fade-in duration-500 bg-transparent p-4 sm:p-8 rounded-xl">
        <CheckCircle className="w-16 h-16 sm:w-20 sm:h-20 text-green-500 mb-6" />
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Conversion Complete!</h2>
        <p className="text-muted-foreground mb-8 text-sm sm:text-base">Your JPG images are ready for download.</p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4">
          <Button size="lg" onClick={handleDownload} className="w-full sm:w-auto text-base font-bold bg-green-600 hover:bg-green-700 text-white">
             {conversionResults[0].filename.endsWith('.zip') ? (
                <FileArchive className="mr-2 h-5 w-5" />
             ) : (
                <Download className="mr-2 h-5 w-5" />
             )}
            Download
          </Button>
          <Button size="lg" variant="outline" onClick={handleConvertAgain} className="w-full sm:w-auto text-base">
            Convert Another PDF
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-transparent shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Upload PDF to Convert</CardTitle>
          <CardDescription>
            Select a single PDF file to convert to JPG images.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!file && !isProcessing ? (
            <div
              {...getRootProps()}
              className={cn(
                "flex flex-col items-center justify-center p-6 sm:p-10 rounded-lg border-2 border-dashed transition-colors duration-300",
                !isConverting && "hover:border-primary/50",
                isDragActive && "border-primary bg-primary/10"
              )}
            >
              <input {...getInputProps()} />
              <UploadCloud className="w-10 h-10 text-muted-foreground sm:w-12 sm:h-12" />
              <p className="mt-2 text-base font-semibold text-foreground sm:text-lg">
                Drop a PDF file here
              </p>
              <p className="text-xs text-muted-foreground sm:text-sm">or click the button below</p>
              <motion.div whileHover={{ scale: 1.05, y: -2 }} transition={{ type: 'spring', stiffness: 400, damping: 10 }}>
                <Button type="button" onClick={open} className="mt-4" disabled={isProcessing || isConverting}>
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
                    {file?.isEncrypted ? <Lock className="h-6 w-6 text-yellow-500 shrink-0" /> : <ImageIcon className="w-6 h-6 text-destructive shrink-0" />}
                    <div className="flex flex-col overflow-hidden">
                        {file ? (
                          <>
                            <span className="text-sm font-medium truncate" title={file.file.name}>{file.file.name}</span>
                            <span className="text-xs text-muted-foreground">
                                {formatBytes(file.file.size)} {file.isEncrypted ? '(Encrypted)' : `• ${file.totalPages} pages`}
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
                    <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground/70 hover:bg-destructive/10 hover:text-destructive shrink-0" onClick={removeFile} disabled={isConverting}>
                        <X className="w-4 h-4" />
                    </Button>
                ))}
             </div>
          )}
        </CardContent>
      </Card>

      {file && (
        <Card className="bg-transparent shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Conversion Options</CardTitle>
          </CardHeader>
          <CardContent>
            {file.isEncrypted ? (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                    <ShieldAlert className="w-10 h-10 text-destructive mb-4" />
                    <p className="font-semibold text-lg">This PDF is password-protected.</p>
                    <p className="text-sm text-muted-foreground">Please upload an unlocked file to convert.</p>
                </div>
            ) : isProcessing ? (
                <div className="flex flex-col justify-center items-center h-48">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="mt-4 mb-2">Processing PDF...</p>
                </div>
            ) : (
                 <PageVisibilityContext.Provider value={{ onVisible: onPageVisible }}>
                    <div className={cn(isConverting && "opacity-70 pointer-events-none")}>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                            <Label className="font-semibold text-base sm:text-lg">
                                Selected Pages: {selectedPages.size} / {file.totalPages}
                            </Label>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="select-all"
                                    checked={selectedPages.size === file.totalPages && file.totalPages > 0}
                                    onCheckedChange={(checked) => toggleSelectAllPages(Boolean(checked))}
                                    disabled={isConverting}
                                />
                                <Label htmlFor="select-all">Select All</Label>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-4 max-h-96 overflow-y-auto pr-2">
                            {pagePreviews.map(preview => (
                                <PagePreviewCard 
                                    key={preview.pageNumber}
                                    {...preview}
                                    isSelected={selectedPages.has(preview.pageNumber)}
                                    onToggle={toggleSelectPage}
                                    showCheckbox={true}
                                    disabled={isConverting}
                                />
                            ))}
                        </div>
                    </div>
                 </PageVisibilityContext.Provider>
            )}


            {error && (
                <p className="text-sm text-destructive mt-4 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" /> {error}
                </p>
            )}
            <div className="mt-8 pt-6 border-t">
              <AnimatePresence mode="wait">
              {isConverting ? (
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
                                <p className="text-sm font-medium text-primary">Converting to JPG...</p>
                            </div>
                            <p className="text-sm font-medium text-primary">{Math.round(conversionProgress)}%</p>
                        </div>
                        <Progress value={conversionProgress} className="h-2" />
                    </div>
                    <Button size="sm" variant="destructive" onClick={handleCancelConvert} className="w-full">
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
                    <Button size="lg" className="w-full text-base font-bold" onClick={handleConvert} disabled={isProcessing || isConverting || !file || file.isEncrypted || selectedPages.size === 0}>
                    <ImageIcon className="mr-2 h-5 w-5" />
                    Convert to JPG
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
