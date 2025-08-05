
"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
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
import { Slider } from "./ui/slider";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";


const MAX_FILES = 50;
const MAX_FILE_SIZE_MB = 50;
const MAX_TOTAL_SIZE_MB = 400;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_TOTAL_SIZE_BYTES = MAX_TOTAL_SIZE_MB * 1024 * 1024;

type ImageFile = {
  id: string;
  file: File;
  previewUrl: string;
};

type Orientation = "portrait" | "landscape";
type PageSize = "A4" | "Letter" | "Fit";
type MarginSize = "none" | "small" | "big";

interface PagePreviewProps {
    fileInfo: ImageFile;
    orientation: Orientation;
    pageSize: PageSize;
    marginSize: MarginSize;
}

const PagePreview = React.memo(
  function PagePreview(props: PagePreviewProps) {
    const { fileInfo, orientation, pageSize, marginSize } = props;

    if (pageSize === 'Fit') {
        return (
             <div className="w-full h-full flex items-center justify-center p-1 bg-muted/30 rounded-lg">
                <img
                    src={fileInfo.previewUrl}
                    alt="Preview"
                    className="max-w-full max-h-full object-contain shadow-md"
                />
            </div>
        )
    }

    const getPageAspectRatio = () => {
        const dims = pageSize === 'A4' ? [210, 297] : [215.9, 279.4]; // A4, Letter
        return orientation === 'landscape' ? dims[1] / dims[0] : dims[0] / dims[1];
    };

    const aspectRatio = getPageAspectRatio();
    
    const pageContainerStyle = {
        position: 'relative' as const,
        width: '100%',
        paddingBottom: `${(1 / aspectRatio) * 100}%`,
        backgroundColor: 'white',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        transition: 'padding-bottom 0.3s ease',
    };

    let padding = '0';
    if (marginSize === 'small') padding = '5%';
    if (marginSize === 'big') padding = '10%';
    
    const imageContainerStyle = {
        position: 'absolute' as const,
        top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding,
        transition: 'padding 0.3s ease-in-out',
    };

    return (
        <div className="w-full h-full flex items-center justify-center p-1 bg-muted/30 rounded-lg">
            <div style={pageContainerStyle}>
                <div style={imageContainerStyle}>
                    <img
                        src={fileInfo.previewUrl}
                        alt="Preview"
                        className="max-w-full max-h-full object-contain"
                    />
                </div>
            </div>
        </div>
    );
  },
  (prevProps, nextProps) => {
    return (
        prevProps.fileInfo.id === nextProps.fileInfo.id &&
        prevProps.orientation === nextProps.orientation &&
        prevProps.pageSize === nextProps.pageSize &&
        prevProps.marginSize === nextProps.marginSize
    );
  }
);
PagePreview.displayName = 'PagePreview';

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
  const [progressText, setProgressText] = useState("");
  const [conversionResults, setConversionResults] = useState<{url: string, filename: string}[] | null>(null);
  const [removingFileId, setRemovingFileId] = useState<string | null>(null);

  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [pageSize, setPageSize] = useState<PageSize>("A4");
  const [marginSize, setMarginSize] = useState<MarginSize>("none");
  const [mergeIntoOnePdf, setMergeIntoOnePdf] = useState(true);
  const [imageQuality, setImageQuality] = useState(80);

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
    if(fileToRemove){
        setRemovingFileId(fileId);
        dragItem.current = null;
        dragOverItem.current = null;
        setTimeout(() => {
            const fileToRevoke = files.find(f => f.id === fileId);
            setFiles(prev => prev.filter(f => f.id !== fileId));
            setTotalSize(prev => prev - (fileToRevoke?.file.size || 0));
            toast({ variant: "info", title: `Removed "${fileToRemove.file.name}"` });
            setRemovingFileId(null);
        }, 300);
    }
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

  const recompressImage = (file: File): Promise<{ bytes: ArrayBuffer, width: number, height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Canvas to Blob conversion failed"));
            blob.arrayBuffer().then(buffer => resolve({ bytes: buffer, width: img.width, height: img.height }));
          },
          'image/jpeg',
          imageQuality / 100
        );
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
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
    setProgressText("Initializing...");

    const pdfDocs: {bytes: Uint8Array, name: string}[] = [];
    const mergedPdf = await PDFDocument.create();

    const getPageSize = () => {
        if (pageSize === "Fit") return PageSizes.A4; // Placeholder, will be resized
        let size = pageSize === "A4" ? PageSizes.A4 : PageSizes.Letter;
        return orientation === 'landscape' ? [size[1], size[0]] : size;
    }
    const effectiveMarginSize = pageSize === 'Fit' ? 'none' : marginSize;
    const getMargin = () => {
        if (effectiveMarginSize === 'none') return 0;
        return effectiveMarginSize === 'small' ? 36 : 72;
    }
    const margin = getMargin();

    let i = 0;
    const processChunk = async () => {
        if (i >= files.length || operationId.current !== currentOperationId) {
            // Processing finished or cancelled
            if (operationId.current === currentOperationId) {
                try {
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
                     console.error("Finalization failed:", error);
                     toast({ variant: "destructive", title: "Finalization Failed", description: error.message || "An unexpected error occurred." });
                } finally {
                    setIsConverting(false);
                }
            }
            return;
        }

        const imageFile = files[i];
        setProgressText(`Processing ${imageFile.file.name}...`);
        
        try {
            const { bytes: imageBytes, width: imgWidth, height: imgHeight } = await recompressImage(imageFile.file);
            const image = await mergedPdf.embedJpg(imageBytes);

            const pageDims = getPageSize();
            
            let page;
            let docForPage = mergeIntoOnePdf ? mergedPdf : await PDFDocument.create();

            page = docForPage.addPage(pageSize === 'Fit' ? undefined : pageDims);
           
            let pageWidth = page.getWidth();
            let pageHeight = page.getHeight();
            
            if (pageSize === 'Fit') {
                pageWidth = imgWidth + margin * 2;
                pageHeight = imgHeight + margin * 2;
                page.setSize(pageWidth, pageHeight);
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
                const pdfBytes = await docForPage.save();
                pdfDocs.push({ bytes: pdfBytes, name: `${imageFile.file.name.replace(/\.[^/.]+$/, "")}.pdf`});
            }
        } catch (error: any) {
            console.error(`Failed to process ${imageFile.file.name}:`, error);
            toast({ variant: "destructive", title: `Skipping ${imageFile.file.name}`, description: "File might be corrupted." });
        }
        
        i++;
        setConversionProgress(Math.round((i / files.length) * 100));

        // Yield to the event loop to keep the UI responsive
        setTimeout(processChunk, 0);
    };

    // Start the process
    processChunk();
  };
  
  const handleCancel = () => {
    operationId.current++;
    setIsConverting(false);
    setConversionProgress(0);
    setProgressText("");
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
                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive -ml-2 sm:ml-0"
                disabled={isConverting}
              >
                <X className="w-4 h-4 mr-1 sm:mr-2" />
                Clear All
              </Button>
            </CardHeader>
            <CardContent className="p-2 sm:p-4">
               <ScrollArea className="w-full pr-4 h-80 sm:h-auto">
                 <div className="grid grid-flow-row-dense grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    <AnimatePresence>
                        {files.map((imgFile, index) => (
                            <motion.div
                                key={imgFile.id}
                                layout
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
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
                                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
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
                 <ScrollBar orientation="vertical" />
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        <Card className="bg-transparent shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">Conversion Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className={cn("grid grid-cols-2 md:grid-cols-3 gap-6", isConverting && "opacity-70 pointer-events-none")}>
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
                        <RadioGroup value={pageSize === 'Fit' ? 'none' : marginSize} onValueChange={(v) => setMarginSize(v as MarginSize)} className="mt-3 flex space-x-4" disabled={isConverting || pageSize === 'Fit'}>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="none" id="m-none" disabled={pageSize === 'Fit'} /><Label htmlFor="m-none" className={cn(pageSize === 'Fit' && "text-muted-foreground")}>None</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="small" id="m-small" disabled={pageSize === 'Fit'} /><Label htmlFor="m-small" className={cn(pageSize === 'Fit' && "text-muted-foreground")}>Small</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="big" id="m-big" disabled={pageSize === 'Fit'} /><Label htmlFor="m-big" className={cn(pageSize === 'Fit' && "text-muted-foreground")}>Big</Label></div>
                        </RadioGroup>
                    </div>
                </div>

                <div className={cn("pt-4 border-t", isConverting && "opacity-70 pointer-events-none")}>
                    <Label className="font-semibold">Image Quality: <span className="font-bold text-primary">{imageQuality}%</span></Label>
                    <p className="text-xs text-muted-foreground mb-2">Lower quality results in a smaller PDF file size.</p>
                    <Slider value={[imageQuality]} onValueChange={([val]) => setImageQuality(val)} min={10} max={100} step={10} disabled={isConverting} />
                </div>

                <div className={cn("flex items-center space-x-2 pt-4 border-t", isConverting && "opacity-70 pointer-events-none")}>
                    <Checkbox id="merge" checked={mergeIntoOnePdf} onCheckedChange={(c) => setMergeIntoOnePdf(Boolean(c))} disabled={isConverting} />
                    <Label htmlFor="merge" className="font-semibold">Merge all images into one PDF file</Label>
                </div>
                
                <div className="pt-6 border-t h-[104px] flex flex-col justify-center">
                    <AnimatePresence mode="wait">
                        {isConverting ? (
                            <motion.div
                                key="progress"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-2"
                            >
                                <div className="p-2 border rounded-lg bg-primary/5 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="w-5 h-5 text-primary animate-spin" />
                                            <p className="text-sm font-medium text-primary transition-all duration-300 truncate pr-2">{progressText}</p>
                                        </div>
                                        <p className="text-sm font-medium text-primary shrink-0">{Math.round(conversionProgress)}%</p>
                                    </div>
                                    <Progress value={conversionProgress} className="h-2 transition-all duration-500" />
                                </div>
                                <Button size="sm" variant="destructive" onClick={handleCancel} className="w-full">
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
