
"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud,
  Download,
  X,
  CheckCircle,
  FolderOpen,
  Loader2,
  Ban,
  RotateCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { PDFDocument, degrees } from 'pdf-lib';
import { Progress } from "./ui/progress";
import * as pdfjsLib from 'pdfjs-dist';

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

const MAX_FILE_SIZE_MB = 100;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

type PDFFile = {
  id: string;
  file: File;
};

type ProcessResult = {
  url: string;
  filename: string;
};

type RotationAngle = 90 | 180 | 270;

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}


export function PdfRotator() {
  const [file, setFile] = useState<PDFFile | null>(null);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const [angle, setAngle] = useState<RotationAngle>(90);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const operationId = useRef<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      operationId.current++;
      if (result) {
        URL.revokeObjectURL(result.url);
      }
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [result, previewUrl]);


  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
      if (rejectedFiles.length > 0) {
        toast({ variant: "destructive", title: "Invalid file", description: "The file was not a PDF or exceeded size limits." });
        return;
      }
      
      const currentOperationId = ++operationId.current;
      setIsProcessing(true);
      setPreviewUrl(null);
      
      try {
        const singleFile = acceptedFiles[0];
        setFile({ id: `${singleFile.name}-${Date.now()}`, file: singleFile });
        setResult(null);

        const pdfBytes = await singleFile.arrayBuffer();
        const pdfjsDoc = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
        if (operationId.current !== currentOperationId) return;

        const page = await pdfjsDoc.getPage(1);
        const viewport = page.getViewport({ scale: 1 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext('2d');
        if (context) {
            await page.render({ canvasContext: context, viewport }).promise;
            if (operationId.current !== currentOperationId) return;
            const url = canvas.toDataURL();
            setPreviewUrl(url);
        }
      } catch(e) {
        if(operationId.current === currentOperationId) {
           console.error("Failed to load PDF for preview", e);
           toast({ variant: "destructive", title: "Could not load preview", description: "The file might be corrupted or encrypted." });
        }
      } finally {
        if(operationId.current === currentOperationId) {
          setIsProcessing(false);
        }
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
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const handleProcess = async () => {
    if (!file) {
      toast({ variant: "destructive", title: "No file selected", description: "Please upload a PDF file." });
      return;
    }

    const currentOperationId = ++operationId.current;
    setIsProcessing(true);
    setProgress(0);
    setResult(null);

    try {
      const pdfBytes = await file.file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      const totalPages = pdfDoc.getPageCount();
      
      const pages = pdfDoc.getPages();
      for (let i = 0; i < totalPages; i++) {
        if (operationId.current !== currentOperationId) return;

        const page = pages[i];
        page.setRotation(degrees(page.getRotation().angle + angle));
        
        setProgress(Math.round(((i + 1) / totalPages) * 100));
      }

      if (operationId.current !== currentOperationId) return;

      const newPdfBytes = await pdfDoc.save();
      const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      if (operationId.current !== currentOperationId) {
        URL.revokeObjectURL(url);
        return;
      }
      
      const originalName = file.file.name.replace(/\.pdf$/i, '');
      setResult({
        url,
        filename: `${originalName}_rotated.pdf`,
      });
      
      toast({
        title: "Processing Complete!",
        description: "Your PDF has been rotated.",
        action: <div className="p-1 rounded-full bg-green-500"><CheckCircle className="w-5 h-5 text-white" /></div>
      });

    } catch (error: any) {
      if (operationId.current === currentOperationId) {
        console.error("Processing failed:", error);
        toast({
          variant: "destructive",
          title: "Processing Failed",
          description: error.message || "An unexpected error occurred.",
        });
      }
    } finally {
        if (operationId.current === currentOperationId) {
           setIsProcessing(false);
        }
    }
  };

  const handleCancel = () => {
    operationId.current++;
    setIsProcessing(false);
    setProgress(0);
    toast({ title: "Processing cancelled." });
  };
  
  const handleProcessAgain = () => {
    if (result) {
      URL.revokeObjectURL(result.url);
    }
    setFile(null);
    setResult(null);
    if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
  };

  if (result) {
    return (
      <div className="text-center flex flex-col items-center justify-center py-12 animate-in fade-in duration-500 bg-white dark:bg-card p-4 sm:p-8 rounded-xl shadow-lg border">
        <CheckCircle className="w-16 h-16 sm:w-20 sm:h-20 text-green-500 mb-6" />
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">PDF Rotated Successfully!</h2>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4">
          <a href={result.url} download={result.filename}>
            <Button size="lg" className="w-full sm:w-auto text-base font-bold bg-green-600 hover:bg-green-700 text-white">
              <Download className="mr-2 h-5 w-5" />
              Download PDF
            </Button>
          </a>
          <Button size="lg" variant="outline" onClick={handleProcessAgain} className="w-full sm:w-auto text-base">
            Rotate Another PDF
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!file && (
        <Card className="bg-white dark:bg-card shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Upload PDF</CardTitle>
            <CardDescription>
              Select a single PDF file to rotate its pages.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={cn(
                "flex flex-col items-center justify-center p-6 sm:p-10 rounded-lg border-2 border-dashed transition-colors duration-300",
                !isProcessing && "hover:border-primary/50",
                isDragActive && "border-primary bg-primary/10",
                isProcessing && "opacity-70 pointer-events-none"
              )}
            >
              <input {...getInputProps()} />
              <UploadCloud className="w-10 h-10 text-muted-foreground sm:w-12 sm:h-12" />
              <p className="mt-2 text-base font-semibold text-foreground sm:text-lg">
                Drop a PDF file here
              </p>
              <p className="text-xs text-muted-foreground sm:text-sm">or click the button below</p>
              <Button type="button" onClick={open} className="mt-4" disabled={isProcessing}>
                <FolderOpen className="mr-2 h-4 w-4" />
                Choose File
              </Button>
              <p className="w-full px-2 text-center text-xs text-muted-foreground mt-6">
                Max file size: {MAX_FILE_SIZE_MB}MB
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {file && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <div className="space-y-6">
                <Card className="bg-white dark:bg-card shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-xl">Uploaded File</CardTitle>
                            <CardDescription className="truncate max-w-[200px] sm:max-w-xs" title={file.file.name}>{file.file.name}</CardDescription>
                        </div>
                        <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground/70 hover:bg-destructive/10 hover:text-destructive shrink-0" onClick={removeFile} disabled={isProcessing}>
                            <X className="w-4 h-4" />
                        </Button>
                    </CardHeader>
                </Card>
                <Card className="bg-white dark:bg-card shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl sm:text-2xl">Rotation Options</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={cn(isProcessing && "opacity-70 pointer-events-none")}>
                        <Label className="font-semibold">Angle of Rotation</Label>
                        <RadioGroup 
                            value={String(angle)} 
                            onValueChange={(v) => setAngle(Number(v) as RotationAngle)}
                            className="mt-2 grid grid-cols-3 gap-2"
                            disabled={isProcessing}
                        >
                            <Label className={cn("flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer hover:border-primary/50  transition-colors", angle === 90 && "border-primary bg-primary/5")}>
                                <RadioGroupItem value="90" className="sr-only"/>
                                <RotateCw className="w-6 h-6 mb-2"/>
                                90°
                            </Label>
                            <Label className={cn("flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer hover:border-primary/50 transition-colors", angle === 180 && "border-primary bg-primary/5")}>
                                <RadioGroupItem value="180" className="sr-only"/>
                                 <RotateCw className="w-6 h-6 mb-2" style={{transform: 'rotate(90deg)'}}/>
                                180°
                            </Label>
                            <Label className={cn("flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer hover:border-primary/50 transition-colors", angle === 270 && "border-primary bg-primary/5")}>
                                <RadioGroupItem value="270" className="sr-only"/>
                                <RotateCw className="w-6 h-6 mb-2" style={{transform: 'rotate(180deg)'}}/>
                                270°
                            </Label>
                        </RadioGroup>
                    </div>

                    <div className="mt-8">
                      {isProcessing ? (
                        <div className="p-4 border rounded-lg bg-primary/5">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-5 h-5 text-primary animate-spin" />
                              <p className="text-sm font-medium text-primary transition-all duration-300">Rotating PDF...</p>
                            </div>
                            <p className="text-sm font-medium text-primary">{Math.round(progress)}%</p>
                          </div>
                          <Progress value={progress} className="h-2" />
                           <div className="mt-4">
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                onClick={handleCancel} 
                                className="w-full"
                              >
                                <Ban className="mr-2 h-4 w-4" />
                                Cancel
                              </Button>
                          </div>
                        </div>
                      ) : (
                        <Button size="lg" className="w-full text-base font-bold" onClick={handleProcess} disabled={!file || isProcessing}>
                          <RotateCw className="mr-2 h-5 w-5" />
                          Rotate PDF
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
            </div>
            <div className="space-y-6 sticky top-24">
                 <Card className="bg-white dark:bg-card shadow-lg">
                    <CardHeader><CardTitle className="text-xl">Live Preview</CardTitle></CardHeader>
                    <CardContent className="flex items-center justify-center p-4 bg-muted/50 rounded-b-lg aspect-square overflow-hidden">
                        {previewUrl ? (
                            <div className="relative w-full h-full flex items-center justify-center">
                                <img 
                                    src={previewUrl} 
                                    alt="PDF first page preview" 
                                    className="max-w-full max-h-full object-contain shadow-md border rounded-md transition-transform duration-300 origin-center"
                                    style={{ transform: `rotate(${angle}deg)` }}
                                />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                <p className="mt-2">Loading preview...</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
      )}
    </div>
  );
}
