
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
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import * as pdfjsLib from 'pdfjs-dist';
import { Skeleton } from "./ui/skeleton";

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
};

type PageInfo = {
    pageNumber: number;
    canvasRef: React.RefObject<HTMLCanvasElement>;
}

export function PdfViewer() {
  const [file, setFile] = useState<PDFFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  
  const operationId = useRef<number>(0);
  const { toast } = useToast();

  const loadPdf = useCallback(async (fileToLoad: File, providedPassword = "") => {
    const currentOperationId = ++operationId.current;
    setIsLoading(true);
    setError(null);
    setIsEncrypted(false);
    
    // Clean up previous document
    if (file?.pdfjsDoc) {
      file.pdfjsDoc.destroy();
    }
    setFile(null);
    setPages([]);
    
    try {
      const pdfBytes = await fileToLoad.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: pdfBytes, password: providedPassword });
      const pdfjsDoc = await loadingTask.promise;

      if (operationId.current !== currentOperationId) {
        pdfjsDoc.destroy();
        return;
      }
      
      const totalPages = pdfjsDoc.numPages;
      setFile({
        id: `${fileToLoad.name}-${Date.now()}`,
        file: fileToLoad,
        totalPages: totalPages,
        pdfjsDoc: pdfjsDoc
      });

      const pagesArray: PageInfo[] = Array.from({length: totalPages}, (_, i) => ({
          pageNumber: i + 1,
          canvasRef: React.createRef<HTMLCanvasElement>()
      }));
      setPages(pagesArray);
      setCurrentPage(1);

    } catch (err: any) {
      if (operationId.current !== currentOperationId) return;

      if (err.name === 'PasswordException') {
        setIsEncrypted(true);
        setError("This PDF is password-protected. Please enter the password to view it.");
      } else {
        console.error("Failed to load PDF", err);
        setError("Could not read the PDF file. It might be corrupted or in an unsupported format.");
        toast({ variant: "destructive", title: "Error Loading PDF", description: err.message });
      }
    } finally {
      if (operationId.current === currentOperationId) setIsLoading(false);
    }
  }, [toast, file]);

  useEffect(() => {
    if (!file || pages.length === 0) return;
    const currentOperationId = operationId.current;
    
    const renderPage = async (pageInfo: PageInfo) => {
        try {
            const page = await file.pdfjsDoc.getPage(pageInfo.pageNumber);
            if (operationId.current !== currentOperationId) return;

            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = pageInfo.canvasRef.current;
            if (canvas) {
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                if (context) {
                    await page.render({ canvasContext: context, viewport }).promise;
                }
            }
        } catch (e) {
            console.error(e);
        }
    }

    pages.forEach(renderPage);

  }, [file, pages]);

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
    disabled: isLoading,
  });

  const removeFile = () => {
    operationId.current++;
    if (file?.pdfjsDoc) file.pdfjsDoc.destroy();
    setFile(null);
    setPages([]);
    setIsLoading(false);
    setIsEncrypted(false);
    setPassword('');
    setError(null);
  };
  
  const handlePasswordSubmit = () => {
      if (file?.file) {
          loadPdf(file.file, password);
      }
  }

  const goToPage = (pageNumber: number) => {
      const targetPage = Math.max(1, Math.min(pageNumber, pages.length));
      setCurrentPage(targetPage);
      const pageElement = document.getElementById(`page-${targetPage}`);
      pageElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (!file && !isLoading) {
    return (
        <Card className="bg-white dark:bg-card shadow-lg">
            <CardContent className="p-6">
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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between p-4">
          <div>
            <CardTitle className="truncate max-w-[200px] sm:max-w-md">{file?.file.name || "Loading..."}</CardTitle>
            <CardDescription>{file ? `${file.totalPages} pages` : 'Please wait'}</CardDescription>
          </div>
          <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground/70 hover:bg-destructive/10 hover:text-destructive shrink-0" onClick={removeFile} disabled={isLoading}><X className="w-4 h-4" /></Button>
        </CardHeader>
      </Card>
      
      {isLoading && (
        <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      )}

      {error && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="p-4 space-y-4 text-center">
            <AlertTriangle className="w-8 h-8 text-destructive mx-auto"/>
            <p className="text-destructive font-medium">{error}</p>
            {isEncrypted && (
              <div className="max-w-sm mx-auto space-y-2">
                <div className="relative">
                  <Input
                    id="password-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? 'text' : 'password'}
                    className="pr-10"
                    placeholder="Enter password"
                  />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowPassword(p => !p)}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                <Button onClick={handlePasswordSubmit} disabled={!password}>
                    <Unlock className="mr-2 h-4 w-4"/>
                    Unlock & View
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && file && (
          <>
            <div className="sticky top-20 z-10 bg-background/80 backdrop-blur-sm p-2 rounded-lg border shadow-sm flex items-center justify-between">
                <Button variant="outline" size="icon" onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1}><ChevronLeft className="h-4 w-4"/></Button>
                <div className="flex items-center gap-2 text-sm font-medium">
                    <Input type="number" value={currentPage} onChange={e => setCurrentPage(parseInt(e.target.value,10))} onBlur={() => goToPage(currentPage)} className="w-16 h-8 text-center" min="1" max={file.totalPages} />
                    <span>/ {file.totalPages}</span>
                </div>
                <Button variant="outline" size="icon" onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= file.totalPages}><ChevronRight className="h-4 w-4"/></Button>
            </div>
            <div className="space-y-4 rounded-lg bg-muted/40 p-4">
              {pages.map((pageInfo, index) => (
                  <div key={index} id={`page-${pageInfo.pageNumber}`} className="bg-white dark:bg-card shadow-lg rounded-md overflow-hidden border">
                      <canvas ref={pageInfo.canvasRef} />
                  </div>
              ))}
            </div>
          </>
      )}
    </div>
  );
}
