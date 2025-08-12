"use client";

import React, { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud,
  File as FileIcon,
  X,
  FolderOpen,
  Loader2,
  Lock,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { motion } from "framer-motion";

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

const MAX_FILE_SIZE_MB = 100;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

type PDFFile = {
  id: string;
  file: File;
  totalPages: number;
  pdfjsDoc?: pdfjsLib.PDFDocumentProxy;
  isEncrypted: boolean;
};

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}


export function PdfEditor() {
  const [file, setFile] = useState<PDFFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { toast } = useToast();
  const operationId = useRef<number>(0);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      const singleFile = acceptedFiles[0];
      
      const currentOperationId = ++operationId.current;
      setIsLoading(true);

      try {
        const pdfBytes = await singleFile.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfBytes) });
        const pdfjsDoc = await loadingTask.promise; 

        if (operationId.current !== currentOperationId) {
          pdfjsDoc.destroy();
          return;
        }
        
        const pageCount = pdfjsDoc.numPages;
        
        setFile({ 
          id: `${singleFile.name}-${Date.now()}`, 
          file: singleFile, 
          totalPages: pageCount,
          pdfjsDoc,
          isEncrypted: false,
        });

      } catch (error: any) {
          if (operationId.current !== currentOperationId) return;
          
          if (error.name === 'PasswordException') {
              setFile({
                  id: `${singleFile.name}-${Date.now()}`,
                  file: singleFile,
                  totalPages: 0,
                  isEncrypted: true,
                  pdfjsDoc: undefined,
              })
          } else {
              console.error("Failed to load PDF", error);
              toast({ variant: "destructive", title: "Could not read PDF", description: "The file might be corrupted or in an unsupported format." });
          }
      } finally {
          if (operationId.current === currentOperationId) {
              setIsLoading(false);
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
    disabled: isLoading,
  });

  const removeFile = () => {
    operationId.current++;
    if(file?.pdfjsDoc) file.pdfjsDoc.destroy();
    setFile(null);
    setIsLoading(false);
  };

  if (!file) {
    return (
        <Card className="bg-transparent shadow-lg max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">Upload PDF</CardTitle>
                <CardDescription>Select a PDF file to start editing.</CardDescription>
            </CardHeader>
            <CardContent>
            <div
                {...getRootProps()}
                className={cn(
                "flex flex-col items-center justify-center p-6 sm:p-10 rounded-lg border-2 border-dashed transition-colors duration-300",
                !isLoading && "hover:border-primary/50",
                isDragActive && "border-primary bg-primary/10",
                isLoading && "opacity-70 pointer-events-none"
                )}
            >
                <input {...getInputProps()} />
                {isLoading ? (
                    <>
                     <Loader2 className="w-10 h-10 text-primary animate-spin sm:w-12 sm:h-12" />
                     <p className="mt-4 text-base font-semibold text-primary sm:text-lg">Loading PDF...</p>
                    </>
                ) : (
                    <>
                        <UploadCloud className="w-10 h-10 text-muted-foreground sm:w-12 sm:h-12" />
                        <p className="mt-2 text-base font-semibold text-foreground sm:text-lg">Drop a PDF file here</p>
                        <p className="text-xs text-muted-foreground sm:text-sm">or click the button below</p>
                        <motion.div whileHover={{ scale: 1.05, y: -2 }} transition={{ type: 'spring', stiffness: 400, damping: 10 }}>
                            <Button type="button" onClick={open} className="mt-4" disabled={isLoading}>
                                <FolderOpen className="mr-2 h-4 w-4" />Choose File
                            </Button>
                        </motion.div>
                    </>
                )}
            </div>
            </CardContent>
        </Card>
    );
  }

  // Editor UI will go here in the next steps
  return (
     <div>
        <Card className="mb-4">
            <CardHeader className="flex flex-row items-center justify-between p-4">
                <div>
                    <CardTitle className="text-lg truncate max-w-md" title={file.file.name}>{file.file.name}</CardTitle>
                    <CardDescription>{formatBytes(file.file.size)} - {file.totalPages} pages</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={removeFile}>
                    <X className="w-5 h-5" />
                </Button>
            </CardHeader>
            {file.isEncrypted && (
                <CardContent className="p-4 pt-0">
                    <div className="flex items-center gap-3 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3 text-sm text-yellow-700 dark:text-yellow-400">
                        <ShieldAlert className="h-5 w-5 shrink-0" />
                        <div>This PDF is password-protected and cannot be edited. Please upload an unlocked file.</div>
                    </div>
                </CardContent>
            )}
        </Card>
        
        {/* Placeholder for the editor interface */}
        {!file.isEncrypted && (
          <div className="text-center p-10 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">PDF Editor interface will be built here.</p>
          </div>
        )}
     </div>
  );
}
