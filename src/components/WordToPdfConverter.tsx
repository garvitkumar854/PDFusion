"use client";

import React, { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, File as FileIcon, Download, X, CheckCircle, FileText, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default function WordToPdfConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [convertedPdfUrl, setConvertedPdfUrl] = useState<string | null>(null);
  const [outputFilename, setOutputFilename] = useState("converted_document.pdf");
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      toast({ variant: "destructive", title: "Invalid file", description: "Please upload a valid Word document (.doc, .docx)." });
      return;
    }

    const selectedFile = acceptedFiles[0];
    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      toast({ variant: "destructive", title: "File too large", description: `File size cannot exceed ${MAX_FILE_SIZE_MB}MB.` });
      return;
    }
    
    setFile(selectedFile);
    setOutputFilename(selectedFile.name.replace(/\.(docx|doc)$/, ".pdf"));
    setConvertedPdfUrl(null);

  }, [toast]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"], "application/msword": [".doc"] },
    multiple: false,
    noClick: true,
    noKeyboard: true,
  });

  const removeFile = () => {
    setFile(null);
    setConvertedPdfUrl(null);
  };
  
  const handleConvert = async () => {
    if (!file) {
      toast({ variant: "destructive", title: "No file selected", description: "Please upload a Word document to convert." });
      return;
    }

    setIsConverting(true);
    setConversionProgress(0);
    setConvertedPdfUrl(null);

    // Simulate conversion progress
    const progressInterval = setInterval(() => {
      setConversionProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    try {
        const fileBuffer = await file.arrayBuffer();
        const { default: docx_pdf } = await import('docx-pdf');

        docx_pdf(fileBuffer, {}, (err: Error, result: Buffer) => {
            clearInterval(progressInterval);
            if (err) {
                console.error("Conversion failed:", err);
                toast({ variant: "destructive", title: "Conversion Failed", description: "An error occurred during conversion." });
                setIsConverting(false);
                return;
            }
            
            if (result) {
                const blob = new Blob([result], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                setConvertedPdfUrl(url);
                setConversionProgress(100);
                toast({
                  title: "Conversion Successful!",
                  description: "Your PDF is ready for download.",
                  action: <div className="p-1 rounded-full bg-green-500"><CheckCircle className="w-5 h-5 text-white" /></div>
                });
            } else {
                 toast({ variant: "destructive", title: "Conversion Failed", description: "No PDF data was returned." });
            }
            setIsConverting(false);
        });

    } catch (error) {
      clearInterval(progressInterval);
      console.error("Conversion failed:", error);
      toast({ variant: "destructive", title: "Conversion Failed", description: "An unexpected error occurred." });
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (!convertedPdfUrl) return;
    const link = document.createElement("a");
    link.href = convertedPdfUrl;
    link.download = outputFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    if (convertedPdfUrl) {
      URL.revokeObjectURL(convertedPdfUrl);
    }
    setFile(null);
    setConvertedPdfUrl(null);
    setIsConverting(false);
    setConversionProgress(0);
  };


  if (convertedPdfUrl) {
    return (
        <div className="text-center flex flex-col items-center justify-center py-12 animate-in fade-in duration-500 bg-white dark:bg-card p-6 sm:p-8 rounded-xl shadow-lg border">
            <CheckCircle className="w-16 h-16 sm:w-20 sm:h-20 text-green-500 mb-6" />
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Conversion Successful!</h2>
            <p className="text-muted-foreground mb-8 text-sm sm:text-base">Your new PDF is ready to be downloaded.</p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Button size="lg" onClick={handleDownload} className="w-full sm:w-auto text-base font-bold bg-green-500 hover:bg-green-600">
                    <Download className="mr-2 h-5 w-5" />
                    Download PDF
                </Button>
                <Button size="lg" variant="outline" onClick={handleReset} className="w-full sm:w-auto text-base">
                    <RefreshCw className="mr-2 h-5 w-5" />
                    Convert Another
                </Button>
            </div>
        </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-card shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Upload Word Document</CardTitle>
          <CardDescription>Drag & drop a .doc or .docx file to get started.</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={cn(
              "flex flex-col items-center justify-center p-6 sm:p-10 rounded-lg border-2 border-dashed transition-colors duration-300",
              "hover:border-primary/50",
              isDragActive && "border-primary bg-primary/10"
            )}
          >
            <input {...getInputProps()} />
            <UploadCloud className="w-10 h-10 text-muted-foreground sm:w-12 sm:h-12" />
            <p className="mt-2 text-base font-semibold text-foreground sm:text-lg">
              Drop your Word file here
            </p>
            <p className="text-xs text-muted-foreground sm:text-sm">or</p>
            <Button type="button" onClick={open} className="mt-2">
              Choose File
            </Button>
            <p className="mt-4 text-xs text-muted-foreground">Max file size: {MAX_FILE_SIZE_MB}MB</p>
          </div>
        </CardContent>
      </Card>

      {file && (
        <Card className="bg-white dark:bg-card shadow-lg animate-in fade-in duration-300">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">File Ready for Conversion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
              <div className="flex items-center gap-3 overflow-hidden">
                <FileText className="w-8 h-8 text-blue-500 shrink-0" />
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-medium truncate" title={file.name}>
                    {file.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatBytes(file.size)}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 text-muted-foreground/70 hover:bg-destructive/10 hover:text-destructive"
                onClick={removeFile}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              {isConverting ? (
                <div className="p-4 border rounded-lg bg-primary/5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      <p className="text-sm font-medium text-primary">Converting...</p>
                    </div>
                    <p className="text-sm font-medium text-primary">{Math.round(conversionProgress)}%</p>
                  </div>
                  <Progress value={conversionProgress} className="h-2" />
                </div>
              ) : (
                <Button size="lg" className="w-full text-base font-bold" onClick={handleConvert} disabled={isConverting}>
                  <RefreshCw className="mr-2 h-5 w-5" />
                  Convert to PDF
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
