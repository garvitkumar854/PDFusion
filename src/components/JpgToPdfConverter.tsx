
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
  RotateCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PDFDocument, PageSizes, degrees } from 'pdf-lib';
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
  rotation: number;
};

type Orientation = "portrait" | "landscape";
type PageSize = "A4" | "Letter" | "Fit";
type MarginSize = "none" | "small" | "big";

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const PagePreview = ({ fileInfo, orientation, pageSize, marginSize }: { fileInfo: ImageFile, orientation: Orientation, pageSize: PageSize, marginSize: MarginSize }) => {
    
    const showPageContainer = pageSize !== 'Fit';

    const getPageAspectRatio = () => {
        if (!showPageContainer) return 'auto';
        const dims = PageSizes[pageSize];
        return orientation === 'landscape' ? dims[1] / dims[0] : dims[0] / dims[1];
    };
    
    const pageContainerAspectRatio = getPageAspectRatio();
    
    return (
        <div 
            className="w-full h-full flex items-center justify-center p-1 bg-muted/30 rounded-lg transition-all duration-300"
        >
            {showPageContainer ? (
                <div
                    className="relative bg-white shadow-md transition-all duration-300 ease-in-out w-full h-auto"
                    style={{
                        aspectRatio: `${pageContainerAspectRatio}`,
                    }}
                >
                    <img
                        src={fileInfo.previewUrl}
                        alt="Preview"
                        className={cn(
                            "object-contain w-full h-full transition-transform duration-300",
                            marginSize === 'small' && 'p-[5%]',
                            marginSize === 'big' && 'p-[10%]'
                        )}
                        style={{ transform: `rotate(${fileInfo.rotation}deg)` }}
                    />
                </div>
            ) : (
                <img
                    src={fileInfo.previewUrl}
                    alt="Preview"
                    className="object-contain w-full h-full shadow-md transition-transform duration-300"
                    style={{ transform: `rotate(${fileInfo.rotation}deg)` }}
                />
            )}
        </div>
    );
};


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

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const operationId = useRef<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      operationId.current = 0;
      files.forEach(f => URL.revokeObjectURL(f.previewUrl));
      if (conversionResults) {
        conversionResults.forEach(r => URL.revokeObjectURL(r.url));
      }
    };
  }, [files, conversionResults]);

  useEffect(() => {
    if (pageSize === 'Fit') {
      setMarginSize('none');
    }
  }, [pageSize]);
  
  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      if (files.length + acceptedFiles.length > MAX_FILES) {
        toast({ variant: "destructive", title: "File limit reached", description: `You can only upload a maximum of ${MAX_FILES} files.` });
        return;
      }
      
      let currentSize = totalSize;
      const newFiles = acceptedFiles.filter(file => {
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

      const filesToAdd = newFiles.map(file => ({ 
        id: `${file.name}-${Date.now()}`, 
        file,
        previewUrl: URL.createObjectURL(file),
        rotation: 0,
      }));
      
      setFiles(prev => [...prev, ...filesToAdd]);
      setTotalSize(prev => prev + newFiles.reduce((acc, file) => acc + file.size, 0));

      if (filesToAdd.length > 0) {
        toast({
            variant: "success",
            title: `${filesToAdd.length} image(s) added successfully!`,
        });
      }

      if (rejectedFiles.length > 0) {
        toast({ variant: "destructive", title: "Invalid file(s) rejected", description: "Some files were not valid image types or exceeded size limits." });
      }
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
    const fileToRemove = files.find(f => f.id === fileId);
    if (fileToRemove) {
      URL.revokeObjectURL(fileToRemove.previewUrl);
      setTotalSize(prev => prev - fileToRemove.file.size);
      setFiles(prev => prev.filter(f => f.id !== fileId));
      toast({ variant: "info", title: `Removed "${fileToRemove.file.name}"` });
    }
  };

  const rotateImage = (fileId: string) => {
    setFiles(prevFiles =>
      prevFiles.map(f =>
        f.id === fileId ? { ...f, rotation: (f.rotation + 90) % 360 } : f
      )
    );
  };
  
  const handleClearAll = () => {
    files.forEach(f => URL.revokeObjectURL(f.previewUrl));
    setFiles([]);
    setTotalSize(0);
    toast({ variant: "info", title: "All files cleared." });
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
  
  const handleConvert = async () => {
    if (files.length === 0) {
      toast({ variant: "destructive", title: "No files uploaded", description: "Please upload at least one image file to convert." });
      return;
    }
    
    const currentOperationId = ++operationId.current;
    
    setIsConverting(true);
    setConversionProgress(0);
    setConversionResults(null);
    
    try {
      const getPageSize = () => {
        let size = PageSizes[pageSize === "Fit" ? "A4" : pageSize];
        return orientation === 'landscape' ? [size[1], size[0]] : size;
      }

      const getMargin = () => {
        if (pageSize === 'Fit' || marginSize === 'none') return 0;
        return marginSize === 'small' ? 36 : 72;
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

        const pageDims = getPageSize();
        const margin = getMargin();

        let page;
        if (mergeIntoOnePdf) {
            page = mergedPdf.addPage(pageSize === 'Fit' ? undefined : pageDims);
        } else {
            const singlePdf = await PDFDocument.create();
            page = singlePdf.addPage(pageSize === 'Fit' ? undefined : pageDims);
        }
        
        const effectiveRotation = imageFile.rotation;
        if (effectiveRotation !== 0) {
            page.setRotation(degrees(effectiveRotation));
        }
        
        let imgWidth = image.width;
        let imgHeight = image.height;
        if (effectiveRotation === 90 || effectiveRotation === 270) {
            [imgWidth, imgHeight] = [imgHeight, imgWidth];
        }

        let pageWidth = page.getWidth();
        let pageHeight = page.getHeight();
        if (effectiveRotation === 90 || effectiveRotation === 270) {
            [pageWidth, pageHeight] = [pageHeight, pageWidth];
        }
        
        if (pageSize === 'Fit') {
            pageWidth = imgWidth + margin * 2;
            pageHeight = imgHeight + margin * 2;
            page.setSize(pageWidth, pageHeight);
             if (effectiveRotation !== 0) {
                // When rotating, the page's own coordinate system rotates. We need to reset it back
                page.setRotation(degrees(0));
                page.setSize(pageWidth, pageHeight);
                page.setRotation(degrees(effectiveRotation));
            }
        }

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
            const pdfBytes = await (page.doc as PDFDocument).save();
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
        variant: "success",
        title: "Conversion Successful!",
        description: "Your PDF is ready to be downloaded.",
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
    toast({ variant: "info", title: "Conversion cancelled." });
  };

  const handleDownload = () => {
    if (!conversionResults || conversionResults.length === 0) return;
    const result = conversionResults[0];
    const link = document.createElement("a");
    link.href = result.url;
    link.download = result.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        <div className="text-center flex flex-col items-center justify-center py-12 animate-in fade-in duration-500 bg-transparent p-6 sm:p-8 rounded-xl shadow-lg border">
            <CheckCircle className="w-16 h-16 sm:w-20 sm:h-20 text-green-500 mb-6" />
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Conversion Successful!</h2>
            <p className="text-muted-foreground mb-8 text-sm sm:text-base">Your new document is ready for download.</p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Button size="lg" onClick={handleDownload} className="w-full sm:w-auto text-base font-bold bg-green-600 hover:bg-green-700 text-white">
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
        <Card className={cn("bg-transparent shadow-lg", isConverting && "opacity-70 pointer-events-none")}>
            <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">Upload Images</CardTitle>
                <CardDescription>
                  Drag & drop your JPG or PNG files below.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div
                    {...getRootProps()}
                    className={cn(
                    "flex flex-col items-center justify-center p-6 sm:p-10 rounded-lg border-2 border-dashed transition-colors duration-300",
                    !isConverting && "hover:border-primary/50",
                    isDragActive && "border-primary bg-primary/10"
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
          <Card className={cn("bg-transparent shadow-lg", isConverting && "opacity-70 pointer-events-none")}>
            <CardHeader className="flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between pb-2 pr-4">
              <div>
                <CardTitle className="text-xl sm:text-2xl">Uploaded Files ({files.length})</CardTitle>
                <CardDescription>Drag to reorder images</CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClearAll} 
                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:shadow-sm active:bg-destructive/20 active:shadow-md -ml-2 sm:ml-0"
                disabled={isConverting}
              >
                <X className="w-4 h-4 mr-1 sm:mr-2" />
                Clear All
              </Button>
            </CardHeader>
            <CardContent className="p-2 sm:p-4">
                <div 
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                >
                    <AnimatePresence>
                        {files.map((imgFile, index) => (
                            <motion.div
                                key={imgFile.id}
                                layout
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                draggable={!isConverting}
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragEnter={(e) => handleDragEnter(e, index)}
                                onDragEnd={handleDragEnd}
                                onDragOver={(e) => e.preventDefault()}
                                className={cn(
                                    'group relative rounded-lg border-2 bg-muted transition-all duration-300 ease-in-out aspect-[7/10]',
                                    'focus-within:border-primary',
                                    isDragging && dragItem.current === index ? 'shadow-lg scale-105 opacity-50' : 'shadow-sm',
                                    isConverting ? 'cursor-not-allowed' : 'cursor-grab'
                                )}
                                tabIndex={0}
                            >
                                <PagePreview fileInfo={imgFile} orientation={orientation} pageSize={pageSize} marginSize={marginSize} />
                                <div
                                    className={cn("absolute top-1 right-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity flex gap-1")}
                                >
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        title="Rotate"
                                        className="w-6 h-6 text-white/80 bg-black/40 hover:bg-black/70 hover:text-white"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            rotateImage(imgFile.id)
                                        }}
                                        disabled={isConverting}
                                    >
                                        <RotateCw className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        title="Remove"
                                        className="w-6 h-6 text-white/80 bg-black/40 hover:bg-destructive/80 hover:text-white"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeFile(imgFile.id)
                                        }}
                                        disabled={isConverting}
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-transparent shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">Conversion Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-6", isConverting && "opacity-70 pointer-events-none")}>
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
                </div>

                <div className={cn("flex items-center space-x-2 pt-4 border-t", isConverting && "opacity-70 pointer-events-none")}>
                    <Checkbox id="merge" checked={mergeIntoOnePdf} onCheckedChange={(c) => setMergeIntoOnePdf(Boolean(c))} disabled={isConverting} />
                    <Label htmlFor="merge" className="font-semibold">Merge all images into one PDF file</Label>
                </div>
                
                <div className="pt-4 border-t h-[104px] flex flex-col justify-center">
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
                                <div className="p-4 border rounded-lg bg-primary/5">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="w-5 h-5 text-primary animate-spin" />
                                            <p className="text-sm font-medium text-primary transition-all duration-300">Converting to PDF...</p>
                                        </div>
                                        <p className="text-sm font-medium text-primary">{Math.round(conversionProgress)}%</p>
                                    </div>
                                    <Progress value={conversionProgress} className="h-2 transition-all duration-500" />
                                </div>
                                <Button size="sm" variant="destructive" onClick={handleCancel} className="w-full mt-2">
                                    <Ban className="mr-2 h-4 w-4" />
                                    Cancel
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
                                <Button size="lg" className="w-full text-base font-bold" onClick={handleConvert} disabled={files.length === 0 || isConverting}>
                                    <FileText className="mr-2 h-5 w-5" />
                                    Convert to PDF
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

            </CardContent>
        </Card>
    </div>
  );
}
