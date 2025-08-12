"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud,
  File as FileIcon,
  X,
  FolderOpen,
  Loader2,
  Lock,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { motion } from "framer-motion";

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

const MAX_FILE_SIZE_MB = 100;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

type PageInfo = {
  pageNumber: number;
  dataUrl?: string;
  pdfjsPage: pdfjsLib.PDFPageProxy;
};

type PDFFile = {
  id: string;
  file: File;
  totalPages: number;
  pdfjsDoc: pdfjsLib.PDFDocumentProxy;
  isEncrypted: boolean;
};

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const PageThumbnail = React.memo(({ pageInfo, isSelected, onClick, onVisible }: { pageInfo: PageInfo; isSelected: boolean; onClick: () => void; onVisible: (pageNumber: number) => void; }) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !pageInfo.dataUrl) {
                onVisible(pageInfo.pageNumber);
                if (ref.current) observer.unobserve(ref.current);
            }
        }, { threshold: 0.1 });

        if (ref.current) observer.observe(ref.current);

        return () => {
            if (ref.current) observer.unobserve(ref.current);
        };
    }, [pageInfo.pageNumber, pageInfo.dataUrl, onVisible]);

    return (
        <div
            ref={ref}
            onClick={onClick}
            className={cn(
                "relative rounded-lg border-2 bg-background cursor-pointer transition-all duration-200 aspect-[7/10]",
                isSelected ? "border-primary shadow-md" : "border-transparent hover:border-primary/50"
            )}
        >
            {pageInfo.dataUrl ? (
                <img src={pageInfo.dataUrl} alt={`Page ${pageInfo.pageNumber}`} className="w-full h-full object-contain" />
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span>Page {pageInfo.pageNumber}</span>
                </div>
            )}
            <div className="absolute top-1 right-1 bg-background/80 text-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border shadow-sm">
                {pageInfo.pageNumber}
            </div>
        </div>
    );
});
PageThumbnail.displayName = 'PageThumbnail';


export function PdfEditor() {
  const [file, setFile] = useState<PDFFile | null>(null);
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [selectedPage, setSelectedPage] = useState<PageInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);

  const { toast } = useToast();
  const operationId = useRef<number>(0);

  const renderPdfPage = useCallback(async (pdfjsPage: pdfjsLib.PDFPageProxy, scale: number = 1.0): Promise<string | null> => {
    try {
        const viewport = pdfjsPage.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext('2d');
        if (context) {
            await pdfjsPage.render({ canvasContext: context, viewport }).promise;
            return canvas.toDataURL('image/jpeg', 0.9);
        }
    } catch (e) {
      console.error(`Error rendering page ${pdfjsPage.pageNumber}:`, e);
    }
    return null;
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      const singleFile = acceptedFiles[0];
      
      const currentOperationId = ++operationId.current;
      setIsLoading(true);

      try {
        const pdfBytes = await singleFile.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfBytes) });
        const pdfjsDoc = await loadingTask.promise; 

        if (operationId.current !== currentOperationId) {
          pdfjsDoc.destroy();
          return;
        }
        
        const pageCount = pdfjsDoc.numPages;
        
        const pagePromises: Promise<pdfjsLib.PDFPageProxy>[] = [];
        for (let i = 1; i <= pageCount; i++) {
          pagePromises.push(pdfjsDoc.getPage(i));
        }
        const pdfjsPages = await Promise.all(pagePromises);
        
        const pageInfos = pdfjsPages.map((p, i) => ({
          pageNumber: i + 1,
          pdfjsPage: p
        }));

        setPages(pageInfos);
        setFile({ 
          id: `${singleFile.name}-${Date.now()}`, 
          file: singleFile, 
          totalPages: pageCount,
          pdfjsDoc,
          isEncrypted: false,
        });

      } catch (error: any) {
          if (operationId.current !== currentOperationId) return;
          
          if (error.name === 'PasswordException') {
              setFile({
                  id: `${singleFile.name}-${Date.now()}`,
                  file: singleFile,
                  totalPages: 0,
                  isEncrypted: true,
                  pdfjsDoc: new Proxy({}, { get: () => { throw new Error("Document is encrypted")}}) as any,
              })
          } else {
              console.error("Failed to load PDF", error);
              toast({ variant: "destructive", title: "Could not read PDF", description: "The file might be corrupted or in an unsupported format." });
          }
      } finally {
          if (operationId.current === currentOperationId) {
              setIsLoading(false);
          }
      }
    }, [toast]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxSize: MAX_FILE_SIZE_BYTES,
    multiple: false,
    noClick: true,
    noKeyboard: true,
    disabled: isLoading,
  });

  const removeFile = () => {
    operationId.current++;
    if(file?.pdfjsDoc) file.pdfjsDoc.destroy();
    setFile(null);
    setPages([]);
    setSelectedPage(null);
    setIsLoading(false);
  };
  
  const onThumbnailVisible = useCallback(async (pageNumber: number) => {
     setPages(currentPages => {
        const pageIndex = currentPages.findIndex(p => p.pageNumber === pageNumber);
        if (pageIndex === -1 || currentPages[pageIndex].dataUrl) {
          return currentPages;
        }
        
        const pageToRender = currentPages[pageIndex];
        renderPdfPage(pageToRender.pdfjsPage, 0.4).then(dataUrl => {
            if(dataUrl) {
                 setPages(prev => prev.map(p => p.pageNumber === pageNumber ? {...p, dataUrl} : p));
            }
        });
        return currentPages;
     });
  }, [renderPdfPage]);
  
  const handlePageSelect = async (pageInfo: PageInfo) => {
    setSelectedPage(pageInfo);
  };

  useEffect(() => {
    if (pages.length > 0 && !selectedPage) {
        handlePageSelect(pages[0]);
    }
  }, [pages, selectedPage]);

  useEffect(() => {
    const renderMainCanvas = async () => {
        if (!selectedPage || !mainCanvasRef.current) return;
        
        const canvas = mainCanvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;
        
        // Show a temporary low-res preview
        if(selectedPage.dataUrl) {
          const img = new Image();
          img.onload = () => {
            canvas.width = img.width * 3.75; // Scale up for better temp quality
            canvas.height = img.height * 3.75;
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = selectedPage.dataUrl;
        } else {
            // If no thumbnail, show loading state
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.fillStyle = "#f1f5f9";
            context.fillRect(0,0, canvas.width, canvas.height);
        }

        // Render high-res version
        const dataUrl = await renderPdfPage(selectedPage.pdfjsPage, 1.5);
        if(dataUrl) {
          const img = new Image();
          img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(img, 0, 0);
          };
          img.src = dataUrl;
        }
    }
    renderMainCanvas();
  }, [selectedPage, renderPdfPage]);


  if (!file) {
    return (
        <Card className="bg-transparent shadow-lg max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">Upload PDF</CardTitle>
                <CardDescription>Select a PDF file to start editing.</CardDescription>
            </CardHeader>
            <CardContent>
            <div
                {...getRootProps()}
                className={cn(
                "flex flex-col items-center justify-center p-6 sm:p-10 rounded-lg border-2 border-dashed transition-colors duration-300",
                !isLoading && "hover:border-primary/50",
                isDragActive && "border-primary bg-primary/10",
                isLoading && "opacity-70 pointer-events-none"
                )}
            >
                <input {...getInputProps()} />
                {isLoading ? (
                    <>
                     <Loader2 className="w-10 h-10 text-primary animate-spin sm:w-12 sm:h-12" />
                     <p className="mt-4 text-base font-semibold text-primary sm:text-lg">Loading PDF...</p>
                    </>
                ) : (
                    <>
                        <UploadCloud className="w-10 h-10 text-muted-foreground sm:w-12 sm:h-12" />
                        <p className="mt-2 text-base font-semibold text-foreground sm:text-lg">Drop a PDF file here</p>
                        <p className="text-xs text-muted-foreground sm:text-sm">or click the button below</p>
                        <motion.div whileHover={{ scale: 1.05, y: -2 }} transition={{ type: 'spring', stiffness: 400, damping: 10 }}>
                            <Button type="button" onClick={open} className="mt-4" disabled={isLoading}>
                                <FolderOpen className="mr-2 h-4 w-4" />Choose File
                            </Button>
                        </motion.div>
                    </>
                )}
            </div>
            </CardContent>
        </Card>
    );
  }

  return (
     <div className="flex flex-col h-full">
        <Card className="mb-4">
            <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-4">
                <div className="flex items-center gap-3 min-w-0">
                    <FileIcon className="w-6 h-6 text-destructive hidden sm:block shrink-0"/>
                    <div className="min-w-0">
                        <CardTitle className="text-base sm:text-lg truncate" title={file.file.name}>{file.file.name}</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">{formatBytes(file.file.size)} - {file.totalPages} pages</CardDescription>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">Save</Button>
                    <Button variant="ghost" size="icon" onClick={removeFile} className="w-8 h-8">
                        <X className="w-5 h-5" />
                    </Button>
                </div>
            </CardHeader>
            {file.isEncrypted && (
                <CardContent className="p-4 pt-0">
                    <div className="flex items-center gap-3 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3 text-sm text-yellow-700 dark:text-yellow-400">
                        <ShieldAlert className="h-5 w-5 shrink-0" />
                        <div>This PDF is password-protected and cannot be edited. Please upload an unlocked file.</div>
                    </div>
                </CardContent>
            )}
        </Card>
        
        {!file.isEncrypted && (
            <div className="flex-1 grid grid-cols-12 gap-4 overflow-hidden h-full">
                <div className="col-span-3 lg:col-span-2 h-full overflow-y-auto pr-3 -mr-3">
                    <div className="grid grid-cols-1 gap-3">
                        {pages.map(page => (
                            <PageThumbnail 
                                key={page.pageNumber}
                                pageInfo={page}
                                isSelected={selectedPage?.pageNumber === page.pageNumber}
                                onClick={() => handlePageSelect(page)}
                                onVisible={onThumbnailVisible}
                            />
                        ))}
                    </div>
                </div>
                <div className="col-span-9 lg:col-span-10 bg-muted/40 rounded-lg flex items-center justify-center p-4 overflow-auto">
                    <canvas ref={mainCanvasRef} className="max-w-full max-h-full object-contain shadow-lg border"></canvas>
                </div>
            </div>
        )}
     </div>
  );
}
