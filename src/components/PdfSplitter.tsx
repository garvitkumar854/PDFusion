"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud,
  File as FileIcon,
  Download,
  X,
  CheckCircle,
  Scissors,
  FolderOpen,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PDFDocument } from 'pdf-lib';

const MAX_FILE_SIZE_MB = 100;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

type PDFFile = {
  id: string;
  file: File;
  totalPages: number;
};

type SplitResult = {
  filename: string;
  url: string;
};

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function PdfSplitter() {
  const [file, setFile] = useState<PDFFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [splitResults, setSplitResults] = useState<SplitResult[]>([]);
  const [splitRanges, setSplitRanges] = useState("");
  const [splitError, setSplitError] = useState<string | null>(null);
  
  const { toast } = useToast();
  
  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: any[]) => {
      if (acceptedFiles.length === 0) {
        if (rejectedFiles.length > 0) {
          toast({ variant: "destructive", title: "Invalid file(s) rejected", description: "The file was not a PDF or exceeded size limits." });
        }
        return;
      }
      
      const singleFile = acceptedFiles[0];
      if (singleFile.size > MAX_FILE_SIZE_BYTES) {
        toast({ variant: "destructive", title: "File too large", description: `"${singleFile.name}" exceeds the ${MAX_FILE_SIZE_MB}MB file size limit.` });
        return;
      }
      
      try {
        const pdfBytes = await singleFile.arrayBuffer();
        const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
        const totalPages = pdfDoc.getPageCount();
        setFile({ id: `${singleFile.name}-${Date.now()}`, file: singleFile, totalPages });
        setSplitRanges(`1-${totalPages}`);
        setSplitResults([]);
        setSplitError(null);
      } catch (error) {
        console.error("Error loading PDF:", error);
        toast({ variant: "destructive", title: "Could not read PDF", description: "The file might be corrupted or encrypted." });
      }
    },
    [toast]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
    noClick: true,
    noKeyboard: true,
  });

  const removeFile = () => {
    setFile(null);
    setSplitRanges("");
    setSplitResults([]);
    setSplitError(null);
  };
  
  const parseRanges = (ranges: string, max: number): number[][] | null => {
    const result: number[][] = [];
    const parts = ranges.split(',').map(part => part.trim());

    for (const part of parts) {
      if (part.includes('-')) {
        const [startStr, endStr] = part.split('-');
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (isNaN(start) || isNaN(end) || start < 1 || end > max || start > end) {
          return null; // Invalid range
        }
        const range = [];
        for (let i = start; i <= end; i++) {
          range.push(i - 1);
        }
        result.push(range);
      } else {
        const pageNum = parseInt(part, 10);
        if (isNaN(pageNum) || pageNum < 1 || pageNum > max) {
          return null; // Invalid page number
        }
        result.push([pageNum - 1]);
      }
    }
    return result;
  };

  const handleSplit = async () => {
    if (!file) return;

    const pageGroups = parseRanges(splitRanges, file.totalPages);
    if (!pageGroups || pageGroups.length === 0) {
      setSplitError("Invalid page ranges. Please use formats like '1-3', '5', '7-9'.");
      return;
    }
    setSplitError(null);
    
    setIsProcessing(true);
    setSplitResults([]);

    try {
      const results: SplitResult[] = [];
      const pdfBytes = await file.file.arrayBuffer();
      
      for (const [index, group] of pageGroups.entries()) {
        const sourcePdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
        const newPdf = await PDFDocument.create();
        
        const copiedPages = await newPdf.copyPages(sourcePdf, group);
        copiedPages.forEach(page => newPdf.addPage(page));

        if (newPdf.getPageCount() > 0) {
            const newPdfBytes = await newPdf.save();
            const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const originalName = file.file.name.replace(/\.pdf$/i, '');
            const rangeText = group.length === 1 ? `page_${group[0] + 1}` : `pages_${group[0] + 1}-${group[group.length - 1] + 1}`;
            results.push({
                filename: `${originalName}_${rangeText}.pdf`,
                url,
            });
        }
      }
      setSplitResults(results);
      toast({
        title: "Split Successful!",
        description: "Your PDF has been split into new documents.",
        action: <div className="p-1 rounded-full bg-primary"><CheckCircle className="w-5 h-5 text-white" /></div>
      });

    } catch (error: any) {
      console.error("Split failed:", error);
      toast({
        variant: "destructive",
        title: "Split Failed",
        description: error.message || "An unexpected error occurred during the split process.",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleSplitAgain = () => {
    setSplitResults([]);
    removeFile();
  };
  
  const handleDownloadAll = () => {
    splitResults.forEach((result, index) => {
        setTimeout(() => {
            const link = document.createElement("a");
            link.href = result.url;
            link.download = result.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }, index * 300); // Stagger downloads to prevent browser blocking
    });
  };

  if (splitResults.length > 0) {
    return (
      <div className="text-center flex flex-col items-center justify-center py-12 animate-in fade-in duration-500 bg-white dark:bg-card p-6 sm:p-8 rounded-xl shadow-lg border">
        <CheckCircle className="w-16 h-16 sm:w-20 sm:h-20 text-primary mb-6" />
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">PDF Split Successfully!</h2>
        <p className="text-muted-foreground mb-8 text-sm sm:text-base">Your new documents are ready for download.</p>
        <div className="w-full max-w-md space-y-3 my-4 max-h-60 overflow-y-auto">
            {splitResults.map(result => (
                <div key={result.filename} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <FileIcon className="w-6 h-6 text-destructive shrink-0" />
                        <span className="text-sm font-medium truncate" title={result.filename}>{result.filename}</span>
                    </div>
                    <Button size="sm" variant="ghost" asChild>
                        <a href={result.url} download={result.filename}>
                            <Download className="w-4 h-4" />
                        </a>
                    </Button>
                </div>
            ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4">
          <Button size="lg" onClick={handleDownloadAll} className="w-full sm:w-auto text-base font-bold bg-primary hover:bg-primary/90">
            <Download className="mr-2 h-5 w-5" />
            Download All
          </Button>
          <Button size="lg" variant="outline" onClick={handleSplitAgain} className="w-full sm:w-auto text-base">
            Split Another PDF
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-card shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Upload PDF to Split</CardTitle>
          <CardDescription>
            Select a single PDF file to start the splitting process.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!file ? (
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
              <p className="mt-2 text-base font-semibold text-foreground sm:text-lg">
                Drop a PDF file here
              </p>
              <p className="text-xs text-muted-foreground sm:text-sm">or click the button below</p>
              <Button type="button" onClick={open} className="mt-4">
                <FolderOpen className="mr-2 h-4 w-4" />
                Choose File
              </Button>
              <p className="w-full px-2 text-center text-xs text-muted-foreground mt-6">
                Max file size: {MAX_FILE_SIZE_MB}MB
              </p>
            </div>
          ) : (
             <div className="p-2 sm:p-3 rounded-lg border bg-card/50 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                    <FileIcon className="w-6 h-6 text-destructive sm:w-8 sm:h-8 shrink-0" />
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-medium truncate" title={file.file.name}>{file.file.name}</span>
                        <span className="text-xs text-muted-foreground">
                            {formatBytes(file.file.size)} • {file.totalPages} pages
                        </span>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground/70 hover:bg-destructive/10 hover:text-destructive" onClick={removeFile}>
                    <X className="w-4 h-4" />
                </Button>
             </div>
          )}
        </CardContent>
      </Card>

      {file && (
        <Card className="bg-white dark:bg-card shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Split Settings</CardTitle>
            <CardDescription>
                Define page ranges to extract. Each range will become a separate PDF.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label htmlFor="split-ranges" className="text-sm font-medium text-foreground">Pages to Extract</label>
              <Input 
                id="split-ranges" 
                value={splitRanges} 
                onChange={(e) => {
                    setSplitRanges(e.target.value);
                    if(splitError) setSplitError(null);
                }}
                className={cn("mt-1", splitError && "border-destructive focus-visible:ring-destructive")}
                placeholder="e.g., 1-3, 5, 8-10"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Use commas to separate page numbers or ranges. Example: <span className="font-mono bg-muted/80 px-1 py-0.5 rounded">1-3, 5, 8-10</span>
              </p>
              {splitError && (
                  <p className="text-sm text-destructive mt-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> {splitError}
                  </p>
              )}
            </div>
            
            <div className="space-y-4">
              {isProcessing ? (
                <div className="p-4 border rounded-lg bg-primary/5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      <p className="text-sm font-medium text-primary">Splitting your PDF...</p>
                    </div>
                  </div>
                  <Progress value={undefined} className="h-2" />
                </div>
              ) : (
                <Button size="lg" className="w-full text-base font-bold" onClick={handleSplit} disabled={isProcessing || !file || !splitRanges}>
                  <Scissors className="mr-2 h-5 w-5" />
                  Split PDF
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
