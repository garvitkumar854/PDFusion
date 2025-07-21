
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
  FileArchive,
  ArrowRight,
  Ban,
  ShieldAlert,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { PDFDocument, PDFImage, PDFName } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

const MAX_FILE_SIZE_MB = 100;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

type PDFFile = {
  id: string;
  file: File;
  isEncrypted: boolean;
};

type CompressionResult = {
  url: string;
  originalSize: number;
  compressedSize: number;
  filename: string;
};

type CompressionLevel = "low" | "recommended" | "extreme";
type CompressionStatus = "idle" | "compressing" | "done" | "error";

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const getImageQuality = (level: CompressionLevel): number => {
    switch (level) {
        case 'low': return 0.75;
        case 'recommended': return 0.5;
        case 'extreme': return 0.25;
        default: return 0.5;
    }
}

export function PdfCompressor() {
  const [file, setFile] = useState<PDFFile | null>(null);
  const [compressionResult, setCompressionResult] = useState<CompressionResult | null>(null);
  const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>("recommended");
  
  const [status, setStatus] = useState<CompressionStatus>("idle");
  const [progress, setProgress] = useState(0);

  const operationId = useRef<number>(0);
  const { toast } = useToast();
  
  const isCompressing = status === 'compressing';

  useEffect(() => {
    return () => {
      operationId.current++;
      if (compressionResult) {
        URL.revokeObjectURL(compressionResult.url);
      }
    };
  }, [compressionResult]);


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
          await pdfjsLib.getDocument({data: new Uint8Array(pdfBytes)}).promise;
      } catch (e: any) {
          if (e.name === 'PasswordException') {
              isEncrypted = true;
          } else {
              toast({ variant: 'destructive', title: 'Invalid PDF', description: 'This file may be corrupted or not a valid PDF.'});
              return;
          }
      }

      setFile({ id: `${singleFile.name}-${Date.now()}`, file: singleFile, isEncrypted });
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
    if (file.isEncrypted) {
      toast({ variant: "destructive", title: "Encrypted PDF", description: "Password-protected PDFs cannot be compressed at this time." });
      return;
    }

    const currentOperationId = ++operationId.current;
    setStatus('compressing');
    setProgress(0);
    setCompressionResult(null);

    try {
        const pdfBytes = await file.file.arrayBuffer();
        const originalSize = pdfBytes.length;
        const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
        
        const imageQuality = getImageQuality(compressionLevel);
        let imagesProcessed = 0;
        const totalPages = pdfDoc.getPageCount();

        for(let i = 0; i < totalPages; i++) {
            if (operationId.current !== currentOperationId) return;
            const page = pdfDoc.getPage(i);
            const resources = page.node.Resources();
            if (!resources) continue;

            const xobjects = resources.get(PDFName.of('XObject'));
            if (!xobjects || !('asDict' in xobjects)) continue;
            
            const xobjectDict = xobjects.asDict();
            const imageNames = xobjectDict.keys();

            for (const imageName of imageNames) {
                const imageStream = xobjectDict.get(imageName);
                // Check if it's an image and has a stream-like structure
                if (!imageStream || !('asStream' in imageStream) || imageStream.asStream().get(PDFName.of('Subtype'))?.toString() !== '/Image') {
                    continue;
                }
                
                try {
                    const image = await pdfDoc.embedJpg(imageStream.asStream().getContents());
                    const compressedImage = await pdfDoc.embedJpg(await image.asJpg({ quality: imageQuality }));
                    xobjectDict.set(imageName, compressedImage.ref);
                    imagesProcessed++;
                } catch (e) {
                    console.warn(`Could not process an image resource (${imageName.toString()}). It may be in an unsupported format. Skipping.`, e);
                }
            }
            setProgress(Math.round(((i + 1) / totalPages) * 100));
        }

        if (operationId.current !== currentOperationId) return;

        let compressedPdfBytes: Uint8Array;
        if (imagesProcessed > 0) {
            compressedPdfBytes = await pdfDoc.save({ useObjectStreams: true });
        } else {
            compressedPdfBytes = pdfBytes;
        }

        const compressedSize = compressedPdfBytes.length;
        
        if (compressedSize >= originalSize) {
             toast({
                title: "Already Optimized!",
                description: "This PDF is already well-optimized. No further compression was possible.",
             });
             setFile(null);
             setStatus('idle');
             return;
        }
        
        const blob = new Blob([compressedPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        const originalName = file.file.name.replace(/\.pdf$/i, '');
        setCompressionResult({
            url,
            originalSize: originalSize,
            compressedSize: compressedSize,
            filename: `${originalName}_compressed.pdf`,
        });
        setStatus('done');
        toast({ title: "Compression Successful!" });

    } catch (error: any) {
      if (operationId.current === currentOperationId) {
        setStatus('error');
        console.error("Compression failed:", error);
        toast({
          variant: "destructive",
          title: "Compression Failed",
          description: error.message || "An unexpected error occurred.",
        });
        setProgress(0);
      }
    }
  };

  const handleCancelCompress = () => {
    operationId.current++; // Invalidate the current operation
    setStatus('idle');
    setProgress(0);
    toast({ title: "Compression cancelled." });
  };
  
  const handleCompressAgain = () => {
    if (compressionResult) {
      URL.revokeObjectURL(compressionResult.url);
    }
    setFile(null);
    setCompressionResult(null);
    setStatus('idle');
  };

  if (status === 'done' && compressionResult) {
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

  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-card shadow-lg">
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
                isDragActive && "border-primary bg-primary/10",
                isCompressing && "opacity-70 pointer-events-none"
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
            <div className={cn("p-2 sm:p-3 rounded-lg border bg-card/50 shadow-sm flex items-center justify-between", isCompressing && "opacity-70 pointer-events-none")}>
              <div className="flex items-center gap-3 overflow-hidden">
                {file.isEncrypted ? <Lock className="w-6 h-6 text-yellow-500 sm:w-8 sm:h-8 shrink-0" /> : <FileIcon className="w-6 h-6 text-destructive sm:w-8 sm:h-8 shrink-0" />}
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
          <CardContent>
             {file.isEncrypted && (
              <div className="mb-4 flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                <ShieldAlert className="h-5 w-5 shrink-0" />
                <p>Password-protected PDFs cannot be compressed at this time.</p>
              </div>
            )}
            <div className={cn((isCompressing || file.isEncrypted) && "opacity-70 pointer-events-none")}>
              <RadioGroup 
                value={compressionLevel} 
                onValueChange={(v) => setCompressionLevel(v as CompressionLevel)} 
                className="space-y-4"
                disabled={isCompressing || file.isEncrypted}
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
            </div>

            <div className="mt-8">
              {isCompressing ? (
                <div className="p-4 border rounded-lg bg-primary/5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      <p className="text-sm font-medium text-primary transition-all duration-300">Compressing...</p>
                    </div>
                    <p className="text-sm font-medium text-primary">{Math.round(progress)}%</p>
                  </div>
                  <Progress value={progress} className="h-2 transition-all duration-500 ease-out" />
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={handleCancelCompress} 
                    className="w-full mt-4"
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button size="lg" className="w-full text-base font-bold" onClick={handleCompress} disabled={!file || isCompressing || file.isEncrypted}>
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
