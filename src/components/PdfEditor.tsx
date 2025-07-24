
"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud,
  Save,
  X,
  Loader2,
  Type,
  Image as ImageIcon,
  Square,
  Circle as CircleIcon,
  Trash2,
  FolderOpen,
  Lock,
  ShieldAlert,
} from "lucide-react";
import { fabric } from 'fabric';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { Skeleton } from "./ui/skeleton";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

const MAX_FILE_SIZE_MB = 100;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

type PageInfo = {
  originalIndex: number;
  dataUrl?: string;
  id: string;
};

type PDFFile = {
  id: string;
  file: File;
  totalPages: number;
  pdfjsDoc?: pdfjsLib.PDFDocumentProxy;
  isEncrypted: boolean;
};

type EditorState = {
  file: PDFFile | null;
  pages: PageInfo[];
  activePage: number;
  isLoading: boolean;
  isSaving: boolean;
  selectedObject: fabric.Object | null;
};

export function PdfEditor() {
  const [state, setState] = useState<EditorState>({
    file: null,
    pages: [],
    activePage: 0,
    isLoading: false,
    isSaving: false,
    selectedObject: null,
  });
  const { file, pages, activePage, isLoading, isSaving, selectedObject } = state;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);

  const operationId = useRef<number>(0);
  const { toast } = useToast();

  const renderPageThumbnail = useCallback(async (pdfjsDoc: pdfjsLib.PDFDocumentProxy, pageNum: number, currentOperationId: number) => {
    if (operationId.current !== currentOperationId) return undefined;
    try {
      const page = await pdfjsDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 0.3 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext('2d');
      if (context) {
        await page.render({ canvasContext: context, viewport }).promise;
        return canvas.toDataURL('image/jpeg', 0.8);
      }
    } catch (e) {
      console.error(`Error rendering page thumbnail ${pageNum}:`, e);
    }
    return undefined;
  }, []);

  const loadPdf = useCallback(async (fileToLoad: File) => {
    const currentOperationId = ++operationId.current;
    if (file?.pdfjsDoc) file.pdfjsDoc.destroy();
    setState(s => ({ ...s, file: null, pages: [], isLoading: true, activePage: 0, selectedObject: null }));
    if (fabricCanvas) fabricCanvas.clear();


    try {
      const pdfBytes = await fileToLoad.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfBytes) });
      const pdfjsDoc = await loadingTask.promise;

      if (operationId.current !== currentOperationId) {
        pdfjsDoc.destroy();
        return;
      }

      const pageCount = pdfjsDoc.numPages;
      const initialPages: PageInfo[] = Array.from({ length: pageCount }, (_, i) => ({
        originalIndex: i,
        id: `${i}-${Date.now()}`,
      }));

      setState(s => ({
        ...s,
        file: {
          id: `${fileToLoad.name}-${Date.now()}`,
          file: fileToLoad,
          totalPages: pageCount,
          pdfjsDoc,
          isEncrypted: false,
        },
        pages: initialPages,
        isLoading: false
      }));

    } catch (error: any) {
      if (operationId.current !== currentOperationId) return;
      if (error.name === 'PasswordException') {
        setState(s => ({
            ...s,
            file: {
              id: `${fileToLoad.name}-${Date.now()}`,
              file: fileToLoad,
              totalPages: 0,
              isEncrypted: true,
              pdfjsDoc: undefined,
            },
            isLoading: false
        }))
        toast({ variant: "destructive", title: "Encrypted PDF", description: "This file is password-protected and cannot be edited." });
      } else {
        console.error("Failed to load PDF", error);
        toast({ variant: "destructive", title: "Could not read PDF", description: "The file might be corrupted or in an unsupported format." });
        setState(s => ({ ...s, isLoading: false }));
      }
    }
  }, [file?.pdfjsDoc, toast, fabricCanvas]);


  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const singleFile = acceptedFiles[0];
    loadPdf(singleFile);
  }, [loadPdf]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxSize: MAX_FILE_SIZE_BYTES,
    multiple: false,
    noClick: true,
    noKeyboard: true,
    disabled: isLoading || isSaving,
  });

  const onPageVisible = useCallback((id: string) => {
    if (!file || isLoading || !file.pdfjsDoc) return;
    const currentOperationId = operationId.current;

    setState(prev => {
      const pageIndex = prev.pages.findIndex(p => p.id === id);
      if (pageIndex === -1 || prev.pages[pageIndex].dataUrl) {
        return prev;
      }
      
      renderPageThumbnail(file.pdfjsDoc!, pageIndex + 1, currentOperationId).then(dataUrl => {
        if (dataUrl && operationId.current === currentOperationId) {
          setState(current => {
            const latestIndex = current.pages.findIndex(p => p.id === id);
            if (latestIndex > -1) {
              const finalPages = [...current.pages];
              finalPages[latestIndex] = { ...finalPages[latestIndex], dataUrl };
              return { ...current, pages: finalPages };
            }
            return current;
          });
        }
      });
      return prev;
    });
  }, [file, renderPageThumbnail, isLoading]);

  const handleSave = async () => {
    if (!file || !fabricCanvas) return;
    setState(s => ({...s, isSaving: true}));

    try {
      const pdfBytes = await file.file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      
      const page = pdfDoc.getPages()[activePage];
      const { width: pageWidth, height: pageHeight } = page.getSize();
      const canvasScale = Math.min(fabricCanvas.getWidth() / pageWidth, fabricCanvas.getHeight() / pageHeight);

      const fabricObjects = fabricCanvas.getObjects();
      for (const obj of fabricObjects) {
        if (!obj.left || !obj.top) continue;

        const scaleX = obj.scaleX || 1;
        const scaleY = obj.scaleY || 1;
        const left = obj.left / canvasScale;
        const top = obj.top / canvasScale;
        const angle = obj.angle || 0;

        if (obj.type === 'textbox') {
            const textbox = obj as fabric.Textbox;
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const fontSize = (textbox.fontSize || 12) / canvasScale * scaleY; // Apply scale to font size
            page.drawText(textbox.text || '', {
                x: left,
                y: pageHeight - top - (fontSize),
                font,
                size: fontSize,
                color: textbox.fill ? fabricColorToRgb(textbox.fill as string) : rgb(0,0,0),
                lineHeight: (textbox.lineHeight || 1) * fontSize,
                rotate: degrees(-angle),
            });
        } else if (obj.type === 'rect') {
            page.drawRectangle({
                x: left,
                y: pageHeight - top - ((obj.height || 0) * scaleY),
                width: (obj.width || 0) * scaleX,
                height: (obj.height || 0) * scaleY,
                fillColor: obj.fill ? fabricColorToRgb(obj.fill as string) : undefined,
                borderColor: obj.stroke ? fabricColorToRgb(obj.stroke as string) : undefined,
                borderWidth: obj.strokeWidth,
                rotate: degrees(-angle),
            });
        } else if (obj.type === 'circle') {
             page.drawCircle({
                x: left + ((obj.radius || 0) * scaleX),
                y: pageHeight - top - ((obj.radius || 0) * scaleY),
                radius: (obj.radius || 0) * scaleX, // Use consistent scaling
                fillColor: obj.fill ? fabricColorToRgb(obj.fill as string) : undefined,
                borderColor: obj.stroke ? fabricColorToRgb(obj.stroke as string) : undefined,
                borderWidth: obj.strokeWidth,
            });
        } else if (obj.type === 'image') {
            const imageObj = obj as fabric.Image;
            const imageEl = imageObj.getElement();
            const imageBytes = await fetch(imageEl.src).then(res => res.arrayBuffer());
            
            let pdfImage;
            if (imageEl.src.startsWith('data:image/jpeg')) {
                pdfImage = await pdfDoc.embedJpg(imageBytes);
            } else {
                pdfImage = await pdfDoc.embedPng(imageBytes);
            }

            page.drawImage(pdfImage, {
                x: left,
                y: pageHeight - top - (imageObj.getScaledHeight() / canvasScale),
                width: imageObj.getScaledWidth() / canvasScale,
                height: imageObj.getScaledHeight() / canvasScale,
                rotate: degrees(-angle)
            });
        }
      }

      const newPdfBytes = await pdfDoc.save();
      const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `${file.file.name.replace(/\.pdf$/i, '')}_edited.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({ title: "Successfully saved!", description: "Your edited PDF has been downloaded." });
    } catch (e: any) {
      console.error("Failed to save PDF", e);
      toast({ variant: "destructive", title: "Failed to save PDF.", description: "An unexpected error occurred. " + e.message });
    } finally {
      setState(s => ({...s, isSaving: false}));
    }
  };

  const removeFile = () => {
    operationId.current++;
    if (file?.pdfjsDoc) file.pdfjsDoc.destroy();
    if(fabricCanvas) fabricCanvas.clear();
    setState({ file: null, pages: [], activePage: 0, isLoading: false, isSaving: false, selectedObject: null });
  };

  // Initialize Fabric canvas
  const canvasContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
        const canvasEl = canvasRef.current;
        if(canvasEl) {
            const canvas = new fabric.Canvas(canvasEl);
            setFabricCanvas(canvas);

            const handleSelection = (e: fabric.IEvent) => setState(s => ({...s, selectedObject: e.selected?.[0] || null }));
            const handleSelectionCleared = () => setState(s => ({...s, selectedObject: null }));

            canvas.on('selection:created', handleSelection);
            canvas.on('selection:updated', handleSelection);
            canvas.on('selection:cleared', handleSelectionCleared);
        }
    }
  }, []);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if((e.key === 'Delete' || e.key === 'Backspace') && fabricCanvas?.getActiveObject()) {
            fabricCanvas.remove(fabricCanvas.getActiveObject()!);
        }
    }
    window.addEventListener('keydown', handleKeyDown);

    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        fabricCanvas?.dispose();
    }
  }, [fabricCanvas]);

  // Render PDF page to canvas background
  useEffect(() => {
    if (!file?.pdfjsDoc || !fabricCanvas || !canvasContainerRef) return;
    
    const renderCanvas = async () => {
        fabricCanvas.clear();
        
        try {
            const page = await file.pdfjsDoc!.getPage(activePage + 1);
            const container = fabricCanvas.getElement().parentElement?.parentElement;
            if (!container) return;

            const containerWidth = container.offsetWidth - 16;
            const containerHeight = container.offsetHeight - 16;

            let viewport = page.getViewport({ scale: 1 });
            const scale = Math.min(containerWidth / viewport.width, containerHeight / viewport.height, 1);
            viewport = page.getViewport({ scale });
            
            fabricCanvas.setWidth(viewport.width);
            fabricCanvas.setHeight(viewport.height);

            const bgCanvas = document.createElement('canvas');
            bgCanvas.width = viewport.width;
            bgCanvas.height = viewport.height;
            const bgCtx = bgCanvas.getContext('2d');
            
            if (!bgCtx) return;

            await page.render({ canvasContext: bgCtx, viewport }).promise;

            fabric.Image.fromURL(bgCanvas.toDataURL(), (img) => {
                fabricCanvas.setBackgroundImage(img, fabricCanvas.renderAll.bind(fabricCanvas), {
                    scaleX: fabricCanvas.width! / img.width!,
                    scaleY: fabricCanvas.height! / img.height!,
                });
            });

        } catch (error) {
            console.error("Failed to render page to canvas:", error);
            toast({ variant: 'destructive', title: 'Preview Error', description: 'Could not render the selected page.' });
        }
    };
    
    renderCanvas();
  }, [activePage, file, fabricCanvas, toast]);

  
  const fabricColorToRgb = (color: string) => {
    const fColor = new fabric.Color(color);
    const [r, g, b] = fColor.getSource();
    return rgb(r / 255, g / 255, b / 255);
  };

  const addText = () => {
    if (!fabricCanvas) return;
    const textbox = new fabric.Textbox('Type something...', {
      left: 50,
      top: 50,
      width: 150,
      fontSize: 20,
      fill: '#000000',
    });
    fabricCanvas.add(textbox);
    fabricCanvas.setActiveObject(textbox);
  }
  
  const addShape = (type: 'rect' | 'circle') => {
    if(!fabricCanvas) return;
    let shape;
    if(type === 'rect') {
        shape = new fabric.Rect({ left: 100, top: 100, fill: '#0000ff', width: 60, height: 70, stroke: '#000000', strokeWidth: 1 });
    } else {
        shape = new fabric.Circle({ left: 100, top: 100, fill: '#ff0000', radius: 50, stroke: '#000000', strokeWidth: 1 });
    }
    fabricCanvas.add(shape);
  }

  const addImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            const imgData = event.target?.result as string;
            fabric.Image.fromURL(imgData, (img) => {
                fabricCanvas?.add(img);
            });
        };
        reader.readAsDataURL(file);
    }
    e.target.value = ''; // Reset input
  }

  const updateSelectedObject = (props: any) => {
    const activeObj = fabricCanvas?.getActiveObject();
    if(activeObj) {
        activeObj.set(props);
        fabricCanvas?.renderAll();
    }
  }

  const deleteSelectedObject = () => {
    const activeObj = fabricCanvas?.getActiveObject();
    if(activeObj) {
        fabricCanvas?.remove(activeObj);
    }
  }

  return (
    <div className="space-y-6">
      {!file && !isLoading ? (
        <Card className="bg-white dark:bg-card shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Edit PDF</CardTitle>
            <CardDescription>Upload a PDF to start editing.</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={cn("flex flex-col items-center justify-center p-6 sm:p-10 rounded-lg border-2 border-dashed transition-colors duration-300", !isLoading && "hover:border-primary/50", isDragActive && "border-primary bg-primary/10", (isLoading || isSaving) && "opacity-70 pointer-events-none")}>
              <input {...getInputProps()} />
              <UploadCloud className="w-10 h-10 text-muted-foreground sm:w-12 sm:h-12" />
              <p className="mt-2 text-base font-semibold text-foreground sm:text-lg">Drop a PDF file here</p>
              <p className="text-xs text-muted-foreground sm:text-sm">or click the button below</p>
              <Button type="button" onClick={open} className="mt-4" disabled={isLoading || isSaving}><FolderOpen className="mr-2 h-4 w-4" />Choose File</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="sticky top-20 z-20 bg-background/80 backdrop-blur-sm">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 md:p-4">
              <div className="flex-grow min-w-0">
                <CardTitle className="text-base sm:text-lg truncate" title={file?.file.name}>
                  Editing: <span className="font-normal">{file?.file.name || 'Loading...'}</span>
                </CardTitle>
              </div>
              <div className="flex gap-2 self-end sm:self-center">
                <Button variant="ghost" size="icon" className="w-9 h-9 text-muted-foreground/80 hover:bg-destructive/10 hover:text-destructive shrink-0" onClick={removeFile} disabled={isSaving || isLoading}><X className="w-5 h-5" /><span className="sr-only">Change File</span></Button>
                <Button size="sm" onClick={handleSave} disabled={isSaving || isLoading || !file || file.isEncrypted}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save</Button>
              </div>
            </CardHeader>
          </Card>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/4 lg:w-1/5 space-y-4">
              <Card className="p-2">
                <CardContent className="p-2 max-h-[70vh] overflow-y-auto">
                  {isLoading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="w-full aspect-[7/10] mb-2" />)
                    : file?.isEncrypted ? <div className="flex items-center justify-center p-4 text-center text-muted-foreground"><ShieldAlert className="w-8 h-8 mx-auto mb-2 text-destructive" /><p>This PDF is encrypted and cannot be edited.</p></div>
                      : pages.map((page, index) => (
                        <PageThumbnail key={page.id} page={page} index={index} isActive={activePage === index} onSelect={() => setState(s => ({...s, activePage: index}))} onVisible={onPageVisible} />
                      ))}
                </CardContent>
              </Card>
            </div>

            <div className="flex-1 flex flex-col gap-4">
              <Card className="p-2">
                <div className="p-2 border-b flex items-center gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={addText} disabled={isLoading || isSaving || file?.isEncrypted}><Type className="mr-2 h-4 w-4" />Text</Button>
                  <Button variant="outline" size="sm" onClick={() => addShape('rect')} disabled={isLoading || isSaving || file?.isEncrypted}><Square className="mr-2 h-4 w-4" />Rectangle</Button>
                   <Button variant="outline" size="sm" onClick={() => addShape('circle')} disabled={isLoading || isSaving || file?.isEncrypted}><CircleIcon className="mr-2 h-4 w-4" />Circle</Button>
                   <Button asChild variant="outline" size="sm" disabled={isLoading || isSaving || file?.isEncrypted}><label htmlFor="image-upload" className="cursor-pointer"><ImageIcon className="mr-2 h-4 w-4" />Image</label></Button>
                   <input type="file" id="image-upload" className="hidden" accept="image/png, image/jpeg" onChange={addImage} />
                   {selectedObject && <Button variant="destructive" size="sm" onClick={deleteSelectedObject}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>}
                </div>
                 {selectedObject && (
                    <div className="p-2 flex items-center gap-4 flex-wrap">
                        {selectedObject.type === 'textbox' && (
                            <>
                                <Label>Font Size:</Label>
                                <Input type="number" value={(selectedObject as fabric.Textbox).fontSize} onChange={e => updateSelectedObject({fontSize: parseInt(e.target.value)})} className="w-20" aria-label="Font Size" />
                                <Label>Color:</Label>
                                <Input type="color" value={(selectedObject as fabric.Textbox).fill as string} onChange={e => updateSelectedObject({fill: e.target.value})} className="w-12 h-8 p-1" aria-label="Text Color" />
                            </>
                        )}
                         {(selectedObject.type === 'rect' || selectedObject.type === 'circle') && (
                            <>
                                <Label>Fill:</Label>
                                <Input type="color" value={selectedObject.fill as string} onChange={e => updateSelectedObject({fill: e.target.value})} className="w-12 h-8 p-1" aria-label="Fill Color" />
                                <Label>Stroke:</Label>
                                <Input type="color" value={selectedObject.stroke as string} onChange={e => updateSelectedObject({stroke: e.target.value})} className="w-12 h-8 p-1" aria-label="Stroke Color" />
                            </>
                        )}
                    </div>
                )}
              </Card>
              <Card className="flex-1 p-2">
                <div ref={canvasContainerRef} className="p-2 mt-2 bg-muted/50 flex justify-center items-center overflow-auto h-[70vh]">
                  {isLoading ? <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    : file?.isEncrypted ? <div className="flex items-center justify-center h-full text-center text-muted-foreground"><ShieldAlert className="w-10 h-10 mx-auto mb-2 text-destructive" /><p>Editing is disabled for encrypted files.</p></div>
                      : <canvas ref={canvasRef} />}
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const PageThumbnail = React.memo(({ page, index, isActive, onSelect, onVisible }: { page: PageInfo, index: number, isActive: boolean, onSelect: () => void, onVisible: (id: string) => void }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !page.dataUrl) {
        onVisible(page.id);
        if (ref.current) observer.unobserve(ref.current);
      }
    }, { threshold: 0.1 });

    const currentRef = ref.current;
    if (currentRef) observer.observe(currentRef);

    return () => { if (currentRef) observer.unobserve(currentRef); };
  }, [page.id, page.dataUrl, onVisible]);

  return (
    <div ref={ref} onClick={onSelect} className={cn("relative rounded-md overflow-hidden border-2 transition-all aspect-[7/10] bg-muted group shadow-sm cursor-pointer mb-2", isActive ? "border-primary" : "border-transparent hover:border-primary/50")}>
      <div className="w-full h-full flex items-center justify-center p-1 bg-white">
        {page.dataUrl ? (<img src={page.dataUrl} alt={`Page ${page.originalIndex + 1}`} className="w-full h-full object-contain" />)
          : (<div className="flex flex-col items-center gap-1 text-xs text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin text-primary" /> Page {index + 1}</div>)}
      </div>
      <div className="absolute bottom-0 left-0 bg-background/80 text-foreground text-xs font-bold rounded-tr-md px-2 py-1 flex items-center justify-center border-t border-r shadow">
        {index + 1}
      </div>
    </div>
  );
});
PageThumbnail.displayName = 'PageThumbnail';
