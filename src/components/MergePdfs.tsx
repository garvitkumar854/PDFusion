"use client";

import React, { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud,
  File as FileIcon,
  HardDrive,
  Database,
  Download,
  PackageCheck,
  X,
  CheckCircle,
  Info,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { PDFDocument } from "pdf-lib";


const MAX_FILES = 20;
const MAX_FILE_SIZE_MB = 100;
const MAX_TOTAL_SIZE_MB = 200;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_TOTAL_SIZE_BYTES = MAX_TOTAL_SIZE_MB * 1024 * 1024;

export type PDFFile = {
  id: string;
  file: File;
};


export function MergePdfs() {
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [totalSize, setTotalSize] = useState(0);
  const [isMerging, setIsMerging] = useState(false);
  const [mergeProgress, setMergeProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState("Merging...");
  const [mergedPdfUrl, setMergedPdfUrl] = useState<string | null>(null);
  const isCancelled = useRef(false);
  const { toast } = useToast();
  
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      let currentFiles = [...files];
      let currentSize = totalSize;

      for (const file of acceptedFiles) {
        if (currentFiles.length >= MAX_FILES) {
          toast({ variant: "destructive", title: "File limit reached", description: `You can only upload a maximum of ${MAX_FILES} files.` });
          break;
        }
        if (file.size > MAX_FILE_SIZE_BYTES) {
          toast({ variant: "destructive", title: "File too large", description: `"${file.name}" exceeds the ${MAX_FILE_SIZE_MB}MB file size limit.` });
          continue;
        }
        if (currentSize + file.size > MAX_TOTAL_SIZE_BYTES) {
          toast({ variant: "destructive", title: "Total size limit exceeded", description: `Adding "${file.name}" would exceed the ${MAX_TOTAL_SIZE_MB}MB total size limit.` });
          continue;
        }
        if (!file.type.includes('pdf')) {
          toast({ variant: "destructive", title: "Invalid file type", description: `"${file.name}" is not a PDF.` });
          continue;
        }

        currentFiles.push({ id: `${file.name}-${Date.now()}`, file });
        currentSize += file.size;
      }
      
      setFiles(currentFiles);
      setTotalSize(currentSize);

      if (rejectedFiles.length > 0) {
        toast({ variant: "destructive", title: "Invalid file type", description: "Some files were not PDFs and were ignored." });
      }
    },
    [files, totalSize, toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
  });

  const removeFile = (fileId: string) => {
    const fileToRemove = files.find(f => f.id === fileId);
    if (fileToRemove) {
      setTotalSize(prev => prev - fileToRemove.file.size);
      setFiles(prev => prev.filter(f => f.id !== fileId));
    }
  };

  const handleCancel = () => {
    isCancelled.current = true;
    setIsMerging(false); // Immediately stop the UI merging state
    toast({ title: "Merge Cancelled", description: "The merge process was cancelled." });
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    dragItem.current = index;
    e.dataTransfer.effectAllowed = 'move';
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
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); 
  };
  
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    if (dragItem.current !== null) {
      dragOverItem.current = index;
    }
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
    setProgressStatus("Preparing files...");
    isCancelled.current = false;

    try {
      const mergedPdf = await PDFDocument.create();
      let filesProcessed = 0;

      for (const pdfFile of files) {
        if (isCancelled.current) {
            throw new Error("Cancelled");
        }

        const progress = (filesProcessed / files.length) * 100;
        setMergeProgress(progress);
        setProgressStatus(`Processing ${pdfFile.file.name}...`);

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
            continue; // Skip to the next file
        } finally {
            filesProcessed++;
        }
      }
      
      if (isCancelled.current) {
        throw new Error("Cancelled");
      }
      
      if (mergedPdf.getPageCount() === 0) {
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
        action: <div className="p-1 rounded-full bg-green-500"><PackageCheck className="w-5 h-5 text-white" /></div>
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
    link.download = "PDFusion_merged.pdf";
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
  
  const filesRemaining = MAX_FILES - files.length;
  const sizeRemaining = (MAX_TOTAL_SIZE_BYTES - totalSize) / (1024*1024);

  return (
    <div className="bg-card p-6 sm:p-8 rounded-xl shadow-lg border">
      {mergedPdfUrl ? (
        <div className="text-center flex flex-col items-center justify-center py-12 animate-in fade-in duration-500">
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
      ) : (
        <>
          <div
            {...getRootProps()}
            className={cn(
              "relative flex flex-col items-center justify-center p-10 rounded-lg border-2 border-dashed transition-colors duration-300 cursor-pointer bg-muted/40",
              "hover:border-primary/50 hover:bg-muted/60",
              isDragActive && "border-primary bg-primary/10"
            )}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center text-center gap-2">
              <UploadCloud className="w-12 h-12 text-primary" />
              <p className="text-lg font-semibold text-foreground">
                Drop your PDFs here or <span className="text-primary font-bold">click to browse</span>
              </p>
              <p className="text-sm text-muted-foreground">
                {filesRemaining} files remaining &bull; {sizeRemaining.toFixed(1)}MB available
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center text-xs text-muted-foreground mt-4 py-3 px-2 rounded-lg bg-muted/40">
            <div className="flex items-center justify-center gap-2">
              <FileIcon className="w-4 h-4 text-primary" />
              <span>Max {MAX_FILES} files</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <HardDrive className="w-4 h-4 text-primary" />
              <span>{MAX_FILE_SIZE_MB}MB per file</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Database className="w-4 h-4 text-primary" />
              <span>{MAX_TOTAL_SIZE_MB}MB total</span>
            </div>
          </div>

          {files.length > 0 && (
            <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4 text-foreground">Uploaded Files ({files.length})</h2>
                
                <div 
                  className="space-y-2 pr-2 overflow-y-auto"
                  style={{ maxHeight: files.length > 0 ? '17rem' : '0' }}
                  onDragOver={handleDragOver}
                >
                  {files.map((pdfFile, index) => {
                    const isDragging = dragItem.current === index;
                    const isDragOver = dragOverItem.current === index;

                    return (
                      <div
                        key={pdfFile.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragEnter={(e) => handleDragEnter(e, index)}
                        onDragEnd={handleDragEnd}
                        className={cn(
                          'relative group flex items-center justify-between p-3 rounded-lg border bg-muted/40 cursor-grab transition-shadow duration-300',
                          isDragging && 'shadow-lg scale-105 opacity-80 z-10',
                          isDragOver && 'ring-2 ring-primary'
                        )}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <GripVertical className="w-5 h-5 text-muted-foreground/70 flex-shrink-0 transition-opacity group-hover:opacity-100 md:opacity-0" />
                          <FileIcon className="w-6 h-6 text-primary flex-shrink-0" />
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-medium truncate" title={pdfFile.file.name}>
                              {pdfFile.file.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {(pdfFile.file.size / (1024 * 1024)).toFixed(2)} MB
                            </span>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground/70 hover:bg-red-100 hover:text-destructive flex-shrink-0" 
                          onClick={() => removeFile(pdfFile.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
            </div>
          )}
              
          <div className="mt-8">
            {isMerging ? (
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-full">
                        <div className="w-full relative h-2.5 rounded-full overflow-hidden bg-primary/20">
                          <div 
                            className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-500 ease-out" 
                            style={{ width: `${mergeProgress}%` }}
                          ></div>
                        </div>
                        <p className="text-sm font-medium text-primary text-center mt-2">{progressStatus} {Math.round(mergeProgress)}%</p>
                    </div>
                    <Button
                      variant="destructive"
                      size="lg"
                      className="w-full sm:w-auto text-base font-bold"
                      onClick={handleCancel}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                </div>
            ) : (
              <>
                <Button size="lg" className="w-full text-base font-bold" onClick={handleMerge} disabled={isMerging || files.length < 2}>
                    <PackageCheck className="mr-2 h-5 w-5" />
                    Merge {files.length > 1 ? `${files.length} PDFs` : 'PDFs'}
                </Button>
                {files.length > 0 && files.length < 2 && (
                  <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground animate-in fade-in duration-300">
                    <Info className="w-4 h-4" />
                    <span>Add at least one more PDF to merge files.</span>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
