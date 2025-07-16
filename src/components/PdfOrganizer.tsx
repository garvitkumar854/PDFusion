
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PDFDocument, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { Skeleton } from "./ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

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

type PasswordState = {
  isNeeded: boolean;
  isSubmitting: boolean;
  error: string | null;
  fileToLoad: File | null;
  passwordAttempt?: string;
}

export function PdfOrganizer() {
  const [file, setFile] = useState<PDFFile | null>(null);
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [passwordState, setPasswordState] = useState<PasswordState>({
    isNeeded: false,
    isSubmitting: false,
    error: null,
    fileToLoad: null,
  });
  const passwordInputRef = useRef<HTMLInputElement>(null);
  
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const operationId = useRef<number>(0);
  const { toast } = useToast();

  useEffect(() => {
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
  
  const loadPdf = useCallback(async (fileToLoad: File, password?: string) => {
    const currentOperationId = ++operationId.current;
    
    if(file?.pdfjsDoc) file.pdfjsDoc.destroy();
    setFile(null);
    setPages([]);
    setIsLoading(true);
    setPasswordState(prev => ({ ...prev, isSubmitting: true, error: null, passwordAttempt: password }));

    try {
      const pdfBytes = await fileToLoad.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfBytes), password });
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
        pdfjsDoc 
      });
      setPages(initialPages);
      setPasswordState({ isNeeded: false, isSubmitting: false, error: null, fileToLoad: null, passwordAttempt: password });

    } catch (error: any) {
        if (operationId.current !== currentOperationId) return;
        
        if (error.name === 'PasswordException' || error.name === 'PasswordIsIncorrectError') {
            setPasswordState(prev => ({ ...prev, isNeeded: true, isSubmitting: false, error: password ? 'Incorrect password.' : null, fileToLoad }));
            setTimeout(() => passwordInputRef.current?.focus(), 100);
        } else {
            console.error("Failed to load PDF", error);
            toast({ variant: "destructive", title: "Could not read PDF", description: "The file might be corrupted or in an unsupported format." });
            setPasswordState({ isNeeded: false, isSubmitting: false, error: null, fileToLoad: null });
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
    if (!file || isLoading) return;
    const currentOperationId = operationId.current;

    setPages(prev => {
        const pageIndex = prev.findIndex(p => p.id === id);
        if (pageIndex === -1 || prev[pageIndex].dataUrl) {
            return prev;
        }
        
        const newPages = [...prev];
        const pageInfo = newPages[pageIndex];

        renderPage(file.pdfjsDoc, pageInfo.originalIndex + 1, currentOperationId).then(dataUrl => {
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
      const pdfBytes = await file.file.arrayBuffer();
      const pdfLibDoc = await PDFDocument.load(pdfBytes, {
          password: passwordState.passwordAttempt,
          ignoreEncryption: !passwordState.passwordAttempt,
      });
      
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
      
      toast({ title: "Successfully saved!", description: "Your organized PDF has been downloaded." });

    } catch (e: any) {
      if(e.name === 'PasswordException' || e.name === 'PasswordIsIncorrectError') {
        setPasswordState(prev => ({...prev, isNeeded: true, isSubmitting: false, error: 'Incorrect password.' }));
        toast({ variant: 'destructive', title: 'Save Failed', description: 'The password provided was incorrect.'});
      } else {
        console.error("Failed to save PDF", e);
        toast({ variant: "destructive", title: "Failed to save PDF.", description: "An unexpected error occurred. " + e.message});
      }
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
    setPasswordState({isNeeded: false, isSubmitting: false, error: null, fileToLoad: null});
  };
  
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordState.fileToLoad && passwordInputRef.current) {
        loadPdf(passwordState.fileToLoad, passwordInputRef.current.value);
    }
  }
  
  const handlePasswordDialogClose = (open: boolean) => {
      if (!open) {
          setPasswordState({ isNeeded: false, isSubmitting: false, error: null, fileToLoad: null });
      }
  }

  return (
    <div className="space-y-6">
      {!file && !isLoading ? (
        <Card className="bg-white dark:bg-card shadow-lg">
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
                <Button type="button" onClick={open} className="mt-4" disabled={isLoading || isSaving}>
                    <FolderOpen className="mr-2 h-4 w-4" />
                    Choose File
                </Button>
            </div>
            </CardContent>
        </Card>
      ) : (
        <>
            <Card className="sticky top-20 z-10 bg-background/80 backdrop-blur-sm">
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 md:p-4">
                    <div className="flex-grow min-w-0">
                        <CardTitle className="text-base sm:text-lg truncate" title={file?.file.name}>
                            Organizing: <span className="font-normal">{file?.file.name || 'Loading...'}</span>
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                            {isLoading ? 'Loading...' : `${pages.length} pages`}
                        </CardDescription>
                    </div>
                    <div className="flex gap-2 self-end sm:self-center">
                         <Button variant="ghost" size="icon" className="w-9 h-9 text-muted-foreground/80 hover:bg-destructive/10 hover:text-destructive shrink-0" onClick={removeFile} disabled={isSaving || isLoading}>
                            <X className="w-5 h-5" />
                            <span className="sr-only">Change File</span>
                         </Button>
                         <Button size="sm" onClick={handleSave} disabled={isSaving || isLoading || !file}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save
                         </Button>
                    </div>
                </CardHeader>
            </Card>
            <div {...getRootProps({onDragOver: handleDragOver, className: 'outline-none'})}>
              <input {...getInputProps()} />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
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
            </div>
        </>
      )}
      <Dialog open={passwordState.isNeeded} onOpenChange={handlePasswordDialogClose}>
        <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handlePasswordSubmit}>
                <DialogHeader>
                    <DialogTitle>Password Required</DialogTitle>
                    <DialogDescription>
                        This PDF file is password protected. Please enter the password to open it.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="password-input" className="text-right">
                            Password
                        </Label>
                        <Input
                            id="password-input"
                            ref={passwordInputRef}
                            type="password"
                            className="col-span-3"
                        />
                    </div>
                    {passwordState.error && <p className="text-destructive text-sm text-center -mt-2">{passwordState.error}</p>}
                </div>
                <DialogFooter>
                    <Button type="button" variant="secondary" onClick={() => handlePasswordDialogClose(false)}>Cancel</Button>
                    <Button type="submit" disabled={passwordState.isSubmitting}>
                        {passwordState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Unlock
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
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

    