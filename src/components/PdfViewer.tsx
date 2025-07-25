
"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud,
  X,
  Loader2,
  FolderOpen,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import * as pdfjsLib from 'pdfjs-dist';

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

const MAX_FILE_SIZE_MB = 100;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const INITIAL_ZOOM = 1;
const ZOOM_INCREMENT = 0.2;
const MAX_ZOOM = 3;
const MIN_ZOOM = 0.4;

type PDFFile = {
  id: string;
  file: File;
  totalPages: number;
  pdfjsDoc: pdfjsLib.PDFDocumentProxy;
};

type PageInfo = {
    pageNumber: number;
    dataUrl: string | null;
}

const PageThumbnail = React.memo(({ page, onSelect, isActive }: { page: PageInfo, onSelect: () => void, isActive: boolean }) => {
    return (
        <div
            onClick={onSelect}
            className={cn(
                "relative rounded-md overflow-hidden border-2 transition-all aspect-[7/10] bg-muted group shadow-sm cursor-pointer mb-2",
                isActive ? "border-primary" : "border-transparent hover:border-primary/50"
            )}
        >
            <div className="w-full h-full flex items-center justify-center p-1 bg-white dark:bg-zinc-800">
                {page.dataUrl ? (
                    <img src={page.dataUrl} alt={`Page ${page.pageNumber}`} className="w-full h-full object-contain" />
                ) : (
                    <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                         Page {page.pageNumber}
                    </div>
                )}
            </div>
        </div>
    );
});
PageThumbnail.displayName = 'PageThumbnail';


export function PdfViewer() {
  const [file, setFile] = useState<PDFFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pagePreviews, setPagePreviews] = useState<PageInfo[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  const [error, setError] = useState<string | null>(null);
  
  const operationId = useRef<number>(0);
  const { toast } = useToast();
  const mainCanvasContainerRef = useRef<HTMLDivElement>(null);
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);

  const renderPage = useCallback(async (
    pdfDoc: pdfjsLib.PDFDocumentProxy,
    pageNum: number,
    canvas: HTMLCanvasElement,
    currentZoom: number,
    containerWidth: number,
    containerHeight: number,
  ) => {
    try {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1 });
        
        const scale = Math.min(
            containerWidth / viewport.width,
            containerHeight / viewport.height
        ) * currentZoom;

        const scaledViewport = page.getViewport({ scale });
        
        const context = canvas.getContext('2d');
        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;

        if (context) {
            await page.render({ canvasContext: context, viewport: scaledViewport }).promise;
        }
    } catch(e) {
        console.error("Failed to render page:", e);
    }
  }, []);

  const loadPdf = useCallback(async (fileToLoad: File, providedPassword = "") => {
    const currentOperationId = ++operationId.current;
    setIsLoading(true);
    setError(null);
    setIsEncrypted(false);
    
    if (file?.pdfjsDoc) file.pdfjsDoc.destroy();
    setFile(null);
    setPagePreviews([]);
    setZoom(INITIAL_ZOOM);
    
    try {
      const pdfBytes = await fileToLoad.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: pdfBytes, password: providedPassword });
      const pdfjsDoc = await loadingTask.promise;

      if (operationId.current !== currentOperationId) {
        pdfjsDoc.destroy();
        return;
      }
      
      const totalPages = pdfjsDoc.numPages;
      const newFile = { id: `${fileToLoad.name}-${Date.now()}`, file: fileToLoad, totalPages, pdfjsDoc };
      setFile(newFile);

      const previews: PageInfo[] = Array.from({length: totalPages}, (_, i) => ({
          pageNumber: i + 1,
          dataUrl: null,
      }));
      setPagePreviews(previews);
      setCurrentPage(1);

      // Lazy load thumbnails
      const renderThumbnail = async (pageNum: number) => {
          const page = await pdfjsDoc.getPage(pageNum);
          const viewport = page.getViewport({ scale: 0.3 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const context = canvas.getContext('2d');
          if (context) {
              await page.render({ canvasContext: context, viewport }).promise;
              return canvas.toDataURL('image/jpeg', 0.7);
          }
          return null;
      }
      
      for(let i=0; i < totalPages; i++) {
          if (operationId.current !== currentOperationId) break;
          const dataUrl = await renderThumbnail(i + 1);
          if (operationId.current === currentOperationId) {
              setPagePreviews(prev => {
                  const newPreviews = [...prev];
                  newPreviews[i] = {...newPreviews[i], dataUrl};
                  return newPreviews;
              });
          }
      }

    } catch (err: any) {
      if (operationId.current !== currentOperationId) return;

      if (err.name === 'PasswordException') {
        setIsEncrypted(true);
        setError("This PDF is password-protected. Please enter the password to view it.");
      } else {
        setError("Could not read the PDF file. It might be corrupted or in an unsupported format.");
        toast({ variant: "destructive", title: "Error Loading PDF", description: err.message });
      }
    } finally {
      if (operationId.current === currentOperationId) setIsLoading(false);
    }
  }, [file, toast]);

  useEffect(() => {
    const observer = new ResizeObserver(() => {
        if (file?.pdfjsDoc && mainCanvasRef.current && mainCanvasContainerRef.current) {
            const containerWidth = mainCanvasContainerRef.current.clientWidth - 32; // padding
            const containerHeight = mainCanvasContainerRef.current.clientHeight - 32; // padding
            renderPage(file.pdfjsDoc, currentPage, mainCanvasRef.current, zoom, containerWidth, containerHeight);
        }
    });

    if (mainCanvasContainerRef.current) {
        observer.observe(mainCanvasContainerRef.current);
    }
    
    return () => observer.disconnect();
  }, [file, currentPage, zoom, renderPage]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    loadPdf(acceptedFiles[0]);
  }, [loadPdf]);

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
    if (file?.pdfjsDoc) file.pdfjsDoc.destroy();
    setFile(null);
    setPagePreviews([]);
    setIsLoading(false);
    setIsEncrypted(false);
    setPassword('');
    setError(null);
  };
  
  const handlePasswordSubmit = () => {
      const currentFile = file?.file;
      if (currentFile) {
          loadPdf(currentFile, password);
      }
  }

  const changeZoom = (direction: 'in' | 'out') => {
      setZoom(prevZoom => {
          let newZoom = direction === 'in' ? prevZoom + ZOOM_INCREMENT : prevZoom - ZOOM_INCREMENT;
          return Math.max(MIN_ZOOM, Math.min(newZoom, MAX_ZOOM));
      });
  }

  if (!file && !isLoading) {
    return (
        <Card className="bg-white dark:bg-card shadow-lg h-full flex flex-col">
            <CardContent className="p-6 flex-1 flex flex-col items-center justify-center">
                <div {...getRootProps()} className={cn("w-full h-full flex flex-col items-center justify-center p-10 rounded-lg border-2 border-dashed transition-colors", isDragActive ? "border-primary bg-primary/10" : "hover:border-primary/50")}>
                    <input {...getInputProps()} />
                    <UploadCloud className="w-12 h-12 text-muted-foreground" />
                    <p className="mt-4 text-lg font-semibold">Drop PDF here or click to upload</p>
                    <Button type="button" onClick={open} className="mt-4" disabled={isLoading}><FolderOpen className="mr-2 h-4 w-4"/>Choose File</Button>
                </div>
            </CardContent>
        </Card>
    );
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-3 overflow-hidden">
             <Lock className="w-6 h-6 text-destructive shrink-0" />
             <div className="flex flex-col overflow-hidden">
                <CardTitle className="truncate max-w-[200px] sm:max-w-md">{file?.file.name || "Loading..."}</CardTitle>
                <CardDescription>{file ? `${file.totalPages} pages` : 'Please wait'}</CardDescription>
             </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
             <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground/70 hover:bg-destructive/10 hover:text-destructive shrink-0" onClick={removeFile} disabled={isLoading}><X className="w-4 h-4" /></Button>
          </div>
        </CardHeader>
      </Card>

      {(isLoading || error) ? (
        <Card className="h-[70vh] flex items-center justify-center">
          <CardContent className="p-4 text-center">
             {isLoading ? <Loader2 className="w-8 h-8 animate-spin text-primary" /> : (
                <div className="space-y-4">
                    <AlertTriangle className="w-8 h-8 text-destructive mx-auto"/>
                    <p className="text-destructive font-medium">{error}</p>
                    {isEncrypted && (
                      <div className="max-w-sm mx-auto space-y-2">
                        <div className="relative">
                          <Input id="password-input" value={password} onChange={(e) => setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} className="pr-10" placeholder="Enter password" />
                          <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowPassword(p => !p)}>
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                        <Button onClick={handlePasswordSubmit} disabled={!password}>
                            <Unlock className="mr-2 h-4 w-4"/> Unlock & View
                        </Button>
                      </div>
                    )}
                </div>
             )}
          </CardContent>
        </Card>
      ) : file && (
          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 flex-1 min-h-0">
            <Card className="hidden md:block">
                <div className="p-2 h-full overflow-y-auto">
                    {pagePreviews.map(p => (
                        <PageThumbnail key={p.pageNumber} page={p} onSelect={() => setCurrentPage(p.pageNumber)} isActive={currentPage === p.pageNumber} />
                    ))}
                </div>
            </Card>

            <div className="flex flex-col gap-4 h-full min-h-0">
                <Card className="sticky top-20 z-10 bg-background/80 backdrop-blur-sm">
                    <div className="p-2 flex items-center justify-between">
                        <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1}><ChevronLeft className="h-4 w-4"/></Button>
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <Input type="number" value={currentPage} onChange={e => setCurrentPage(parseInt(e.target.value,10))} onBlur={() => setCurrentPage(p => Math.max(1, Math.min(p, file.totalPages)))} className="w-16 h-8 text-center" min="1" max={file.totalPages} />
                            <span>/ {file.totalPages}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" onClick={() => changeZoom('out')} disabled={zoom <= MIN_ZOOM}><ZoomOut className="h-4 w-4"/></Button>
                            <Button variant="outline" size="icon" onClick={() => setZoom(INITIAL_ZOOM)}><RotateCw className="h-4 w-4"/></Button>
                            <Button variant="outline" size="icon" onClick={() => changeZoom('in')} disabled={zoom >= MAX_ZOOM}><ZoomIn className="h-4 w-4"/></Button>
                        </div>
                        <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.min(file.totalPages, p + 1))} disabled={currentPage >= file.totalPages}><ChevronRight className="h-4 w-4"/></Button>
                    </div>
                </Card>
                <div ref={mainCanvasContainerRef} className="flex-1 overflow-auto bg-muted/40 rounded-lg flex justify-center p-4">
                    <canvas ref={mainCanvasRef} className="bg-white dark:bg-card shadow-lg rounded-md" />
                </div>
            </div>
          </div>
      )}
    </div>
  );
}
