
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
  Bold,
  Italic,
  Underline,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PDFDocument, rgb, StandardFonts, degrees, pushOperators, save, restore } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { Progress } from "./ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { Slider } from "./ui/slider";
import { Textarea } from "./ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";


if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();
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
type Layer = 'over' | 'under';

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16) / 255, g: parseInt(result[2], 16) / 255, b: parseInt(result[3], 16) / 255 }
    : { r: 0, g: 0, b: 0 };
};

const FONT_MAP: Record<Font, { normal: StandardFonts, bold: StandardFonts, italic: StandardFonts, boldItalic: StandardFonts }> = {
    Helvetica: { normal: StandardFonts.Helvetica, bold: StandardFonts.HelveticaBold, italic: StandardFonts.HelveticaOblique, boldItalic: StandardFonts.HelveticaBoldOblique },
    TimesRoman: { normal: StandardFonts.TimesRoman, bold: StandardFonts.TimesRomanBold, italic: StandardFonts.TimesRomanItalic, boldItalic: StandardFonts.TimesRomanBoldItalic },
    Courier: { normal: StandardFonts.Courier, bold: StandardFonts.CourierBold, italic: StandardFonts.CourierOblique, boldItalic: StandardFonts.CourierBoldOblique },
};

export function WatermarkAdder() {
  const [file, setFile] = useState<PDFFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [progress, setProgress] = useState(0);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const renderTask = useRef<pdfjsLib.RenderTask | null>(null);

  // Watermark options
  const [watermarkType, setWatermarkType] = useState<WatermarkType>("text");
  const [text, setText] = useState("CONFIDENTIAL");
  const [font, setFont] = useState<Font>("Helvetica");
  const [fontSize, setFontSize] = useState(50);
  const [textColor, setTextColor] = useState("#ff0000");
  const [opacity, setOpacity] = useState(0.5);
  const [rotation, setRotation] = useState(-45);
  const [position, setPosition] = useState<Position>('tile');
  const [layer, setLayer] = useState<Layer>('over');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [image, setImage] = useState<{file: File, preview: string, width: number, height: number} | null>(null);
  const [imageScale, setImageScale] =useState(50);
  
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(1);

  const operationId = useRef<number>(0);
  const { toast } = useToast();
  
  const drawPreview = useCallback(async () => {
    if (!file || !file.pdfjsDoc || !previewCanvasRef.current) return;
    
    if (renderTask.current) {
        renderTask.current.cancel();
    }

    const currentOperationId = ++operationId.current;
    setIsLoadingPreview(true);
    
    try {
      const page = await file.pdfjsDoc.getPage(1);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = previewCanvasRef.current;
      const context = canvas.getContext('2d');
      
      if(!context) return;
      
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      const task = page.render({ canvasContext: context, viewport });
      renderTask.current = task;
      await task.promise;
      renderTask.current = null;

      if (operationId.current !== currentOperationId) return;

      context.globalAlpha = opacity;
      
      const drawWatermark = (x: number, y: number) => {
        context.save();
        context.translate(x, y);
        context.rotate(rotation * Math.PI / 180);
        
        if (watermarkType === 'text' && text) {
            const selectedFont = `${isItalic ? 'italic ' : ''}${isBold ? 'bold ' : ''}${fontSize}px ${font}`;
            context.font = selectedFont;
            context.fillStyle = textColor;
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.fillText(text, 0, 0);

            if (isUnderline) {
                const metrics = context.measureText(text);
                context.beginPath();
                context.moveTo(-metrics.width/2, fontSize / 2);
                context.lineTo(metrics.width/2, fontSize / 2);
                context.strokeStyle = textColor;
                context.lineWidth = Math.max(1, fontSize / 15);
                context.stroke();
            }

        } else if (watermarkType === 'image' && image) {
             const img = new Image();
             img.src = image.preview;
             const scale = imageScale / 100;
             const imgWidth = image.width * scale;
             const imgHeight = image.height * scale;
             context.drawImage(img, -imgWidth/2, -imgHeight/2, imgWidth, imgHeight);
        }
        context.restore();
      };
      
      if (position === 'tile') {
          const gap = 150;
          for (let y = -canvas.height; y < canvas.height * 2; y += gap) {
              for (let x = -canvas.width; x < canvas.width * 2; x += gap * 2) {
                  drawWatermark(x, y);
              }
          }
      } else {
          const margin = 50;
          const positions = {
            'center': { x: canvas.width / 2, y: canvas.height / 2 },
            'top-left': { x: margin, y: margin },
            'top': { x: canvas.width / 2, y: margin },
            'top-right': { x: canvas.width - margin, y: margin },
            'left': { x: margin, y: canvas.height / 2 },
            'right': { x: canvas.width - margin, y: canvas.height / 2 },
            'bottom-left': { x: margin, y: canvas.height - margin },
            'bottom': { x: canvas.width / 2, y: canvas.height - margin },
            'bottom-right': { x: canvas.width - margin, y: canvas.height - margin },
          };
          const pos = positions[position];
          context.textAlign = position.includes('left') ? 'left' : position.includes('right') ? 'right' : 'center';
          context.textBaseline = position.includes('top') ? 'top' : position.includes('bottom') ? 'bottom' : 'middle';
          drawWatermark(pos.x, pos.y);
      }

    } catch(e: any) {
      if (e.name !== 'RenderingCancelledException') {
        console.error(e);
      }
    } finally {
      if(operationId.current === currentOperationId) {
        setIsLoadingPreview(false);
      }
    }
  }, [file, watermarkType, text, font, fontSize, textColor, isBold, isItalic, isUnderline, opacity, rotation, position, image, imageScale]);
  
  useEffect(() => {
    drawPreview();
  }, [drawPreview]);


  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if(acceptedFiles.length === 0) return;
    const singleFile = acceptedFiles[0];

    setFile(null);
    setIsProcessing(true);

    let isEncrypted = false;
    let pdfjsDoc: pdfjsLib.PDFDocumentProxy | null = null;
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
    
    const totalPages = pdfjsDoc ? pdfjsDoc.numPages : 0;
    setFile({ id: `${singleFile.name}-${Date.now()}`, file: singleFile, isEncrypted, pdfjsDoc: pdfjsDoc! });
    setStartPage(1);
    setEndPage(totalPages);
    setIsProcessing(false);
    toast({ variant: "success", title: "File Uploaded", description: `"${singleFile.name}" is ready.` });
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

  const onImageDrop = useCallback((acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
          const imageFile = acceptedFiles[0];
          if (imageFile.size > MAX_IMAGE_SIZE_BYTES) {
              toast({ variant: "destructive", title: "Image too large", description: `Please select an image smaller than ${MAX_IMAGE_SIZE_BYTES / 1024 / 1024}MB.` });
              return;
          }
          const reader = new FileReader();
          reader.onloadend = () => {
            const img = new Image();
            img.src = reader.result as string;
            img.onload = () => {
              setImage({file: imageFile, preview: reader.result as string, width: img.width, height: img.height});
            }
          };
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
      
      const effectiveStart = Math.max(1, startPage);
      const effectiveEnd = Math.min(pages.length, endPage);

      let watermarkImage: any = null;
      if (watermarkType === 'image' && image) {
        const imageBytes = await image.file.arrayBuffer();
        watermarkImage = image.file.type === 'image/png'
          ? await pdfDoc.embedPng(imageBytes)
          : await pdfDoc.embedJpg(imageBytes);
      } else if (watermarkType === 'image' && !image) {
          throw new Error("Please select an image for the watermark.");
      }

      let selectedFont = FONT_MAP[font].normal;
      if(isBold && isItalic) selectedFont = FONT_MAP[font].boldItalic;
      else if(isBold) selectedFont = FONT_MAP[font].bold;
      else if(isItalic) selectedFont = FONT_MAP[font].italic;

      const embeddedFont = watermarkType === 'text' && text ? await pdfDoc.embedFont(selectedFont) : null;
      const colorRgb = hexToRgb(textColor);

      const pageIndices = Array.from({length: (effectiveEnd - effectiveStart) + 1}, (_, i) => effectiveStart + i - 1);

      for (const i of pageIndices) {
        if (operationId.current !== currentOperationId) return;

        const page = pages[i];
        
        const drawWatermarkOnPage = (target: typeof page) => {
            const { width: pageWidth, height: pageHeight } = target.getSize();
            const options: any = {
                rotate: degrees(rotation),
                opacity,
            };
            
            let contentWidth = 0;
            let contentHeight = 0;

            if (watermarkType === 'text' && text && embeddedFont) {
                options.font = embeddedFont;
                options.size = fontSize;
                options.color = rgb(colorRgb.r, colorRgb.g, colorRgb.b);
                contentWidth = embeddedFont.widthOfTextAtSize(text, fontSize);
                contentHeight = embeddedFont.heightAtSize(fontSize);
            } else if (watermarkType === 'image' && watermarkImage) {
                const scale = imageScale / 100;
                contentWidth = watermarkImage.width * scale;
                contentHeight = watermarkImage.height * scale;
                options.width = contentWidth;
                options.height = contentHeight;
            }

            const drawCommands = (x:number, y:number) => {
                const drawOptions = {...options, x, y };
                if (watermarkType === 'text' && text) target.drawText(text, drawOptions);
                else if (watermarkType === 'image' && watermarkImage) target.drawImage(watermarkImage, drawOptions);
            };

            if (position === 'tile') {
                const gap = 150;
                for (let y = 0; y < pageHeight + contentHeight; y += gap) {
                    for (let x = 0; x < pageWidth + contentWidth; x += gap * 2) {
                        drawCommands(x - contentWidth, y - contentHeight);
                    }
                }
            } else {
                const margin = 50;
                let x = 0, y = 0;

                const vAlign = position.split('-')[0];
                const hAlign = position.split('-').length > 1 ? position.split('-')[1] : 'center';

                if (vAlign === 'top') y = pageHeight - contentHeight - margin;
                else if (vAlign === 'bottom') y = margin;
                else y = (pageHeight - contentHeight) / 2;

                if (hAlign === 'left') x = margin;
                else if (hAlign === 'right') x = pageWidth - contentWidth - margin;
                else x = (pageWidth - contentWidth) / 2;

                if(position === 'top') x = (pageWidth - contentWidth) / 2;
                if(position === 'bottom') x = (pageWidth - contentWidth) / 2;
                if(position === 'left') y = (pageHeight - contentHeight) / 2;
                if(position === 'right') y = (pageHeight - contentHeight) / 2;


                drawCommands(x, y);
            }
        };

        if (layer === 'under') {
          page.pushOperators(save());
          drawWatermarkOnPage(page);
          page.pushOperators(restore());
        } else {
          drawWatermarkOnPage(page);
        }

        setProgress(Math.round(((pageIndices.indexOf(i) + 1) / pageIndices.length) * 100));
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
  };
  
  const totalPages = file?.pdfjsDoc?.numPages || 0;
  const positions: Position[] = ['top-left', 'top', 'top-right', 'left', 'center', 'right', 'bottom-left', 'bottom', 'bottom-right'];

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
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <div className="flex flex-col gap-6 overflow-hidden">
                <Card className="bg-transparent shadow-lg shrink-0">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="max-w-full overflow-hidden">
                            <CardTitle className="text-base sm:text-lg">Uploaded File</CardTitle>
                            <CardDescription className="truncate text-xs" title={file.file.name}>{file.file.name}</CardDescription>
                        </div>
                         <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground/70 hover:bg-destructive/10 hover:text-destructive shrink-0" onClick={removeFile} disabled={isProcessing}>
                            <X className="w-4 h-4" />
                        </Button>
                    </CardHeader>
                    {file.isEncrypted && (
                       <CardContent>
                         <div className="flex items-center gap-3 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3 text-sm text-yellow-700 dark:text-yellow-400">
                            <ShieldAlert className="h-5 w-5 shrink-0" />
                            <div>This PDF is password-protected and cannot be processed.</div>
                        </div>
                       </CardContent>
                    )}
                </Card>
                <Card className="bg-transparent shadow-lg flex-grow overflow-hidden flex flex-col">
                    <CardHeader><CardTitle className="text-base sm:text-lg">Watermark Options</CardTitle></CardHeader>
                    <CardContent className="flex-grow overflow-y-auto pr-2">
                      <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
                        <AccordionItem value="item-1">
                          <AccordionTrigger className="text-base">Watermark Type</AccordionTrigger>
                          <AccordionContent className="space-y-4 pt-2">
                             <Label className="text-sm font-semibold">Type</Label>
                             <Select value={watermarkType} onValueChange={(v) => setWatermarkType(v as WatermarkType)} disabled={isProcessing}>
                               <SelectTrigger>
                                <SelectValue placeholder="Select watermark type" />
                               </SelectTrigger>
                               <SelectContent>
                                 <SelectItem value="text"><div className="flex items-center gap-2"><Type className="w-4 h-4"/>Text</div></SelectItem>
                                 <SelectItem value="image"><div className="flex items-center gap-2"><FileImage className="w-4 h-4"/>Image</div></SelectItem>
                               </SelectContent>
                             </Select>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                           <AccordionTrigger className="text-base">{watermarkType === 'text' ? 'Text Options' : 'Image Options'}</AccordionTrigger>
                           <AccordionContent className="space-y-4 pt-4">
                             <AnimatePresence mode="wait">
                               <motion.div key={watermarkType} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden">
                                {watermarkType === 'text' ? (
                                    <div className="space-y-4">
                                        <div><Label htmlFor="watermark-text" className="text-sm font-semibold">Text</Label><Textarea id="watermark-text" value={text} onChange={(e) => setText(e.target.value)} disabled={isProcessing} className="mt-1" /></div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div><Label htmlFor="font" className="text-sm font-semibold">Font</Label><Select value={font} onValueChange={v => setFont(v as Font)} disabled={isProcessing}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Helvetica">Helvetica</SelectItem><SelectItem value="TimesRoman">Times New Roman</SelectItem><SelectItem value="Courier">Courier</SelectItem></SelectContent></Select></div>
                                            <div><Label className="text-sm font-semibold">Style</Label><div className="mt-1 flex items-center gap-2"><Button variant={isBold ? "secondary" : "outline"} size="icon" onClick={() => setIsBold(!isBold)} disabled={isProcessing}><Bold className="w-4 h-4" /></Button><Button variant={isItalic ? "secondary" : "outline"} size="icon" onClick={() => setIsItalic(!isItalic)} disabled={isProcessing}><Italic className="w-4 h-4" /></Button><Button variant={isUnderline ? "secondary" : "outline"} size="icon" onClick={() => setIsUnderline(!isUnderline)} disabled={isProcessing}><Underline className="w-4-4" /></Button></div></div>
                                        </div>
                                        <div><Label htmlFor="textColor" className="text-sm font-semibold">Color</Label><div className="relative mt-1"><Input id="textColor" type="text" value={textColor} onChange={e => setTextColor(e.target.value)} className="w-full pr-12" disabled={isProcessing}/><Input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-10 p-0 cursor-pointer" disabled={isProcessing}/></div></div>
                                        <div><Label className="text-sm font-semibold">Font Size: <span className="font-bold text-primary">{fontSize}</span></Label><Slider value={[fontSize]} onValueChange={([val]) => setFontSize(val)} min={10} max={200} step={1} disabled={isProcessing} /></div>
                                    </div>
                                ) : (
                                     <div className="space-y-4">
                                        <Label className="text-sm font-semibold">Image</Label>
                                        <div {...getImageRootProps()} className={cn("p-4 rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer", isImageDragActive && "border-primary")}>
                                            <input {...getImageInputProps()} />
                                            {image ? <img src={image.preview} alt="Watermark Preview" className="max-h-24 rounded"/> : <><FileImage className="w-8 h-8 text-muted-foreground"/><p className="text-xs text-muted-foreground mt-2">Drop image here or click</p></>
                                            }
                                        </div>
                                        <div><Label className="text-sm font-semibold">Scale: <span className="font-bold text-primary">{imageScale}%</span></Label><Slider value={[imageScale]} onValueChange={([val]) => setImageScale(val)} min={10} max={200} step={1} disabled={isProcessing || !image} /></div>
                                    </div>
                                )}
                             </motion.div>
                             </AnimatePresence>
                           </AccordionContent>
                        </AccordionItem>
                         <AccordionItem value="item-3">
                            <AccordionTrigger className="text-base">Style & Placement</AccordionTrigger>
                            <AccordionContent className="space-y-4 pt-4">
                                <div><Label className="text-sm font-semibold">Position</Label><Select value={position} onValueChange={v => setPosition(v as Position)} disabled={isProcessing}><SelectTrigger className="mt-1"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="tile">Tile</SelectItem><SelectItem value="center">Center</SelectItem></SelectContent></Select></div>
                                {position !== 'tile' && <div><Label className="text-sm font-semibold">Grid</Label><div className="mt-1 grid grid-cols-3 grid-rows-3 gap-1 p-1 rounded-lg bg-muted aspect-square w-[78px]">{positions.map(p => ( <button key={p} onClick={() => setPosition(p)} disabled={isProcessing} className="rounded-md transition-colors relative flex items-center justify-center group"><span className={cn("absolute inset-0.5 rounded-[5px] transition-colors", position === p ? "bg-primary" : "group-hover:bg-muted-foreground/20")}></span></button> ))}</div></div>}
                                <div><Label className="text-sm font-semibold">Rotation: <span className="font-bold text-primary">{rotation}°</span></Label><Slider value={[rotation]} onValueChange={([val]) => setRotation(val)} min={-180} max={180} step={5} disabled={isProcessing} /></div>
                                <div><Label className="text-sm font-semibold">Opacity: <span className="font-bold text-primary">{Math.round(opacity * 100)}%</span></Label><Slider value={[opacity]} onValueChange={([val]) => setOpacity(val)} min={0} max={1} step={0.05} disabled={isProcessing} /></div>
                            </AccordionContent>
                         </AccordionItem>
                         <AccordionItem value="item-4">
                           <AccordionTrigger className="text-base">Pages & Layering</AccordionTrigger>
                           <AccordionContent className="space-y-4 pt-4">
                             <div>
                                <Label className="text-sm font-semibold">Pages to apply watermark</Label>
                                <div className="grid grid-cols-2 gap-2 mt-1">
                                    <Input placeholder="Start" type="number" value={startPage} min="1" max={totalPages || 1} onChange={e => setStartPage(Math.max(1, parseInt(e.target.value)) || 1)} disabled={isProcessing || file.isEncrypted}/>
                                    <Input placeholder="End" type="number" value={endPage} min={startPage} max={totalPages || 1} onChange={e => setEndPage(Math.max(startPage, parseInt(e.target.value)) || startPage)} disabled={isProcessing || file.isEncrypted}/>
                                </div>
                             </div>
                              <div><Label className="text-sm font-semibold">Layer</Label><Select value={layer} onValueChange={(v) => setLayer(v as Layer)}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="over">Over Content</SelectItem><SelectItem value="under">Under Content</SelectItem></SelectContent></Select></div>
                           </AccordionContent>
                         </AccordionItem>
                      </Accordion>
                      <div className="pt-6 border-t mt-4 h-[104px] flex flex-col justify-center">
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
             <div className="lg:col-span-1 h-full flex flex-col">
                <Card className="bg-transparent shadow-lg h-full flex flex-col">
                    <CardHeader><CardTitle className="text-base sm:text-lg">Live Preview (First Page)</CardTitle></CardHeader>
                    <CardContent className="h-full flex-grow flex items-center justify-center p-4 bg-muted/50 rounded-b-lg overflow-hidden">
                       <div className="relative w-full h-full flex items-center justify-center">
                          <canvas ref={previewCanvasRef} className="max-w-full max-h-full object-contain border rounded-md shadow-md bg-white"/>
                          {isLoadingPreview && <div className="absolute inset-0 flex items-center justify-center bg-background/50"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>}
                       </div>
                    </CardContent>
                </Card>
            </div>
         </div>
       )}
    </div>
  );
}

    