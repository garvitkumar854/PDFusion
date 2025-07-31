
"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud,
  Download,
  X,
  CheckCircle,
  FileText,
  FolderOpen,
  Loader2,
  Ban,
  FileArchive,
  Settings,
  GripVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PDFDocument, PageSizes } from 'pdf-lib';
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Checkbox } from "./ui/checkbox";
import JSZip from 'jszip';
import { motion, AnimatePresence } from "framer-motion";

const MAX_FILES = 50;
const MAX_FILE_SIZE_MB = 25;
const MAX_TOTAL_SIZE_MB = 100;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_TOTAL_SIZE_BYTES = MAX_TOTAL_SIZE_MB * 1024 * 1024;

type ImageFile = {
  id: string;
  file: File;
  previewUrl: string;
  width: number;
  height: number;
};

type Orientation = "portrait" | "landscape";
type PageSize = "A4" | "Letter" | "Fit";
type MarginSize = "none" | "small" | "big";

const PAGE_SIZE_MAP: Record<"A4" | "Letter", [number, number]> = {
    A4: PageSizes.A4,
    Letter: PageSizes.Letter,
};

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function JpgToPdfConverter() {
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [totalSize, setTotalSize] = useState(0);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [conversionResults, setConversionResults] = useState<{url: string, filename: string}[]>([]);
  
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [pageSize, setPageSize] = useState<PageSize>("A4");
  const [marginSize, setMarginSize] = useState<MarginSize>("none");
  const [mergeIntoOnePdf, setMergeIntoOnePdf] = useState(true);

  const [removingFileId, setRemovingFileId] = useState<string | null>(null);
  
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  
  const operationId = useRef<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      operationId.current++; 
      files.forEach(f => URL.revokeObjectURL(f.previewUrl));
      conversionResults.forEach(r => URL.revokeObjectURL(r.url));
    };
  }, [files, conversionResults]);
  
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      let currentSize = totalSize;
      const validFiles = acceptedFiles.filter(file => {
        if (file.size > MAX_FILE_SIZE_BYTES) {
          toast({ variant: "destructive", title: "File too large", description: `"${file.name}" exceeds the ${MAX_FILE_SIZE_MB}MB file size limit.` });
          return false;
        }
        if (currentSize + file.size > MAX_TOTAL_SIZE_BYTES) {
          toast({ variant: "destructive", title: "Total size limit exceeded", description: `Adding "${file.name}" would exceed the ${MAX_TOTAL_SIZE_MB}MB total size limit.` });
          return false;
        }
        currentSize += file.size;
        return true;
      });

      const filesToAdd: Promise<ImageFile>[] = validFiles.map((file, index) => 
        new Promise((resolve) => {
          const previewUrl = URL.createObjectURL(file);
          const img = new window.Image();
          img.onload = () => {
            resolve({
              id: `${files.length + index + 1}-${file.name}`,
              file,
              previewUrl,
              width: img.width,
              height: img.height,
            });
          };
          img.src = previewUrl;
        })
      );
      
      Promise.all(filesToAdd).then(newFiles => {
        setFiles(prev => [...prev, ...newFiles]);
        setTotalSize(prev => prev + newFiles.reduce((acc, file) => acc + file.file.size, 0));
      });
    },
    [files.length, totalSize, toast]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"] },
    noClick: true,
    noKeyboard: true,
    disabled: isConverting,
  });

  const removeFile = (fileId: string) => {
    setRemovingFileId(fileId);
    setTimeout(() => {
      setFiles(prev => {
        const fileToRemove = prev.find(f => f.id === fileId);
        if (fileToRemove) {
          URL.revokeObjectURL(fileToRemove.previewUrl);
          setTotalSize(s => s - fileToRemove.file.size);
        }
        return prev.filter(f => f.id !== fileId);
      });
      setRemovingFileId(null);
    }, 300);
  };
  
  const handleClearAll = () => {
    files.forEach(f => URL.revokeObjectURL(f.previewUrl));
    setFiles([]);
    setTotalSize(0);
  };
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    dragItem.current = index;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (dragItem.current === null || dragItem.current === index) return;
    dragOverItem.current = index;
    const filesCopy = [...files];
    const draggedItemContent = filesCopy.splice(dragItem.current, 1)[0];
    filesCopy.splice(index, 0, draggedItemContent);
    dragItem.current = index;
    setFiles(filesCopy);
  };

  const handleDragEnd = () => {
    dragItem.current = null;
    dragOverItem.current = null;
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();
  
  const handleConvert = async () => {
    if (files.length === 0) {
      toast({ variant: "destructive", title: "No files", description: "Please upload at least one image file." });
      return;
    }
    
    const currentOperationId = ++operationId.current;
    
    setIsConverting(true);
    setConversionProgress(0);
    setConversionResults([]);
    
    try {
      const getPageDimensions = (img: ImageFile) => {
        if(pageSize === 'Fit') return {width: img.width, height: img.height};
        let size = PAGE_SIZE_MAP[pageSize];
        return orientation === 'landscape' ? [size[1], size[0]] as [number, number] : size as [number, number];
      }

      const getMargin = (pageWidth: number, pageHeight: number) => {
        if (pageSize === 'Fit' || marginSize === 'none') return 0;
        const shortestSide = Math.min(pageWidth, pageHeight);
        return marginSize === 'small' ? shortestSide * 0.05 : shortestSide * 0.1;
      }
      
      const results: {url: string, filename: string}[] = [];
      const createSinglePdf = mergeIntoOnePdf || files.length === 1;

      if (createSinglePdf) {
          const mergedPdf = await PDFDocument.create();
          for (let i = 0; i < files.length; i++) {
              if (operationId.current !== currentOperationId) return;
              const imageFile = files[i];
              const imageBytes = await imageFile.file.arrayBuffer();
              const image = await (imageFile.file.type === 'image/png' 
                  ? mergedPdf.embedPng(imageBytes) 
                  : mergedPdf.embedJpg(imageBytes));

              const pageDims = getPageDimensions(imageFile);
              const page = mergedPdf.addPage(pageDims);
              const {width: pageWidth, height: pageHeight} = page.getSize();
              const margin = getMargin(pageWidth, pageHeight);
              const usableWidth = pageWidth - margin * 2;
              const usableHeight = pageHeight - margin * 2;
              const scaled = image.scaleToFit(usableWidth, usableHeight);
              page.drawImage(image, {
                  x: margin + (usableWidth - scaled.width) / 2,
                  y: margin + (usableHeight - scaled.height) / 2,
                  width: scaled.width,
                  height: scaled.height,
              });
              setConversionProgress(Math.round(((i + 1) / files.length) * 100));
          }
          const mergedBytes = await mergedPdf.save();
          const blob = new Blob([mergedBytes], { type: 'application/pdf' });
          results.push({ url: URL.createObjectURL(blob), filename: 'converted_document.pdf' });

      } else {
          const zip = new JSZip();
          for (let i = 0; i < files.length; i++) {
              if (operationId.current !== currentOperationId) return;
              const imageFile = files[i];
              const singlePdf = await PDFDocument.create();
              const imageBytes = await imageFile.file.arrayBuffer();
              const image = await (imageFile.file.type === 'image/png' 
                  ? singlePdf.embedPng(imageBytes) 
                  : singlePdf.embedJpg(imageBytes));
              
              const pageDims = getPageDimensions(imageFile);
              const page = singlePdf.addPage(pageDims);
              const {width: pageWidth, height: pageHeight} = page.getSize();
              const margin = getMargin(pageWidth, pageHeight);
              const usableWidth = pageWidth - margin * 2;
              const usableHeight = pageHeight - margin * 2;
              const scaled = image.scaleToFit(usableWidth, usableHeight);
              page.drawImage(image, {
                  x: margin + (usableWidth - scaled.width) / 2,
                  y: margin + (usableHeight - scaled.height) / 2,
                  width: scaled.width,
                  height: scaled.height,
              });

              const pdfBytes = await singlePdf.save();
              const filename = `${imageFile.file.name.replace(/\.[^/.]+$/, "")}.pdf`;
              
              zip.file(filename, pdfBytes);
              setConversionProgress(Math.round(((i + 1) / files.length) * 100));
          }

          const zipBlob = await zip.generateAsync({type:"blob"});
          results.push({ url: URL.createObjectURL(zipBlob), filename: 'converted_images.zip' });
      }
      
      if (operationId.current !== currentOperationId) {
        results.forEach(r => URL.revokeObjectURL(r.url));
        return;
      }
      
      setConversionResults(results);
      toast({
        title: "Conversion Successful!",
        description: "Your PDF is ready to be downloaded.",
        action: <div className="p-1 rounded-full bg-green-500"><CheckCircle className="w-5 h-5 text-white" /></div>
      });
    } catch (error: any) {
      if (operationId.current === currentOperationId) {
        console.error("Conversion failed:", error);
        toast({ variant: "destructive", title: "Conversion Failed", description: error.message || "An unexpected error occurred." });
      }
    } finally {
      if (operationId.current === currentOperationId) {
        setIsConverting(false);
      }
    }
  };
  
  const handleCancel = () => {
    operationId.current++;
    setIsConverting(false);
    setConversionProgress(0);
    toast({ title: "Conversion cancelled." });
  };
  
  const handleConvertMore = () => {
    handleClearAll();
    setConversionResults([]);
  };

  const handleDownload = () => {
      if (conversionResults.length === 0) return;
      const result = conversionResults[0];
      const link = document.createElement("a");
      link.href = result.url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
          document.body.removeChild(link);
      }, 100);
  };

  if (conversionResults.length > 0) {
    return (
        <div className="text-center flex flex-col items-center justify-center py-12 animate-in fade-in duration-500 bg-transparent p-6 sm:p-8 rounded-xl">
            <CheckCircle className="w-16 h-16 sm:w-20 sm:h-20 text-green-500 mb-6" />
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Conversion Successful!</h2>
            <p className="text-muted-foreground mb-8 text-sm sm:text-base">Your new document is ready for download.</p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto text-base font-bold bg-green-600 hover:bg-green-700 text-white" onClick={handleDownload}>
                    {conversionResults[0].filename.endsWith('.zip') ? <FileArchive className="mr-2 h-5 w-5" /> : <Download className="mr-2 h-5 w-5" />}
                    Download {conversionResults[0].filename.endsWith('.zip') ? 'ZIP' : 'PDF'}
                </Button>
                <Button size="lg" variant="outline" onClick={handleConvertMore} className="w-full sm:w-auto text-base">
                    Convert More
                </Button>
            </div>
        </div>
    )
  }

  return (
    <div className="space-y-6">
        <Card className="bg-transparent shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">Upload Images</CardTitle>
                <CardDescription>Drag & drop your JPG or PNG files below.</CardDescription>
            </CardHeader>
            <CardContent>
                <div
                    {...getRootProps()}
                    className={cn(
                    "flex flex-col items-center justify-center p-6 sm:p-10 rounded-lg border-2 border-dashed transition-colors duration-300",
                    !isConverting && "hover:border-primary/50",
                    isDragActive && "border-primary bg-primary/10",
                    isConverting && "opacity-70 pointer-events-none"
                    )}
                >
                    <input {...getInputProps()} />
                    <UploadCloud className="w-10 h-10 text-muted-foreground sm:w-12 sm:h-12" />
                    <p className="mt-2 text-base font-semibold text-foreground sm:text-lg">Drop image files here</p>
                    <p className="text-xs text-muted-foreground sm:text-sm">or click the button below</p>
                     <motion.div whileHover={{ scale: 1.05, y: -2 }} transition={{ type: 'spring', stiffness: 400, damping: 10 }}>
                        <Button type="button" onClick={open} className="mt-4" disabled={isConverting}>
                            <FolderOpen className="mr-2 h-4 w-4" />Choose Files
                        </Button>
                    </motion.div>
                    <div className="w-full px-2 text-center text-xs text-muted-foreground mt-6">
                        <p>Max: {MAX_FILE_SIZE_MB}MB/file • {MAX_TOTAL_SIZE_MB}MB total • {MAX_FILES} files</p>
                        <p>Remaining space: {formatBytes(MAX_TOTAL_SIZE_BYTES - totalSize)}</p>
                    </div>
                </div>
            </CardContent>
        </Card>

       {files.length > 0 && (
            <Card className="bg-transparent shadow-lg">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="text-xl sm:text-2xl">Arrange and Configure</CardTitle>
                            <CardDescription>Drag to reorder images and set PDF options.</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive" disabled={isConverting}>
                            <X className="w-4 h-4 mr-1" />Clear All
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Previews */}
                    <div className="lg:col-span-2">
                        <div onDragOver={handleDragOver} className={cn("grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 rounded-lg bg-muted/30 p-4 max-h-[600px] overflow-y-auto", isConverting && "opacity-70 pointer-events-none")}>
                           {files.map((imgFile, index) => (
                                <div
                                    key={imgFile.id}
                                    draggable={!isConverting}
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragEnter={(e) => handleDragEnter(e, index)}
                                    onDragEnd={handleDragEnd}
                                    className={cn(
                                        'relative transition-all duration-300 group aspect-[3/4]',
                                        dragItem.current === index ? 'shadow-2xl scale-105 opacity-50' : 'shadow-sm',
                                        isConverting ? 'cursor-not-allowed' : 'cursor-grab',
                                        removingFileId === imgFile.id && 'opacity-0 scale-95'
                                    )}
                                >
                                    <div className="absolute inset-0 bg-background rounded-lg flex items-center justify-center">
                                        <img src={imgFile.previewUrl} alt={`Preview of ${imgFile.file.name}`} className="max-w-full max-h-full object-contain rounded"/>
                                    </div>
                                    <div className="absolute top-1 left-1 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">{index + 1}</div>
                                    <Button variant="destructive" size="icon" className="absolute top-1 right-1 w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeFile(imgFile.id)} disabled={isConverting}>
                                        <X className="w-4 h-4" />
                                    </Button>
                                    <div className="absolute bottom-1 right-1 left-1 bg-black/50 text-white text-xs p-1 rounded-b-md truncate">{imgFile.file.name}</div>
                                    <GripVertical className="absolute top-1/2 right-1 -translate-y-1/2 w-5 h-5 text-white/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Options */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className={cn("space-y-6 p-4 border rounded-lg", isConverting && "opacity-70 pointer-events-none")}>
                             <div>
                                <Label className="font-semibold flex items-center gap-2"><Settings className="w-4 h-4"/>PDF Options</Label>
                             </div>
                            <div>
                                <Label className="font-semibold text-sm">Page Orientation</Label>
                                <RadioGroup value={orientation} onValueChange={(v) => setOrientation(v as Orientation)} className="mt-2 grid grid-cols-2 gap-2" disabled={isConverting}>
                                    <div><RadioGroupItem value="portrait" id="o-p" className="sr-only peer" /><Label htmlFor="o-p" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">Portrait</Label></div>
                                    <div><RadioGroupItem value="landscape" id="o-l" className="sr-only peer" /><Label htmlFor="o-l" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">Landscape</Label></div>
                                </RadioGroup>
                            </div>
                            <div>
                                <Label className="font-semibold text-sm">Page Size</Label>
                                <RadioGroup value={pageSize} onValueChange={(v) => setPageSize(v as PageSize)} className="mt-2 grid grid-cols-3 gap-2" disabled={isConverting}>
                                    <div><RadioGroupItem value="A4" id="ps-a4" className="sr-only peer" /><Label htmlFor="ps-a4" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">A4</Label></div>
                                    <div><RadioGroupItem value="Letter" id="ps-letter" className="sr-only peer" /><Label htmlFor="ps-letter" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">Letter</Label></div>
                                    <div><RadioGroupItem value="Fit" id="ps-fit" className="sr-only peer" /><Label htmlFor="ps-fit" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">Fit</Label></div>
                                </RadioGroup>
                            </div>
                            <div>
                                <Label className="font-semibold text-sm">Margin</Label>
                                <RadioGroup value={marginSize} onValueChange={(v) => setMarginSize(v as MarginSize)} className="mt-2 grid grid-cols-3 gap-2" disabled={isConverting || pageSize === 'Fit'}>
                                    <div><RadioGroupItem value="none" id="m-none" disabled={pageSize === 'Fit'} className="sr-only peer" /><Label htmlFor="m-none" className={cn("flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary", pageSize==='Fit' && "opacity-50 cursor-not-allowed")}>None</Label></div>
                                    <div><RadioGroupItem value="small" id="m-small" disabled={pageSize === 'Fit'} className="sr-only peer" /><Label htmlFor="m-small" className={cn("flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary", pageSize==='Fit' && "opacity-50 cursor-not-allowed")}>Small</Label></div>
                                    <div><RadioGroupItem value="big" id="m-big" disabled={pageSize === 'Fit'} className="sr-only peer" /><Label htmlFor="m-big" className={cn("flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary", pageSize==='Fit' && "opacity-50 cursor-not-allowed")}>Big</Label></div>
                                </RadioGroup>
                            </div>
                            <div className="flex items-center space-x-2 pt-4 border-t">
                                <Checkbox id="merge" checked={mergeIntoOnePdf} onCheckedChange={(c) => setMergeIntoOnePdf(Boolean(c))} disabled={isConverting} />
                                <Label htmlFor="merge" className="font-semibold text-sm">Merge all images into one PDF file</Label>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-4 pt-4 border-t h-[124px] flex flex-col justify-center">
                             <AnimatePresence mode="wait">
                                {isConverting ? (
                                    <motion.div
                                        key="progress"
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-4"
                                    >
                                        <div className="p-4 border rounded-lg bg-primary/5 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                                                    <p className="text-sm font-medium text-primary">Converting...</p>
                                                </div>
                                                <p className="text-sm font-medium text-primary">{Math.round(conversionProgress)}%</p>
                                            </div>
                                            <Progress value={conversionProgress} className="h-2" />
                                        </div>
                                        <Button size="sm" variant="destructive" onClick={handleCancel} className="w-full">
                                            <Ban className="mr-2 h-4 w-4" />Cancel
                                        </Button>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="button"
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <Button size="lg" className="w-full text-base font-bold" onClick={handleConvert} disabled={files.length === 0}>
                                            <FileText className="mr-2 h-5 w-5" />Convert to PDF
                                        </Button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </CardContent>
            </Card>
       )}
    </div>
  );
}
