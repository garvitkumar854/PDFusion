
"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud,
  Download,
  X,
  Check,
  FolderOpen,
  Loader2,
  Ban,
  FileImage,
  Type,
  Lock,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PDFDocument, rgb, StandardFonts, degrees, BlendMode } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { Progress } from "./ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { Slider } from "./ui/slider";
import { Textarea } from "./ui/textarea";

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

const MAX_FILE_SIZE_MB = 100;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB for watermark image

type PDFFile = {
  id: string;
  file: File;
  pdfjsDoc: pdfjsLib.PDFDocumentProxy;
  isEncrypted: boolean;
};

type WatermarkType = "text" | "image";
type Font = "Helvetica" | "TimesRoman" | "Courier";
type Position = 'center' | 'top-left' | 'top' | 'top-right' | 'left' | 'right' | 'bottom-left' | 'bottom' | 'bottom-right' | 'tile';


const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16) / 255, g: parseInt(result[2], 16) / 255, b: parseInt(result[3], 16) / 255 }
    : { r: 0, g: 0, b: 0 };
};

const FONT_MAP: Record<Font, StandardFonts> = {
  Helvetica: StandardFonts.Helvetica,
  TimesRoman: StandardFonts.TimesRoman,
  Courier: StandardFonts.Courier,
};

export function WatermarkAdder() {
  const [file, setFile] = useState<PDFFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Watermark options
  const [watermarkType, setWatermarkType] = useState<WatermarkType>("text");
  const [text, setText] = useState("CONFIDENTIAL");
  const [font, setFont] = useState<Font>("Helvetica");
  const [fontSize, setFontSize] = useState(50);
  const [textColor, setTextColor] = useState("#ff0000");
  const [opacity, setOpacity] = useState(0.5);
  const [rotation, setRotation] = useState(-45);
  const [position, setPosition] = useState<Position>('tile');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const operationId = useRef<number>(0);
  const { toast } = useToast();

  const cleanupPreview = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  }, [previewUrl]);

  const generatePreview = useCallback(async () => {
    if (!file || !file.pdfjsDoc) return;

    const currentOperationId = ++operationId.current;
    setIsLoadingPreview(true);
    cleanupPreview();

    try {
      const page = await file.pdfjsDoc.getPage(1);
      if (operationId.current !== currentOperationId) return;

      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext('2d');
      
      if (context) {
        await page.render({ canvasContext: context, viewport }).promise;
        if (operationId.current !== currentOperationId) return;
        setPreviewUrl(canvas.toDataURL());
      }
    } catch (e) {
        if(operationId.current === currentOperationId) {
            console.error("Failed to generate preview", e);
        }
    } finally {
        if(operationId.current === currentOperationId) {
           setIsLoadingPreview(false);
        }
    }
  }, [file, cleanupPreview]);

  useEffect(() => {
    generatePreview();
  }, [generatePreview]);
  
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if(acceptedFiles.length === 0) return;
    const singleFile = acceptedFiles[0];

    cleanupPreview();
    setFile(null);
    setIsProcessing(true);

    let isEncrypted = false;
    let pdfjsDoc = null;
    try {
      const pdfBytes = await singleFile.arrayBuffer();
      pdfjsDoc = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
    } catch(e: any) {
        if (e.name === 'PasswordException') isEncrypted = true;
        else {
          toast({ variant: 'destructive', title: 'Invalid PDF', description: 'This file may be corrupted.' });
          setIsProcessing(false);
          return;
        }
    }

    setFile({ id: `${singleFile.name}-${Date.now()}`, file: singleFile, isEncrypted, pdfjsDoc: pdfjsDoc! });
    setIsProcessing(false);
    toast({ variant: "success", title: "File Uploaded", description: `"${singleFile.name}" is ready.` });
  }, [cleanupPreview, toast]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxSize: MAX_FILE_SIZE_BYTES,
    multiple: false,
    noClick: true,
    noKeyboard: true,
    disabled: isProcessing,
  });

  const onImageDrop = useCallback((acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
          const imageFile = acceptedFiles[0];
          if (imageFile.size > MAX_IMAGE_SIZE_BYTES) {
              toast({ variant: "destructive", title: "Image too large", description: `Please select an image smaller than ${MAX_IMAGE_SIZE_BYTES / 1024 / 1024}MB.` });
              return;
          }
          setImage(imageFile);
          const reader = new FileReader();
          reader.onloadend = () => setImagePreview(reader.result as string);
          reader.readAsDataURL(imageFile);
      }
  }, [toast]);
  
  const { getRootProps: getImageRootProps, getInputProps: getImageInputProps, isDragActive: isImageDragActive } = useDropzone({
    onDrop: onImageDrop,
    accept: { "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"] },
    multiple: false,
  });


  const handleProcess = async () => {
    if (!file || file.isEncrypted || isProcessing) return;

    const currentOperationId = ++operationId.current;
    setIsProcessing(true);
    setProgress(0);

    try {
      const pdfBytes = await file.file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      const pages = pdfDoc.getPages();
      const totalPages = pages.length;

      let watermarkImage: any = null;
      if (watermarkType === 'image' && image) {
        const imageBytes = await image.arrayBuffer();
        watermarkImage = image.type === 'image/png'
          ? await pdfDoc.embedPng(imageBytes)
          : await pdfDoc.embedJpg(imageBytes);
      } else if (watermarkType === 'image' && !image) {
          throw new Error("Please select an image for the watermark.");
      }

      for (let i = 0; i < totalPages; i++) {
        if (operationId.current !== currentOperationId) return;

        const page = pages[i];
        const { width: pageWidth, height: pageHeight } = page.getSize();
        
        const drawWatermark = (x: number, y: number) => {
          if (watermarkType === 'text') {
            page.drawText(text, {
              x, y,
              font: embeddedFont,
              size: fontSize,
              color: rgb(colorRgb.r, colorRgb.g, colorRgb.b),
              opacity,
              rotate: degrees(rotation),
              blendMode: BlendMode.Multiply,
            });
          } else if (watermarkImage) {
            const scale = fontSize / 100;
            const imgWidth = watermarkImage.width * scale;
            const imgHeight = watermarkImage.height * scale;
            page.drawImage(watermarkImage, {
              x: x - imgWidth / 2, y: y - imgHeight / 2,
              width: imgWidth,
              height: imgHeight,
              opacity,
              rotate: degrees(rotation),
              blendMode: BlendMode.Multiply,
            });
          }
        };
        
        let embeddedFont: any;
        let colorRgb: {r:number, g:number, b:number};

        if (watermarkType === 'text') {
            embeddedFont = await pdfDoc.embedFont(FONT_MAP[font]);
            colorRgb = hexToRgb(textColor);
        }

        if (position === 'tile') {
            const gap = 150;
            for (let y = -pageHeight; y < pageHeight * 2; y += gap) {
                for (let x = -pageWidth; x < pageWidth * 2; x += gap * 2) {
                   drawWatermark(x, y);
                }
            }
        } else {
            const positions = {
              'center': { x: pageWidth / 2, y: pageHeight / 2 },
              'top-left': { x: 50, y: pageHeight - 50 },
              'top': { x: pageWidth / 2, y: pageHeight - 50 },
              'top-right': { x: pageWidth - 50, y: pageHeight - 50 },
              'left': { x: 50, y: pageHeight / 2 },
              'right': { x: pageWidth - 50, y: pageHeight / 2 },
              'bottom-left': { x: 50, y: 50 },
              'bottom': { x: pageWidth / 2, y: 50 },
              'bottom-right': { x: pageWidth - 50, y: 50 },
            };
            drawWatermark(positions[position].x, positions[position].y);
        }

        setProgress(Math.round(((i + 1) / totalPages) * 100));
      }

      if (operationId.current !== currentOperationId) return;

      const newPdfBytes = await pdfDoc.save();
      const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const originalName = file.file.name.replace(/\.pdf$/i, '');
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${originalName}_watermarked.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({ variant: "success", title: "Watermark Added!", description: "Your PDF has been downloaded." });
      
    } catch (error: any) {
        if(operationId.current === currentOperationId) {
          console.error("Failed to add watermark:", error);
          toast({ variant: "destructive", title: "An Error Occurred", description: error.message });
        }
    } finally {
        if(operationId.current === currentOperationId) {
           setIsProcessing(false);
        }
    }
  };

  const removeFile = () => {
    operationId.current++;
    if(file?.pdfjsDoc) file.pdfjsDoc.destroy();
    setFile(null);
    cleanupPreview();
  };

  return (
    <div className="space-y-6">
       {!file ? (
         <Card className="bg-transparent shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Upload PDF</CardTitle>
            <CardDescription>Select a PDF file to add a watermark to.</CardDescription>
          </CardHeader>
          <CardContent>
            <div {...getRootProps()} className={cn("flex flex-col items-center justify-center p-6 sm:p-10 rounded-lg border-2 border-dashed transition-colors duration-300", !isProcessing && "hover:border-primary/50", isDragActive && "border-primary bg-primary/10", isProcessing && "opacity-70 pointer-events-none")}>
              <input {...getInputProps()} />
              <UploadCloud className="w-10 h-10 text-muted-foreground sm:w-12 sm:h-12" />
              <p className="mt-2 text-base font-semibold text-foreground sm:text-lg">Drop a PDF file here</p>
              <p className="text-xs text-muted-foreground sm:text-sm">or click the button below</p>
              <motion.div whileHover={{ scale: 1.05, y: -2 }} transition={{ type: 'spring', stiffness: 400, damping: 10 }}>
                <Button type="button" onClick={open} className="mt-4" disabled={isProcessing}><FolderOpen className="mr-2 h-4 w-4" />Choose File</Button>
              </motion.div>
            </div>
          </CardContent>
        </Card>
       ) : (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
                <Card className="bg-transparent shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="max-w-full overflow-hidden">
                            <CardTitle className="text-xl">Uploaded File</CardTitle>
                            <CardDescription className="truncate" title={file.file.name}>{file.file.name}</CardDescription>
                        </div>
                         <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground/70 hover:bg-destructive/10 hover:text-destructive shrink-0" onClick={removeFile} disabled={isProcessing}>
                            <X className="w-4 h-4" />
                        </Button>
                    </CardHeader>
                    {file.isEncrypted && (
                       <CardContent>
                         <div className="flex items-center gap-3 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3 text-sm text-yellow-700 dark:text-yellow-400">
                            <ShieldAlert className="h-5 w-5 shrink-0" />
                            <div>This PDF is password-protected and cannot be processed. Please upload an unlocked file.</div>
                        </div>
                       </CardContent>
                    )}
                </Card>
                <Card className="bg-transparent shadow-lg">
                    <CardHeader><CardTitle className="text-xl">Watermark Options</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className={cn(isProcessing && "opacity-70 pointer-events-none")}>
                            <Label className="font-semibold">Type</Label>
                             <RadioGroup value={watermarkType} onValueChange={(v) => setWatermarkType(v as WatermarkType)} className="mt-2 grid grid-cols-2 gap-2">
                                <Label htmlFor="type-text" className={cn("flex items-center justify-center space-x-2 border rounded-md p-3 cursor-pointer", watermarkType === "text" && "border-primary bg-primary/5")}><RadioGroupItem value="text" id="type-text" /><Type className="w-4 h-4 mr-2"/><span>Text</span></Label>
                                <Label htmlFor="type-image" className={cn("flex items-center justify-center space-x-2 border rounded-md p-3 cursor-pointer", watermarkType === "image" && "border-primary bg-primary/5")}><RadioGroupItem value="image" id="type-image" /><FileImage className="w-4 h-4 mr-2"/><span>Image</span></Label>
                             </RadioGroup>
                        </div>

                         <AnimatePresence mode="wait">
                           <motion.div key={watermarkType} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden">
                            {watermarkType === 'text' ? (
                                <div className="space-y-4 pt-4 border-t">
                                     <div>
                                        <Label htmlFor="watermark-text" className="font-semibold">Text</Label>
                                        <Textarea id="watermark-text" value={text} onChange={(e) => setText(e.target.value)} disabled={isProcessing} className="mt-1" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><Label htmlFor="font" className="font-semibold">Font</Label><Select value={font} onValueChange={v => setFont(v as Font)} disabled={isProcessing}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Helvetica">Helvetica</SelectItem><SelectItem value="TimesRoman">Times New Roman</SelectItem><SelectItem value="Courier">Courier</SelectItem></SelectContent></Select></div>
                                        <div><Label htmlFor="textColor" className="font-semibold">Color</Label><div className="relative mt-1"><Input id="textColor" type="text" value={textColor} onChange={e => setTextColor(e.target.value)} className="w-full pr-12" disabled={isProcessing}/><Input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-10 p-0 cursor-pointer" disabled={isProcessing}/></div></div>
                                    </div>
                                </div>
                            ) : (
                                 <div className="space-y-4 pt-4 border-t">
                                    <Label className="font-semibold">Image</Label>
                                    <div {...getImageRootProps()} className={cn("p-4 rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer", isImageDragActive && "border-primary")}>
                                        <input {...getImageInputProps()} />
                                        {imagePreview ? <img src={imagePreview} alt="Watermark Preview" className="max-h-24 rounded"/> : <><FileImage className="w-8 h-8 text-muted-foreground"/><p className="text-sm text-muted-foreground mt-2">Drop image here or click</p></>}
                                    </div>
                                </div>
                            )}
                         </motion.div>
                         </AnimatePresence>

                        <div className="space-y-4 pt-4 border-t">
                             <div>
                                <Label className="font-semibold">Position</Label>
                                <Select value={position} onValueChange={v => setPosition(v as Position)} disabled={isProcessing}><SelectTrigger className="mt-1"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="tile">Tile</SelectItem><SelectItem value="center">Center</SelectItem><SelectItem value="top-left">Top Left</SelectItem><SelectItem value="top">Top</SelectItem><SelectItem value="top-right">Top Right</SelectItem><SelectItem value="left">Left</SelectItem><SelectItem value="right">Right</SelectItem><SelectItem value="bottom-left">Bottom Left</SelectItem><SelectItem value="bottom">Bottom</SelectItem><SelectItem value="bottom-right">Bottom Right</SelectItem></SelectContent></Select>
                             </div>
                             <div>
                                <Label className="font-semibold">Rotation: <span className="font-bold text-primary">{rotation}°</span></Label>
                                <Slider value={[rotation]} onValueChange={([val]) => setRotation(val)} min={-180} max={180} step={5} disabled={isProcessing} />
                             </div>
                             <div>
                                <Label className="font-semibold">{watermarkType === 'text' ? 'Font Size' : 'Scale'}: <span className="font-bold text-primary">{fontSize}</span></Label>
                                <Slider value={[fontSize]} onValueChange={([val]) => setFontSize(val)} min={10} max={watermarkType==='text' ? 200 : 100} step={1} disabled={isProcessing} />
                             </div>
                             <div>
                                <Label className="font-semibold">Opacity: <span className="font-bold text-primary">{Math.round(opacity * 100)}%</span></Label>
                                <Slider value={[opacity]} onValueChange={([val]) => setOpacity(val)} min={0} max={1} step={0.05} disabled={isProcessing} />
                             </div>
                        </div>

                         <div className="pt-6 border-t h-[104px] flex flex-col justify-center">
                            <AnimatePresence mode="wait">
                            {isProcessing ? (
                                <motion.div key="progress" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.2 }} className="space-y-4">
                                    <div className="p-4 border rounded-lg bg-primary/5 space-y-2"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><Loader2 className="w-5 h-5 text-primary animate-spin" /><p className="text-sm font-medium text-primary">Adding watermark...</p></div><p className="text-sm font-medium text-primary">{Math.round(progress)}%</p></div><Progress value={progress} className="h-2" /></div>
                                    <Button size="sm" variant="destructive" onClick={() => operationId.current++} className="w-full"><Ban className="mr-2 h-4 w-4" />Cancel</Button>
                                </motion.div>
                            ) : (
                                <motion.div key="button" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.2 }}>
                                    <Button size="lg" className="w-full text-base font-bold" onClick={handleProcess} disabled={!file || isProcessing || file.isEncrypted}><Check className="mr-2 h-5 w-5" />Add Watermark</Button>
                                </motion.div>
                            )}
                            </AnimatePresence>
                         </div>
                    </CardContent>
                </Card>
            </div>
             <div className="lg:col-span-2">
                <Card className="bg-transparent shadow-lg h-full">
                    <CardHeader><CardTitle className="text-xl">Preview</CardTitle></CardHeader>
                    <CardContent className="h-full flex items-center justify-center">
                        {isLoadingPreview ? (<div className="flex flex-col items-center justify-center text-muted-foreground"><Loader2 className="w-8 h-8 animate-spin text-primary" /><p className="mt-2">Loading Preview...</p></div>) : previewUrl ? (<img src={previewUrl} alt="PDF Preview" className="max-w-full max-h-[calc(100vh-20rem)] border rounded-md shadow-md" />) : (<p className="text-muted-foreground">No preview available.</p>)}
                    </CardContent>
                </Card>
            </div>
         </div>
       )}
    </div>
  );
}
