
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
  Ban,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import { Progress } from "./ui/progress";

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

type Position = "bottom-left" | "bottom-center" | "bottom-right" | "top-left" | "top-center" | "top-right";
type Font = "Helvetica" | "TimesRoman" | "Courier";

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}


export function PageNumberAdder() {
  const [file, setFile] = useState<PDFFile | null>(null);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  // Options
  const [position, setPosition] = useState<Position>("bottom-center");
  const [margin, setMargin] = useState(36);
  const [fontSize, setFontSize] = useState(12);
  const [font, setFont] = useState<Font>("Helvetica");
  const [format, setFormat] = useState("page {p} of {n}");

  const operationId = useRef<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      operationId.current++;
      if (result) {
        URL.revokeObjectURL(result.url);
      }
    };
  }, [result]);


  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
      if (rejectedFiles.length > 0) {
        toast({ variant: "destructive", title: "Invalid file", description: "The file was not a PDF or exceeded size limits." });
        return;
      }
      
      const singleFile = acceptedFiles[0];
      setFile({ id: `${singleFile.name}-${Date.now()}`, file: singleFile });
      setResult(null);
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
  };

  const handleProcess = async () => {
    if (!file) {
      toast({ variant: "destructive", title: "No file selected", description: "Please upload a PDF file." });
      return;
    }

    const currentOperationId = ++operationId.current;
    setIsProcessing(true);
    setProgress(0);
    setResult(null);

    try {
      const pdfBytes = await file.file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      const totalPages = pdfDoc.getPageCount();
      
      const fontMap = {
        Helvetica: StandardFonts.Helvetica,
        TimesRoman: StandardFonts.TimesRoman,
        Courier: StandardFonts.Courier,
      }
      const embeddedFont = await pdfDoc.embedFont(fontMap[font]);
      
      const pages = pdfDoc.getPages();
      for (let i = 0; i < totalPages; i++) {
        if (operationId.current !== currentOperationId) return;

        const page = pages[i];
        const { width, height } = page.getSize();
        const text = format.replace('{p}', String(i + 1)).replace('{n}', String(totalPages));
        const textWidth = embeddedFont.widthOfTextAtSize(text, fontSize);
        
        let x = 0;
        let y = 0;
        
        const posParts = position.split('-'); // e.g., ["bottom", "center"]
        
        // Y coordinate
        if(posParts[0] === 'top') {
            y = height - margin;
        } else { // bottom
            y = margin;
        }

        // X coordinate
        if(posParts[1] === 'left') {
            x = margin;
        } else if (posParts[1] === 'center') {
            x = width / 2 - textWidth / 2;
        } else { // right
            x = width - margin - textWidth;
        }

        page.drawText(text, {
          x,
          y,
          size: fontSize,
          font: embeddedFont,
          color: rgb(0, 0, 0),
        });
        
        setProgress(Math.round(((i + 1) / totalPages) * 100));
      }

      if (operationId.current !== currentOperationId) return;

      const newPdfBytes = await pdfDoc.save();
      const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      if (operationId.current !== currentOperationId) {
        URL.revokeObjectURL(url);
        return;
      }
      
      const originalName = file.file.name.replace(/\.pdf$/i, '');
      setResult({
        url,
        filename: `${originalName}_numbered.pdf`,
      });
      
      toast({
        title: "Processing Complete!",
        description: "Page numbers have been added to your PDF.",
        action: <div className="p-1 rounded-full bg-green-500"><CheckCircle className="w-5 h-5 text-white" /></div>
      });

    } catch (error: any) {
      if (operationId.current === currentOperationId) {
        console.error("Processing failed:", error);
        toast({
          variant: "destructive",
          title: "Processing Failed",
          description: error.message || "An unexpected error occurred.",
        });
      }
    } finally {
        if (operationId.current === currentOperationId) {
           setIsProcessing(false);
        }
    }
  };

  const handleCancel = () => {
    operationId.current++;
    setIsProcessing(false);
    setProgress(0);
    toast({ title: "Processing cancelled." });
  };
  
  const handleProcessAgain = () => {
    if (result) {
      URL.revokeObjectURL(result.url);
    }
    setFile(null);
    setResult(null);
  };

  if (result) {
    return (
      <div className="text-center flex flex-col items-center justify-center py-12 animate-in fade-in duration-500 bg-white dark:bg-card p-4 sm:p-8 rounded-xl shadow-lg border">
        <CheckCircle className="w-16 h-16 sm:w-20 sm:h-20 text-green-500 mb-6" />
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">PDF Updated Successfully!</h2>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4">
          <a href={result.url} download={result.filename}>
            <Button size="lg" className="w-full sm:w-auto text-base font-bold bg-green-600 hover:bg-green-700 text-white">
              <Download className="mr-2 h-5 w-5" />
              Download PDF
            </Button>
          </a>
          <Button size="lg" variant="outline" onClick={handleProcessAgain} className="w-full sm:w-auto text-base">
            Add Numbers to Another PDF
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-card shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Upload PDF</CardTitle>
          <CardDescription>
            Select a single PDF file to add page numbers to.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!file ? (
            <div
              {...getRootProps()}
              className={cn(
                "flex flex-col items-center justify-center p-6 sm:p-10 rounded-lg border-2 border-dashed transition-colors duration-300",
                !isProcessing && "hover:border-primary/50",
                isDragActive && "border-primary bg-primary/10",
                isProcessing && "opacity-70 pointer-events-none"
              )}
            >
              <input {...getInputProps()} />
              <UploadCloud className="w-10 h-10 text-muted-foreground sm:w-12 sm:h-12" />
              <p className="mt-2 text-base font-semibold text-foreground sm:text-lg">
                Drop a PDF file here
              </p>
              <p className="text-xs text-muted-foreground sm:text-sm">or click the button below</p>
              <Button type="button" onClick={open} className="mt-4" disabled={isProcessing}>
                <FolderOpen className="mr-2 h-4 w-4" />
                Choose File
              </Button>
              <p className="w-full px-2 text-center text-xs text-muted-foreground mt-6">
                Max file size: {MAX_FILE_SIZE_MB}MB
              </p>
            </div>
          ) : (
            <div className={cn("p-2 sm:p-3 rounded-lg border bg-card/50 shadow-sm flex items-center justify-between", isProcessing && "opacity-70 pointer-events-none")}>
              <div className="flex items-center gap-3 overflow-hidden">
                <FileIcon className="w-6 h-6 text-destructive sm:w-8 sm:h-8 shrink-0" />
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-medium truncate" title={file.file.name}>{file.file.name}</span>
                  <span className="text-xs text-muted-foreground">{formatBytes(file.file.size)}</span>
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
            <CardTitle className="text-xl sm:text-2xl">Numbering Options</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn("space-y-6", isProcessing && "opacity-70 pointer-events-none")}>
                <div>
                    <Label className="font-semibold">Position</Label>
                    <RadioGroup 
                        value={position} 
                        onValueChange={(v) => setPosition(v as Position)}
                        className="mt-2 grid grid-cols-3 gap-2"
                        disabled={isProcessing}
                    >
                        <Label className="flex items-center justify-center p-4 border rounded-lg cursor-pointer hover:border-primary/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors text-xs">
                            <RadioGroupItem value="top-left" className="sr-only"/>Top Left
                        </Label>
                        <Label className="flex items-center justify-center p-4 border rounded-lg cursor-pointer hover:border-primary/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors text-xs">
                            <RadioGroupItem value="top-center" className="sr-only"/>Top Center
                        </Label>
                        <Label className="flex items-center justify-center p-4 border rounded-lg cursor-pointer hover:border-primary/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors text-xs">
                            <RadioGroupItem value="top-right" className="sr-only"/>Top Right
                        </Label>
                        <Label className="flex items-center justify-center p-4 border rounded-lg cursor-pointer hover:border-primary/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors text-xs">
                            <RadioGroupItem value="bottom-left" className="sr-only"/>Bottom Left
                        </Label>
                        <Label className="flex items-center justify-center p-4 border rounded-lg cursor-pointer hover:border-primary/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors text-xs">
                            <RadioGroupItem value="bottom-center" className="sr-only"/>Bottom Center
                        </Label>
                        <Label className="flex items-center justify-center p-4 border rounded-lg cursor-pointer hover:border-primary/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors text-xs">
                            <RadioGroupItem value="bottom-right" className="sr-only"/>Bottom Right
                        </Label>
                    </RadioGroup>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="margin" className="font-semibold">Margin (points)</Label>
                        <Input id="margin" type="number" value={margin} onChange={e => setMargin(Number(e.target.value))} className="mt-2" disabled={isProcessing}/>
                    </div>
                     <div>
                        <Label htmlFor="font-size" className="font-semibold">Font Size (points)</Label>
                        <Input id="font-size" type="number" value={fontSize} onChange={e => setFontSize(Number(e.target.value))} className="mt-2" disabled={isProcessing}/>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="format" className="font-semibold">Format</Label>
                        <Input id="format" type="text" value={format} onChange={e => setFormat(e.target.value)} className="mt-2" disabled={isProcessing}/>
                        <p className="text-xs text-muted-foreground mt-1.5">Use {"{p}"} for page and {"{n}"} for total pages.</p>
                    </div>
                    <div>
                        <Label htmlFor="font" className="font-semibold">Font</Label>
                        <Select value={font} onValueChange={v => setFont(v as Font)} disabled={isProcessing}>
                            <SelectTrigger className="mt-2">
                                <SelectValue placeholder="Select a font" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Helvetica">Helvetica</SelectItem>
                                <SelectItem value="TimesRoman">Times New Roman</SelectItem>
                                <SelectItem value="Courier">Courier</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <div className="mt-8">
              {isProcessing ? (
                <div className="p-4 border rounded-lg bg-primary/5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      <p className="text-sm font-medium text-primary transition-all duration-300">Adding page numbers...</p>
                    </div>
                    <p className="text-sm font-medium text-primary">{Math.round(progress)}%</p>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="mt-4">
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={handleCancel} 
                        className="w-full"
                      >
                        <Ban className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                  </div>
                </div>
              ) : (
                <Button size="lg" className="w-full text-base font-bold" onClick={handleProcess} disabled={!file || isProcessing}>
                  <Hash className="mr-2 h-5 w-5" />
                  Add Page Numbers
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
