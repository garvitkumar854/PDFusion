"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud,
  X,
  FolderOpen,
  Loader2,
  Lock,
  File as FileIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import * as pdfjsLib from 'pdfjs-dist';
import { motion } from "framer-motion";
import { PdfSidebar, PageInfo } from "./PdfSidebar";

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

const MAX_FILE_SIZE_MB = 100;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

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
  
  const removeFile = useCallback(() => {
    operationId.current++;
    if(file?.pdfjsDoc) file.pdfjsDoc.destroy();
    setFile(null);
    setPages([]);
    setIsLoading(false);
    setSelectedPage(null);
  }, [file]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      const singleFile = acceptedFiles[0];
      
      const currentOperationId = ++operationId.current;
      removeFile();
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
        
        const pageInfos: PageInfo[] = pdfjsPages.map((p, i) => ({
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
        setSelectedPage(pageInfos[0]);

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
    }, [toast, removeFile]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxSize: MAX_FILE_SIZE_BYTES,
    multiple: false,
    noClick: true,
    noKeyboard: true,
    disabled: isLoading,
  });

  const onThumbnailVisible = useCallback(async (pageNumber: number) => {
     setPages(currentPages => {
        const pageIndex = currentPages.findIndex(p => p.pageNumber === pageNumber);
        if (pageIndex === -1 || currentPages[pageIndex].dataUrl || !file?.pdfjsDoc) {
          return currentPages;
        }
        
        const pageToRender = currentPages[pageIndex];
        renderPdfPage(file.pdfjsDoc.getPage(pageToRender.pageNumber), 0.4).then(dataUrl => {
            if(dataUrl) {
                 setPages(prev => prev.map(p => p.pageNumber === pageNumber ? {...p, dataUrl} : p));
            }
        });
        return currentPages;
     });
  }, [file, renderPdfPage]);

  const handlePageSelect = (page: PageInfo) => {
    setSelectedPage(page);
  };
  
  useEffect(() => {
    const renderMainCanvas = async () => {
        if (!selectedPage || !mainCanvasRef.current) return;
        
        const canvas = mainCanvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;
        
        // Show low-res preview immediately
        context.clearRect(0, 0, canvas.width, canvas.height);
        const lowResDataUrl = pages.find(p => p.pageNumber === selectedPage.pageNumber)?.dataUrl;
        if (lowResDataUrl) {
          const img = new Image();
          img.onload = () => {
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;
            if(tempCtx) tempCtx.drawImage(img, 0, 0);

            canvas.width = tempCanvas.width * 2;
            canvas.height = tempCanvas.height * 2;
            context.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
          };
          img.src = lowResDataUrl;
        } else {
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
  }, [selectedPage, renderPdfPage, pages]);


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
    <div className="flex flex-col h-full gap-4">
        <Card className="bg-transparent shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between p-4">
                <div className="flex items-center gap-3 overflow-hidden">
                    {file.isEncrypted ? <Lock className="w-6 h-6 text-yellow-500 sm:w-8 sm:h-8 shrink-0" /> : <FileIcon className="w-6 h-6 text-destructive sm:w-8 sm:h-8 shrink-0" />}
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-medium truncate" title={file.file.name}>{file.file.name}</span>
                        <span className="text-xs text-muted-foreground">{formatBytes(file.file.size)}</span>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground/70 hover:bg-destructive/10 hover:text-destructive shrink-0" onClick={removeFile}>
                    <X className="w-4 h-4" />
                </Button>
            </CardHeader>
        </Card>
     <div className="grid grid-cols-12 gap-4 h-[calc(100vh-14rem)]">
        <div className="col-span-3 lg:col-span-2 h-full overflow-y-auto pr-2">
            <PdfSidebar
                pages={pages}
                selectedPage={selectedPage}
                onPageSelect={handlePageSelect}
                onThumbnailVisible={onThumbnailVisible}
            />
        </div>
        <div className="col-span-9 lg:col-span-10 bg-muted/40 rounded-lg flex items-center justify-center p-4 overflow-auto">
            <canvas ref={mainCanvasRef} className="max-w-full max-h-full object-contain shadow-lg border"></canvas>
        </div>
    </div>
    </div>
  );
}
