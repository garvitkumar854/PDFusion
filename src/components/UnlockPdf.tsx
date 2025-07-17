
"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud,
  File as FileIcon,
  Download,
  X,
  CheckCircle,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  
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
      setResult(null);
      setFile({ id: `${singleFile.name}-${Date.now()}`, file: singleFile });
      setIsPasswordDialogOpen(true);
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

  const removeFile = () => {
    setFile(null);
    setResult(null);
    setIsPasswordDialogOpen(false);
  };
    
  const handleProcessAgain = () => {
    if (result) URL.revokeObjectURL(result.url);
    removeFile();
  };

  const onUnlockSuccess = (unlockedUrl: string, wasEncrypted: boolean) => {
    if (!file) return;

    const originalName = file.file.name.replace(/\.pdf$/i, '');
    setResult({ url: unlockedUrl, filename: `${originalName}_unlocked.pdf` });
    setIsPasswordDialogOpen(false);
    
    if (wasEncrypted) {
      toast({ title: "PDF Unlocked Successfully!" });
    } else {
      toast({ title: "PDF is not encrypted", description: "The original file has been provided for download." });
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
          <div
            {...getRootProps()}
            className={cn("flex flex-col items-center justify-center p-6 sm:p-10 rounded-lg border-2 border-dashed transition-colors duration-300 hover:border-primary/50", isDragActive && "border-primary bg-primary/10")}>
            <input {...getInputProps()} />
            {file ? (
                <div className="w-full flex flex-col items-center">
                    <FileIcon className="w-12 h-12 text-destructive mb-4" />
                    <p className="font-semibold text-foreground truncate max-w-full" title={file.file.name}>{file.file.name}</p>
                    <p className="text-sm text-muted-foreground">{formatBytes(file.file.size)}</p>
                    <Button variant="ghost" className="mt-4 text-primary hover:text-primary" onClick={(e) => { e.stopPropagation(); removeFile(); open();}}>Change file</Button>
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
        <PasswordDialog 
          isOpen={isPasswordDialogOpen}
          onClose={() => {
            setIsPasswordDialogOpen(false);
            removeFile();
          }}
          pdfFile={file.file}
          onSuccess={onUnlockSuccess}
        />
      )}
    </div>
  );
}
