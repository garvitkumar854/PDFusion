
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
  Lock,
  ShieldAlert,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PDFDocument, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { Skeleton } from "./ui/skeleton";
import { motion } from "framer-motion";


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
  pdfjsDoc?: pdfjsLib.PDFDocumentProxy;
  isEncrypted: boolean;
};


export function PdfOrganizer() {
  const [file, setFile] = useState<PDFFile | null>(null);
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const operationId = useRef<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    return () => {
      // Cleanup pdf.js document to free memory
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
  
  const loadPdf = useCallback(async (fileToLoad: File) => {
    const currentOperationId = ++operationId.current;
    
    if(file?.pdfjsDoc) file.pdfjsDoc.destroy();
    setFile(null);
    setPages([]);
    setIsLoading(true);

    try {
      const pdfBytes = await fileToLoad.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfBytes) });
      const pdfjsDoc = await loadingTask.promise; 

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
        id: `${fileToLoad.name}-${Date.now()}`, 
        file: fileToLoad, 
        totalPages: pageCount,
        pdfjsDoc,
        isEncrypted: false,
      });
      setPages(initialPages);

    } catch (error: any) {
        if (operationId.current !== currentOperationId) return;
        
        if (error.name === 'PasswordException') {
            setFile({
                id: `${fileToLoad.name}-${Date.now()}`,
                file: fileToLoad,
                totalPages: 0,
                isEncrypted: true,
                pdfjsDoc: undefined,
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
  }, [file?.pdfjsDoc, toast]);


  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const singleFile = acceptedFiles[0];
    loadPdf(singleFile);
  }, [loadPdf]);

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
    if (!file || isLoading || !file.pdfjsDoc) return;
    const currentOperationId = operationId.current;

    setPages(prev => {
        const pageIndex = prev.findIndex(p => p.id === id);
        if (pageIndex === -1 || prev[pageIndex].dataUrl) {
            return prev;
        }
        
        const newPages = [...prev];
        const pageInfo = newPages[pageIndex];

        renderPage(file.pdfjsDoc!, pageInfo.originalIndex + 1, currentOperationId).then(dataUrl => {
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
    dragOverItem.current = index;
    const filesCopy = [...pages];
    const draggedItemContent = filesCopy.splice(dragItem.current, 1)[0];
    filesCopy.splice(index, 0, draggedItemContent);
    dragItem.current = index;
    setPages(filesCopy);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const { top, bottom, height } = container.getBoundingClientRect();
    const mouseY = e.clientY;
    
    const scrollThreshold = height * 0.15; // 15% of container height for hot zone
    const maxScrollSpeed = 20; // pixels per frame

    if (mouseY < top + scrollThreshold) {
      const intensity = 1 - (mouseY - top) / scrollThreshold;
      container.scrollTop -= maxScrollSpeed * intensity;
    } else if (mouseY > bottom - scrollThreshold) {
      const intensity = 1 - (bottom - mouseY) / scrollThreshold;
      container.scrollTop += maxScrollSpeed * intensity;
    }
  }
  
  const rotatePage = useCallback((id: string) => {
    setPages(prev => prev.map(p => p.id === id ? {...p, rotation: (p.rotation + 90) % 360} : p));
  }, []);
  
  const deletePage = useCallback((id: string) => {
    setPages(prev => prev.filter(p => p.id !== id));
  }, []);
  
  const handleSave = async () => {
    const fileToProcess = file?.file;
    if (!fileToProcess || pages.length === 0 || file?.isEncrypted) {
      return;
    }

    setIsSaving(true);
    try {
      const pdfBytes = await fileToProcess.arrayBuffer();
      const pdfLibDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      
      const newPdfDoc = await PDFDocument.create();
      
      const pageIndicesToCopy = pages.map(p => p.originalIndex);
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
      
      toast({ 
        variant: "success",
        title: "Successfully saved!", 
        description: "Your organized PDF has been downloaded.",
      });

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
    setIsLoading(false);
    setSelectedPageId(null);
  };
  
  const handlePageClick = useCallback((id: string) => {
    if (isTouchDevice) {
        setSelectedPageId(prevId => (prevId === id ? null : id));
    }
  }, [isTouchDevice]);

  return (
    <div className="space-y-6">
      {!file && !isLoading ? (
        <Card className="bg-transparent shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">Organize PDF</CardTitle>
                <CardDescription>Upload a PDF to reorder, rotate, or delete its pages.</CardDescription>
            </CardHeader>
            <CardContent>
            <div
                {...getRootProps()}
                className={cn(
                "flex flex-col items-center justify-center p-6 sm:p-10 rounded-lg border-2 border-dashed transition-colors duration-300",
                !isLoading && "hover:border-primary/50",
                isDragActive && "border-primary bg-primary/10",
                (isLoading || isSaving) && "opacity-70 pointer-events-none"
                )}
            >
                <input {...getInputProps()} />
                <UploadCloud className="w-10 h-10 text-muted-foreground sm:w-12 sm:h-12" />
                <p className="mt-2 text-base font-semibold text-foreground sm:text-lg">
                    Drop a PDF file here
                </p>
                <p className="text-xs text-muted-foreground sm:text-sm">or click the button below</p>
                <motion.div whileHover={{ scale: 1.05, y: -2 }} transition={{ type: 'spring', stiffness: 400, damping: 10 }}>
                    <Button type="button" onClick={open} className="mt-4" disabled={isLoading || isSaving}>
                        <FolderOpen className="mr-2 h-4 w-4" />
                        Choose File
                    </Button>
                </motion.div>
            </div>
            </CardContent>
        </Card>
      ) : (
        <>
            <Card className="bg-background/95 border-b">
                <CardHeader className="flex flex-col gap-2 p-3 md:p-4">
                     <div className="flex items-center justify-between gap-2 w-full">
                        <CardTitle className="text-base sm:text-lg truncate flex-1 min-w-0" title={file?.file.name}>
                            {file?.file.name || 'Loading...'}
                        </CardTitle>
                        <div className="flex gap-2 shrink-0">
                            <Button variant="ghost" size="icon" className="w-9 h-9 text-muted-foreground/80 hover:bg-destructive/10 hover:text-destructive" onClick={removeFile} disabled={isSaving || isLoading}>
                                <X className="w-5 h-5" />
                                <span className="sr-only">Change File</span>
                            </Button>
                            <Button size="sm" onClick={handleSave} disabled={isSaving || isLoading || !file || file.isEncrypted} className="sm:w-auto">
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                                <span className="hidden sm:inline ml-2">Save</span>
                            </Button>
                        </div>
                    </div>
                    <CardDescription className="text-xs sm:text-sm">
                        {isLoading ? 'Loading...' : `${pages.length} pages`}
                    </CardDescription>
                </CardHeader>
                {file?.isEncrypted && (
                    <CardContent className="p-4 pt-0">
                         <div className="flex items-center gap-3 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3 text-sm text-yellow-700 dark:text-yellow-400">
                            <ShieldAlert className="h-5 w-5 shrink-0" />
                            <div>This PDF is password-protected and cannot be processed. Please upload an unlocked file.</div>
                        </div>
                    </CardContent>
                )}
            </Card>
            <div 
              ref={scrollContainerRef}
              {...getRootProps({
                  onDragOver: handleDragOver, 
                  className: 'outline-none -mx-4 px-4 overflow-y-auto max-h-[calc(100vh-12rem)] sm:h-[45rem] h-[34rem]',
                  onClick: (e) => {
                      if (isTouchDevice && (e.target as HTMLElement).closest('.page-card-container')) {
                          // Let page card handle its own click
                      } else {
                          setSelectedPageId(null);
                      }
                  }
              })}
            >
              <input {...getInputProps()} />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {isLoading ? (
                    Array.from({ length: 12 }).map((_, i) => (
                         <div key={i} className="rounded-md overflow-hidden border transition-all aspect-[7/10] bg-muted group flex flex-col items-center justify-center gap-2">
                             <Skeleton className="w-full h-full" />
                         </div>
                    ))
                ) : file?.isEncrypted ? (
                     <div className="col-span-full flex flex-col items-center justify-center text-center p-10 bg-muted rounded-lg">
                        <Lock className="w-12 h-12 text-muted-foreground mb-4" />
                        <h3 className="font-semibold text-lg">Encrypted File</h3>
                        <p className="text-muted-foreground">This PDF is password-protected and cannot be processed. Please upload an unlocked file.</p>
                    </div>
                ) : (
                    pages.map((page, index) => (
                      <PageCard
                          key={page.id}
                          page={page}
                          index={index}
                          onVisible={onPageVisible}
                          onRotate={() => rotatePage(page.id)}
                          onDelete={() => deletePage(page.id)}
                          onPageClick={() => handlePageClick(page.id)}
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragEnter={(e) => handleDragEnter(e, index)}
                          onDragEnd={handleDragEnd}
                          isSaving={isSaving}
                          isDragging={isDragging && dragItem.current === index}
                          isSelected={selectedPageId === page.id}
                          isTouchDevice={isTouchDevice}
                      />
                    ))
                )}
              </div>
            </div>
        </>
      )}
    </div>
  );
}

interface PageCardProps {
    page: PageInfo;
    index: number;
    onVisible: (id: string) => void;
    onRotate: () => void;
    onDelete: () => void;
    onPageClick: () => void;
    onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragEnter: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragEnd: () => void;
    isSaving: boolean;
    isDragging: boolean;
    isSelected: boolean;
    isTouchDevice: boolean;
}

const PageCard = React.memo(({ page, index, onVisible, onRotate, onDelete, onPageClick, onDragStart, onDragEnter, onDragEnd, isSaving, isDragging, isSelected, isTouchDevice }: PageCardProps) => {
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

    const showOverlay = !isTouchDevice || isSelected;

    return (
        <div 
            ref={ref}
            draggable={!isSaving}
            onDragStart={onDragStart}
            onDragEnter={onDragEnter}
            onDragEnd={onDragEnd}
            onClick={onPageClick}
            className={cn(
                "relative page-card-container rounded-lg overflow-hidden border-2 transition-all duration-300 aspect-[7/10] bg-muted group shadow-sm",
                isSaving ? "cursor-not-allowed opacity-70" : "cursor-grab",
                isDragging ? "shadow-2xl scale-105 opacity-50 border-primary" : "hover:shadow-md hover:border-primary/50",
                isSelected ? "border-primary" : "border-transparent"
            )}
        >
            <div className="w-full h-full flex items-center justify-center p-1 bg-white">
            {page.dataUrl ? (
                <img src={page.dataUrl} alt={`Page ${page.originalIndex + 1}`} className="w-full h-full object-contain transition-transform duration-300" style={{ transform: `rotate(${page.rotation}deg)` }} />
            ) : (
                <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin text-primary" /> Page {page.originalIndex + 1}</div>
            )}
            </div>
            
            <div className={cn(
                "absolute inset-0 bg-black/60 transition-opacity flex items-center justify-center gap-2",
                isTouchDevice ? (isSelected ? "opacity-100" : "opacity-0 pointer-events-none") : "opacity-0 group-hover:opacity-100"
            )}>
                <Button title="Rotate" size="icon" variant="secondary" onClick={(e) => { e.stopPropagation(); onRotate(); }} disabled={isSaving} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full"><RotateCw className="w-4 h-4 sm:w-5 sm:h-5" /></Button>
                <Button title="Delete" size="icon" variant="destructive" onClick={(e) => { e.stopPropagation(); onDelete(); }} disabled={isSaving} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full"><Trash2 className="w-4 h-4 sm:w-5 sm:h-5" /></Button>
            </div>
            
            <div className="absolute top-1 right-1 bg-background/80 text-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border shadow">
                {index + 1}
            </div>
        </div>
    );
});
PageCard.displayName = 'PageCard';



    
