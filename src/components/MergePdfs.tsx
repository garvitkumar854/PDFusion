
"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud,
  File as FileIcon,
  Download,
  X,
  CheckCircle,
  GripVertical,
  Layers,
  FolderOpen,
  Loader2,
  Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PDFDocument } from 'pdf-lib';


const MAX_FILES = 50;
const MAX_FILE_SIZE_MB = 100;
const MAX_TOTAL_SIZE_MB = 200;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_TOTAL_SIZE_BYTES = MAX_TOTAL_SIZE_MB * 1024 * 1024;

export type PDFFile = {
  id: string;
  file: File;
};

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function MergePdfs() {
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [totalSize, setTotalSize] = useState(0);
  const [isMerging, setIsMerging] = useState(false);
  const [mergeProgress, setMergeProgress] = useState(0);
  const [mergedPdfUrl, setMergedPdfUrl] = useState<string | null>(null);
  const [outputFilename, setOutputFilename] = useState("merged_document.pdf");
  const [removingFileId, setRemovingFileId] = useState<string | null>(null);
  
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const mergeOperationId = useRef<number>(0);
  const isCancelledRef = useRef<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    // Cleanup function to run when the component unmounts
    return () => {
      isCancelledRef.current = true;
      if (mergedPdfUrl) {
        URL.revokeObjectURL(mergedPdfUrl);
      }
    };
  }, [mergedPdfUrl]);
  
  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      
      if (files.length + acceptedFiles.length > MAX_FILES) {
        toast({ variant: "destructive", title: "File limit reached", description: `You can only upload a maximum of ${MAX_FILES} files.` });
        return;
      }
      
      let currentSize = totalSize;
      const newFiles = acceptedFiles.filter(file => {
        if (file.size > MAX_FILE_SIZE_BYTES) {
          toast({ variant: "destructive", title: "File too large", description: `"${file.name}" exceeds the ${MAX_FILE_SIZE_MB}MB file size limit.` });
          return false;
        }
        if (currentSize + file.size > MAX_TOTAL_SIZE_BYTES) {
          toast({ variant: "destructive", title: "Total size limit exceeded", description: `Adding "${file.name}" would exceed the ${MAX_TOTAL_SIZE_MB}MB total size limit.` });
          return false;
        }
        if (!file.type.includes('pdf')) {
          toast({ variant: "destructive", title: "Invalid file type", description: `"${file.name}" is not a PDF.` });
          return false;
        }
        currentSize += file.size;
        return true;
      });

      const filesToAdd = newFiles.map(file => ({ id: `${file.name}-${Date.now()}`, file }));
      
      setFiles(prev => [...prev, ...filesToAdd]);
      setTotalSize(prev => prev + newFiles.reduce((acc, file) => acc + file.size, 0));

      if (rejectedFiles.length > 0) {
        toast({ variant: "destructive", title: "Invalid file(s) rejected", description: "Some files were not PDFs or exceeded size limits." });
      }
    },
    [files, totalSize, toast]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    noClick: true,
    noKeyboard: true,
    disabled: isMerging,
  });

  const removeFile = (fileId: string) => {
    setRemovingFileId(fileId);
    setTimeout(() => {
      const fileToRemove = files.find(f => f.id === fileId);
      if (fileToRemove) {
        setTotalSize(prev => prev - fileToRemove.file.size);
        setFiles(prev => prev.filter(f => f.id !== fileId));
      }
      setRemovingFileId(null);
    }, 300); // Should match the CSS transition duration
  };
  
  const handleClearAll = () => {
    setFiles([]);
    setTotalSize(0);
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
    setFiles(filesCopy);
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
      toast({
        variant: "destructive",
        title: "Not enough files",
        description: "Please upload at least two PDF files to merge.",
      });
      return;
    }
    
    isCancelledRef.current = false;
    const currentOperationId = ++mergeOperationId.current;
    
    setIsMerging(true);
    setMergeProgress(0);
    setMergedPdfUrl(null);
    
    // Smooth progress bar updates
    setTimeout(() => setMergeProgress(95), 100);

    try {
        const mergedPdf = await PDFDocument.create();

        for (const pdfFile of files) {
            if (isCancelledRef.current) return;
            const pdfBytes = await pdfFile.file.arrayBuffer();
            try {
                const sourcePdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
                const copiedPages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));
            } catch (error) {
                console.warn(`Skipping corrupted or encrypted file: ${pdfFile.file.name}`, error);
                toast({
                   variant: "destructive",
                   title: "Skipped a file",
                   description: `Could not process "${pdfFile.file.name}". It might be corrupted or encrypted.`
                });
            }
        }
        
        if (isCancelledRef.current) return;

        if (mergedPdf.getPageCount() === 0) {
            throw new Error("Merge failed. All source PDFs might be corrupted, encrypted, or invalid.");
        }

        const mergedPdfBytes = await mergedPdf.save();
        const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
        
        if (isCancelledRef.current || currentOperationId !== mergeOperationId.current) {
            URL.revokeObjectURL(URL.createObjectURL(blob));
            return;
        }

        const url = URL.createObjectURL(blob);
        setMergedPdfUrl(url);
      
      toast({
        title: "Merge Successful!",
        description: "Your PDF is ready to be downloaded.",
        action: <div className="p-1 rounded-full bg-green-500"><CheckCircle className="w-5 h-5 text-white" /></div>
      });
    } catch (error: any) {
      console.error("Merge failed:", error);
       if (!isCancelledRef.current) {
          toast({
            variant: "destructive",
            title: "Merge Failed",
            description: error.message || "An unexpected error occurred during the merge process.",
          });
      }
      setMergeProgress(0); // Reset on error
    } finally {
      if (!isCancelledRef.current && currentOperationId === mergeOperationId.current) {
        setMergeProgress(100);
        setIsMerging(false);
      }
    }
  };
  
  const handleCancelMerge = () => {
    isCancelledRef.current = true;
    setIsMerging(false);
    setMergeProgress(0);
  };

  const handleDownload = () => {
    if (!mergedPdfUrl) return;
    const link = document.createElement("a");
    link.href = mergedPdfUrl;
    const finalFilename = outputFilename.endsWith('.pdf') ? outputFilename : `${outputFilename}.pdf`;
    link.download = finalFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleMergeMore = () => {
    if (mergedPdfUrl) {
      URL.revokeObjectURL(mergedPdfUrl);
    }
    setFiles([]);
    setTotalSize(0);
    setMergedPdfUrl(null);
  };

  if (mergedPdfUrl) {
    return (
        <div className="text-center flex flex-col items-center justify-center py-12 animate-in fade-in duration-500 bg-white dark:bg-card p-6 sm:p-8 rounded-xl shadow-lg border">
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
    )
  }

  return (
    <div className="space-y-6">
        <Card className={cn("bg-white dark:bg-card shadow-lg", isMerging && "opacity-70 pointer-events-none")}>
            <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">Upload &amp; Merge</CardTitle>
                <CardDescription>
                  Drag &amp; drop files, reorder them, and click merge.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div
                    {...getRootProps()}
                    className={cn(
                    "flex flex-col items-center justify-center p-6 sm:p-10 rounded-lg border-2 border-dashed transition-colors duration-300",
                    !isMerging && "hover:border-primary/50",
                    isDragActive && "border-primary bg-primary/10"
                    )}
                >
                    <input {...getInputProps()} />
                    <UploadCloud className="w-10 h-10 text-muted-foreground sm:w-12 sm:h-12" />
                    <p className="mt-2 text-base font-semibold text-foreground sm:text-lg">
                        Drop PDF files here
                    </p>
                    <p className="text-xs text-muted-foreground sm:text-sm">or click the button below</p>
                    <Button type="button" onClick={open} className="mt-4" disabled={isMerging}>
                        <FolderOpen className="mr-2 h-4 w-4" />
                        Choose Files
                    </Button>
                    <div className="w-full px-2 text-center text-xs text-muted-foreground mt-6">
                        <div className="flex flex-col items-center">
                            <p>Max: {MAX_FILE_SIZE_MB}MB/file • {MAX_TOTAL_SIZE_MB}MB total • {MAX_FILES} files</p>
                            <p>Remaining space: {formatBytes(MAX_TOTAL_SIZE_BYTES - totalSize)}</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>

        {files.length > 0 && (
          <Card className={cn("bg-white dark:bg-card shadow-lg", isMerging && "opacity-70 pointer-events-none")}>
            <CardHeader className="flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between pb-2 pr-4">
              <div>
                <CardTitle className="text-xl sm:text-2xl">Uploaded Files ({files.length})</CardTitle>
                <CardDescription>Drag to reorder merge sequence</CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClearAll} 
                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:shadow-sm active:bg-destructive/20 active:shadow-md -ml-2 sm:ml-0"
                disabled={isMerging}
              >
                <X className="w-4 h-4 mr-1 sm:mr-2" />
                Clear All
              </Button>
            </CardHeader>
            <CardContent onDragOver={handleDragOver} className="p-2 sm:p-4">
                <div className="space-y-2 max-h-[266px] overflow-y-auto pr-2">
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
                            'group flex items-center justify-between p-2 sm:p-3 rounded-lg border bg-card transition-all duration-300 ease-in-out',
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
                            <Badge variant="outline" className="hidden text-primary border-primary/20 sm:inline-flex bg-primary/10">
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            Ready
                            </Badge>
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

        <Card className="bg-white dark:bg-card shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">Merge Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
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
                
                <div className="space-y-4">
                    {isMerging ? (
                        <div className="p-4 border rounded-lg bg-primary/5">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                                    <p className="text-sm font-medium text-primary transition-all duration-300">Merging PDFs...</p>
                                </div>
                                <p className="text-sm font-medium text-primary">{Math.round(mergeProgress)}%</p>
                            </div>
                            <Progress value={mergeProgress} className="h-2 transition-all duration-500" />
                            <Button size="sm" variant="destructive" onClick={handleCancelMerge} className="w-full mt-4">
                                <Ban className="mr-2 h-4 w-4" />
                                Cancel
                            </Button>
                        </div>
                    ) : (
                        <Button size="lg" className="w-full text-base font-bold" onClick={handleMerge} disabled={files.length < 2 || isMerging}>
                            <Layers className="mr-2 h-5 w-5" />
                            Merge PDFs
                        </Button>
                    )}
                </div>

            </CardContent>
        </Card>
    </div>
  );
}
