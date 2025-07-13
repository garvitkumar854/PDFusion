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
  Loader2,
  FileArchive,
  ArrowRight,
  Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { compressPdf, CompressPdfInput } from "@/ai/flows/compress-pdf-flow";

const MAX_FILE_SIZE_MB = 100;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

type PDFFile = {
  id: string;
  file: File;
};

type CompressionResult = {
  url: string;
  originalSize: number;
  compressedSize: number;
  filename: string;
};

type CompressionLevel = "low" | "recommended" | "extreme";
type CompressionStatus = "idle" | "uploading" | "compressing" | "done" | "error";

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

export function PdfCompressor() {
  const [file, setFile] = useState<PDFFile | null>(null);
  const [compressionResult, setCompressionResult] = useState<CompressionResult | null>(null);
  const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>("recommended");
  
  const [status, setStatus] = useState<CompressionStatus>("idle");
  const [progress, setProgress] = useState(0);

  const { toast } = useToast();
  
  const isCompressing = status === 'uploading' || status === 'compressing';

  useEffect(() => {
    let targetProgress = 0;
    if (status === 'uploading') targetProgress = 50;
    else if (status === 'compressing') targetProgress = 90;
    else if (status === 'done' || status === 'error') targetProgress = 100;
    else targetProgress = 0;
    setProgress(targetProgress);
  }, [status]);


  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      if (rejectedFiles.length > 0) {
        toast({ variant: "destructive", title: "Invalid file", description: "The file was not a PDF or exceeded size limits." });
        return;
      }
      
      const singleFile = acceptedFiles[0];
      setFile({ id: `${singleFile.name}-${Date.now()}`, file: singleFile });
      setCompressionResult(null);
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
    disabled: isCompressing,
  });

  const removeFile = () => {
    setFile(null);
    setStatus("idle");
  };

  const handleCompress = async () => {
    if (!file) {
      toast({ variant: "destructive", title: "No file selected", description: "Please upload a PDF file to compress." });
      return;
    }

    setStatus('uploading');
    setCompressionResult(null);

    try {
      const pdfDataUri = await fileToDataUri(file.file);
      
      setStatus('compressing');
      
      const input: CompressPdfInput = { pdfDataUri, compressionLevel };
      const result = await compressPdf(input);
      
      const blob = await fetch(result.compressedPdfDataUri).then(res => res.blob());
      const url = URL.createObjectURL(blob);
      
      const originalName = file.file.name.replace(/\.pdf$/i, '');
      setCompressionResult({
        url,
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
        filename: `${originalName}_compressed.pdf`,
      });
      setStatus('done');
      
      toast({
        title: "Compression Successful!",
        description: "Your PDF is ready for download.",
        action: <div className="p-1 rounded-full bg-green-500"><CheckCircle className="w-5 h-5 text-white" /></div>
      });

    } catch (error: any) {
      setStatus('error');
      console.error("Compression failed:", error);
      toast({
        variant: "destructive",
        title: "Compression Failed",
        description: error.message || "An unexpected error occurred during compression.",
      });
      setProgress(0);
    }
  };

  const handleCancelCompress = () => {
    setStatus('idle');
    setProgress(0);
    // Note: This doesn't abort the backend request, just resets the UI.
  };
  
  const handleCompressAgain = () => {
    if (compressionResult) {
      URL.revokeObjectURL(compressionResult.url);
    }
    setFile(null);
    setCompressionResult(null);
    setStatus('idle');
  };

  if (compressionResult) {
    const { url, originalSize, compressedSize, filename } = compressionResult;
    const reduction = originalSize > 0 ? ((originalSize - compressedSize) / originalSize) * 100 : 0;
    
    return (
      <div className="text-center flex flex-col items-center justify-center py-12 animate-in fade-in duration-500 bg-white dark:bg-card p-4 sm:p-8 rounded-xl shadow-lg border">
        <CheckCircle className="w-16 h-16 sm:w-20 sm:h-20 text-green-500 mb-6" />
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">PDF Compressed Successfully!</h2>
        
        <div className="flex items-center justify-center my-6 gap-4 text-base sm:text-lg">
          <div className="text-center">
            <p className="font-semibold text-foreground">{formatBytes(originalSize)}</p>
            <p className="text-xs text-muted-foreground">Original</p>
          </div>
          <ArrowRight className="w-6 h-6 text-primary shrink-0" />
          <div className="text-center">
            <p className="font-semibold text-foreground">{formatBytes(compressedSize)}</p>
            <p className="text-xs text-muted-foreground">Compressed</p>
          </div>
        </div>
        <p className="text-muted-foreground mb-8 text-sm sm:text-base">
          File size reduced by <span className="font-bold text-primary">{reduction.toFixed(1)}%</span>.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4">
          <a href={url} download={filename}>
            <Button size="lg" className="w-full sm:w-auto text-base font-bold bg-green-600 hover:bg-green-700 text-white">
              <Download className="mr-2 h-5 w-5" />
              Download PDF
            </Button>
          </a>
          <Button size="lg" variant="outline" onClick={handleCompressAgain} className="w-full sm:w-auto text-base">
            Compress Another PDF
          </Button>
        </div>
      </div>
    );
  }

  const getProgressLabel = () => {
    switch(status) {
        case "uploading": return "Uploading to server...";
        case "compressing": return "Compressing PDF...";
        case "done": return "Done!";
        case "error": return "An error occurred.";
        default: return "";
    }
  }

  return (
    <div className="space-y-6">
      <Card className={cn("bg-white dark:bg-card shadow-lg", isCompressing && "opacity-70 pointer-events-none")}>
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Upload PDF to Compress</CardTitle>
          <CardDescription>
            Select a single PDF file to start the compression process.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!file ? (
            <div
              {...getRootProps()}
              className={cn(
                "flex flex-col items-center justify-center p-6 sm:p-10 rounded-lg border-2 border-dashed transition-colors duration-300",
                !isCompressing && "hover:border-primary/50",
                isDragActive && "border-primary bg-primary/10"
              )}
            >
              <input {...getInputProps()} />
              <UploadCloud className="w-10 h-10 text-muted-foreground sm:w-12 sm:h-12" />
              <p className="mt-2 text-base font-semibold text-foreground sm:text-lg">
                Drop a PDF file here
              </p>
              <p className="text-xs text-muted-foreground sm:text-sm">or click the button below</p>
              <Button type="button" onClick={open} className="mt-4" disabled={isCompressing}>
                <FolderOpen className="mr-2 h-4 w-4" />
                Choose File
              </Button>
              <p className="w-full px-2 text-center text-xs text-muted-foreground mt-6">
                Max file size: {MAX_FILE_SIZE_MB}MB
              </p>
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
              <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground/70 hover:bg-destructive/10 hover:text-destructive shrink-0" onClick={removeFile} disabled={isCompressing}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {file && (
        <Card className="bg-white dark:bg-card shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Compression Options</CardTitle>
          </CardHeader>
          <CardContent className={cn(isCompressing && "opacity-70 pointer-events-none")}>
            <RadioGroup 
              value={compressionLevel} 
              onValueChange={(v) => setCompressionLevel(v as CompressionLevel)} 
              className="space-y-4"
              disabled={isCompressing}
            >
              <Label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:border-primary/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors">
                <RadioGroupItem value="low" id="c-low" />
                <div>
                  <div className="font-semibold">Less Compression</div>
                  <p className="text-sm text-muted-foreground">Good quality, lower compression.</p>
                </div>
              </Label>
              <Label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:border-primary/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors">
                <RadioGroupItem value="recommended" id="c-recommended" />
                <div>
                  <div className="font-semibold">Recommended</div>
                  <p className="text-sm text-muted-foreground">Good compression and good quality.</p>
                </div>
              </Label>
              <Label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:border-primary/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors">
                <RadioGroupItem value="extreme" id="c-extreme" />
                <div>
                  <div className="font-semibold">Extreme Compression</div>
                  <p className="text-sm text-muted-foreground">Lowest file size, lower quality.</p>
                </div>
              </Label>
            </RadioGroup>

            <div className="mt-8">
              {isCompressing ? (
                <div className="p-4 border rounded-lg bg-primary/5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      <p className="text-sm font-medium text-primary transition-all duration-300">{getProgressLabel()}</p>
                    </div>
                    <p className="text-sm font-medium text-primary">{Math.round(progress)}%</p>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <Button size="sm" variant="ghost" onClick={handleCancelCompress} className="w-full mt-4 text-muted-foreground">
                    <Ban className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button size="lg" className="w-full text-base font-bold" onClick={handleCompress} disabled={!file || isCompressing}>
                  <FileArchive className="mr-2 h-5 w-5" />
                  Compress PDF
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
