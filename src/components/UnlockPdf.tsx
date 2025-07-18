
"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud,
  File as FileIcon,
  Download,
  X,
  CheckCircle,
  FolderOpen,
  Loader2,
  Ban,
  Unlock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PasswordDialog } from "./PasswordDialog";
import { PDFDocument } from 'pdf-lib';

const MAX_FILE_SIZE_MB = 100;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

type PDFFile = {
  id: string;
  file: File;
};

type UnlockResult = {
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

export function UnlockPdf() {
  const [file, setFile] = useState<PDFFile | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockResult, setUnlockResult] = useState<UnlockResult | null>(null);
  
  const [passwordFile, setPasswordFile] = useState<File | null>(null);
  const [unlockedFile, setUnlockedFile] = useState<File | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (unlockResult?.url) {
        URL.revokeObjectURL(unlockResult.url);
      }
    };
  }, [unlockResult]);
  
  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: any[]) => {
      if (rejectedFiles.length > 0) {
        toast({ variant: "destructive", title: "Invalid file", description: "The file was not a PDF or exceeded size limits." });
      }
      const singleFile = acceptedFiles[0];
      if (singleFile) {
        setFile({ id: `${singleFile.name}-${Date.now()}`, file: singleFile });
        setUnlockResult(null);
        setUnlockedFile(null);
        // Automatically trigger password prompt
        setPasswordFile(singleFile);
      }
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
    disabled: isUnlocking,
  });

  const removeFile = () => {
    setFile(null);
    setUnlockedFile(null);
    setPasswordFile(null);
  };

  const onUnlockSuccess = (unlockedFile: File) => {
    setUnlockedFile(unlockedFile);
    setPasswordFile(null);
    toast({ title: 'File Unlocked!', description: `"${unlockedFile.name}" can now be downloaded.`});
    
    // Create a downloadable link immediately
    const url = URL.createObjectURL(unlockedFile);
    setUnlockResult({
        url,
        filename: unlockedFile.name.replace(/\.pdf$/i, '_unlocked.pdf'),
    });
  };
  
  const handleUnlockMore = () => {
    if (unlockResult?.url) {
      URL.revokeObjectURL(unlockResult.url);
    }
    setFile(null);
    setUnlockedFile(null);
    setUnlockResult(null);
  };

  if (unlockResult) {
    return (
        <div className="text-center flex flex-col items-center justify-center py-12 animate-in fade-in duration-500 bg-white dark:bg-card p-6 sm:p-8 rounded-xl shadow-lg border">
            <CheckCircle className="w-16 h-16 sm:w-20 sm:h-20 text-green-500 mb-6" />
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">PDF Unlocked Successfully!</h2>
            <p className="text-muted-foreground mb-8 text-sm sm:text-base">Your unlocked document is ready for download.</p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <a href={unlockResult.url} download={unlockResult.filename}>
                    <Button size="lg" className="w-full sm:w-auto text-base font-bold bg-green-600 hover:bg-green-700 text-white">
                        <Download className="mr-2 h-5 w-5" />
                        Download PDF
                    </Button>
                </a>
                <Button size="lg" variant="outline" onClick={handleUnlockMore} className="w-full sm:w-auto text-base">
                    Unlock Another PDF
                </Button>
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-6">
        {passwordFile && (
            <PasswordDialog 
                isOpen={!!passwordFile}
                onOpenChange={(isOpen) => !isOpen && setPasswordFile(null)}
                file={passwordFile}
                onUnlockSuccess={onUnlockSuccess}
            />
        )}
        <Card className="bg-white dark:bg-card shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">Unlock PDF</CardTitle>
                <CardDescription>
                  Upload a password-protected PDF to remove its encryption.
                </CardDescription>
            </CardHeader>
            <CardContent>
                { !file ? (
                    <div
                        {...getRootProps()}
                        className={cn(
                        "flex flex-col items-center justify-center p-6 sm:p-10 rounded-lg border-2 border-dashed transition-colors duration-300",
                        !isUnlocking && "hover:border-primary/50",
                        isDragActive && "border-primary bg-primary/10",
                        isUnlocking && "opacity-70 pointer-events-none"
                        )}
                    >
                        <input {...getInputProps()} />
                        <UploadCloud className="w-10 h-10 text-muted-foreground sm:w-12 sm:h-12" />
                        <p className="mt-2 text-base font-semibold text-foreground sm:text-lg">
                            Drop PDF file here
                        </p>
                        <p className="text-xs text-muted-foreground sm:text-sm">or click the button below</p>
                        <Button type="button" onClick={open} className="mt-4" disabled={isUnlocking}>
                            <FolderOpen className="mr-2 h-4 w-4" />
                            Choose File
                        </Button>
                        <p className="w-full px-2 text-center text-xs text-muted-foreground mt-6">Max file size: {MAX_FILE_SIZE_MB}MB</p>
                    </div>
                ) : (
                    <div className="p-2 sm:p-3 rounded-lg border bg-card/50 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <FileIcon className="w-6 h-6 text-destructive sm:w-8 sm:h-8 shrink-0" />
                            <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-medium truncate" title={file.file.name}>
                                {file.file.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {formatBytes(file.file.size)}
                            </span>
                            </div>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="w-8 h-8 text-muted-foreground/70 hover:bg-destructive/10 hover:text-destructive shrink-0" 
                            onClick={removeFile}
                            disabled={isUnlocking}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>

        {file && !unlockedFile && (
             <Card className="bg-white dark:bg-card shadow-lg">
                <CardContent className="p-6 text-center">
                    <Button
                        size="lg"
                        className="w-full text-base font-bold"
                        onClick={() => setPasswordFile(file.file)}
                        disabled={isUnlocking}
                    >
                        <Unlock className="mr-2 h-5 w-5" />
                        Enter Password to Unlock
                    </Button>
                </CardContent>
             </Card>
        )}
    </div>
  );
}

