
"use client";

import React, { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud,
  Download,
  X,
  Check,
  File as FileIcon,
  FolderOpen,
  Loader2,
  Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import * as mammoth from "mammoth";
import html2pdf from "html2pdf.js";
import { motion, AnimatePresence } from "framer-motion";


const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

type DocxFile = {
  id: string;
  file: File;
};

type ConversionResult = {
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

export function DocxToPdfConverter() {
  const [file, setFile] = useState<DocxFile | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [result, setResult] = useState<ConversionResult | null>(null);

  const operationId = useRef<number>(0);
  const { toast } = useToast();
  
  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      if (rejectedFiles.length > 0) {
        toast({ variant: "destructive", title: "Invalid file type", description: "Please upload a .docx file." });
        return;
      }
      if (acceptedFiles.length === 0) return;
      const docxFile = acceptedFiles[0];
      setFile({ id: `${docxFile.name}-${Date.now()}`, file: docxFile });
      setResult(null);
      toast({ variant: 'success', title: 'File added', description: `"${docxFile.name}" is ready to be converted.`});
    },
    [toast]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"] },
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE_BYTES,
    noClick: true,
    noKeyboard: true,
    disabled: isConverting,
  });

  const removeFile = () => {
    setFile(null);
    setResult(null);
    toast({ variant: "info", title: "File removed" });
  };
  
  const handleConvert = async () => {
    if (!file) return;

    const currentOperationId = ++operationId.current;
    setIsConverting(true);
    setConversionProgress(0);
    setResult(null);
    
    try {
        const arrayBuffer = await file.file.arrayBuffer();
        
        setConversionProgress(30);
        
        const { value: html } = await mammoth.convertToHtml({ arrayBuffer });
        
        setConversionProgress(60);

        if (operationId.current !== currentOperationId) return;
        
        const element = document.createElement('div');
        element.innerHTML = html;
        element.className = 'html-preview';
        
        const opt = {
          margin:       1,
          filename:     `${file.file.name.replace(/\.docx$/, '')}.pdf`,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true },
          jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        const pdfBlob = await html2pdf().from(element).set(opt).output('blob');
        
        setConversionProgress(100);

        if (operationId.current !== currentOperationId) return;

        const url = URL.createObjectURL(pdfBlob);
        setResult({ filename: opt.filename, url });
        
        toast({
            variant: "success",
            title: "Conversion Successful!",
            description: "Your PDF is ready for download.",
        });

    } catch (error: any) {
        if(operationId.current === currentOperationId) {
            console.error("Conversion failed:", error);
            toast({
                variant: "destructive",
                title: "Conversion Failed",
                description: error.message || "An unexpected error occurred.",
            });
        }
    } finally {
        if(operationId.current === currentOperationId) {
            setIsConverting(false);
        }
    }
  };

  const handleCancel = () => {
    operationId.current++;
    setIsConverting(false);
    toast({ variant: 'info', title: 'Conversion cancelled' });
  }
  
  const handleDownload = () => {
    if (!result) return;
    const link = document.createElement("a");
    link.href = result.url;
    link.download = result.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(result.url);
  };
  
  const handleConvertAnother = () => {
    setFile(null);
    setResult(null);
  };

  if (result) {
    return (
        <div className="text-center flex flex-col items-center justify-center py-12 animate-in fade-in duration-500 bg-transparent p-6 sm:p-8 rounded-xl shadow-lg border">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-500 rounded-full flex items-center justify-center mb-6">
                <Check className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Conversion Successful!</h2>
            <p className="text-muted-foreground mb-8 text-sm sm:text-base">Your PDF is ready to be downloaded.</p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Button size="lg" onClick={handleDownload} className="w-full sm:w-auto text-base font-bold bg-green-600 hover:bg-green-700 text-white">
                    <Download className="mr-2 h-5 w-5" />
                    Download PDF
                </Button>
                <Button size="lg" variant="outline" onClick={handleConvertAnother} className="w-full sm:w-auto text-base">
                    Convert Another
                </Button>
            </div>
        </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
        <Card className="bg-transparent shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">Upload DOCX File</CardTitle>
                <CardDescription>
                  Drag & drop your Word document here.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {!file ? (
                    <div
                        {...getRootProps()}
                        className={cn(
                        "flex flex-col items-center justify-center p-6 sm:p-10 rounded-lg border-2 border-dashed transition-colors duration-300",
                        !isConverting && "hover:border-primary/50",
                        isDragActive && "border-primary bg-primary/10"
                        )}
                    >
                        <input {...getInputProps()} />
                        <UploadCloud className="w-10 h-10 text-muted-foreground sm:w-12 sm:h-12" />
                        <p className="mt-2 text-base font-semibold text-foreground sm:text-lg">
                            Drop a DOCX file here
                        </p>
                        <p className="text-xs text-muted-foreground sm:text-sm">or click the button below</p>
                        <motion.div whileHover={{ scale: 1.05, y: -2 }} transition={{ type: 'spring', stiffness: 400, damping: 10 }}>
                          <Button type="button" onClick={open} className="mt-4" disabled={isConverting}>
                              <FolderOpen className="mr-2 h-4 w-4" />
                              Choose File
                          </Button>
                        </motion.div>
                        <p className="w-full px-2 text-center text-xs text-muted-foreground mt-6">Max file size: {MAX_FILE_SIZE_MB}MB</p>
                    </div>
                ) : (
                    <div className={cn("p-2 sm:p-3 rounded-lg border bg-card/50 shadow-sm flex items-center justify-between", isConverting && "opacity-70 pointer-events-none")}>
                        <div className="flex items-center gap-3 overflow-hidden">
                            <FileIcon className="w-6 h-6 text-blue-500 sm:w-8 sm:h-8 shrink-0" />
                            <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-medium truncate" title={file.file.name}>{file.file.name}</span>
                            <span className="text-xs text-muted-foreground">{formatBytes(file.file.size)}</span>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground/70 hover:bg-destructive/10 hover:text-destructive shrink-0" onClick={removeFile} disabled={isConverting}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
        
        {file && (
            <Card className="bg-transparent shadow-lg">
                <CardContent className="p-6">
                    <div className="h-[104px] flex flex-col justify-center">
                        <AnimatePresence mode="wait">
                            {isConverting ? (
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
                                                <p className="text-sm font-medium text-primary transition-all duration-300">Converting to PDF...</p>
                                            </div>
                                            <p className="text-sm font-medium text-primary">{Math.round(conversionProgress)}%</p>
                                        </div>
                                        <Progress value={conversionProgress} className="h-2" />
                                    </div>
                                    <Button size="sm" variant="destructive" onClick={handleCancel} className="w-full">
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
                                    <Button size="lg" className="w-full text-base font-bold" onClick={handleConvert} disabled={!file || isConverting}>
                                        <FileIcon className="mr-2 h-5 w-5" />
                                        Convert to PDF
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </CardContent>
            </Card>
        )}
    </div>
  );
}
