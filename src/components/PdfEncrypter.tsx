
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
  Lock,
  Unlock,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { callPdfApi } from "@/lib/pdf-api";

const MAX_FILE_SIZE_MB = 100;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

interface PdfEncrypterProps {
  mode: 'lock' | 'unlock';
}

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function PdfEncrypter({ mode }: PdfEncrypterProps) {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ url: string; filename: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      toast({ variant: "destructive", title: "Invalid file", description: "The file was not a PDF or exceeded size limits." });
      return;
    }
    const singleFile = acceptedFiles[0];
    if (singleFile) {
      setFile(singleFile);
      setResult(null);
      setError(null);
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
    if(result?.url) URL.revokeObjectURL(result.url);
    setResult(null);
  };

  const handleProcess = async () => {
    if (!file) {
      setError("Please upload a file first.");
      return;
    }
    if (!password) {
      setError(`Please enter a password to ${mode} the PDF.`);
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await callPdfApi(mode, file, password);
      
      const originalName = file.name.replace(/\.pdf$/i, '');
      const newFilename = mode === 'lock' ? `${originalName}_locked.pdf` : `${originalName}_unlocked.pdf`;

      setResult({ url: URL.createObjectURL(response), filename: newFilename });
      
      toast({
        title: `PDF ${mode === 'lock' ? 'Locked' : 'Unlocked'} Successfully!`,
        description: `Your ${mode === 'lock' ? 'protected' : 'unlocked'} PDF is ready for download.`,
        action: <div className="p-1 rounded-full bg-green-500"><CheckCircle className="w-5 h-5 text-white" /></div>,
      });

    } catch (err: any) {
      console.error(err);
      setError(err.message || `An unexpected error occurred. Please check the server connection and password.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessAgain = () => {
    removeFile();
    setPassword("");
  };

  const config = {
    lock: {
      title: "Lock PDF",
      description: "Select a PDF file to add password protection.",
      passwordLabel: "Enter a strong password",
      passwordPlaceholder: "Password",
      buttonText: "Lock PDF",
      buttonProcessingText: "Locking...",
      Icon: Lock,
      ResultTitle: "PDF Locked!",
      ResultDownloadText: "Download Locked PDF",
      ResultProcessAgainText: "Lock Another PDF",
    },
    unlock: {
      title: "Unlock PDF",
      description: "Select a password-protected PDF file to unlock.",
      passwordLabel: "Enter the PDF's current password",
      passwordPlaceholder: "Current password",
      buttonText: "Unlock PDF",
      buttonProcessingText: "Unlocking...",
      Icon: Unlock,
      ResultTitle: "PDF Unlocked!",
      ResultDownloadText: "Download Unlocked PDF",
      ResultProcessAgainText: "Unlock Another PDF",
    }
  }[mode];

  if (result) {
    return (
      <div className="text-center flex flex-col items-center justify-center py-12 animate-in fade-in duration-500 bg-white dark:bg-card p-4 sm:p-8 rounded-xl shadow-lg border">
        <CheckCircle className="w-16 h-16 sm:w-20 sm:h-20 text-green-500 mb-6" />
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">{config.ResultTitle}</h2>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4">
          <a href={result.url} download={result.filename}>
            <Button size="lg" className="w-full sm:w-auto text-base font-bold bg-green-600 hover:bg-green-700 text-white">
              <Download className="mr-2 h-5 w-5" /> {config.ResultDownloadText}
            </Button>
          </a>
          <Button size="lg" variant="outline" onClick={handleProcessAgain}>{config.ResultProcessAgainText}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-card shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">{config.title}</CardTitle>
          <CardDescription>{config.description}</CardDescription>
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
              <Button type="button" onClick={open} className="mt-4" disabled={isProcessing}><FolderOpen className="mr-2 h-4 w-4" />Choose File</Button>
            </div>
          ) : (
            <div className={cn("p-2 sm:p-3 rounded-lg border bg-card/50 shadow-sm flex items-center justify-between")}>
              <div className="flex items-center gap-3 overflow-hidden">
                <FileIcon className="w-6 h-6 text-destructive sm:w-8 sm:h-8 shrink-0" />
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-medium truncate" title={file.name}>{file.name}</span>
                  <span className="text-xs text-muted-foreground">{formatBytes(file.size)}</span>
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
        <Card className="bg-white dark:bg-card shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Set Password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password-input">{config.passwordLabel}</Label>
              <div className="relative">
                <Input
                  id="password-input"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if(error) setError(null);
                  }}
                  type={showPassword ? 'text' : 'password'}
                  className={cn("pr-10", error && "border-destructive")}
                  disabled={isProcessing}
                  placeholder={config.passwordPlaceholder}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowPassword(p => !p)}
                  disabled={isProcessing}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              {error && (
                 <p className="text-sm text-destructive mt-2 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> {error}</p>
              )}
            </div>

            <Button size="lg" className="w-full text-base font-bold" onClick={handleProcess} disabled={isProcessing || !password || !file}>
              {isProcessing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <config.Icon className="mr-2 h-5 w-5" />}
              {isProcessing ? config.buttonProcessingText : config.buttonText}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
