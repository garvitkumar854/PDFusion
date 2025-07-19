
"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud,
  Download,
  X,
  Save,
  Loader2,
  FolderOpen,
  Lock,
  ShieldAlert,
  Type,
  Image as ImageIcon,
  Square,
  MousePointer,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { Skeleton } from "./ui/skeleton";
import { PasswordDialog } from "./PasswordDialog";

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

const MAX_FILE_SIZE_MB = 100;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

type PDFFile = {
  id: string;
  file: File;
  totalPages: number;
  pdfjsDoc?: pdfjsLib.PDFDocumentProxy;
  isEncrypted: boolean;
};

type EditMode = 'select' | 'text' | 'image' | 'shape';

// More to be added here for different object types
type EditorObject = {
    id:string;
    type: 'text' | 'image' | 'shape';
    x: number;
    y: number;
    width: number;
    height: number;
    text?: string;
    fontSize?: number;
    imageData?: Uint8Array;
    // ... other properties
};

export function PdfEditor() {
  const [file, setFile] = useState<PDFFile | null>(null);
  const [unlockedFile, setUnlockedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  
  const [activePage, setActivePage] = useState<number>(1);
  const [pagePreviews, setPagePreviews] = useState<{page: number, url: string}[]>([]);
  const [activePageUrl, setActivePageUrl] = useState<string | null>(null);

  const [editMode, setEditMode] = useState<EditMode>('select');
  const [objects, setObjects] = useState<Record<number, EditorObject[]>>({});


  const operationId = useRef<number>(0);
  const { toast } = useToast();

  const cleanup = useCallback(() => {
    if (file?.pdfjsDoc) {
      file.pdfjsDoc.destroy();
    }
    setFile(null);
    setUnlockedFile(null);
    setIsLoading(false);
    setPagePreviews([]);
    setActivePage(1);
    setActivePageUrl(null);
    setObjects({});
  }, [file]);

  useEffect(() => {
    // Component unmount cleanup
    return () => {
      if (file?.pdfjsDoc) {
        file.pdfjsDoc.destroy();
      }
    };
  }, [file]);


  const renderPage = useCallback(async (pdfjsDoc: pdfjsLib.PDFDocumentProxy, pageNum: number, currentOperationId: number, scale = 1.5) => {
    if (operationId.current !== currentOperationId) return null;
    try {
      const page = await pdfjsDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext('2d');
      if (context) {
        await page.render({ canvasContext: context, viewport }).promise;
        return canvas.toDataURL('image/jpeg', 0.9);
      }
    } catch (e) {
      console.error(`Error rendering page ${pageNum}:`, e);
    }
    return null;
  }, []);

  const loadPdf = useCallback(async (fileToLoad: File, isUnlocked = false) => {
    const currentOperationId = ++operationId.current;
    
    cleanup(); // Clean up previous state before loading new file
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
      setFile({ 
        id: `${fileToLoad.name}-${Date.now()}`, 
        file: fileToLoad, 
        totalPages: pageCount,
        pdfjsDoc,
        isEncrypted: false,
      });

      // Render first page immediately for active view
      const firstPageUrl = await renderPage(pdfjsDoc, 1, currentOperationId);
      if(firstPageUrl) setActivePageUrl(firstPageUrl);

      // Render all previews
      const previewPromises = Array.from({length: pageCount}, (_, i) => renderPage(pdfjsDoc, i + 1, currentOperationId, 0.3));
      const urls = await Promise.all(previewPromises);
      const previews = urls.map((url, i) => ({ page: i + 1, url: url! })).filter(p => p.url);
      setPagePreviews(previews);

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
            setIsPasswordDialogOpen(true);
        } else {
            console.error("Failed to load PDF", error);
            toast({ variant: "destructive", title: "Could not read PDF", description: "The file might be corrupted or in an unsupported format." });
            cleanup();
        }
    } finally {
        if (operationId.current === currentOperationId) {
            setIsLoading(false);
        }
    }
  }, [cleanup, toast, renderPage]);


  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const singleFile = acceptedFiles[0];
    loadPdf(singleFile);
  }, [loadPdf]);

  const onUnlockSuccess = async (unlocked: File) => {
      setIsPasswordDialogOpen(false);
      await loadPdf(unlocked, true);
      toast({ title: 'File Unlocked', description: `You can now edit your PDF.`});
  };
  
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxSize: MAX_FILE_SIZE_BYTES,
    multiple: false,
    noClick: true,
    noKeyboard: true,
    disabled: isLoading || isSaving,
  });
  
  const handleSave = async () => {
    // This is a placeholder for a much more complex save function
    toast({ title: "Save functionality coming soon!" });
  };
  
  const handlePageChange = async (pageNumber: number) => {
    if (!file?.pdfjsDoc || isLoading || activePage === pageNumber) return;
    setActivePage(pageNumber);
    setActivePageUrl(null); // Show loader
    const currentOperationId = operationId.current;
    const url = await renderPage(file.pdfjsDoc, pageNumber, currentOperationId);
    if (url && operationId.current === currentOperationId) {
      setActivePageUrl(url);
    }
  };

  const editorTools = [
    { id: 'select', icon: MousePointer, label: 'Select' },
    { id: 'text', icon: Type, label: 'Add Text' },
    { id: 'image', icon: ImageIcon, label: 'Add Image' },
    { id: 'shape', icon: Square, label: 'Add Shape' },
  ]

  if (!file && !isLoading) {
    return (
        <Card className="bg-white dark:bg-card shadow-lg max-w-lg mx-auto">
            <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">PDF Editor</CardTitle>
                <CardDescription>Upload a PDF to start editing.</CardDescription>
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
                <p className="mt-2 text-base font-semibold text-foreground sm:text-lg">Drop a PDF file here</p>
                <p className="text-xs text-muted-foreground sm:text-sm">or click the button below</p>
                <Button type="button" onClick={open} className="mt-4" disabled={isLoading || isSaving}>
                    <FolderOpen className="mr-2 h-4 w-4" />Choose File
                </Button>
            </div>
            </CardContent>
        </Card>
    );
  }

  return (
    <div className="space-y-6">
        {file?.isEncrypted && isPasswordDialogOpen && (
            <PasswordDialog
                isOpen={isPasswordDialogOpen}
                onOpenChange={setIsPasswordDialogOpen}
                file={file.file}
                onUnlockSuccess={onUnlockSuccess}
            />
        )}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
          <aside className="w-full lg:w-64 space-y-4 shrink-0">
              <Card>
                  <CardHeader className="p-3">
                      <CardTitle className="text-base">Pages</CardTitle>
                      <CardDescription className="text-xs">{file?.totalPages ? `${file.totalPages} pages` : 'Loading...'}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-2 max-h-[70vh] overflow-y-auto">
                      {isLoading ? Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="w-full aspect-[7/10] mb-2" />) :
                      <div className="grid grid-cols-3 lg:grid-cols-2 gap-2">
                         {pagePreviews.map(p => (
                          <div 
                              key={p.page} 
                              className={cn("rounded-md overflow-hidden border-2 transition-all aspect-[7/10] bg-muted cursor-pointer", activePage === p.page ? 'border-primary' : 'border-transparent hover:border-primary/50')}
                              onClick={() => handlePageChange(p.page)}
                          >
                             {p.url ? <img src={p.url} className="w-full h-full object-contain" alt={`Page ${p.page} preview`} /> : <Skeleton className="w-full h-full" />}
                             <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-0.5 font-medium">{p.page}</div>
                          </div>
                         ))}
                      </div>
                      }
                  </CardContent>
              </Card>
          </aside>
          <main className="flex-grow min-w-0">
              <Card className="sticky top-20 z-10 bg-background/80 backdrop-blur-sm">
                 <div className="p-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex gap-1">
                          {editorTools.map(tool => (
                              <Button key={tool.id} variant={editMode === tool.id ? 'secondary' : 'ghost'} size="icon" onClick={() => setEditMode(tool.id as EditMode)} title={tool.label}>
                                  <tool.icon className="w-5 h-5" />
                              </Button>
                          ))}
                      </div>
                      <div className="flex gap-2">
                          <Button variant="ghost" size="icon" className="text-muted-foreground/80 hover:bg-destructive/10 hover:text-destructive" onClick={cleanup} disabled={isSaving || isLoading}>
                              <Trash2 className="w-5 h-5" />
                          </Button>
                          <Button onClick={handleSave} disabled={isSaving || isLoading || !file || (file.isEncrypted && !unlockedFile)}>
                              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                              Save PDF
                          </Button>
                      </div>
                 </div>
              </Card>
              <div className="mt-4 aspect-[8.5/11] bg-white dark:bg-zinc-800 rounded-md shadow-lg border flex items-center justify-center overflow-hidden">
                  {isLoading ? <Loader2 className="w-8 h-8 animate-spin text-primary" /> :
                   activePageUrl ? <img src={activePageUrl} alt={`Page ${activePage}`} className="max-w-full max-h-full object-contain" /> : <Loader2 className="w-8 h-8 animate-spin text-primary" />}
              </div>
          </main>
      </div>
    </div>
  );
}
