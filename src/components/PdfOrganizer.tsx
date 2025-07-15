
"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud,
  Download,
  X,
  CheckCircle,
  FolderOpen,
  Loader2,
  Ban,
  RotateCw,
  Trash2,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PDFDocument, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

const MAX_FILE_SIZE_MB = 100;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

type PageInfo = {
  originalIndex: number;
  rotation: number;
  dataUrl?: string;
  id: string; // For stable key
  isVisible: boolean;
};

type PDFFile = {
  id: string;
  file: File;
  pdfDoc: PDFDocument;
  pdfjsDoc: pdfjsLib.PDFDocumentProxy;
};

export function PdfOrganizer() {
  const [file, setFile] = useState<PDFFile | null>(null);
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const operationId = useRef<number>(0);
  const { toast } = useToast();

  const renderPage = useCallback(async (pdfjsDoc: pdfjsLib.PDFDocumentProxy, pageNum: number) => {
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
    const currentOperationId = ++operationId.current;
    setIsLoading(true);
    setPages([]);
    try {
      const singleFile = acceptedFiles[0];
      const pdfBytes = await singleFile.arrayBuffer();
      const [pdfDoc, pdfjsDoc] = await Promise.all([
        PDFDocument.load(pdfBytes, { ignoreEncryption: true }),
        pdfjsLib.getDocument({ data: pdfBytes }).promise,
      ]);

      if (operationId.current !== currentOperationId) return;

      setFile({ id: `${singleFile.name}-${Date.now()}`, file: singleFile, pdfDoc, pdfjsDoc });
      
      const pageCount = pdfDoc.getPageCount();
      const initialPages: PageInfo[] = Array.from({ length: pageCount }, (_, i) => ({
        originalIndex: i,
        rotation: pdfDoc.getPage(i).getRotation().angle,
        id: `${i}-${Date.now()}`,
        isVisible: false,
      }));
      setPages(initialPages);
    } catch (error) {
      if (operationId.current === currentOperationId) {
        toast({ variant: "destructive", title: "Could not read PDF", description: "The file might be corrupted or encrypted." });
      }
    } finally {
      if (operationId.current === currentOperationId) setIsLoading(false);
    }
  }, [toast]);
  
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
        if (pageIndex === -1 || prev[pageIndex].dataUrl || prev[pageIndex].isVisible) {
            return prev;
        }

        const newPages = [...prev];
        const pageInfo = newPages[pageIndex];
        newPages[pageIndex] = { ...pageInfo, isVisible: true };
        
        renderPage(file.pdfjsDoc, pageInfo.originalIndex + 1).then(dataUrl => {
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
    const newPages = [...pages];
    const draggedItemContent = newPages.splice(dragItem.current, 1)[0];
    newPages.splice(index, 0, draggedItemContent);
    dragItem.current = index;
    setPages(newPages);
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
      const newPdfDoc = await PDFDocument.create();
      const orderedOriginalIndices = pages.map(p => p.originalIndex);
      
      const copiedPages = await newPdfDoc.copyPages(file.pdfDoc, orderedOriginalIndices);

      copiedPages.forEach((copiedPage, index) => {
        const pageInfo = pages[index];
        copiedPage.setRotation(degrees(pageInfo.rotation));
        newPdfDoc.addPage(copiedPage);
      });

      const pdfBytes = await newPdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${file.file.name.replace(/\.pdf$/i, '')}_organized.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({ title: "Successfully saved!", description: "Your organized PDF has been downloaded." });

    } catch (e) {
      console.error("Failed to save PDF", e);
      toast({ variant: "destructive", title: "Failed to save PDF." });
    } finally {
      setIsSaving(false);
    }
  };
  
  const removeFile = () => {
    operationId.current++;
    setFile(null);
    setPages([]);
  };

  return (
    <div className="space-y-6">
      {!file && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Organize PDF</CardTitle>
            <CardDescription>Upload a PDF to reorder, rotate, or delete its pages.</CardDescription>
          </CardHeader>
          <CardContent>
            <div {...getRootProps()} className={cn("flex flex-col items-center justify-center p-6 sm:p-10 rounded-lg border-2 border-dashed transition-colors duration-300", isDragActive && "border-primary bg-primary/10", (isLoading || isSaving) && "opacity-70 pointer-events-none")}>
              <input {...getInputProps()} />
              {isLoading ? <Loader2 className="w-10 h-10 text-primary animate-spin" /> : <UploadCloud className="w-10 h-10 text-muted-foreground" />}
              <p className="mt-2 text-base font-semibold text-foreground">
                {isLoading ? "Processing PDF..." : "Drop a PDF file here"}
              </p>
              <p className="text-xs text-muted-foreground">or click the button below</p>
              <Button type="button" onClick={open} className="mt-4" disabled={isLoading || isSaving}>
                <FolderOpen className="mr-2 h-4 w-4" /> Choose File
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {file && (
        <>
            <Card className="sticky top-20 z-10">
                <CardHeader className="flex flex-row items-center justify-between p-4">
                    <div>
                        <CardTitle className="text-lg">Organizing: {file.file.name}</CardTitle>
                        <CardDescription>{pages.length} pages</CardDescription>
                    </div>
                    <div className="flex gap-2">
                         <Button variant="outline" onClick={removeFile} disabled={isSaving}><X className="mr-2 h-4 w-4" />Change File</Button>
                         <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save
                         </Button>
                    </div>
                </CardHeader>
            </Card>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4" onDragOver={handleDragOver}>
              {pages.map((page, index) => (
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
              ))}
            </div>
        </>
      )}
    </div>
  );
}

const PageCard = ({ page, index, onVisible, onRotate, onDelete, onDragStart, onDragEnter, onDragEnd, isSaving, isDragging }: any) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !page.dataUrl) {
                onVisible(page.id);
                 if (ref.current) observer.unobserve(ref.current);
            }
        }, { threshold: 0.1 });

        if (ref.current) observer.observe(ref.current);

        return () => {
            if (ref.current) observer.unobserve(ref.current);
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
                "relative rounded-md overflow-hidden border transition-all aspect-[7/10] bg-muted group",
                isSaving ? "cursor-not-allowed" : "cursor-grab",
                isDragging ? "shadow-2xl scale-105 opacity-50" : "shadow-sm"
            )}
        >
            <div className="w-full h-full flex items-center justify-center p-1">
            {page.dataUrl ? (
                <img src={page.dataUrl} alt={`Page ${page.originalIndex + 1}`} className="w-full h-full object-contain transition-transform duration-300" style={{ transform: `rotate(${page.rotation}deg)` }} />
            ) : (
                <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin text-primary" /> Page {page.originalIndex + 1}</div>
            )}
            </div>
            
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button size="icon" variant="secondary" onClick={() => onRotate(page.id)} disabled={isSaving} className="w-8 h-8"><RotateCw className="w-4 h-4" /></Button>
                <Button size="icon" variant="destructive" onClick={() => onDelete(page.id)} disabled={isSaving} className="w-8 h-8"><Trash2 className="w-4 h-4" /></Button>
            </div>
            
            <div className="absolute bottom-1 right-1 bg-background/80 text-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border">
                {index + 1}
            </div>
        </div>
    );
};
