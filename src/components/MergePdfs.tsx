"use client";

import React, { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud,
  File as FileIcon,
  Download,
  PackageCheck,
  X,
  CheckCircle,
  GripVertical,
  Layers,
  FolderOpen,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { PDFDocument } from "pdf-lib";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

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
  const [progressStatus, setProgressStatus] = useState("Combining documents...");
  const [mergedPdfUrl, setMergedPdfUrl] = useState<string | null>(null);
  const [outputFilename, setOutputFilename] = useState("merged_document.pdf");
  
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const isCancelled = useRef(false);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  
  const { toast } = useToast();
  
  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      let currentFiles = [...files];
      let currentSize = totalSize;

      const newFiles = acceptedFiles.filter(file => {
        if (currentFiles.length + 1 > MAX_FILES) {
          toast({ variant: "destructive", title: "File limit reached", description: `You can only upload a maximum of ${MAX_FILES} files.` });
          return false;
        }
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
        return true;
      });

      const filesToAdd = newFiles.map(file => ({ id: `${file.name}-${Date.now()}`, file }));
      
      setFiles(prev => [...prev, ...filesToAdd]);
      setTotalSize(prev => prev + newFiles.reduce((acc, file) => acc + file.size, 0));

      if (rejectedFiles.length > 0) {
        toast({ variant: "destructive", title: "Invalid file(s) rejected", description: "Some files were not PDFs or exceeded size limits." });
      }
    },
    [files.length, totalSize, toast]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    noClick: true,
    noKeyboard: true,
  });

  const removeFile = (fileId: string) => {
    const fileToRemove = files.find(f => f.id === fileId);
    if (fileToRemove) {
      setTotalSize(prev => prev - fileToRemove.file.size);
      setFiles(prev => prev.filter(f => f.id !== fileId));
    }
  };
  
  const handleClearAll = () => {
    setFiles([]);
    setTotalSize(0);
  };

  const handleCancel = () => {
    isCancelled.current = true;
    setIsMerging(false); // Immediately stop the UI merging state
    toast({ title: "Merge Cancelled", description: "The merge process was cancelled." });
  };
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    dragItem.current = index;
    setDraggingIndex(index);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    if (draggingIndex === null) return;
    dragOverItem.current = index;
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
        const filesCopy = [...files];
        const draggedItemContent = filesCopy.splice(dragItem.current, 1)[0];
        filesCopy.splice(dragOverItem.current, 0, draggedItemContent);
        setFiles(filesCopy);
    }
    dragItem.current = null;
    dragOverItem.current = null;
    setDraggingIndex(null);
    setDragOverIndex(null);
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

    setIsMerging(true);
    setMergeProgress(0);
    setProgressStatus("Combining documents...");
    isCancelled.current = false;
    setMergedPdfUrl(null);

    try {
      const mergedPdf = await PDFDocument.create();
      let filesProcessed = 0;

      for (const pdfFile of files) {
        if (isCancelled.current) {
            throw new Error("Cancelled");
        }

        const progress = (filesProcessed / files.length) * 100;
        setMergeProgress(progress);
        setProgressStatus(`Processing file ${filesProcessed + 1} of ${files.length}`);

        try {
            const fileBytes = await pdfFile.file.arrayBuffer();
            const sourcePdf = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
            const copiedPages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
        } catch (error) {
            console.warn(`Skipping corrupted or encrypted file: ${pdfFile.file.name}`, error);
            toast({
                variant: 'destructive',
                title: 'Skipped File',
                description: `Could not process "${pdfFile.file.name}". It might be corrupted or encrypted.`,
            });
        } finally {
            filesProcessed++;
        }
      }
      
      if (isCancelled.current) {
        throw new Error("Cancelled");
      }
      
      if (mergedPdf.getPageCount() === 0) {
        toast({ variant: 'destructive', title: 'Merge Failed', description: "No valid pages were found. All source PDFs might be corrupted or encrypted." });
        throw new Error("Merge failed. All source PDFs might be corrupted or encrypted.");
      }

      setMergeProgress(100);
      setProgressStatus("Finalizing...");

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setMergedPdfUrl(url);

      toast({
        title: "Merge Successful!",
        description: "Your PDF is ready to be downloaded.",
        action: <div className="p-1 rounded-full bg-green-500"><CheckCircle className="w-5 h-5 text-white" /></div>
      });
    } catch (error: any) {
      if (error.message !== 'Cancelled') {
        console.error("Merge failed:", error);
        toast({
          variant: "destructive",
          title: "Merge Failed",
          description: error.message || "An unexpected error occurred during the merge process.",
        });
      }
    } finally {
      setIsMerging(false);
      setMergeProgress(0);
    }
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
        <div className="text-center flex flex-col items-center justify-center py-12 animate-in fade-in duration-500 bg-card p-6 sm:p-8 rounded-xl shadow-sm border">
            <CheckCircle className="w-20 h-20 text-green-500 mb-6" />
            <h2 className="text-2xl font-bold text-foreground mb-2">PDF Merged Successfully!</h2>
            <p className="text-muted-foreground mb-8">Your new document is ready for download.</p>
            <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" onClick={handleDownload} className="w-full sm:w-auto text-base font-bold">
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
        <Card>
            <CardHeader>
                <CardTitle>Upload PDF Files</CardTitle>
                <CardDescription>
                  Drag and drop your PDF files here or click to browse
                </CardDescription>
                 <div className="text-sm text-muted-foreground">
                  Remaining space: {formatBytes(MAX_TOTAL_SIZE_BYTES - totalSize)}
                </div>
            </CardHeader>
            <CardContent>
                <div
                    {...getRootProps()}
                    className={cn(
                    "relative flex flex-col items-center justify-center p-10 rounded-lg border-2 border-dashed transition-colors duration-300 cursor-pointer bg-card",
                    "hover:border-primary/50",
                    isDragActive && "border-primary bg-primary/10"
                    )}
                >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center text-center gap-4">
                        <UploadCloud className="w-12 h-12 text-muted-foreground" />
                        <p className="text-lg font-semibold text-foreground">
                            Drop PDF files here
                        </p>
                        <p className="text-sm text-muted-foreground">or click to browse</p>
                        <Button type="button" onClick={open} className="mt-2">
                            <FolderOpen className="mr-2 h-4 w-4" />
                            Choose Files
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground text-center mt-4 absolute bottom-4">
                        Max: {MAX_FILE_SIZE_MB}MB/file • {MAX_TOTAL_SIZE_MB}MB total • {MAX_FILES} files
                    </p>
                </div>
            </CardContent>
        </Card>

        {files.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Uploaded Files ({files.length})</CardTitle>
                <CardDescription>Drag to reorder merge sequence</CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClearAll} 
                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:shadow-sm"
              >
                <X className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            </CardHeader>
            <CardContent onDragOver={handleDragOver}>
              <div 
                className="space-y-2 pr-2 max-h-[24rem] overflow-y-auto"
              >
                {files.map((pdfFile, index) => {
                  const isDragging = draggingIndex === index;
                  const isDragOver = dragOverIndex === index;

                  return (
                    <div
                      key={pdfFile.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragEnter={(e) => handleDragEnter(e, index)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        'group flex items-center justify-between p-3 rounded-lg border bg-card cursor-grab transition-all duration-300',
                        isDragging ? 'shadow-lg scale-105 opacity-80 z-10' : 'shadow-sm',
                        isDragOver && !isDragging && 'ring-2 ring-primary'
                      )}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FileIcon className="w-8 h-8 text-destructive flex-shrink-0" />
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-sm font-medium truncate" title={pdfFile.file.name}>
                            {pdfFile.file.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatBytes(pdfFile.file.size)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />
                          Ready
                        </Badge>
                        <GripVertical className="w-5 h-5 text-muted-foreground/70 cursor-grab" />
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground/70 hover:bg-destructive/10 hover:text-destructive" 
                          onClick={() => removeFile(pdfFile.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
            <CardHeader>
                <CardTitle>Merge Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <label htmlFor="output-filename" className="text-sm font-medium text-foreground">Output Filename</label>
                    <Input 
                        id="output-filename" 
                        value={outputFilename} 
                        onChange={(e) => setOutputFilename(e.target.value)}
                        className="mt-1"
                        placeholder="e.g., merged_document.pdf"
                    />
                </div>
                
                <div>
                    <h3 className="text-sm font-medium text-foreground mb-2">Summary</h3>
                    <div className="space-y-2 text-sm rounded-md border p-4 bg-muted/20">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Files:</span>
                            <span className="font-medium">{files.length}/{MAX_FILES}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Size:</span>
                            <span className="font-medium">{formatBytes(totalSize)}/{MAX_TOTAL_SIZE_MB}MB</span>
                        </div>
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">Est. Output:</span>
                            <span className="font-medium">{files.length > 0 ? formatBytes(totalSize) : '0 Bytes'}</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    {isMerging ? (
                        <>
                            <Button
                                variant="destructive"
                                size="lg"
                                className="w-full text-base font-bold"
                                onClick={handleCancel}
                                >
                                <X className="mr-2 h-4 w-4" />
                                Cancel Merge
                            </Button>

                            <div className="p-4 rounded-lg border bg-primary/10">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                                        <p className="text-sm font-medium text-primary">Combining documents...</p>
                                    </div>
                                    <p className="text-sm font-medium text-primary">{Math.round(mergeProgress)}%</p>
                                </div>
                                <Progress value={mergeProgress} className="h-2" />
                                <p className="text-xs text-muted-foreground text-center mt-2">{progressStatus}</p>
                            </div>
                        </>
                    ) : (
                        <Button size="lg" className="w-full text-base font-bold" onClick={handleMerge} disabled={isMerging || files.length < 2}>
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
