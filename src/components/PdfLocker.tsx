
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

const MAX_FILE_SIZE_MB = 100;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const API_URL = process.env.NEXT_PUBLIC_PDF_API_URL || 'http://localhost:5000';

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function PdfLocker() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultFilename, setResultFilename] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();
  const operationId = useRef<number>(0);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      toast({ variant: "destructive", title: "Invalid file", description: "The file was not a PDF or exceeded size limits." });
      return;
    }
    const singleFile = acceptedFiles[0];
    if (singleFile) {
      setFile(singleFile);
      setResultUrl(null);
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
    if(resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
  };

  const handleLock = async () => {
    if (!file) {
      setError("Please upload a file first.");
      return;
    }
    if (!password) {
      setError("Please enter a password.");
      return;
    }

    const currentOperationId = ++operationId.current;
    setIsProcessing(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('password', password);

    try {
      const response = await fetch(`${API_URL}/lock`, {
        method: 'POST',
        body: formData,
      });

      if (operationId.current !== currentOperationId) return;

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to lock the PDF.");
      }

      const blob = await response.blob();
      const newResultUrl = URL.createObjectURL(blob);
      const originalName = file.name.replace(/\.pdf$/i, '');
      
      setResultUrl(newResultUrl);
      setResultFilename(`${originalName}_locked.pdf`);
      
      toast({
        title: "PDF Locked Successfully!",
        description: "Your protected PDF is ready for download.",
        action: <div className="p-1 rounded-full bg-green-500"><CheckCircle className="w-5 h-5 text-white" /></div>,
      });

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred. Please check the server connection.");
    } finally {
       if (operationId.current === currentOperationId) {
        setIsProcessing(false);
      }
    }
  };

  const handleProcessAgain = () => {
    removeFile();
    setPassword("");
  };

  if (resultUrl) {
    return (
      <div className="text-center flex flex-col items-center justify-center py-12 animate-in fade-in duration-500 bg-white dark:bg-card p-4 sm:p-8 rounded-xl shadow-lg border">
        <CheckCircle className="w-16 h-16 sm:w-20 sm:h-20 text-green-500 mb-6" />
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">PDF Locked!</h2>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4">
          <a href={resultUrl} download={resultFilename}>
            <Button size="lg" className="w-full sm:w-auto text-base font-bold bg-green-600 hover:bg-green-700 text-white">
              <Download className="mr-2 h-5 w-5" /> Download Locked PDF
            </Button>
          </a>
          <Button size="lg" variant="outline" onClick={handleProcessAgain}>Lock Another PDF</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-card shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Upload PDF</CardTitle>
          <CardDescription>Select a PDF file to add password protection.</CardDescription>
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
              <Label htmlFor="password-input">Enter a strong password</Label>
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
                  placeholder="Password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowPassword(p => !p)}
                  disabled={isProcessing}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              {error && (
                 <p className="text-sm text-destructive mt-2 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> {error}</p>
              )}
            </div>

            <Button size="lg" className="w-full text-base font-bold" onClick={handleLock} disabled={isProcessing || !password || !file}>
              {isProcessing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Lock className="mr-2 h-5 w-5" />}
              {isProcessing ? 'Locking...' : 'Lock PDF'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
