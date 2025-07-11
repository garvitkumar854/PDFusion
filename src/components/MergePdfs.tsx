
"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { PDFDocument } from "pdf-lib";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import {
  UploadCloud,
  File as FileIcon,
  HardDrive,
  Database,
  Download,
  PackageCheck,
  X,
  CheckCircle2,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
  const [mergedPdfUrl, setMergedPdfUrl] = useState<string | null>(null);
  const isCancelled = useRef(false);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }
    const items = Array.from(files);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setFiles(items);
  };

  const processFileChunk = (
    mergedPdf: PDFDocument,
    fileIndex: number,
    onProgress: (progress: number) => void
  ): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      if (isCancelled.current) {
        return reject(new Error("Cancelled"));
      }

      const pdfFile = files[fileIndex];
      const sourcePdfBytes = await pdfFile.file.arrayBuffer();
      const sourcePdf = await PDFDocument.load(sourcePdfBytes, { ignoreEncryption: true });
      
      const copiedPages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
      
      const progress = ((fileIndex + 1) / files.length) * 100;
      onProgress(progress);

      // Yield to the main thread
      setTimeout(() => resolve(), 0);
    });
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
    isCancelled.current = false;

    try {
      const mergedPdf = await PDFDocument.create();
      
      for (let i = 0; i < files.length; i++) {
        await processFileChunk(mergedPdf, i, setMergeProgress);
      }

      if (isCancelled.current) {
        toast({ title: "Merge Cancelled", description: "The merge process was cancelled." });
        setIsMerging(false);
        return;
      }

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
      if (error.message === 'Cancelled') {
        toast({ title: "Merge Cancelled", description: "The merge process was cancelled." });
      } else {
        console.error("Merge failed:", error);
        let errorMessage = "An error occurred while merging the PDFs.";
        if (error instanceof Error) {
          errorMessage = `An error occurred: ${error.message}. One of your PDFs might be encrypted or corrupted.`;
        }
        toast({
          variant: "destructive",
          title: "Merge Failed",
          description: errorMessage,
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
            <CheckCircle2 className="w-20 h-20 text-green-500 mb-6" />
            <h2 className="text-2xl font-bold text-foreground mb-2">PDF merged successfully!</h2>
            <p className="text-muted-foreground mb-8">Your new document is ready for download.</p>
            <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" onClick={handleDownload} className="w-full sm:w-auto text-base font-bold">
                    <Download className="mr-2 h-5 w-5" />
                    Download PDF
                </Button>
                <Button size="lg" variant="outline" onClick={handleMergeMore} className="w-full sm:w-auto text-base">
                    Merge more
                </Button>
            </div>
        </div>
      ) : (
        <>
          <div
            {...getRootProps()}
            className={cn(
              "relative flex flex-col items-center justify-center p-8 rounded-xl border transition-colors duration-300 cursor-pointer bg-muted/20",
              "hover:border-primary/50 hover:bg-muted/40",
              isDragActive && "border-primary bg-primary/10 shadow-inner"
            )}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 border-8 border-primary/5">
                  <UploadCloud className="w-8 h-8 text-primary" />
              </div>
              <p className="text-xl font-semibold text-foreground mb-2">
                Drop PDFs here or <span className="text-primary font-bold">browse your files</span>
              </p>
              <p className="text-sm text-muted-foreground">
                {filesRemaining} files remaining - {sizeRemaining.toFixed(1)}MB available
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center text-xs text-muted-foreground mt-6 py-4 px-2 rounded-lg bg-muted/30">
            <div className="flex items-center justify-center gap-2">
              <FileIcon className="w-4 h-4 text-primary" />
              <span>Max {MAX_FILES} files</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <HardDrive className="w-4 h-4 text-primary" />
              <span>{MAX_FILE_SIZE_MB} MB per file</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Database className="w-4 h-4 text-primary" />
              <span>{MAX_TOTAL_SIZE_MB} MB total</span>
            </div>
          </div>

          {files.length > 0 && (
            <div className="mt-8 animate-in fade-in duration-500">
              <h2 className="text-xl font-semibold mb-4">Uploaded Files ({files.length})</h2>
              
              {isClient && (
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="pdf-files">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3 max-h-60 overflow-y-auto pr-2">
                        {files.map((pdfFile, index) => (
                          <Draggable key={pdfFile.id} draggableId={pdfFile.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={cn('flex items-center justify-between p-3 rounded-md border bg-muted/30 transition-shadow', snapshot.isDragging ? 'shadow-lg' : '')}
                              >
                                <div className="flex items-center gap-3 overflow-hidden">
                                  <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab" />
                                  <FileIcon className="w-5 h-5 text-primary flex-shrink-0" />
                                  <span className="text-sm font-medium truncate" title={pdfFile.file.name}>
                                    {pdfFile.file.name}
                                  </span>
                                  <span className="text-xs text-muted-foreground flex-shrink-0">
                                    ({(pdfFile.file.size / (1024 * 1024)).toFixed(2)} MB)
                                  </span>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-muted-foreground hover:bg-red-100 hover:text-destructive flex-shrink-0" 
                                  onClick={() => removeFile(pdfFile.id)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
              
              <div className="mt-6">
                {isMerging ? (
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="w-full">
                            <div className="w-full relative h-3 rounded-full overflow-hidden bg-primary/20">
                              <div 
                                className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-500 ease-out" 
                                style={{ width: `${mergeProgress}%` }}
                              ></div>
                            </div>
                            <p className="text-sm font-medium text-primary text-center mt-2">Merging... {Math.round(mergeProgress)}%</p>
                        </div>
                        <Button
                          variant="destructive"
                          size="lg"
                          className="w-full sm:w-auto text-base font-bold bg-[#ff0000] text-white hover:bg-[#ff3333]"
                          onClick={handleCancel}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Cancel
                        </Button>
                    </div>
                ) : (
                    <Button size="lg" className="w-full text-base font-bold" onClick={handleMerge} disabled={isMerging || files.length < 2}>
                        <Download className="mr-2 h-5 w-5" />
                        Merge & Download
                    </Button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
