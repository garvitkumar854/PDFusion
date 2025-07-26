
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
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import * as pdfjsLib from 'pdfjs-dist';

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

const MAX_FILE_SIZE_MB = 100;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ZOOM_INCREMENT = 0.2;
const MAX_ZOOM = 3;
const MIN_ZOOM = 0.2;

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
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState<string | null>(null);
  
  const operationId = useRef<number>(0);
  const { toast } = useToast();
  const mainCanvasContainerRef = useRef<HTMLDivElement>(null);
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const renderTask = useRef<pdfjsLib.RenderTask | null>(null);
  const panState = useRef({ isPanning: false, startX: 0, startY: 0, lastX: 0, lastY: 0 });

  const renderPage = useCallback(async (
    pdfDoc: pdfjsLib.PDFDocumentProxy,
    pageNum: number,
    canvas: HTMLCanvasElement,
    forceZoom?: number
  ) => {
    if (renderTask.current) {
      renderTask.current.cancel();
      renderTask.current = null;
    }

    try {
        const page = await pdfDoc.getPage(pageNum);
        const container = mainCanvasContainerRef.current;
        if (!container) return;

        let scale = forceZoom ?? zoom;
        const isAutoZoom = !forceZoom;
        
        const viewportDefault = page.getViewport({ scale: 1 });

        if (isAutoZoom) {
            scale = Math.min(
                container.clientWidth / viewportDefault.width,
                container.clientHeight / viewportDefault.height
            ) * 0.98;
            setZoom(scale);
        }

        const viewport = page.getViewport({ scale });
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        if (isAutoZoom) {
            container.scrollLeft = (canvas.width - container.clientWidth) / 2;
            container.scrollTop = (canvas.height - container.clientHeight) / 2;
        }

        if (context) {
            const task = page.render({ canvasContext: context, viewport });
            renderTask.current = task;
            await task.promise;
        }
    } catch(e: any) {
        if (e.name !== 'RenderingCancelledException') {
          console.error("Failed to render page:", e);
          toast({ variant: "destructive", title: "Render Error", description: "Could not display the page." });
        }
    } finally {
        if (renderTask.current?.internalRenderTask.id === renderTask.current?.id) {
            renderTask.current = null;
        }
    }
  }, [toast, zoom]);

  useEffect(() => {
    if (file?.pdfjsDoc && mainCanvasRef.current && currentPage) {
        renderPage(file.pdfjsDoc, currentPage, mainCanvasRef.current, zoom);
    }
  }, [zoom]); // Rerender only on zoom change, page change is handled separately.

  const loadPdf = useCallback(async (fileToLoad: File, providedPassword = "") => {
    const currentOperationId = ++operationId.current;
    setIsLoading(true);
    setError(null);
    setIsEncrypted(false);
    
    if (file?.pdfjsDoc) file.pdfjsDoc.destroy();
    setFile(null);
    setPagePreviews([]);
    
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

      if (mainCanvasRef.current) {
        renderPage(pdfjsDoc, 1, mainCanvasRef.current);
      }
      
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
                  if(newPreviews[i]) {
                    newPreviews[i] = {...newPreviews[i], dataUrl};
                  }
                  return newPreviews;
              });
          }
      }

    } catch (err: any) {
      if (operationId.current !== currentOperationId) return;

      if (err.name === 'PasswordException') {
        setIsEncrypted(true);
        setFile({ file: fileToLoad } as any); // Set a placeholder to show the password field
        setError("This PDF is password-protected. Please enter the password to view it.");
      } else {
        setError("Could not read the PDF file. It might be corrupted or in an unsupported format.");
        toast({ variant: "destructive", title: "Error Loading PDF", description: err.message });
      }
    } finally {
      if (operationId.current === currentOperationId) setIsLoading(false);
    }
  }, [file?.pdfjsDoc, toast, renderPage]);
  
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
    if(renderTask.current) renderTask.current.cancel();
    if (file?.pdfjsDoc) file.pdfjsDoc.destroy();
    setFile(null);
    setPagePreviews([]);
    setIsLoading(false);
    setIsEncrypted(false);
    setPassword('');
    setError(null);
  };
  
  const handlePasswordSubmit = (e: React.FormEvent) => {
      e.preventDefault();
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
  
  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
        setCurrentPage('' as any);
    } else {
        const num = parseInt(val, 10);
        if (!isNaN(num) && file) {
            const newPage = Math.max(1, Math.min(num, file.totalPages));
            handlePageSelect(newPage);
        }
    }
  }

   const handlePageInputBlur = () => {
        if ((currentPage as any) === '' && file) {
            setCurrentPage(1);
        }
    };
  
  const resetZoom = () => {
    if (file?.pdfjsDoc && mainCanvasRef.current) {
        renderPage(file.pdfjsDoc, currentPage, mainCanvasRef.current);
    }
  }
  
  const handlePageSelect = (pageNumber: number) => {
    if (pageNumber !== currentPage && file?.pdfjsDoc && mainCanvasRef.current) {
      setCurrentPage(pageNumber);
      renderPage(file.pdfjsDoc, pageNumber, mainCanvasRef.current, zoom);
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mainCanvasContainerRef.current) return;
    e.preventDefault();
    panState.current.isPanning = true;
    panState.current.startX = e.pageX - mainCanvasContainerRef.current.offsetLeft;
    panState.current.startY = e.pageY - mainCanvasContainerRef.current.offsetTop;
    panState.current.lastX = mainCanvasContainerRef.current.scrollLeft;
    panState.current.lastY = mainCanvasContainerRef.current.scrollTop;
    mainCanvasContainerRef.current.style.cursor = 'grabbing';
  };

  const handleMouseUp = () => {
    if (!mainCanvasContainerRef.current) return;
    panState.current.isPanning = false;
    mainCanvasContainerRef.current.style.cursor = 'grab';
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!panState.current.isPanning || !mainCanvasContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - mainCanvasContainerRef.current.offsetLeft;
    const y = e.pageY - mainCanvasContainerRef.current.offsetTop;
    const walkX = (x - panState.current.startX);
    const walkY = (y - panState.current.startY);
    mainCanvasContainerRef.current.scrollLeft = panState.current.lastX - walkX;
    mainCanvasContainerRef.current.scrollTop = panState.current.lastY - walkY;
  };
  
  const handleMouseLeave = () => {
      if (mainCanvasContainerRef.current && panState.current.isPanning) {
          panState.current.isPanning = false;
          mainCanvasContainerRef.current.style.cursor = 'grab';
      }
  }

  if (!file && !isLoading) {
    return (
        <Card className="bg-white dark:bg-card shadow-lg max-w-lg mx-auto">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl">PDF Viewer</CardTitle>
              <CardDescription>Select a PDF file to view its content.</CardDescription>
            </CardHeader>
            <CardContent>
                <div {...getRootProps()} className={cn("flex flex-col items-center justify-center p-10 rounded-lg border-2 border-dashed transition-colors", isDragActive ? "border-primary bg-primary/10" : "hover:border-primary/50")}>
                    <input {...getInputProps()} />
                    <UploadCloud className="w-12 h-12 text-muted-foreground" />
                    <p className="mt-4 text-lg font-semibold">Drop PDF here or click to upload</p>
                    <Button type="button" onClick={open} className="mt-4" disabled={isLoading}><FolderOpen className="mr-2 h-4 w-4"/>Choose File</Button>
                </div>
            </CardContent>
        </Card>
    );
  }
  
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Processing PDF...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 h-full">
        <Card className="max-w-sm w-full">
          <CardContent className="p-6 text-center space-y-4">
            <AlertTriangle className="w-10 h-10 text-destructive mx-auto"/>
            <p className="text-destructive font-medium">{error}</p>
            {isEncrypted && (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="relative">
                  <Input id="password-input" value={password} onChange={(e) => setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} className="pr-10" placeholder="Enter password" />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowPassword(p => !p)}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                <Button type="submit" disabled={!password} className="w-full">
                    <Unlock className="mr-2 h-4 w-4"/> Unlock & View
                </Button>
              </form>
            )}
            <Button variant="outline" onClick={removeFile} className="w-full">Choose a different file</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return file?.pdfjsDoc ? (
    <div className="flex flex-col h-[calc(100vh-200px)] gap-4">
        <Card>
            <div className="p-2 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => handlePageSelect(currentPage - 1)} disabled={currentPage <= 1}><ChevronLeft className="h-4 w-4"/></Button>
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                        <Input type="number" value={currentPage} onChange={handlePageInputChange} onBlur={handlePageInputBlur} className="w-16 h-8 text-center" min="1" max={file.totalPages} />
                        <span>/ {file.totalPages}</span>
                    </div>
                    <Button variant="outline" size="icon" onClick={() => handlePageSelect(currentPage + 1)} disabled={currentPage >= file.totalPages}><ChevronRight className="h-4 w-4"/></Button>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => changeZoom('out')} disabled={zoom <= MIN_ZOOM}><ZoomOut className="h-4 w-4"/></Button>
                    <Button variant="outline" size="icon" onClick={resetZoom}><RefreshCw className="h-4 w-4"/></Button>
                    <Button variant="outline" size="icon" onClick={() => changeZoom('in')} disabled={zoom >= MAX_ZOOM}><ZoomIn className="h-4 w-4"/></Button>
                </div>
                <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground/70 hover:bg-destructive/10 hover:text-destructive shrink-0" onClick={removeFile}><X className="w-4 h-4" /></Button>
            </div>
        </Card>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-[250px_1fr] gap-4 min-h-0">
            <Card className="hidden md:block">
                <div className="p-2 h-full overflow-y-auto">
                    {pagePreviews.map(p => (
                        <PageThumbnail key={p.pageNumber} page={p} onSelect={() => handlePageSelect(p.pageNumber)} isActive={currentPage === p.pageNumber} />
                    ))}
                </div>
            </Card>
            <div 
                ref={mainCanvasContainerRef} 
                className="flex-1 overflow-auto bg-muted/40 rounded-lg flex justify-center items-center p-4 cursor-grab"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
            >
                <canvas ref={mainCanvasRef} className="bg-white dark:bg-card shadow-lg rounded-md" />
            </div>
        </div>
    </div>
  ) : null;
}
