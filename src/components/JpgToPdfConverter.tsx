
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

const PagePreview = ({ image, orientation, pageSize, marginSize }: { image: ImageFile, orientation: Orientation, pageSize: PageSize, marginSize: MarginSize }) => {
    const getPageDimensions = () => {
        if (pageSize === "Fit") {
            return { width: image.width, height: image.height, aspectRatio: image.width / image.height };
        }
        let dims = PAGE_SIZE_MAP[pageSize];
        if (orientation === 'landscape') {
            dims = [dims[1], dims[0]];
        }
        return { width: dims[0], height: dims[1], aspectRatio: dims[0] / dims[1] };
    };

    const getMargin = () => {
        if (pageSize === "Fit") return 0;
        if (marginSize === "none") return 0;
        return marginSize === "small" ? 0.05 : 0.1; // Margin as a percentage of the shortest side
    };

    const { aspectRatio } = getPageDimensions();
    const marginPercent = getMargin();

    return (
        <div className="flex flex-col items-center">
            <div 
                className="bg-white dark:bg-zinc-800 shadow-md border"
                style={{
                    aspectRatio: `${aspectRatio}`,
                    width: '100%',
                    padding: `${marginPercent * 100}%`,
                }}
            >
                <img
                    src={image.previewUrl}
                    alt="preview"
                    className="w-full h-full object-contain"
                />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Page {image.id.split('-')[0]}</p>
        </div>
    );
}


export function JpgToPdfConverter() {
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [totalSize, setTotalSize] = useState(0);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [conversionResults, setConversionResults] = useState<{url: string, filename: string}[] | null>(null);
  
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [pageSize, setPageSize] = useState<PageSize>("A4");
  const [marginSize, setMarginSize] = useState<MarginSize>("none");
  const [mergeIntoOnePdf, setMergeIntoOnePdf] = useState(true);

  const [removingFileId, setRemovingFileId] = useState<string | null>(null);
  
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const operationId = useRef<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    // This is the cleanup function that runs when the component unmounts.
    return () => {
      // Invalidate any ongoing operations to prevent state updates on an unmounted component.
      operationId.current++; 
      
      // Revoke object URLs to avoid memory leaks.
      files.forEach(f => URL.revokeObjectURL(f.previewUrl));
      if (conversionResults) {
        conversionResults.forEach(r => URL.revokeObjectURL(r.url));
      }
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

      const filesToAdd: Promise<ImageFile>[] = validFiles.map(file => 
        new Promise((resolve) => {
          const previewUrl = URL.createObjectURL(file);
          const img = new window.Image();
          img.onload = () => {
            resolve({
              id: `${files.length + validFiles.indexOf(file) + 1}-${file.name}`,
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
    setTimeout(() => setIsDragging(true), 0);
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
    setIsDragging(false);
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
    setConversionResults(null);
    
    try {
      const getPageDimensions = (img: ImageFile) => {
        if(pageSize === 'Fit') return {width: img.width, height: img.height};
        let size = PAGE_SIZE_MAP[pageSize];
        return orientation === 'landscape' ? [size[1], size[0]] : size;
      }

      const getMargin = (pageWidth: number, pageHeight: number) => {
        if (pageSize === 'Fit' || marginSize === 'none') return 0;
        const shortestSide = Math.min(pageWidth, pageHeight);
        return marginSize === 'small' ? shortestSide * 0.05 : shortestSide * 0.1; // 5% or 10% margin
      }
      
      const pdfDocs: {bytes: Uint8Array, name: string}[] = [];
      const mergedPdf = await PDFDocument.create();

      for (let i = 0; i < files.length; i++) {
        const imageFile = files[i];
        if (operationId.current !== currentOperationId) return;

        const imageBytes = await imageFile.file.arrayBuffer();
        const image = await (imageFile.file.type === 'image/png' 
            ? mergedPdf.embedPng(imageBytes) 
            : mergedPdf.embedJpg(imageBytes));

        const pageDims = getPageDimensions(imageFile);
        let page;
        let docToSave: PDFDocument;

        if (mergeIntoOnePdf) {
            page = mergedPdf.addPage(pageDims);
            docToSave = mergedPdf;
        } else {
            const singlePdf = await PDFDocument.create();
            page = singlePdf.addPage(pageDims);
            docToSave = singlePdf;
        }
        
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
        
        if (!mergeIntoOnePdf) {
            const pdfBytes = await docToSave.save();
            pdfDocs.push({ bytes: pdfBytes, name: `${imageFile.file.name.replace(/\.[^/.]+$/, "")}.pdf`});
        }
        
        setConversionProgress(Math.round(((i + 1) / files.length) * 100));
      }
      
      if (operationId.current !== currentOperationId) return;

      const results: {url: string, filename: string}[] = [];
      if(mergeIntoOnePdf) {
        const mergedBytes = await mergedPdf.save();
        const blob = new Blob([mergedBytes], { type: 'application/pdf' });
        results.push({ url: URL.createObjectURL(blob), filename: 'converted_document.pdf' });
      } else {
        if(pdfDocs.length === 1) {
            const blob = new Blob([pdfDocs[0].bytes], { type: 'application/pdf' });
            results.push({ url: URL.createObjectURL(blob), filename: pdfDocs[0].name });
        } else {
            const zip = new JSZip();
            pdfDocs.forEach(doc => zip.file(doc.name, doc.bytes));
            const zipBlob = await zip.generateAsync({type:"blob"});
            results.push({ url: URL.createObjectURL(zipBlob), filename: 'converted_images.zip' });
        }
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
    if (conversionResults) {
      conversionResults.forEach(r => URL.revokeObjectURL(r.url));
    }
    setConversionResults(null);
    handleClearAll();
  };

  if (conversionResults) {
    return (
        <div className="text-center flex flex-col items-center justify-center py-12 animate-in fade-in duration-500 bg-transparent p-6 sm:p-8 rounded-xl">
            <CheckCircle className="w-16 h-16 sm:w-20 sm:h-20 text-green-500 mb-6" />
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Conversion Successful!</h2>
            <p className="text-muted-foreground mb-8 text-sm sm:text-base">Your new document is ready for download.</p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <a href={conversionResults[0].url} download={conversionResults[0].filename}>
                    <Button size="lg" className="w-full sm:w-auto text-base font-bold bg-green-600 hover:bg-green-700 text-white">
                        {conversionResults[0].filename.endsWith('.zip') ? <FileArchive className="mr-2 h-5 w-5" /> : <Download className="mr-2 h-5 w-5" />}
                        Download {conversionResults[0].filename.endsWith('.zip') ? 'ZIP' : 'PDF'}
                    </Button>
                </a>
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
                <CardDescription>
                  Drag &amp; drop your JPG or PNG files below.
                </CardDescription>
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
                    <p className="mt-2 text-base font-semibold text-foreground sm:text-lg">
                        Drop image files here
                    </p>
                    <p className="text-xs text-muted-foreground sm:text-sm">or click the button below</p>
                     <motion.div whileHover={{ scale: 1.05, y: -2 }} transition={{ type: 'spring', stiffness: 400, damping: 10 }}>
                        <Button type="button" onClick={open} className="mt-4" disabled={isConverting}>
                            <FolderOpen className="mr-2 h-4 w-4" />
                            Choose Files
                        </Button>
                    </motion.div>
                    <div className="w-full px-2 text-center text-xs text-muted-foreground mt-6">
                        <div className="flex flex-col items-center">
                            <p>Max: {MAX_FILE_SIZE_MB}MB/file • {MAX_TOTAL_SIZE_MB}MB total • {MAX_FILES} files</p>
                            <p>Remaining space: {formatBytes(MAX_TOTAL_SIZE_BYTES - totalSize)}</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>

       {files.length > 0 && (
            <Card className="bg-transparent shadow-lg">
                <CardHeader>
                    <CardTitle className="text-xl sm:text-2xl">Arrange and Configure</CardTitle>
                    <CardDescription>Drag images to reorder them and set your PDF options.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-1 space-y-6">
                        {/* Options */}
                        <div className={cn("space-y-6", isConverting && "opacity-70 pointer-events-none")}>
                            <div>
                                <Label className="font-semibold">Page Orientation</Label>
                                <RadioGroup value={orientation} onValueChange={(v) => setOrientation(v as Orientation)} className="mt-2" disabled={isConverting}>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="portrait" id="o-p" /><Label htmlFor="o-p">Portrait</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="landscape" id="o-l" /><Label htmlFor="o-l">Landscape</Label></div>
                                </RadioGroup>
                            </div>
                            <div>
                                <Label className="font-semibold">Page Size</Label>
                                <RadioGroup value={pageSize} onValueChange={(v) => setPageSize(v as PageSize)} className="mt-2" disabled={isConverting}>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="A4" id="ps-a4" /><Label htmlFor="ps-a4">A4</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="Letter" id="ps-letter" /><Label htmlFor="ps-letter">Letter</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="Fit" id="ps-fit" /><Label htmlFor="ps-fit">Fit Image</Label></div>
                                </RadioGroup>
                            </div>
                            <div>
                                <Label className="font-semibold">Margin</Label>
                                <RadioGroup value={marginSize} onValueChange={(v) => setMarginSize(v as MarginSize)} className="mt-2" disabled={isConverting || pageSize === 'Fit'}>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="none" id="m-none" disabled={pageSize === 'Fit'} /><Label htmlFor="m-none" className={cn(pageSize === 'Fit' && "text-muted-foreground")}>No Margin</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="small" id="m-small" disabled={pageSize === 'Fit'} /><Label htmlFor="m-small" className={cn(pageSize === 'Fit' && "text-muted-foreground")}>Small</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="big" id="m-big" disabled={pageSize === 'Fit'} /><Label htmlFor="m-big" className={cn(pageSize === 'Fit' && "text-muted-foreground")}>Big</Label></div>
                                </RadioGroup>
                            </div>
                            <div className="flex items-center space-x-2 pt-4 border-t">
                                <Checkbox id="merge" checked={mergeIntoOnePdf} onCheckedChange={(c) => setMergeIntoOnePdf(Boolean(c))} disabled={isConverting} />
                                <Label htmlFor="merge" className="font-semibold">Merge all images into one PDF file</Label>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-4 pt-4 border-t h-20 flex flex-col justify-center">
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
                    
                    {/* Previews */}
                    <div className="md:col-span-2">
                        <div className="flex justify-between items-center mb-4">
                             <h3 className="font-semibold">Preview</h3>
                             <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive" disabled={isConverting}><X className="w-4 h-4 mr-1" />Clear All</Button>
                        </div>
                        <div onDragOver={handleDragOver} className={cn("grid grid-cols-2 lg:grid-cols-3 gap-4 rounded-lg bg-muted/30 p-4 max-h-[600px] overflow-y-auto", isConverting && "opacity-70 pointer-events-none")}>
                           {files.map((imgFile, index) => (
                                <div
                                    key={imgFile.id}
                                    draggable={!isConverting}
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragEnter={(e) => handleDragEnter(e, index)}
                                    onDragEnd={handleDragEnd}
                                    className={cn(
                                        'relative transition-all duration-300',
                                        isDragging && dragItem.current === index ? 'shadow-2xl scale-105 opacity-50' : 'shadow-sm',
                                        isConverting ? 'cursor-not-allowed' : 'cursor-grab',
                                        removingFileId === imgFile.id && 'opacity-0 scale-95'
                                    )}
                                >
                                    <PagePreview image={imgFile} orientation={orientation} pageSize={pageSize} marginSize={marginSize} />
                                    <Button variant="destructive" size="icon" className="absolute top-2 right-2 w-7 h-7" onClick={() => removeFile(imgFile.id)} disabled={isConverting}>
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
       )}
    </div>
  );
}
