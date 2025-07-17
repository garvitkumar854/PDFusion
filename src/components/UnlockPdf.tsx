
"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
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
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { unlockPdf } from "@/ai/flows/unlock-pdf-flow";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

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

export function UnlockPdf() {
  const [file, setFile] = useState<PDFFile | null>(null);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();
  
  useEffect(() => {
    return () => {
      if(result?.url) {
        URL.revokeObjectURL(result.url);
      }
    }
  }, [result]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const singleFile = acceptedFiles[0];
    if (singleFile) {
      setFile({ id: `${singleFile.name}-${Date.now()}`, file: singleFile });
      setResult(null);
      setError(null);
      setPassword("");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxSize: MAX_FILE_SIZE_BYTES,
    multiple: false,
    noClick: true,
    noKeyboard: true,
  });
  
  const handleProcessAgain = () => {
    if (result) URL.revokeObjectURL(result.url);
    setFile(null);
    setResult(null);
    setError(null);
    setPassword("");
  };

  const handleUnlock = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
        const pdfDataUri = await fileToDataUri(file.file);
        const response = await unlockPdf({ pdfDataUri, password });

        const blob = await fetch(response.unlockedPdfDataUri).then(res => res.blob());
        const url = URL.createObjectURL(blob);
        
        const originalName = file.file.name.replace(/\.pdf$/i, '');
        setResult({ url, filename: `${originalName}_unlocked.pdf` });

        if (response.wasEncrypted) {
            toast({ title: "PDF Unlocked Successfully!" });
        } else {
            toast({ title: "PDF was not encrypted", description: "The original file is available for download." });
        }

    } catch(e: any) {
        setError(e.message || "An unexpected error occurred.");
    } finally {
        setIsProcessing(false);
    }
  }

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
          <div
            {...getRootProps()}
            className={cn("flex flex-col items-center justify-center p-6 sm:p-10 rounded-lg border-2 border-dashed transition-colors duration-300", !isProcessing && "hover:border-primary/50", isDragActive && "border-primary bg-primary/10")}
          >
            <input {...getInputProps()} />
            {file ? (
                <div className="w-full flex flex-col items-center">
                    <FileIcon className="w-12 h-12 text-destructive mb-4" />
                    <p className="font-semibold text-foreground truncate max-w-full" title={file.file.name}>{file.file.name}</p>
                    <p className="text-sm text-muted-foreground">{formatBytes(file.file.size)}</p>
                     <Button variant="ghost" className="mt-4 text-primary hover:text-primary" onClick={(e) => { e.stopPropagation(); handleProcessAgain();}}>Change file</Button>
                </div>
            ) : (
                <>
                    <UploadCloud className="w-10 h-10 text-muted-foreground sm:w-12 sm:h-12" />
                    <p className="mt-2 text-base font-semibold text-foreground sm:text-lg">Drop a PDF file here</p>
                    <p className="text-xs text-muted-foreground sm:text-sm">or click the button below</p>
                    <Button type="button" onClick={open} className="mt-4">
                        <FolderOpen className="mr-2 h-4 w-4" />Choose File
                    </Button>
                </>
            )}
          </div>
        </CardContent>
      </Card>
      
      {file && (
        <Card className="bg-white dark:bg-card shadow-lg animate-in fade-in duration-500">
            <CardHeader>
                <CardTitle>Enter Password</CardTitle>
                <CardDescription>Enter the password to unlock your PDF file.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="password-input">Password</Label>
                        <div className="relative">
                            <Input
                                id="password-input"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value)
                                    if(error) setError(null);
                                }}
                                type={showPassword ? "text" : "password"}
                                className={cn("pr-10", error && "border-destructive focus-visible:ring-destructive")}
                                disabled={isProcessing}
                                placeholder="Enter PDF password"
                            />
                            <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon" 
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                                onClick={() => setShowPassword(p => !p)}
                                tabIndex={-1}
                                disabled={isProcessing}
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                        </div>
                        {error && <p className="text-destructive text-sm flex items-center gap-2"><ShieldAlert className="w-4 h-4"/>{error}</p>}
                    </div>

                    <Button size="lg" className="w-full text-base" onClick={handleUnlock} disabled={isProcessing || !password}>
                        {isProcessing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Lock className="mr-2 h-5 w-5" />}
                        Unlock PDF
                    </Button>
                 </div>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
