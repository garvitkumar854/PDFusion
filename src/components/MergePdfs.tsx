"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { PDFDocument } from "pdf-lib";
import {
  UploadCloud,
  File as FileIcon,
  HardDrive,
  Database,
  Loader2,
  Trash2,
  Download,
  PackageCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

const MAX_FILES = 20;
const MAX_FILE_SIZE_MB = 25;
const MAX_TOTAL_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_TOTAL_SIZE_BYTES = MAX_TOTAL_SIZE_MB * 1024 * 1024;

type PDFFile = {
  id: string;
  file: File;
};

export function MergePdfs() {
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [totalSize, setTotalSize] = useState(0);
  const [isMerging, setIsMerging] = useState(false);
  const [mergeProgress, setMergeProgress] = useState(0);

  const { toast } = useToast();

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

    try {
      const mergedPdf = await PDFDocument.create();

      for (let i = 0; i < files.length; i++) {
        const pdfFile = files[i];
        const sourcePdf = await PDFDocument.load(await pdfFile.file.arrayBuffer());
        const copiedPages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
        setMergeProgress(((i + 1) / files.length) * 100);
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "merged_document.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Merge Successful!",
        description: "Your PDF has been downloaded.",
        action: <div className="p-1 rounded-full bg-green-500"><PackageCheck className="w-5 h-5 text-white" /></div>
      });

      // Reset state after successful merge
      setFiles([]);
      setTotalSize(0);

    } catch (error) {
      console.error("Merge failed:", error);
      toast({
        variant: "destructive",
        title: "Merge Failed",
        description: "An error occurred while merging the PDFs.",
      });
    } finally {
      setIsMerging(false);
    }
  };
  
  const filesRemaining = MAX_FILES - files.length;
  const sizeRemaining = (MAX_TOTAL_SIZE_BYTES - totalSize) / (1024*1024);

  return (
    <div>
      <div
        {...getRootProps()}
        className={`flex flex-col items-center justify-center p-8 rounded-lg border-2 border-dashed  transition-colors cursor-pointer
        ${isDragActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 hover:bg-muted/50"}`}
      >
        <input {...getInputProps()} />
        <UploadCloud className="w-12 h-12 text-primary mb-4" />
        <p className="text-lg font-semibold text-foreground">
          Drop PDFs here or tap to browse
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {filesRemaining} files remaining - {sizeRemaining.toFixed(1)}MB available
        </p>
        <div className="flex items-center gap-6 text-xs text-muted-foreground mt-6">
          <div className="flex items-center gap-2">
            <FileIcon className="w-4 h-4" />
            Max {MAX_FILES} files
          </div>
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4" />
            {MAX_FILE_SIZE_MB} MB/file
          </div>
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            {MAX_TOTAL_SIZE_MB} MB total
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Uploaded Files ({files.length})</h2>
          <div className="space-y-3">
            {files.map((pdfFile) => (
              <div key={pdfFile.id} className="flex items-center justify-between p-3 rounded-md border bg-card">
                <div className="flex items-center gap-3">
                   <FileIcon className="w-5 h-5 text-primary" />
                   <span className="text-sm font-medium">{pdfFile.file.name}</span>
                   <span className="text-xs text-muted-foreground">({(pdfFile.file.size / (1024*1024)).toFixed(2)} MB)</span>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeFile(pdfFile.id)}>
                    <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
          <div className="mt-6">
            {isMerging ? (
                <div className="flex flex-col items-center gap-4">
                    <Progress value={mergeProgress} className="w-full h-2" />
                    <p className="text-sm font-medium text-primary">Merging... {Math.round(mergeProgress)}%</p>
                </div>
            ) : (
                <Button size="lg" className="w-full" onClick={handleMerge} disabled={isMerging}>
                    <Download className="mr-2 h-5 w-5" />
                    Merge & Download
                </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
