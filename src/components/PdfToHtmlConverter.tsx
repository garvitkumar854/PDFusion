
"use client";

import React, { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud,
  File as FileIcon,
  Download,
  X,
  Check,
  FolderOpen,
  Loader2,
  Ban,
  Code,
  Lock,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "./ui/progress";
import * as pdfjsLib from 'pdfjs-dist';
import { motion, AnimatePresence } from "framer-motion";

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

const MAX_FILE_SIZE_MB = 100;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

type PDFFile = {
  id: string;
  file: File;
  isEncrypted: boolean;
};

type ProcessResult = {
  url: string;
  filename: string;
};

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}


export function PdfToHtmlConverter() {
  const [file, setFile] = useState<PDFFile | null>(null);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("Converting...");

  const operationId = useRef<number>(0);
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
      const singleFile = acceptedFiles[0];
      if (singleFile) {
        setResult(null);
        let isEncrypted = false;
        try {
            const pdfBytes = await singleFile.arrayBuffer();
            await pdfjsLib.getDocument({data: pdfBytes}).promise;
            toast({ variant: "success", title: "File Uploaded", description: `"${singleFile.name}" is ready.` });
        } catch (e: any) {
            if (e.name === 'PasswordException') {
                isEncrypted = true;
            } else {
                toast({ variant: 'destructive', title: 'Invalid PDF', description: 'This file may be corrupted.' });
                return;
            }
        }
        setFile({ id: `${singleFile.name}-${Date.now()}`, file: singleFile, isEncrypted });
      }
    }, [toast]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxSize: MAX_FILE_SIZE_BYTES,
    multiple: false,
    noClick: true,
    noKeyboard: true,
    disabled: isProcessing,
  });

  const removeFile = () => {
    const fileName = file?.file.name;
    setFile(null);
    if (fileName) {
      toast({ variant: 'info', title: `Removed "${fileName}"` });
    }
  };
  
  const processConversion = async () => {
    if (!file || file.isEncrypted) return;
    
    const currentOperationId = ++operationId.current;
    setIsProcessing(true);
    setProgress(0);
    setProgressText("Initializing...");
    setResult(null);

    try {
      const pdfBytes = await file.file.arrayBuffer();
      const pdfjsDoc = await pdfjsLib.getDocument({ data: pdfBytes, password: '' }).promise;
      const totalPages = pdfjsDoc.numPages;

      let htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${file.file.name}</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
            line-height: 1.6;
            color: #333;
            background-color: #f8f9fa;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 800px;
            margin: 20px auto;
            padding: 20px;
            background-color: #fff;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .page {
            border-bottom: 2px solid #eee;
            padding-bottom: 20px;
            margin-bottom: 20px;
        }
        .page:last-child {
            border-bottom: none;
            margin-bottom: 0;
        }
        h1, h2, h3 {
            font-weight: 600;
        }
        p {
            margin: 0 0 1em 0;
        }
    </style>
</head>
<body>
<div class="container">
<h1>${file.file.name}</h1>
`;

      for (let i = 1; i <= totalPages; i++) {
        if (operationId.current !== currentOperationId) return;

        setProgressText(`Processing page ${i} of ${totalPages}...`);
        const page = await pdfjsDoc.getPage(i);
        const textContent = await page.getTextContent();
        
        htmlContent += `<div class="page" id="page-${i}">\n<h2>Page ${i}</h2>\n`;
        
        let currentParagraph = '';
        textContent.items.forEach((item, index) => {
          if ('str' in item) {
             currentParagraph += item.str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
             if (item.hasEOL || index === textContent.items.length -1) {
                if (currentParagraph.trim()) {
                   htmlContent += `<p>${currentParagraph}</p>\n`;
                }
                currentParagraph = '';
             } else {
                currentParagraph += ' ';
             }
          }
        });
        htmlContent += `</div>\n`;

        setProgress(Math.round((i / totalPages) * 100));
      }

      htmlContent += `</div></body></html>`;
      
      if (operationId.current !== currentOperationId) return;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      const originalName = file.file.name.replace(/\.pdf$/i, '');
      setResult({ url, filename: `${originalName}.html` });
      
      toast({ variant: "success", title: "Conversion Complete!" });

    } catch (error: any) {
      if (operationId.current === currentOperationId) {
        toast({ variant: "destructive", title: "Conversion Failed", description: error.message || "An unexpected error occurred." });
      }
    } finally {
        if (operationId.current === currentOperationId) setIsProcessing(false);
    }
  };


  const handleCancel = () => {
    operationId.current++;
    setIsProcessing(false);
    setProgress(0);
    setProgressText("Converting...");
    toast({ variant: "info", title: "Processing cancelled." });
  };
  
  const handleProcessAgain = () => {
    if (result) URL.revokeObjectURL(result.url);
    setFile(null);
    setResult(null);
  };

  const handleDownload = () => {
    if (!result) return;
    const link = document.createElement("a");
    link.href = result.url;
    link.download = result.filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
        document.body.removeChild(link);
    }, 100);
  };


  if (result) {
    return (
      <div className="text-center flex flex-col items-center justify-center py-12 animate-in fade-in duration-500 bg-transparent p-4 sm:p-8 rounded-xl">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-500 rounded-full flex items-center justify-center mb-6">
            <Check className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Conversion Successful!</h2>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4">
          <Button size="lg" className="w-full sm:w-auto text-base font-bold bg-green-600 hover:bg-green-700 text-white" onClick={handleDownload}>
            <Download className="mr-2 h-5 w-5" /> Download HTML
          </Button>
          <Button size="lg" variant="outline" onClick={handleProcessAgain}>Convert Another PDF</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-transparent shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Upload PDF</CardTitle>
            <CardDescription>Select a PDF file to convert to HTML.</CardDescription>
          </CardHeader>
          <CardContent>
            {!file ? (
            <div
              {...getRootProps()}
              className={cn("flex flex-col items-center justify-center p-6 sm:p-10 rounded-lg border-2 border-dashed transition-colors duration-300", !isProcessing && "hover:border-primary/50", isDragActive && "border-primary bg-primary/10", isProcessing && "opacity-70 pointer-events-none")}>
              <input {...getInputProps()} />
              <UploadCloud className="w-10 h-10 text-muted-foreground sm:w-12 sm:h-12" />
              <p className="mt-2 text-base font-semibold text-foreground sm:text-lg">Drop a PDF file here</p>
              <p className="text-xs text-muted-foreground sm:text-sm">or click the button below</p>
               <motion.div whileHover={{ scale: 1.05, y: -2 }} transition={{ type: 'spring', stiffness: 400, damping: 10 }}>
                <Button type="button" onClick={open} className="mt-4" disabled={isProcessing}>
                    <FolderOpen className="mr-2 h-4 w-4" />Choose File
                </Button>
              </motion.div>
            </div>
            ) : (
                <div className={cn("p-2 sm:p-3 rounded-lg border bg-card/50 shadow-sm flex items-center justify-between", isProcessing && "opacity-70 pointer-events-none")}>
                <div className="flex items-center gap-3 overflow-hidden">
                    {file.isEncrypted ? (
                        <Lock className="w-6 h-6 text-yellow-500 sm:w-8 sm:h-8 shrink-0" />
                    ) : (
                        <FileIcon className="w-6 h-6 text-destructive sm:w-8 sm:h-8 shrink-0" />
                    )}
                    <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-medium truncate" title={file.file.name}>{file.file.name}</span>
                    <span className="text-xs text-muted-foreground">{formatBytes(file.file.size)}</span>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground/70 hover:bg-destructive/10 hover:text-destructive shrink-0" onClick={removeFile} disabled={isProcessing}>
                    <X className="w-4 h-4" />
                </Button>
                </div>
            )}
          </CardContent>
        </Card>
        {file && (
             <Card className="bg-transparent shadow-lg">
                <CardContent className="p-6">
                    {file.isEncrypted ? (
                         <div className="flex items-center gap-3 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3 text-sm text-yellow-700 dark:text-yellow-400">
                            <ShieldAlert className="h-5 w-5 shrink-0" />
                            <p>This PDF is password-protected and cannot be processed. Please upload an unlocked file.</p>
                        </div>
                    ) : (
                        <div className="h-[104px] flex flex-col justify-center">
                            <AnimatePresence mode="wait">
                            {isProcessing ? (
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
                                            <p className="text-sm font-medium text-primary">{progressText}</p>
                                            </div>
                                            <p className="text-sm font-medium text-primary">{Math.round(progress)}%</p>
                                        </div>
                                        <Progress value={progress} className="h-2" />
                                    </div>
                                    <Button size="sm" variant="destructive" onClick={handleCancel} className="w-full">
                                        <Ban className="mr-2 h-4 w-4" />Cancel
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
                                    <Button size="lg" className="w-full text-base font-bold" onClick={processConversion} disabled={!file || isProcessing || file.isEncrypted}><Code className="mr-2 h-5 w-5" />Convert to HTML</Button>
                                </motion.div>
                            )}
                            </AnimatePresence>
                        </div>
                    )}
                </CardContent>
            </Card>
        )}
    </div>
  );
}
