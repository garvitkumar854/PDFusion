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
  FileArchive,
  Lock,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import { compressPdf, CompressPdfInput, CompressionStats } from "@/ai/flows/compress-pdf-flow";
import { motion, AnimatePresence } from "framer-motion";

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
  stats: CompressionStats;
};

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function PdfCompressor() {
  const [file, setFile] = useState<PDFFile | null>(null);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [quality, setQuality] = useState(75);

  const operationId = useRef<number>(0);
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
      const singleFile = acceptedFiles[0];
      if (singleFile) {
        setResult(null);
        let isEncrypted = false;
        try {
            const pdfBytes = await singleFile.arrayBuffer();
            // A simple check for encryption marker. More robust checks are in the flow.
            const textDecoder = new TextDecoder('utf-8');
            const pdfText = textDecoder.decode(pdfBytes.slice(0, 1024));
            if (pdfText.includes('/Encrypt')) {
                isEncrypted = true;
            }
        } catch (e: any) {
            console.error(e);
        }
        setFile({ id: `${singleFile.name}-${Date.now()}`, file: singleFile, isEncrypted });
      }
    }, []);

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
    if (result) URL.revokeObjectURL(result.url);
    setFile(null);
    setResult(null);
  };
  
  const handleProcess = async () => {
    if (!file || file.isEncrypted) return;

    const currentOperationId = ++operationId.current;
    setIsProcessing(true);
    setResult(null);

    const reader = new FileReader();
    reader.readAsDataURL(file.file);
    reader.onload = async () => {
        try {
            const input: CompressPdfInput = {
                pdfDataUri: reader.result as string,
                quality,
            };

            const response = await compressPdf(input);

            if (operationId.current !== currentOperationId) return;

            if (response.error) {
                throw new Error(response.error);
            }

            const byteCharacters = atob(response.pdfDataUri!.split(',')[1]);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/pdf' });

            const url = URL.createObjectURL(blob);
            const originalName = file.file.name.replace(/\.pdf$/i, '');

            setResult({
                url,
                filename: `${originalName}_compressed.pdf`,
                stats: response.stats!,
            });

            toast({
                variant: "success",
                title: "Compression Complete!",
                description: "Your PDF has been successfully compressed.",
            });
        } catch (error: any) {
            if (operationId.current === currentOperationId) {
                toast({ variant: "destructive", title: "Compression Failed", description: error.message || "An unexpected error occurred." });
            }
        } finally {
            if (operationId.current === currentOperationId) {
                setIsProcessing(false);
            }
        }
    };
    reader.onerror = (error) => {
        toast({ variant: "destructive", title: "File Read Error", description: "Could not read the uploaded file." });
        setIsProcessing(false);
    };
};


  const handleCancel = () => {
    operationId.current++;
    setIsProcessing(false);
    toast({ variant: "info", title: "Processing cancelled." });
  };
  
  const handleProcessAgain = () => {
    removeFile();
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
    const { stats } = result;
    const reduction = stats.originalSize > 0 ? ((stats.originalSize - stats.newSize) / stats.originalSize) * 100 : 0;

    return (
      <div className="text-center flex flex-col items-center justify-center py-12 animate-in fade-in duration-500 bg-transparent p-4 sm:p-8 rounded-xl shadow-lg border">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-500 rounded-full flex items-center justify-center mb-6">
            <Check className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Compression Complete!</h2>
        <div className="my-4 text-center">
            <p className="text-lg">Original Size: <span className="font-semibold">{formatBytes(stats.originalSize)}</span></p>
            <p className="text-lg">New Size: <span className="font-semibold text-primary">{formatBytes(stats.newSize)}</span></p>
            <p className="text-2xl font-bold text-green-600 mt-2">Saved {reduction.toFixed(2)}%</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4">
            <Button size="lg" className="w-full sm:w-auto text-base font-bold bg-green-600 hover:bg-green-700 text-white" onClick={handleDownload}>
              <Download className="mr-2 h-5 w-5" /> Download PDF
            </Button>
          <Button size="lg" variant="outline" onClick={handleProcessAgain}>Compress Another PDF</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-transparent shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Upload PDF</CardTitle>
          <CardDescription>Select a PDF file to compress.</CardDescription>
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
                <Button type="button" onClick={open} className="mt-4" disabled={isProcessing}><FolderOpen className="mr-2 h-4 w-4" />Choose File</Button>
              </motion.div>
            </div>
          ) : (
            <div className={cn("p-2 sm:p-3 rounded-lg border bg-card/50 shadow-sm flex items-center justify-between", isProcessing && "opacity-70 pointer-events-none")}>
              <div className="flex items-center gap-3 overflow-hidden">
                {file.isEncrypted ? <Lock className="w-6 h-6 text-yellow-500 sm:w-8 sm:h-8 shrink-0" /> : <FileIcon className="w-6 h-6 text-destructive sm:w-8 sm:h-8 shrink-0" />}
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-medium truncate" title={file.file.name}>{file.file.name}</span>
                  <span className="text-xs text-muted-foreground">{formatBytes(file.file.size)}</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground/70 hover:bg-destructive/10 hover:text-destructive shrink-0" onClick={removeFile} disabled={isProcessing}><X className="w-4 h-4" /></Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {file && (
        <Card className="bg-transparent shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Compression Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {file.isEncrypted ? (
                 <div className="flex items-center gap-3 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3 text-sm text-yellow-700 dark:text-yellow-400">
                    <ShieldAlert className="h-5 w-5 shrink-0" />
                    <div>This PDF is password-protected and cannot be compressed. Please upload an unlocked file.</div>
                </div>
            ) : (
                <div className="space-y-4">
                    <Label htmlFor="quality-slider">Image Quality: <span className="font-bold text-primary">{quality}%</span></Label>
                    <Slider id="quality-slider" value={[quality]} onValueChange={([val]) => setQuality(val)} min={10} max={100} step={5} disabled={isProcessing} />
                    <p className="text-xs text-muted-foreground">Lower quality results in smaller file sizes but may reduce image clarity.</p>
                </div>
            )}
            
            <div className="pt-6 border-t flex flex-col justify-center">
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
                    <div className="flex items-center justify-center gap-2 p-4 border rounded-lg bg-primary/5">
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                        <p className="text-sm font-medium text-primary">Compressing PDF... This may take a moment.</p>
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
                    <Button size="lg" className="w-full text-base font-bold" onClick={handleProcess} disabled={isProcessing || !file || file.isEncrypted}>
                      <FileArchive className="mr-2 h-5 w-5" />Compress PDF
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