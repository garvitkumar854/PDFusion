
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
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

const MAX_FILE_SIZE_MB = 100;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

type PageInfo = {
  pageNumber: number;
  dataUrl?: string;
  isVisible: boolean;
};

type PDFFile = {
  id: string;
  file: File;
  pdfjsDoc: pdfjsLib.PDFDocumentProxy;
};

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}


export function PageRemover() {
  const [file, setFile] = useState<PDFFile | null>(null);
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  
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
    setSelectedPages(new Set());
    try {
      const singleFile = acceptedFiles[0];
      const pdfBytes = await singleFile.arrayBuffer();
      const pdfjsDoc = await pdfjsLib.getDocument({ data: pdfBytes }).promise;

      if (operationId.current !== currentOperationId) return;
      
      setFile({ id: `${singleFile.name}-${Date.now()}`, file: singleFile, pdfjsDoc });
      const pageCount = pdfjsDoc.numPages;
      const initialPages: PageInfo[] = Array.from({ length: pageCount }, (_, i) => ({
        pageNumber: i + 1,
        isVisible: false,
      }));
      setPages(initialPages);
    } catch (error) {
      if (operationId.current === currentOperationId) toast({ variant: "destructive", title: "Could not read PDF" });
    } finally {
      if (operationId.current === currentOperationId) setIsLoading(false);
    }
  }, [toast]);
  
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop, accept: { "application/pdf": [".pdf"] }, maxSize: MAX_FILE_SIZE_BYTES, multiple: false, noClick: true, noKeyboard: true, disabled: isLoading || isRemoving,
  });
  
  const onPageVisible = useCallback((pageNumber: number) => {
    if (!file || isLoading) return;
    const currentOperationId = operationId.current;

    setPages(prev => {
        const pageIndex = prev.findIndex(p => p.pageNumber === pageNumber);
        if (pageIndex === -1 || prev[pageIndex].dataUrl || prev[pageIndex].isVisible) return prev;
        
        const newPages = [...prev];
        newPages[pageIndex] = { ...newPages[pageIndex], isVisible: true };
        
        renderPage(file.pdfjsDoc, pageNumber).then(dataUrl => {
            if (dataUrl && operationId.current === currentOperationId) {
                setPages(current => {
                    const latestIndex = current.findIndex(p => p.pageNumber === pageNumber);
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

  const togglePageSelection = (pageNumber: number) => {
    setSelectedPages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pageNumber)) newSet.delete(pageNumber);
      else newSet.add(pageNumber);
      return newSet;
    });
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) setSelectedPages(new Set(pages.map(p => p.pageNumber)));
    else setSelectedPages(new Set());
  };
  
  const handleRemove = async () => {
    if (!file || selectedPages.size === 0) {
      toast({ variant: "destructive", title: "No pages selected."});
      return;
    }
    if (selectedPages.size === pages.length) {
      toast({ variant: "destructive", title: "Cannot remove all pages."});
      return;
    }
    
    setIsRemoving(true);
    try {
      const pdfBytes = await file.file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      
      const pagesToRemove = Array.from(selectedPages).sort((a,b) => b-a);
      pagesToRemove.forEach(pageNum => pdfDoc.removePage(pageNum - 1));

      const newPdfBytes = await pdfDoc.save();
      const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${file.file.name.replace(/\.pdf$/i, '')}_removed.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast({ title: "Successfully removed pages!" });
      removeFile();

    } catch (e) {
      toast({ variant: "destructive", title: "Failed to remove pages."});
    } finally {
      setIsRemoving(false);
    }
  };
  
  const removeFile = () => {
    operationId.current++;
    setFile(null);
    setPages([]);
    setSelectedPages(new Set());
  };

  return (
    <div className="space-y-6">
      {!file && (
        <Card>
          <CardHeader><CardTitle>Remove Pages</CardTitle><CardDescription>Upload a PDF to select and remove pages.</CardDescription></CardHeader>
          <CardContent>
            <div {...getRootProps()} className={cn("flex flex-col items-center justify-center p-10 rounded-lg border-2 border-dashed", isDragActive && "border-primary")}>
              <input {...getInputProps()} />
              {isLoading ? <Loader2 className="w-10 h-10 text-primary animate-spin" /> : <UploadCloud className="w-10 h-10 text-muted-foreground" />}
              <p className="mt-2 text-base font-semibold">{isLoading ? "Processing PDF..." : "Drop a PDF file here"}</p>
              <Button type="button" onClick={open} className="mt-4" disabled={isLoading || isRemoving}><FolderOpen className="mr-2 h-4 w-4" /> Choose File</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {file && (
        <>
            <Card className="sticky top-20 z-10">
                <CardHeader className="flex flex-row items-center justify-between p-4">
                    <div>
                        <CardTitle className="text-lg">Select Pages to Remove</CardTitle>
                        <CardDescription>{selectedPages.size} of {pages.length} pages selected</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                         <div className="items-center space-x-2 hidden sm:flex">
                           <Checkbox id="select-all" checked={selectedPages.size === pages.length && pages.length > 0} onCheckedChange={(c) => toggleSelectAll(Boolean(c))} />
                           <Label htmlFor="select-all">Select All</Label>
                         </div>
                         <Button variant="outline" onClick={removeFile} disabled={isRemoving}><X className="mr-2 h-4 w-4" />Change</Button>
                         <Button onClick={handleRemove} disabled={isRemoving || selectedPages.size === 0}>
                            {isRemoving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                            Remove Pages
                         </Button>
                    </div>
                </CardHeader>
            </Card>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {pages.map((page, index) => (
                <PagePreviewCard
                    key={page.pageNumber}
                    page={page}
                    onVisible={onPageVisible}
                    isSelected={selectedPages.has(page.pageNumber)}
                    onToggleSelection={togglePageSelection}
                    disabled={isRemoving}
                />
              ))}
            </div>
        </>
      )}
    </div>
  );
}

const PagePreviewCard = ({ page, onVisible, isSelected, onToggleSelection, disabled }: any) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !page.dataUrl) {
                onVisible(page.pageNumber);
                if (ref.current) observer.unobserve(ref.current);
            }
        }, { threshold: 0.1 });
        if (ref.current) observer.observe(ref.current);
        return () => { if (ref.current) observer.unobserve(ref.current); };
    }, [page.pageNumber, page.dataUrl, onVisible]);

    return (
        <div 
            ref={ref}
            onClick={() => onToggleSelection(page.pageNumber)}
            className={cn("relative rounded-md overflow-hidden border-2 transition-all aspect-[7/10] bg-muted cursor-pointer", isSelected ? "border-destructive shadow-lg" : "border-transparent hover:border-destructive/50", disabled && "cursor-not-allowed opacity-70")}
        >
            <div className="w-full h-full flex items-center justify-center p-1">
            {page.dataUrl ? (
                <img src={page.dataUrl} alt={`Page ${page.pageNumber}`} className="w-full h-full object-contain"/>
            ) : (
                <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin text-primary" /> Page {page.pageNumber}</div>
            )}
            </div>
            
            <div className="absolute top-2 right-2">
                <Checkbox checked={isSelected} readOnly />
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-0.5 font-medium">
                {page.pageNumber}
            </div>
        </div>
    );
};
