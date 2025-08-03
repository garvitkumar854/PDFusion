
"use client";

import React, { useState, useCallback, useRef, useEffect, useReducer } from "react";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud,
  File as FileIcon,
  Download,
  X,
  CheckCircle,
  GripVertical,
  Combine,
  FolderOpen,
  Loader2,
  Ban,
  Lock,
  Unlock,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { motion, AnimatePresence } from 'framer-motion';


if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}


const MAX_FILES = 50;
const MAX_FILE_SIZE_MB = 100;
const MAX_TOTAL_SIZE_MB = 200;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_TOTAL_SIZE_BYTES = MAX_TOTAL_SIZE_MB * 1024 * 1024;

export type PDFFile = {
  id: string;
  file: File;
  isEncrypted: boolean;
};

type State = {
    files: PDFFile[];
    totalSize: number;
    isMerging: boolean;
    mergeProgress: number;
    mergedPdfUrl: string | null;
    removingFileId: string | null;
};

type Action =
    | { type: 'ADD_FILES'; files: PDFFile[] }
    | { type: 'UPDATE_FILE'; file: PDFFile }
    | { type: 'REMOVE_FILE'; fileId: string }
    | { type: 'SET_FILES_ORDER'; files: PDFFile[] }
    | { type: 'CLEAR_ALL' }
    | { type: 'MERGE_START' }
    | { type: 'MERGE_PROGRESS'; progress: number }
    | { type: 'MERGE_SUCCESS'; url: string }
    | { type: 'MERGE_ERROR'; error: string }
    | { type: 'MERGE_CANCEL' }
    | { type: 'RESET_MERGE_RESULTS' }
    | { type: 'SET_REMOVING_FILE_ID'; fileId: string | null };


const initialState: State = {
    files: [],
    totalSize: 0,
    isMerging: false,
    mergeProgress: 0,
    mergedPdfUrl: null,
    removingFileId: null,
};

function reducer(state: State, action: Action): State {
    switch(action.type) {
        case 'ADD_FILES': {
            const newFiles = action.files;
            const newSize = newFiles.reduce((acc, f) => acc + f.file.size, 0);
            return {
                ...state,
                files: [...state.files, ...newFiles],
                totalSize: state.totalSize + newSize,
            }
        }
        case 'UPDATE_FILE': {
            const index = state.files.findIndex(f => f.id === action.file.id);
            if (index === -1) return state;
            const newFiles = [...state.files];
            newFiles[index] = action.file;
            return { ...state, files: newFiles };
        }
        case 'REMOVE_FILE': {
            const fileToRemove = state.files.find(f => f.id === action.fileId);
            if (!fileToRemove) return state;
            return {
                ...state,
                files: state.files.filter(f => f.id !== action.fileId),
                totalSize: state.totalSize - fileToRemove.file.size,
                removingFileId: null,
            };
        }
        case 'SET_FILES_ORDER':
            return { ...state, files: action.files };
        case 'CLEAR_ALL':
            return { ...initialState };
        case 'MERGE_START':
            return { ...state, isMerging: true, mergeProgress: 0, mergedPdfUrl: null };
        case 'MERGE_PROGRESS':
            return { ...state, mergeProgress: action.progress };
        case 'MERGE_SUCCESS':
            return { ...state, isMerging: false, mergeProgress: 100, mergedPdfUrl: action.url };
        case 'MERGE_ERROR':
            return { ...state, isMerging: false };
        case 'MERGE_CANCEL':
            return { ...state, isMerging: false, mergeProgress: 0 };
        case 'RESET_MERGE_RESULTS':
            return { ...initialState };
        case 'SET_REMOVING_FILE_ID':
            return { ...state, removingFileId: action.fileId };
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

export function MergePdfs() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { files, totalSize, isMerging, mergeProgress, mergedPdfUrl, removingFileId } = state;
  const [outputFilename, setOutputFilename] = useState("merged_document.pdf");
  
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const operationId = useRef<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (mergedPdfUrl) {
        URL.revokeObjectURL(mergedPdfUrl);
      }
    };
  }, [mergedPdfUrl]);
  
  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: any[]) => {
      if (rejectedFiles.length > 0) {
        toast({ variant: "destructive", title: "Invalid file(s) rejected", description: "Some files were not PDFs or exceeded size limits.", duration: 3000 });
      }
      if (files.length + acceptedFiles.length > MAX_FILES) {
        toast({ variant: "destructive", title: "File limit reached", description: `You can only upload a maximum of ${MAX_FILES} files.`, duration: 3000 });
        return;
      }
      
      let currentSize = totalSize;
      const validFiles: File[] = [];
      for(const file of acceptedFiles) {
        if (file.size > MAX_FILE_SIZE_BYTES) {
          toast({ variant: "destructive", title: "File too large", description: `"${file.name}" exceeds the ${MAX_FILE_SIZE_MB}MB file size limit.`, duration: 3000 });
          continue;
        }
        if (currentSize + file.size > MAX_TOTAL_SIZE_BYTES) {
          toast({ variant: "destructive", title: "Total size limit exceeded", description: `Adding "${file.name}" would exceed the ${MAX_TOTAL_SIZE_MB}MB total size limit.`, duration: 3000 });
          continue;
        }
        if (!file.type.includes('pdf')) {
          toast({ variant: "destructive", title: "Invalid file type", description: `"${file.name}" is not a PDF.`, duration: 3000 });
          continue;
        }
        currentSize += file.size;
        validFiles.push(file);
      }

      if (validFiles.length === 0) return;

      const filesToAddPromises = validFiles.map(async file => {
          const pdfBytes = await file.arrayBuffer();
          let isEncrypted = false;
          try {
              // A more reliable check for encryption
              await pdfjsLib.getDocument(new Uint8Array(pdfBytes)).promise;
          } catch (pdfjsError: any) {
              if (pdfjsError.name === 'PasswordException') {
                  isEncrypted = true;
              } else {
                 console.error("Failed to read file", file.name, pdfjsError);
                 throw new Error(`Could not read "${file.name}". It may be corrupted.`);
              }
          }
          return { id: `${file.name}-${Date.now()}`, file, isEncrypted };
      });

      try {
        const filesToAdd = await Promise.all(filesToAddPromises);
        dispatch({ type: 'ADD_FILES', files: filesToAdd });
        toast({
          variant: "success",
          title: `${filesToAdd.length} file(s) added`,
          description: "You can now reorder them or merge.",
        });
      } catch (e: any) {
         toast({ variant: "destructive", title: "Error reading file", description: e.message || "One of the PDFs might be corrupted.", duration: 5000 });
      }
    },
    [files.length, totalSize, toast]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    noClick: true,
    noKeyboard: true,
    disabled: isMerging,
  });

  const removeFile = (fileId: string) => {
    const fileToRemove = files.find(f => f.id === fileId);
    dispatch({ type: 'SET_REMOVING_FILE_ID', fileId });
    setTimeout(() => {
      dispatch({ type: 'REMOVE_FILE', fileId });
       toast({ variant: "info", title: "File removed", description: `"${fileToRemove?.file.name}" has been removed.` });
    }, 300);
  };
  
  const handleClearAll = () => {
    dispatch({ type: 'CLEAR_ALL' });
    toast({ variant: "warning", title: "All files cleared", description: "The file list has been reset." });
  };
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    dragItem.current = index;
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
        setIsDragging(true);
    }, 0);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (dragItem.current === null || dragItem.current === index) {
      return;
    }
    dragOverItem.current = index;
    const filesCopy = [...files];
    const draggedItemContent = filesCopy.splice(dragItem.current, 1)[0];
    filesCopy.splice(index, 0, draggedItemContent);
    dragItem.current = index;
    dispatch({ type: 'SET_FILES_ORDER', files: filesCopy });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    dragItem.current = null;
    dragOverItem.current = null;
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); 
  };

  const handleMerge = async () => {
    if (files.length < 2) {
        toast({ variant: "destructive", title: "Not enough files", description: "Please upload at least two files to merge." });
        return;
    }
    
    const currentOperationId = ++operationId.current;
    dispatch({ type: 'MERGE_START' });
    
    try {
        const mergedPdf = await PDFDocument.create();
        let skippedFiles = 0;

        for (let i = 0; i < files.length; i++) {
            const pdfFile = files[i];
            if (pdfFile.isEncrypted) {
                // This check is now redundant due to the button being disabled, but it's good practice.
                toast({ variant: "destructive", title: "Cannot Merge Locked File", description: `Please remove "${pdfFile.file.name}" to proceed.` });
                dispatch({ type: 'MERGE_CANCEL' });
                return;
            }
            if (operationId.current !== currentOperationId) return;

            const pdfBytes = await pdfFile.file.arrayBuffer();
            try {
                const sourcePdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
                const copiedPages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));
            } catch (error: any) {
                skippedFiles++;
                console.warn(`Skipping file: ${pdfFile.file.name}`, error);
            }
            dispatch({ type: 'MERGE_PROGRESS', progress: Math.round(((i + 1) / files.length) * 100) });
        }
        
        if (operationId.current !== currentOperationId) return;

        if (mergedPdf.getPageCount() === 0) {
            throw new Error(`Merge failed. ${skippedFiles > 0 ? 'All source PDFs were either corrupted or had incorrect passwords.' : 'No pages could be merged.'}`);
        }

        const mergedPdfBytes = await mergedPdf.save();
        const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
        
        if (operationId.current !== currentOperationId) {
            URL.revokeObjectURL(URL.createObjectURL(blob));
            return;
        }

        const url = URL.createObjectURL(blob);
        dispatch({ type: 'MERGE_SUCCESS', url });
      
      toast({
        variant: "success",
        title: "Merge Successful!",
        description: `Your PDF is ready to be downloaded.${skippedFiles > 0 ? ` (${skippedFiles} file(s) were skipped).` : ''}`,
      });
    } catch (error: any) {
      console.error("Merge failed:", error);
       if (operationId.current === currentOperationId) {
          dispatch({ type: 'MERGE_ERROR', error: error.message });
          toast({
            variant: "destructive",
            title: "Merge Failed",
            description: error.message || "An unexpected error occurred during the merge process.",
          });
      }
    }
  };
  
  const handleCancelMerge = () => {
    operationId.current++;
    dispatch({ type: 'MERGE_CANCEL' });
    toast({ variant: "info", title: "Merge cancelled." });
  };

  const handleDownload = () => {
    if (!mergedPdfUrl) return;
    const link = document.createElement("a");
    link.href = mergedPdfUrl;
    const finalFilename = outputFilename.endsWith('.pdf') ? outputFilename : `${outputFilename}.pdf`;
    link.download = finalFilename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
        document.body.removeChild(link);
    }, 100);
  };
  
  const handleMergeMore = () => {
    if (mergedPdfUrl) {
      URL.revokeObjectURL(mergedPdfUrl);
    }
    dispatch({ type: 'RESET_MERGE_RESULTS' });
  };
  
  const mergeButtonDisabled = isMerging || files.length < 2 || files.some(f => f.isEncrypted);

  if (mergedPdfUrl) {
    return (
        <div className="text-center flex flex-col items-center justify-center py-12 animate-in fade-in duration-500 bg-transparent p-6 sm:p-8 rounded-xl">
            <CheckCircle className="w-16 h-16 sm:w-20 sm:h-20 text-green-500 mb-6" />
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">PDF Merged Successfully!</h2>
            <p className="text-muted-foreground mb-8 text-sm sm:text-base">Your new document is ready for download.</p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Button size="lg" onClick={handleDownload} className="w-full sm:w-auto text-base font-bold bg-green-600 hover:bg-green-700 text-white">
                    <Download className="mr-2 h-5 w-5" />
                    Download PDF
                </Button>
                <Button size="lg" variant="outline" onClick={handleMergeMore} className="w-full sm:w-auto text-base">
                    Merge More
                </Button>
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-6">
        <Card className="bg-transparent shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">Upload & Merge</CardTitle>
                <CardDescription>
                  Drag & drop files, reorder them, and click merge.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div
                    {...getRootProps()}
                    className={cn(
                    "flex flex-col items-center justify-center p-6 sm:p-10 rounded-lg border-2 border-dashed transition-colors duration-300",
                    !isMerging && "hover:border-primary/50",
                    isDragActive && "border-primary bg-primary/10",
                    isMerging && "opacity-70 pointer-events-none"
                    )}
                >
                    <input {...getInputProps()} />
                    <UploadCloud className="w-10 h-10 text-muted-foreground sm:w-12 sm:h-12" />
                    <p className="mt-2 text-base font-semibold text-foreground sm:text-lg">
                        Drop PDF files here
                    </p>
                    <p className="text-xs text-muted-foreground sm:text-sm">or click the button below</p>
                    <motion.div whileHover={{ scale: 1.05, y: -2 }} transition={{ type: 'spring', stiffness: 400, damping: 10 }}>
                      <Button type="button" onClick={open} className="mt-4" disabled={isMerging}>
                          <FolderOpen className="mr-2 h-4 w-4" />
                          Choose Files
                      </Button>
                    </motion.div>
                    <div className="w-full px-2 text-center text-xs text-muted-foreground mt-6">
                        <div className="flex flex-col items-center">
                            <p>Max: {MAX_FILE_SIZE_MB}MB/file • {MAX_TOTAL_SIZE_MB}MB total • {MAX_FILES} files</p>
                            <p>Remaining space: {formatBytes(totalSize > MAX_TOTAL_SIZE_BYTES ? 0 : MAX_TOTAL_SIZE_BYTES - totalSize)}</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>

        {files.length > 0 && (
          <Card className={cn("bg-transparent shadow-lg", isMerging && "opacity-70")}>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between pb-2 p-4 sm:p-6">
              <div className="flex-grow">
                <CardTitle className="text-xl sm:text-2xl">Uploaded Files ({files.length})</CardTitle>
                <CardDescription>Drag to reorder merge sequence</CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClearAll} 
                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive self-end sm:self-center"
                disabled={isMerging}
              >
                <X className="w-4 h-4 mr-1 sm:mr-2" />
                Clear All
              </Button>
            </CardHeader>
            <CardContent onDragOver={handleDragOver} className="p-2 sm:p-4">
                 {files.some(f => f.isEncrypted) && (
                    <div className="mb-4 flex items-center gap-3 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3 text-sm text-yellow-700 dark:text-yellow-400">
                        <ShieldAlert className="h-5 w-5 shrink-0" />
                        <div>This PDF is password-protected and cannot be processed. Please remove it before merging.</div>
                    </div>
                 )}
                <div className={cn("space-y-2 max-h-[266px] overflow-y-auto pr-2", isMerging && "pointer-events-none")}>
                    {files.map((pdfFile, index) => (
                        <div
                        key={pdfFile.id}
                        draggable={!isMerging}
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragEnter={(e) => handleDragEnter(e, index)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => e.preventDefault()}
                        style={{ willChange: 'transform, opacity, height, padding, margin' }}
                        className={cn(
                            'group flex items-center justify-between p-2 sm:p-3 rounded-lg border bg-background transition-all duration-300 ease-in-out',
                             isDragging && dragItem.current === index ? 'shadow-lg scale-105 opacity-50' : 'shadow-sm',
                             isMerging ? 'cursor-not-allowed' : 'cursor-grab',
                             removingFileId === pdfFile.id && 'opacity-0 scale-95 -translate-x-full h-0 !p-0 !my-0'
                        )}
                        >
                        <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
                           <FileIcon className="w-6 h-6 text-destructive sm:w-8 sm:h-8 shrink-0" />
                            <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-medium truncate" title={pdfFile.file.name}>
                                {pdfFile.file.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {formatBytes(pdfFile.file.size)}
                            </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                            {pdfFile.isEncrypted ? (
                                <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/10">
                                     <Lock className="w-3.5 h-3.5 mr-1" />
                                     Locked
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="hidden sm:inline-flex bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700">
                                <Unlock className="w-3.5 h-3.5 mr-1" />
                                Ready
                                </Badge>
                            )}
                            <GripVertical className="w-5 h-5 cursor-grab text-muted-foreground/70" />
                            <Button 
                            variant="ghost" 
                            size="icon" 
                            className="w-8 h-8 text-muted-foreground/70 hover:bg-destructive/10 hover:text-destructive" 
                            onClick={() => removeFile(pdfFile.id)}
                            disabled={isMerging}
                            >
                            <X className="w-4 h-4" />
                            </Button>
                        </div>
                        </div>
                    ))}
                </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-transparent shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">Merge Settings</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className={cn(isMerging && "opacity-70 pointer-events-none")}>
                        <label htmlFor="output-filename" className="text-sm font-medium text-foreground">Output Filename</label>
                        <Input 
                            id="output-filename" 
                            value={outputFilename} 
                            onChange={(e) => setOutputFilename(e.target.value)}
                            className="mt-1"
                            placeholder="e.g., merged_document.pdf"
                            disabled={isMerging}
                        />
                    </div>
                
                    <div className="pt-6 mt-6 border-t">
                        <AnimatePresence mode="wait">
                            {isMerging ? (
                                <motion.div
                                   key="progress"
                                   initial={{ opacity: 0, y: -10 }}
                                   animate={{ opacity: 1, y: 0 }}
                                   exit={{ opacity: 0, y: 10 }}
                                   transition={{ duration: 0.2 }}
                                   className="space-y-4"
                                >
                                    <div className="p-4 border rounded-lg bg-primary/5 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                                                <p className="text-sm font-medium text-primary transition-all duration-300">Merging PDFs...</p>
                                            </div>
                                            <p className="text-sm font-medium text-primary">{Math.round(mergeProgress)}%</p>
                                        </div>
                                        <Progress value={mergeProgress} className="h-2" />
                                    </div>
                                    <Button size="sm" variant="destructive" onClick={handleCancelMerge} className="w-full">
                                        <Ban className="mr-2 h-4 w-4" />
                                        Cancel
                                    </Button>
                                </motion.div>
                            ) : (
                                <motion.div
                                   key="button"
                                   initial={{ opacity: 0, y: -10 }}
                                   animate={{ opacity: 1, y: 0 }}
                                   exit={{ opacity: 0, y: 10 }}
                                   transition={{ duration: 0.2 }}
                                >
                                    <Button size="lg" className="w-full text-base font-bold" onClick={handleMerge} disabled={mergeButtonDisabled}>
                                        <Combine className="mr-2 h-5 w-5" />
                                        Merge PDFs
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
