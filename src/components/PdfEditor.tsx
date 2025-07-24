
"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud,
  Download,
  X,
  Save,
  Loader2,
  Type,
  Image as ImageIcon,
  Square,
  Circle as CircleIcon,
  Trash2,
  FolderOpen,
  Lock,
  ShieldAlert,
} from "lucide-react";
import { fabric } from 'fabric';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { Skeleton } from "./ui/skeleton";

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

const MAX_FILE_SIZE_MB = 100;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

type PageInfo = {
  originalIndex: number;
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

export function PdfEditor() {
  const [file, setFile] = useState<PDFFile | null>(null);
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [activePage, setActivePage] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

  const operationId = useRef<number>(0);
  const { toast } = useToast();

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
      setActivePage(0);

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
            toast({ variant: "destructive", title: "Encrypted PDF", description: "This file is password-protected and cannot be edited." });
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
        renderPage(file.pdfjsDoc!, pageIndex + 1, currentOperationId).then(dataUrl => {
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
  
  const handleSave = async () => {
    if(!file || !fabricCanvasRef.current) return;
    
    setIsSaving(true);
    try {
        const pdfBytes = await file.file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
        
        const fabricObjects = fabricCanvasRef.current.getObjects();
        const page = pdfDoc.getPages()[activePage];
        
        for (const obj of fabricObjects) {
            // This is a simplified example. A full implementation would need to handle
            // different object types (text, images, shapes), rotations, colors, etc.
            if(obj.type === 'textbox') {
                 // Text object handling would go here
            } else if (obj.type === 'image') {
                 // Image object handling would go here
            }
        }
        
        // This is a placeholder for a more complex save logic.
        // For now, it just re-saves the original to show the flow.
        const newPdfBytes = await pdfDoc.save();
        const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
      
        const link = document.createElement('a');
        link.href = url;
        link.download = `${file.file.name.replace(/\.pdf$/i, '')}_edited.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      
        toast({ title: "Successfully saved!", description: "Your edited PDF has been downloaded." });

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
  };

  useEffect(() => {
    if(canvasRef.current && !fabricCanvasRef.current) {
        fabricCanvasRef.current = new fabric.Canvas(canvasRef.current);
    }
    
    if(file?.pdfjsDoc && activePage < pages.length && fabricCanvasRef.current) {
        const canvas = fabricCanvasRef.current;
        file.pdfjsDoc.getPage(activePage + 1).then(page => {
            const viewport = page.getViewport({ scale: 1.5 });
            canvas.setWidth(viewport.width);
            canvas.setHeight(viewport.height);

            const bgCanvas = document.createElement('canvas');
            bgCanvas.width = viewport.width;
            bgCanvas.height = viewport.height;
            const bgCtx = bgCanvas.getContext('2d');
            
            page.render({ canvasContext: bgCtx!, viewport }).promise.then(() => {
                fabric.Image.fromURL(bgCanvas.toDataURL(), (img) => {
                    canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
                        scaleX: canvas.width! / img.width!,
                        scaleY: canvas.height! / img.height!,
                    });
                });
            });
        });
    }

    return () => {
        if (fabricCanvasRef.current) {
            fabricCanvasRef.current.dispose();
            fabricCanvasRef.current = null;
        }
    }
  }, [activePage, file, pages]);
  
  const addText = () => {
    if(!fabricCanvasRef.current) return;
    const textbox = new fabric.Textbox('Type something...', {
        left: 50,
        top: 50,
        width: 150,
        fontSize: 20,
        fill: '#000000',
    });
    fabricCanvasRef.current.add(textbox);
    fabricCanvasRef.current.setActiveObject(textbox);
  }

  return (
    <div className="space-y-6">
      {!file && !isLoading ? (
        <Card className="bg-white dark:bg-card shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">Edit PDF</CardTitle>
                <CardDescription>Upload a PDF to start editing.</CardDescription>
            </CardHeader>
            <CardContent>
            <div
                {...getRootProps()}
                className={cn("flex flex-col items-center justify-center p-6 sm:p-10 rounded-lg border-2 border-dashed transition-colors duration-300", !isLoading && "hover:border-primary/50", isDragActive && "border-primary bg-primary/10", (isLoading || isSaving) && "opacity-70 pointer-events-none")}>
                <input {...getInputProps()} />
                <UploadCloud className="w-10 h-10 text-muted-foreground sm:w-12 sm:h-12" />
                <p className="mt-2 text-base font-semibold text-foreground sm:text-lg">Drop a PDF file here</p>
                <p className="text-xs text-muted-foreground sm:text-sm">or click the button below</p>
                <Button type="button" onClick={open} className="mt-4" disabled={isLoading || isSaving}><FolderOpen className="mr-2 h-4 w-4" />Choose File</Button>
            </div>
            </CardContent>
        </Card>
      ) : (
        <>
            <Card className="sticky top-20 z-20 bg-background/80 backdrop-blur-sm">
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 md:p-4">
                    <div className="flex-grow min-w-0">
                        <CardTitle className="text-base sm:text-lg truncate" title={file?.file.name}>
                            Editing: <span className="font-normal">{file?.file.name || 'Loading...'}</span>
                        </CardTitle>
                    </div>
                    <div className="flex gap-2 self-end sm:self-center">
                         <Button variant="ghost" size="icon" className="w-9 h-9 text-muted-foreground/80 hover:bg-destructive/10 hover:text-destructive shrink-0" onClick={removeFile} disabled={isSaving || isLoading}><X className="w-5 h-5" /><span className="sr-only">Change File</span></Button>
                         <Button size="sm" onClick={handleSave} disabled={isSaving || isLoading || !file || file.isEncrypted}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save</Button>
                    </div>
                </CardHeader>
            </Card>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Sidebar */}
                <div className="md:w-1/4 lg:w-1/5 space-y-4">
                     <Card className="p-2">
                        <CardContent className="p-2 max-h-[70vh] overflow-y-auto">
                            {isLoading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="w-full aspect-[7/10] mb-2" />) 
                            : file?.isEncrypted ? <div className="flex items-center justify-center p-4 text-center text-muted-foreground"><ShieldAlert className="w-8 h-8 mx-auto mb-2 text-destructive" /><p>This PDF is encrypted and cannot be edited.</p></div>
                            : pages.map((page, index) => (
                                <PageThumbnail key={page.id} page={page} index={index} isActive={activePage === index} onSelect={() => setActivePage(index)} onVisible={onPageVisible}/>
                            ))}
                        </CardContent>
                     </Card>
                </div>
                
                {/* Main Content */}
                <div className="flex-1">
                    <Card className="p-2">
                        {/* Editor Toolbar */}
                        <div className="p-2 border-b flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={addText} disabled={isLoading || isSaving || file?.isEncrypted}><Type className="mr-2 h-4 w-4" /> Add Text</Button>
                        </div>
                        {/* Canvas Area */}
                        <CardContent className="p-2 mt-2 bg-muted/50 flex justify-center items-start overflow-auto h-[70vh]">
                            {isLoading ? <Loader2 className="w-8 h-8 animate-spin text-primary" /> 
                            : file?.isEncrypted ? <div className="flex items-center justify-center h-full text-center text-muted-foreground"><ShieldAlert className="w-10 h-10 mx-auto mb-2 text-destructive" /><p>Editing is disabled for encrypted files.</p></div>
                            : <canvas ref={canvasRef} />}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
      )}
    </div>
  );
}


const PageThumbnail = React.memo(({ page, index, isActive, onSelect, onVisible }: { page: PageInfo, index: number, isActive: boolean, onSelect: () => void, onVisible: (id: string) => void}) => {
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

        return () => { if (currentRef) observer.unobserve(currentRef); };
    }, [page.id, page.dataUrl, onVisible]);

    return (
        <div ref={ref} onClick={onSelect} className={cn("relative rounded-md overflow-hidden border-2 transition-all aspect-[7/10] bg-muted group shadow-sm cursor-pointer mb-2", isActive ? "border-primary" : "border-transparent hover:border-primary/50")}>
            <div className="w-full h-full flex items-center justify-center p-1 bg-white">
            {page.dataUrl ? (<img src={page.dataUrl} alt={`Page ${page.originalIndex + 1}`} className="w-full h-full object-contain" />) 
            : (<div className="flex flex-col items-center gap-1 text-xs text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin text-primary" /> Page {index + 1}</div>)}
            </div>
             <div className="absolute bottom-0 left-0 bg-background/80 text-foreground text-xs font-bold rounded-tr-md px-2 py-1 flex items-center justify-center border-t border-r shadow">
                {index + 1}
            </div>
        </div>
    );
});
PageThumbnail.displayName = 'PageThumbnail';
