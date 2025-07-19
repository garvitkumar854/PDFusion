
"use client";

import React, { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud,
  File as FileIcon,
  X,
  CheckCircle,
  FolderOpen,
  Loader2,
  Wand2,
  AlertCircle,
  ShieldCheck,
  Flag,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { scanDocument, ScanDocumentOutput } from "@/ai/flows/scan-document-flow";
import * as pdfjsLib from 'pdfjs-dist';

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

type PDFFile = {
  id: string;
  file: File;
  isEncrypted: boolean;
};

type ScanStatus = "idle" | "analyzing" | "done" | "error";

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const SEVERITY_MAP = {
  high: { icon: AlertCircle, color: "text-destructive", bgColor: "bg-destructive/10" },
  medium: { icon: Flag, color: "text-yellow-500", bgColor: "bg-yellow-500/10" },
  low: { icon: Lightbulb, color: "text-blue-500", bgColor: "bg-blue-500/10" },
};

const STATUS_MAP = {
    good: { icon: ShieldCheck, color: "text-green-500", label: "Looking Good" },
    concerns: { icon: Flag, color: "text-yellow-500", label: "Some Concerns" },
    critical: { icon: AlertCircle, color: "text-destructive", label: "Critical Issues Found" },
}


export function AiDocumentScanner() {
  const [file, setFile] = useState<PDFFile | null>(null);
  const [scanResult, setScanResult] = useState<ScanDocumentOutput | null>(null);
  const [status, setStatus] = useState<ScanStatus>("idle");
  const operationId = useRef<number>(0);
  const { toast } = useToast();
  
  const isAnalyzing = status === 'analyzing';

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: any[]) => {
      if (rejectedFiles.length > 0) {
        toast({ variant: "destructive", title: "Invalid file", description: "The file was not a PDF or exceeded size limits." });
        return;
      }
      
      const singleFile = acceptedFiles[0];
      if (!singleFile) return;

      let isEncrypted = false;
      try {
          const pdfBytes = await singleFile.arrayBuffer();
          await pdfjsLib.getDocument(pdfBytes).promise;
      } catch (e: any) {
          if (e.name === 'PasswordException') {
              isEncrypted = true;
          } else {
              toast({ variant: 'destructive', title: 'Invalid PDF', description: 'This file may be corrupted or not a valid PDF.'});
              return;
          }
      }

      setFile({ id: `${singleFile.name}-${Date.now()}`, file: singleFile, isEncrypted });
      setScanResult(null);
      setStatus("idle");
    },
    [toast]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxSize: MAX_FILE_SIZE_BYTES,
    multiple: false,
    noClick: true,
    noKeyboard: true,
    disabled: isAnalyzing,
  });

  const removeFile = () => {
    setFile(null);
    setStatus("idle");
  };

  const handleScan = async () => {
    if (!file) {
      toast({ variant: "destructive", title: "No file selected", description: "Please upload a PDF file to scan." });
      return;
    }
    if (file.isEncrypted) {
      toast({ variant: "destructive", title: "Encrypted PDF", description: "Password-protected PDFs cannot be scanned." });
      return;
    }

    const currentOperationId = ++operationId.current;
    setStatus('analyzing');
    setScanResult(null);

    try {
      const pdfDataUri = await fileToDataUri(file.file);
      if (operationId.current !== currentOperationId) return;
      
      const result = await scanDocument({ pdfDataUri });
      if (operationId.current !== currentOperationId) return;

      setScanResult(result);
      setStatus('done');
      
    } catch (error: any) {
      if (operationId.current === currentOperationId) {
        setStatus('error');
        console.error("Scan failed:", error);
        toast({
          variant: "destructive",
          title: "Analysis Failed",
          description: error.message || "An unexpected AI error occurred.",
        });
      }
    }
  };
  
  const handleScanAgain = () => {
    setFile(null);
    setScanResult(null);
    setStatus('idle');
  };
  
  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-card shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Upload PDF for Analysis</CardTitle>
          <CardDescription>
            Select a PDF to have our AI check it for potential issues.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!file && !scanResult ? (
            <div
              {...getRootProps()}
              className={cn(
                "flex flex-col items-center justify-center p-6 sm:p-10 rounded-lg border-2 border-dashed transition-colors duration-300",
                !isAnalyzing && "hover:border-primary/50",
                isDragActive && "border-primary bg-primary/10",
                isAnalyzing && "opacity-70 pointer-events-none"
              )}
            >
              <input {...getInputProps()} />
              <UploadCloud className="w-10 h-10 text-muted-foreground sm:w-12 sm:h-12" />
              <p className="mt-2 text-base font-semibold text-foreground sm:text-lg">
                Drop a PDF file here
              </p>
              <p className="text-xs text-muted-foreground sm:text-sm">or click the button below</p>
              <Button type="button" onClick={open} className="mt-4" disabled={isAnalyzing}>
                <FolderOpen className="mr-2 h-4 w-4" />
                Choose File
              </Button>
              <p className="w-full px-2 text-center text-xs text-muted-foreground mt-6">
                Max file size: {MAX_FILE_SIZE_MB}MB
              </p>
            </div>
          ) : (
            <div className={cn("p-2 sm:p-3 rounded-lg border bg-card/50 shadow-sm flex items-center justify-between", isAnalyzing && "opacity-70 pointer-events-none")}>
              <div className="flex items-center gap-3 overflow-hidden">
                <FileIcon className="w-6 h-6 text-destructive sm:w-8 sm:h-8 shrink-0" />
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-medium truncate" title={file?.file.name}>{file?.file.name}</span>
                  <span className="text-xs text-muted-foreground">{formatBytes(file?.file.size || 0)}</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground/70 hover:bg-destructive/10 hover:text-destructive shrink-0" onClick={scanResult ? handleScanAgain : removeFile} disabled={isAnalyzing}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {file && !scanResult && (
        <Card className="bg-white dark:bg-card shadow-lg">
          <CardContent className="p-6">
             {file.isEncrypted && (
              <div className="mb-4 flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p>Password-protected PDFs cannot be scanned.</p>
              </div>
            )}
            <div className="mt-2">
              {isAnalyzing ? (
                <div className="p-4 border rounded-lg bg-primary/5 text-center">
                    <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                        <p className="text-sm font-medium text-primary">AI is analyzing your document...</p>
                    </div>
                </div>
              ) : (
                <Button size="lg" className="w-full text-base font-bold" onClick={handleScan} disabled={!file || isAnalyzing || file.isEncrypted}>
                  <Wand2 className="mr-2 h-5 w-5" />
                  Scan Document
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {scanResult && (
         <Card className="bg-white dark:bg-card shadow-lg animate-in fade-in duration-500">
            <CardHeader>
                <CardTitle className="text-xl sm:text-2xl flex items-center gap-3">
                   <span className={STATUS_MAP[scanResult.overallStatus].color}>
                        {React.createElement(STATUS_MAP[scanResult.overallStatus].icon, { className: "w-7 h-7" })}
                   </span>
                   AI Scan Report: {STATUS_MAP[scanResult.overallStatus].label}
                </CardTitle>
                <CardDescription>{scanResult.summary}</CardDescription>
            </CardHeader>
            <CardContent>
                {scanResult.issues.length > 0 ? (
                    <div className="space-y-4">
                        {scanResult.issues.map((issue, index) => {
                            const Icon = SEVERITY_MAP[issue.severity].icon;
                            return (
                                <div key={index} className={cn("flex items-start gap-4 p-4 rounded-lg border", SEVERITY_MAP[issue.severity].bgColor)}>
                                    <span className={cn("mt-1", SEVERITY_MAP[issue.severity].color)}>
                                        <Icon className="w-5 h-5" />
                                    </span>
                                    <div>
                                        <p className="font-semibold">{issue.category}</p>
                                        <p className="text-sm text-muted-foreground">{issue.description}</p>
                                        {issue.page && <p className="text-xs text-muted-foreground/80 mt-1">Page: {issue.page}</p>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                        <p className="font-semibold">No issues found!</p>
                        <p className="text-muted-foreground text-sm">Your document looks great from our analysis.</p>
                    </div>
                )}

                 <div className="mt-8">
                    <Button size="lg" variant="outline" className="w-full" onClick={handleScanAgain}>
                        Scan Another Document
                    </Button>
                </div>
            </CardContent>
         </Card>
      )}
    </div>
  );
}
