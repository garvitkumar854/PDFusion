
"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud,
  Download,
  X,
  Save,
  Loader2,
  RotateCw,
  Trash2,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PDFDocument, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { Skeleton } from "./ui/skeleton";

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

const MAX_FILE_SIZE_MB = 100;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

type PageInfo = {
  originalIndex: number;
  rotation: number;
  dataUrl?: string;
  id: string; 
};

type PDFFile = {
  id: string;
  file: File;
  totalPages: number;
  pdfjsDoc: pdfjsLib.PDFDocumentProxy;
};

export function PdfOrganizer() {
  const [file, setFile] = useState<PDFFile | null>(null);
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const dragItem = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const operationId = useRef<number>(0);
  const { toast } = useToast();
  
  // Cleanup resources when component unmounts
  useEffect(() => {
    return () => {
      if(file?.pdfjsDoc) {
        file.pdfjsDoc.destroy();
      }
    }
  }, [file]);

  const renderPage = useCallback(async (pdfjsDoc: pdfjsLib.PDFDocumentProxy, pageNum: number, currentOperationId: number) => {
    if (operationId.current !== currentOperationId) return undefined;
    try {
      const page = await pdfjsDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 0.5 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext('2d');
      if (context) {
        await page.render({ canvasContext: context, viewport }).promise;
        return canvas.toDataURL('image/jpeg', 0.8);
      }
    } catch (e) {
      console.error(`Error rendering page ${pageNum}:`, e);
    }
    return undefined;
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    // Increment operation ID to cancel any pending rendering from previous files.
    const currentOperationId = ++operationId.current;
    
    // Cleanup previous state before processing a new file.
    if(file?.pdfjsDoc) file.pdfjsDoc.destroy();
    setFile(null);
    setPages([]);

    setIsLoading(true);

    try {
      const singleFile = acceptedFiles[0];
      const pdfBytes = await singleFile.arrayBuffer();
      // Use both pdf-lib for saving and pdf.js for rendering.
      const pdfjsDoc = await pdfjsLib.getDocument({ data: pdfBytes }).promise; 

      if (operationId.current !== currentOperationId) {
        pdfjsDoc.destroy();
        return;
      }
      
      const pageCount = pdfjsDoc.numPages;
      const initialPages: PageInfo[] = Array.from({ length: pageCount }, (_, i) => ({
        originalIndex: i,
        rotation: 0,
        id: `${i}-${Date.now()}`,
      }));
      
      setFile({ 
        id: `${singleFile.name}-${Date.now()}`, 
        file: singleFile, 
        totalPages: pageCount,
        pdfjsDoc 
      });
      setPages(initialPages);

    } catch (error) {
      if (operationId.current === currentOperationId) {
        console.error("Failed to load PDF", error);
        toast({ variant: "destructive", title: "Could not read PDF", description: "The file might be corrupted or encrypted." });
      }
    } finally {
      if (operationId.current === currentOperationId) {
        setIsLoading(false);
      }
    }
  }, [file?.pdfjsDoc, toast]);
  
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxSize: MAX_FILE_SIZE_BYTES,
    multiple: false,
    noClick: true,
    noKeyboard: true,
    disabled: isLoading || isSaving,
  });
  
  const onPageVisible = useCallback((id: string) => {
    if (!file || isLoading) return;
    const currentOperationId = operationId.current;

    setPages(prev => {
        const pageIndex = prev.findIndex(p => p.id === id);
        // Only render if page exists and doesn't have a dataUrl yet.
        if (pageIndex === -1 || prev[pageIndex].dataUrl) {
            return prev;
        }
        
        const newPages = [...prev];
        const pageInfo = newPages[pageIndex];

        renderPage(file.pdfjsDoc, pageInfo.originalIndex + 1, currentOperationId).then(dataUrl => {
            // Check operationId again inside promise to prevent state updates from old operations.
            if (dataUrl && operationId.current === currentOperationId) {
                setPages(current => {
                    const latestIndex = current.findIndex(p => p.id === id);
                    if (latestIndex > -1) {
                       const finalPages = [...current];
                       finalPages[latestIndex] = { ...finalPages[latestIndex], dataUrl };
                       return finalPages;
                    }
                    return current;
                });
            }
        });
        
        return newPages;
    });
  }, [file, renderPage, isLoading]);
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    dragItem.current = index;
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => setIsDragging(true), 0);
  };
  
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (dragItem.current === null || dragItem.current === index) return;

    setPages(prevPages => {
        const newPages = [...prevPages];
        const draggedItemContent = newPages.splice(dragItem.current!, 1)[0];
        newPages.splice(index, 0, draggedItemContent);
        dragItem.current = index;
        return newPages;
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    dragItem.current = null;
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }
  
  const rotatePage = (id: string) => {
    setPages(prev => prev.map(p => p.id === id ? {...p, rotation: (p.rotation + 90) % 360} : p));
  };
  
  const deletePage = (id: string) => {
    setPages(prev => prev.filter(p => p.id !== id));
  };
  
  const handleSave = async () => {
    if (!file || pages.length === 0) {
      toast({ variant: "destructive", title: "No pages to save." });
      return;
    }

    setIsSaving(true);
    try {
      // Use original file bytes to load with pdf-lib for manipulation
      const pdfBytes = await file.file.arrayBuffer();
      const pdfLibDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      
      const newPdfDoc = await PDFDocument.create();
      
      const pageIndicesToCopy = pages.map(p => p.originalIndex);

      // This can be slow for large PDFs, but is necessary.
      const copiedPages = await newPdfDoc.copyPages(pdfLibDoc, pageIndicesToCopy);
      
      copiedPages.forEach((page, index) => {
        const rotationAngle = pages[index].rotation;
        if (rotationAngle !== 0) {
          page.setRotation(degrees(rotationAngle));
        }
        newPdfDoc.addPage(page);
      });
      
      const newPdfBytes = await newPdfDoc.save();
      const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${file.file.name.replace(/\.pdf$/i, '')}_organized.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({ title: "Successfully saved!", description: "Your organized PDF has been downloaded." });

    } catch (e: any) {
      console.error("Failed to save PDF", e);
      toast({ variant: "destructive", title: "Failed to save PDF.", description: "An unexpected error occurred. " + e.message});
    } finally {
      setIsSaving(false);
    }
  };
  
  const removeFile = () => {
    operationId.current++;
    if(file?.pdfjsDoc) file.pdfjsDoc.destroy();
    setFile(null);
    setPages([]);
  };

  return (
    <div className="space-y-6" {...getRootProps()}>
      <input {...getInputProps()} />
      {!file && !isLoading && (
        <Card className="hover:border-primary/50 cursor-pointer" onClick={open}>
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Organize PDF</CardTitle>
            <CardDescription>Upload a PDF to reorder, rotate, or delete its pages.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={cn("flex flex-col items-center justify-center p-6 sm:p-10 rounded-lg border-2 border-dashed transition-colors duration-300", isDragActive && "border-primary bg-primary/10")}>
              <UploadCloud className="w-10 h-10 text-muted-foreground" />
              <p className="mt-2 text-base font-semibold text-foreground">
                Drop a PDF file here
              </p>
              <p className="text-xs text-muted-foreground">or click to select a file</p>
            </div>
          </CardContent>
        </Card>
      )}

      {(isLoading || file) && (
        <>
            <Card className="sticky top-20 z-10 bg-background/80 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between p-3 md:p-4">
                    <div>
                        <CardTitle className="text-base sm:text-lg truncate max-w-[150px] sm:max-w-xs md:max-w-lg" title={file?.file.name}>Organizing: {file?.file.name || '...'}</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">{file ? `${pages.length} pages` : 'Loading...'}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                         <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground/70 hover:bg-destructive/10 hover:text-destructive shrink-0" onClick={removeFile} disabled={isSaving || isLoading}>
                            <X className="w-4 h-4" />
                         </Button>
                         <Button size="sm" onClick={handleSave} disabled={isSaving || isLoading || !file}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save
                         </Button>
                    </div>
                </CardHeader>
            </Card>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4" onDragOver={handleDragOver}>
              {isLoading ? (
                  Array.from({ length: 12 }).map((_, i) => (
                       <div key={i} className="rounded-md overflow-hidden border transition-all aspect-[7/10] bg-muted group flex flex-col items-center justify-center gap-2">
                           <Skeleton className="w-full h-full" />
                       </div>
                  ))
              ) : (
                  pages.map((page, index) => (
                    <PageCard
                        key={page.id}
                        page={page}
                        index={index}
                        onVisible={onPageVisible}
                        onRotate={rotatePage}
                        onDelete={deletePage}
                        onDragStart={handleDragStart}
                        onDragEnter={handleDragEnter}
                        onDragEnd={handleDragEnd}
                        isSaving={isSaving}
                        isDragging={isDragging && dragItem.current === index}
                    />
                  ))
              )}
            </div>
        </>
      )}
    </div>
  );
}

const PageCard = React.memo(({ page, index, onVisible, onRotate, onDelete, onDragStart, onDragEnter, onDragEnd, isSaving, isDragging }: { page: PageInfo, index: number, onVisible: (id: string) => void, onRotate: (id: string) => void, onDelete: (id: string) => void, onDragStart: (e: React.DragEvent<HTMLDivElement>, index: number) => void, onDragEnter: (e: React.DragEvent<HTMLDivElement>, index: number) => void, onDragEnd: () => void, isSaving: boolean, isDragging: boolean }) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !page.dataUrl) {
                onVisible(page.id);
                 if (ref.current) observer.unobserve(ref.current);
            }
        }, { threshold: 0.1 });

        const currentRef = ref.current;
        if (currentRef) observer.observe(currentRef);

        return () => {
            if (currentRef) observer.unobserve(currentRef);
        };
    }, [page.id, page.dataUrl, onVisible]);

    return (
        <div 
            ref={ref}
            draggable={!isSaving}
            onDragStart={(e) => onDragStart(e, index)}
            onDragEnter={(e) => onDragEnter(e, index)}
            onDragEnd={onDragEnd}
            className={cn(
                "relative rounded-lg overflow-hidden border-2 transition-all duration-300 aspect-[7/10] bg-muted group shadow-sm",
                isSaving ? "cursor-not-allowed opacity-70" : "cursor-grab",
                isDragging ? "shadow-2xl scale-105 opacity-50 border-primary" : "border-transparent hover:shadow-md hover:border-primary/50"
            )}
        >
            <div className="w-full h-full flex items-center justify-center p-1 bg-white">
            {page.dataUrl ? (
                <img src={page.dataUrl} alt={`Page ${page.originalIndex + 1}`} className="w-full h-full object-contain transition-transform duration-300" style={{ transform: `rotate(${page.rotation}deg)` }} />
            ) : (
                <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin text-primary" /> Page {page.originalIndex + 1}</div>
            )}
            </div>
            
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button title="Rotate" size="icon" variant="secondary" onClick={() => onRotate(page.id)} disabled={isSaving} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full"><RotateCw className="w-4 h-4 sm:w-5 sm:h-5" /></Button>
                <Button title="Delete" size="icon" variant="destructive" onClick={() => onDelete(page.id)} disabled={isSaving} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full"><Trash2 className="w-4 h-4 sm:w-5 sm:h-5" /></Button>
            </div>
            
            <div className="absolute top-1 right-1 bg-background/80 text-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border shadow">
                {index + 1}
            </div>
        </div>
    );
});
PageCard.displayName = 'PageCard';
