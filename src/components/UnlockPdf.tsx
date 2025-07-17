
"use client";

import React, { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud,
  File as FileIcon,
  Download,
  X,
  CheckCircle,
  FolderOpen,
  Loader2,
  Unlock as UnlockIcon,
  Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "./ui/progress";
import { PDFDocument } from 'pdf-lib';
import { PasswordDialog } from "./PasswordDialog";

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

type PasswordState = {
  isNeeded: boolean;
  isSubmitting: boolean;
  error: string | null;
};

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function UnlockPdf() {
  const [file, setFile] = useState<PDFFile | null>(null);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const [passwordState, setPasswordState] = useState<PasswordState>({
    isNeeded: false,
    isSubmitting: false,
    error: null,
  });

  const operationId = useRef<number>(0);
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const singleFile = acceptedFiles[0];
    if (singleFile) {
      setResult(null);
      setFile({ id: `${singleFile.name}-${Date.now()}`, file: singleFile });
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
    setFile(null);
    setPasswordState({ isNeeded: false, isSubmitting: false, error: null });
  };

  const processUnlock = async (password: string) => {
    if (!file) return;

    const currentOperationId = ++operationId.current;
    setIsProcessing(true);
    setProgress(0);
    setResult(null);
    setPasswordState({ isNeeded: true, isSubmitting: true, error: null });

    try {
      const pdfBytes = await file.file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes, { password });
      
      const totalPages = pdfDoc.getPageCount();
      for (let i = 0; i < totalPages; i++) {
        if (operationId.current !== currentOperationId) return;
        pdfDoc.getPage(i);
        setProgress(Math.round(((i + 1) / totalPages) * 100));
      }
      
      const newPdfBytes = await pdfDoc.save();
      const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const originalName = file.file.name.replace(/\.pdf$/i, '');
      setResult({ url, filename: `${originalName}_unlocked.pdf` });
      setPasswordState({ isNeeded: false, isSubmitting: false, error: null });
      
      toast({ title: "PDF Unlocked Successfully!" });

    } catch (error: any) {
        if (operationId.current !== currentOperationId) return;
        
        // The only expected error here is an incorrect password.
        // Any other error (like corrupted file) will also result in this message,
        // which is safer than making incorrect assumptions.
        setPasswordState({ isNeeded: true, isSubmitting: false, error: "Incorrect password. Please try again." });
    
    } finally {
      if (operationId.current === currentOperationId) {
        setIsProcessing(false);
      }
    }
  };

  const handleUnlockClick = () => {
    if (!file) {
      toast({ variant: "destructive", title: "No file selected" });
      return;
    }
    setPasswordState({ isNeeded: true, isSubmitting: false, error: null });
  };

  const handleCancel = () => {
    operationId.current++;
    setIsProcessing(false);
    setProgress(0);
    setPasswordState({ isNeeded: false, isSubmitting: false, error: null });
    toast({ title: "Processing cancelled." });
  };
  
  const handleProcessAgain = () => {
    if (result) URL.revokeObjectURL(result.url);
    setFile(null);
    setResult(null);
  };
  
  const handlePasswordSubmit = (password: string) => {
    processUnlock(password);
  };
  
  const handlePasswordDialogClose = () => {
      if (!isProcessing) {
        setPasswordState({ isNeeded: false, isSubmitting: false, error: null });
      }
  };

  if (result) {
    return (
      <div className="text-center flex flex-col items-center justify-center py-12 animate-in fade-in duration-500 bg-white dark:bg-card p-4 sm:p-8 rounded-xl shadow-lg border">
        <CheckCircle className="w-16 h-16 sm:w-20 sm:h-20 text-green-500 mb-6" />
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Your file is ready!</h2>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4">
          <a href={result.url} download={result.filename}>
            <Button size="lg" className="w-full sm:w-auto text-base font-bold bg-green-600 hover:bg-green-700 text-white">
              <Download className="mr-2 h-5 w-5" /> Download PDF
            </Button>
          </a>
          <Button size="lg" variant="outline" onClick={handleProcessAgain}>Process Another PDF</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-card shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Upload PDF</CardTitle>
          <CardDescription>Select a password-protected PDF file to unlock.</CardDescription>
        </CardHeader>
        <CardContent>
          {!file ? (
            <div
              {...getRootProps()}
              className={cn("flex flex-col items-center justify-center p-6 sm:p-10 rounded-lg border-2 border-dashed transition-colors duration-300", !isProcessing && "hover:border-primary/50", isDragActive && "border-primary bg-primary/10")}>
              <input {...getInputProps()} />
              <UploadCloud className="w-10 h-10 text-muted-foreground sm:w-12 sm:h-12" />
              <p className="mt-2 text-base font-semibold text-foreground sm:text-lg">Drop a PDF file here</p>
              <p className="text-xs text-muted-foreground sm:text-sm">or click the button below</p>
              <Button type="button" onClick={open} className="mt-4">
                <FolderOpen className="mr-2 h-4 w-4" />Choose File
              </Button>
            </div>
          ) : (
            <div className="p-2 sm:p-3 rounded-lg border bg-card/50 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <FileIcon className="w-6 h-6 text-destructive sm:w-8 sm:h-8 shrink-0" />
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-medium truncate" title={file.file.name}>{file.file.name}</span>
                  <span className="text-xs text-muted-foreground">{formatBytes(file.file.size)}</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground/70 hover:bg-destructive/10 hover:text-destructive shrink-0" onClick={removeFile}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {file && (
        <Card className="bg-white dark:bg-card shadow-lg">
          <CardContent className="p-6">
            <Button size="lg" className="w-full text-base font-bold" onClick={handleUnlockClick} disabled={!file || isProcessing}>
              <UnlockIcon className="mr-2 h-5 w-5" />Unlock PDF
            </Button>
          </CardContent>
        </Card>
      )}

      <PasswordDialog 
        isOpen={passwordState.isNeeded}
        onClose={handlePasswordDialogClose}
        onSubmit={handlePasswordSubmit}
        isSubmitting={passwordState.isSubmitting}
        error={passwordState.error}
        fileName={file?.file.name || null}
      >
        {isProcessing && (
            <div className="p-4 border rounded-lg bg-primary/5 mt-4">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                        <p className="text-sm font-medium text-primary">Unlocking PDF...</p>
                    </div>
                    <p className="text-sm font-medium text-primary">{Math.round(progress)}%</p>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="mt-4">
                    <Button size="sm" variant="destructive" onClick={handleCancel} className="w-full">
                        <Ban className="mr-2 h-4 w-4" />Cancel
                    </Button>
                </div>
            </div>
        )}
      </PasswordDialog>
    </div>
  );
}
