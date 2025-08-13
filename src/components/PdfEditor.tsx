
"use client";

import React, { useState, useCallback, useRef, useEffect, useReducer } from "react";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud,
  X,
  FolderOpen,
  Loader2,
  Lock,
  File as FileIcon,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import * as pdfjsLib from 'pdfjs-dist';
import { motion } from "framer-motion";
import { PdfSidebar, PageInfo } from "./PdfSidebar";

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
  isEncrypted: boolean;
};

type State = {
  file: PDFFile | null;
  pages: PageInfo[];
  selectedPage: PageInfo | null;
  isLoading: boolean;
  error: string | null;
};

type Action =
  | { type: 'START_LOADING' }
  | { type: 'FILE_LOAD_SUCCESS'; file: PDFFile; pages: PageInfo[] }
  | { type: 'FILE_LOAD_ERROR'; error: string, file?: Partial<PDFFile> }
  | { type: 'PAGE_RENDERED'; pageNumber: number; dataUrl: string; pdfjsPage: pdfjsLib.PDFPageProxy; }
  | { type: 'SELECT_PAGE'; pageNumber: number }
  | { type: 'RESET' };
  
const initialState: State = {
  file: null,
  pages: [],
  selectedPage: null,
  isLoading: false,
  error: null,
};

function editorReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'START_LOADING':
      return { ...initialState, isLoading: true };
    case 'FILE_LOAD_SUCCESS':
      return {
        ...state,
        isLoading: false,
        file: action.file,
        pages: action.pages,
        selectedPage: action.pages[0] || null,
        error: null,
      };
    case 'FILE_LOAD_ERROR':
        const fileState = action.file ? { file: action.file as PDFFile } : {};
        return { ...initialState, ...fileState, isLoading: false, error: action.error };
    case 'PAGE_RENDERED': {
      const newPages = state.pages.map(p =>
        p.pageNumber === action.pageNumber ? { ...p, dataUrl: action.dataUrl, pdfjsPage: action.pdfjsPage } : p
      );
      const newSelectedPage = state.selectedPage?.pageNumber === action.pageNumber 
        ? newPages.find(p => p.pageNumber === action.pageNumber)!
        : state.selectedPage;
        
      return { ...state, pages: newPages, selectedPage: newSelectedPage };
    }
    case 'SELECT_PAGE': {
        const pageToSelect = state.pages.find(p => p.pageNumber === action.pageNumber);
        return { ...state, selectedPage: pageToSelect || state.selectedPage };
    }
    case 'RESET':
        if(state.file?.pdfjsDoc) {
          state.file.pdfjsDoc.destroy();
        }
      return initialState;
    default:
      return state;
  }
}

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}


export function PdfEditor() {
  const [state, dispatch] = useReducer(editorReducer, initialState);
  const { file, pages, selectedPage, isLoading, error } = state;
  const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set());

  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      const singleFile = acceptedFiles[0];
      
      dispatch({ type: 'RESET' });
      dispatch({ type: 'START_LOADING' });

      try {
        const pdfBytes = await singleFile.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfBytes) });
        const pdfjsDoc = await loadingTask.promise;
        
        const pageCount = pdfjsDoc.numPages;
        
        const pageInfos: PageInfo[] = Array.from({ length: pageCount }, (_, i) => ({
            pageNumber: i + 1,
        }));
        
        dispatch({
          type: 'FILE_LOAD_SUCCESS',
          file: {
            id: `${singleFile.name}-${Date.now()}`,
            file: singleFile,
            totalPages: pageCount,
            pdfjsDoc,
            isEncrypted: false,
          },
          pages: pageInfos
        });

      } catch (err: any) {
          let errorMessage = "Could not read PDF. The file might be corrupted.";
          let errorFile: Partial<PDFFile> | undefined = undefined;

          if (err.name === 'PasswordException') {
              errorMessage = "This PDF is password-protected and cannot be edited.";
              errorFile = {
                 id: `${singleFile.name}-${Date.now()}`,
                 file: singleFile,
                 totalPages: 0,
                 isEncrypted: true,
              };
          }
          dispatch({ type: 'FILE_LOAD_ERROR', error: errorMessage, file: errorFile });
          toast({ variant: "destructive", title: "Error Loading File", description: errorMessage });
      }
    }, [toast]);
    
  // Effect for rendering visible page thumbnails
  useEffect(() => {
    if (!file?.pdfjsDoc || visiblePages.size === 0) return;

    const renderThumbnails = async () => {
      for (const pageNumber of visiblePages) {
        const pageInfo = pages.find(p => p.pageNumber === pageNumber);
        // Only render if it doesn't have a dataUrl yet
        if (pageInfo && !pageInfo.dataUrl) {
          try {
            const pdfjsPage = await file.pdfjsDoc!.getPage(pageNumber);
            const viewport = pdfjsPage.getViewport({ scale: 0.4 });
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const context = canvas.getContext('2d');
            if (context) {
              await pdfjsPage.render({ canvasContext: context, viewport }).promise;
              dispatch({
                type: 'PAGE_RENDERED',
                pageNumber,
                dataUrl: canvas.toDataURL('image/jpeg', 0.8),
                pdfjsPage,
              });
            }
          } catch (e) {
            console.error(`Error rendering page ${pageNumber}`, e);
          }
        }
      }
    };
    
    renderThumbnails();
  }, [visiblePages, file, pages]);


  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxSize: MAX_FILE_SIZE_BYTES,
    multiple: false,
    noClick: true,
    noKeyboard: true,
    disabled: isLoading,
  });

  const handlePageSelect = (pageNumber: number) => {
    dispatch({ type: 'SELECT_PAGE', pageNumber });
  };
  
  // Effect for rendering the main canvas
  useEffect(() => {
    let renderTask: pdfjsLib.RenderTask | null = null;
    
    const renderMainCanvas = async () => {
        if (!selectedPage?.pdfjsPage || !mainCanvasRef.current) return;
        
        const canvas = mainCanvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;
        
        // Render high-res version
        const viewport = selectedPage.pdfjsPage.getViewport({ scale: 1.5 });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        renderTask = selectedPage.pdfjsPage.render({ canvasContext: context, viewport });
        await renderTask.promise;
    }
    renderMainCanvas();
    
    return () => {
        if(renderTask) {
            renderTask.cancel();
        }
    }
  }, [selectedPage]);

  if (!file && !isLoading && !error) {
    return (
        <Card className="bg-transparent shadow-lg max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">Upload PDF</CardTitle>
            </CardHeader>
            <CardContent>
            <div
                {...getRootProps()}
                className={cn(
                "flex flex-col items-center justify-center p-6 sm:p-10 rounded-lg border-2 border-dashed transition-colors duration-300",
                "hover:border-primary/50",
                isDragActive && "border-primary bg-primary/10"
                )}
            >
                <input {...getInputProps()} />
                <UploadCloud className="w-10 h-10 text-muted-foreground sm:w-12 sm:h-12" />
                <p className="mt-2 text-base font-semibold text-foreground sm:text-lg">Drop a PDF file here</p>
                <p className="text-xs text-muted-foreground sm:text-sm">or click the button below</p>
                <motion.div whileHover={{ scale: 1.05, y: -2 }} transition={{ type: 'spring', stiffness: 400, damping: 10 }}>
                    <Button type="button" onClick={open} className="mt-4">
                        <FolderOpen className="mr-2 h-4 w-4" />Choose File
                    </Button>
                </motion.div>
            </div>
            </CardContent>
        </Card>
    );
  }

  return (
    <div className="flex flex-col h-full gap-4">
      <Card className="bg-transparent shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between p-4">
              <div className="flex items-center gap-3 overflow-hidden">
                  {isLoading ? (
                  <Loader2 className="w-6 h-6 text-primary animate-spin shrink-0" />
                  ) : error ? (
                  <ShieldAlert className="w-6 h-6 text-destructive shrink-0" />
                  ) : file?.isEncrypted ? (
                  <Lock className="w-6 h-6 text-yellow-500 shrink-0" />
                  ) : (
                  <FileIcon className="w-6 h-6 text-destructive shrink-0" />
                  )}
                  <div className="flex flex-col overflow-hidden">
                      <span className="text-sm font-medium truncate" title={file?.file.name}>
                      {isLoading ? "Loading PDF..." : error ? "Error" : file?.file.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                      {isLoading ? "Please wait..." : error ? error : `${formatBytes(file?.file.size || 0)}`}
                      </span>
                  </div>
              </div>
              <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground/70 hover:bg-destructive/10 hover:text-destructive shrink-0" onClick={() => dispatch({ type: 'RESET' })}>
                  <X className="w-4 h-4" />
              </Button>
          </CardHeader>
      </Card>
        
     <div className="grid grid-cols-12 gap-4 flex-1 h-[calc(100vh-21rem)]" key={file?.id}>
        <div className="col-span-3 lg:col-span-2 h-full overflow-y-auto pr-2">
            <PdfSidebar
                pages={pages}
                selectedPage={selectedPage}
                onPageSelect={handlePageSelect}
                onVisiblePagesChange={setVisiblePages}
                isLoading={isLoading}
            />
        </div>
        <div className="col-span-9 lg:col-span-10 bg-muted/40 rounded-lg flex items-center justify-center p-4 overflow-auto">
             {isLoading ? (
                 <div className="flex flex-col items-center text-center text-muted-foreground">
                    <Loader2 className="w-12 h-12 mb-4 animate-spin text-primary" />
                    <h3 className="font-semibold text-lg text-foreground">Processing PDF</h3>
                    <p>Please wait a moment...</p>
                </div>
             ) : error ? (
                 <div className="flex flex-col items-center text-center text-muted-foreground p-4">
                    <ShieldAlert className="w-12 h-12 mb-4 text-destructive" />
                    <h3 className="font-semibold text-lg text-foreground">Loading Failed</h3>
                    <p>{error}</p>
                </div>
             ) : (
                <canvas ref={mainCanvasRef} className="max-w-full max-h-full object-contain shadow-lg border"></canvas>
             )}
        </div>
    </div>
    </div>
  );
}
