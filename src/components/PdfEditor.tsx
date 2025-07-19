
"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud,
  Download,
  X,
  Save,
  Loader2,
  FolderOpen,
  Lock,
  Type,
  ImageIcon,
  Square,
  MousePointer,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PDFDocument, rgb, StandardFonts, PageSizes, PDFFont } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { Skeleton } from "./ui/skeleton";
import { PasswordDialog } from "./PasswordDialog";
import { FabricJSCanvas, useFabricJSEditor } from 'fabricjs-react';
import { fabric } from 'fabric';

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

const MAX_FILE_SIZE_MB = 100;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

type PDFFile = {
  id: string;
  file: File;
  totalPages: number;
  pdfjsDoc?: pdfjsLib.PDFDocumentProxy;
  isEncrypted: boolean;
};

type EditMode = 'select' | 'text' | 'image' | 'shape';

// Store objects per page
type EditorObjects = Record<number, any>;

export function PdfEditor() {
  const [file, setFile] = useState<PDFFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  
  const [activePage, setActivePage] = useState<number>(1);
  const [pagePreviews, setPagePreviews] = useState<{page: number, url: string}[]>([]);

  const [editMode, setEditMode] = useState<EditMode>('select');
  const [objects, setObjects] = useState<EditorObjects>({});

  const { editor, onReady } = useFabricJSEditor();
  const operationId = useRef<number>(0);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const cleanup = useCallback(() => {
    setFile(null);
    setIsLoading(false);
    setPagePreviews([]);
    setActivePage(1);
    setObjects({});
    editor?.clear();
  }, [editor]);

  useEffect(() => {
    // Component unmount cleanup
    return () => {
      if (file?.pdfjsDoc) {
        file.pdfjsDoc.destroy();
      }
      editor?.dispose();
    };
  }, [file, editor]);


  const renderPage = useCallback(async (pdfjsDoc: pdfjsLib.PDFDocumentProxy, pageNum: number, currentOperationId: number, scale = 1.5): Promise<string | null> => {
    if (operationId.current !== currentOperationId) return null;
    try {
      const page = await pdfjsDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext('2d');
      if (context) {
        await page.render({ canvasContext: context, viewport }).promise;
        return canvas.toDataURL('image/jpeg', 0.9);
      }
    } catch (e) {
      console.error(`Error rendering page ${pageNum}:`, e);
    }
    return null;
  }, []);
  
  const setCanvasBackground = useCallback(async (pageNum: number) => {
    if (!file?.pdfjsDoc || !editor) return;

    const currentOperationId = ++operationId.current;
    
    // Show loader for main canvas
    editor.clear();
    editor.setBackgroundImage(null, editor.renderAll.bind(editor));

    const page = await file.pdfjsDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.5 });
    
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext('2d');
    
    if (context) {
      await page.render({ canvasContext: context, viewport }).promise;
       if (operationId.current !== currentOperationId) return;

      const bgImg = new fabric.Image(canvas, {
          selectable: false,
          evented: false,
      });

      editor.setWidth(viewport.width);
      editor.setHeight(viewport.height);
      editor.setBackgroundImage(bgImg, editor.renderAll.bind(editor));
    }
  }, [file?.pdfjsDoc, editor]);


  const loadPdf = useCallback(async (fileToLoad: File) => {
    cleanup();
    const currentOperationId = ++operationId.current;
    setIsLoading(true);

    try {
      const pdfBytes = await fileToLoad.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfBytes) });
      const pdfjsDoc = await loadingTask.promise; 
      
      if (operationId.current !== currentOperationId) {
        pdfjsDoc.destroy();
        return;
      }
      
      const pageCount = pdfjsDoc.numPages;
      setFile({ 
        id: `${fileToLoad.name}-${Date.now()}`, 
        file: fileToLoad, 
        totalPages: pageCount,
        pdfjsDoc,
        isEncrypted: false,
      });
      setActivePage(1);

      // Render first page immediately for active view
      await setCanvasBackground(1);

      // Render all previews
      const previewPromises = Array.from({length: pageCount}, (_, i) => renderPage(pdfjsDoc, i + 1, currentOperationId, 0.3));
      const urls = await Promise.all(previewPromises);
      const previews = urls.map((url, i) => ({ page: i + 1, url: url! })).filter(p => p.url);
      setPagePreviews(previews);

    } catch (error: any) {
        if (operationId.current !== currentOperationId) return;
        
        if (error.name === 'PasswordException') {
            setFile({
                id: `${fileToLoad.name}-${Date.now()}`,
                file: fileToLoad,
                totalPages: 0,
                isEncrypted: true,
                pdfjsDoc: undefined,
            });
            setIsPasswordDialogOpen(true);
        } else {
            console.error("Failed to load PDF", error);
            toast({ variant: "destructive", title: "Could not read PDF", description: "The file might be corrupted or in an unsupported format." });
            cleanup();
        }
    } finally {
        if (operationId.current === currentOperationId) {
            setIsLoading(false);
        }
    }
  }, [cleanup, toast, renderPage, setCanvasBackground]);


  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const singleFile = acceptedFiles[0];
    if (singleFile.size > MAX_FILE_SIZE_BYTES) {
        toast({ variant: "destructive", title: "File too large", description: `File exceeds the ${MAX_FILE_SIZE_MB}MB limit.` });
        return;
    }
    loadPdf(singleFile);
  }, [loadPdf, toast]);

  const onUnlockSuccess = async (unlocked: File) => {
      setIsPasswordDialogOpen(false);
      await loadPdf(unlocked);
      toast({ title: 'File Unlocked', description: `You can now edit your PDF.`});
  };
  
  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxSize: MAX_FILE_SIZE_BYTES,
    multiple: false,
    noClick: true,
    noKeyboard: true,
    disabled: isLoading || isSaving,
  });
  
  const handlePageChange = async (pageNumber: number) => {
    if (!file?.pdfjsDoc || isLoading || activePage === pageNumber || !editor) return;

    // Save current page state
    const canvasJSON = editor.toObject();
    setObjects(prev => ({ ...prev, [activePage]: canvasJSON }));

    setActivePage(pageNumber);
    await setCanvasBackground(pageNumber);

    // Load new page state
    const nextPageObjects = objects[pageNumber];
    if (nextPageObjects) {
      editor.loadFromJSON(nextPageObjects, editor.renderAll.bind(editor));
    } else {
      editor.clear(); // Clear canvas if no objects for this page
      await setCanvasBackground(pageNumber); // re-apply background
    }
  };

  const addText = () => {
    if (!editor) return;
    const text = new fabric.Textbox('Type here', {
        left: 50,
        top: 50,
        width: 150,
        fontSize: 18,
        fill: '#000000',
        fontFamily: 'Helvetica',
    });
    editor.add(text);
    editor.setActiveObject(text);
    setEditMode('select');
  };

  const addImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && editor) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            const imgObj = new Image();
            imgObj.src = event.target?.result as string;
            imgObj.onload = () => {
                const image = new fabric.Image(imgObj);
                image.scaleToWidth(150);
                editor.add(image);
                editor.centerObject(image);
                editor.setActiveObject(image);
                editor.renderAll();
            };
        };
        reader.readAsDataURL(file);
    }
    setEditMode('select');
  };

  const addShape = () => {
    if (!editor) return;
    const rect = new fabric.Rect({
        left: 100,
        top: 100,
        width: 100,
        height: 100,
        fill: 'rgba(0,0,255,0.3)',
        stroke: 'blue',
        strokeWidth: 2,
    });
    editor.add(rect);
    editor.setActiveObject(rect);
    setEditMode('select');
  };

  const deleteSelected = () => {
    if (!editor) return;
    const activeObjects = editor.getActiveObjects();
    if (activeObjects.length) {
      activeObjects.forEach(obj => editor.remove(obj));
      editor.discardActiveObject();
      editor.renderAll();
    }
  };

  const handleSave = async () => {
    if (!file || !editor) return;

    setIsSaving(true);
    toast({title: "Saving PDF...", description: "Please wait, this may take a moment."});
    
    try {
        const pdfBytes = await file.file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

        // Save current page state before starting save process
        const finalPageObjects = { ...objects, [activePage]: editor.toObject() };
        
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

        for (let pageNum = 1; pageNum <= pdfDoc.getPageCount(); pageNum++) {
            const pageData = finalPageObjects[pageNum];
            if (!pageData || !pageData.objects || pageData.objects.length === 0) continue;

            const page = pdfDoc.getPage(pageNum - 1);
            const { width: pageWidth, height: pageHeight } = page.getSize();
            const fabricCanvas = new fabric.StaticCanvas(null, { width: pageData.width, height: pageData.height });

            await new Promise<void>((resolve) => {
              fabricCanvas.loadFromJSON(pageData, () => {
                  fabricCanvas.renderAll();
                  resolve();
              });
            });

            const scaleX = pageWidth / fabricCanvas.getWidth();
            const scaleY = pageHeight / fabricCanvas.getHeight();

            for (const obj of fabricCanvas.getObjects()) {
                const objScaleX = obj.scaleX || 1;
                const objScaleY = obj.scaleY || 1;
                const left = obj.left || 0;
                const top = obj.top || 0;

                if (obj.type === 'textbox') {
                    const textObj = obj as fabric.Textbox;
                    page.drawText(textObj.text || '', {
                        x: left * scaleX,
                        y: pageHeight - (top + (textObj.height || 0) * objScaleY) * scaleY,
                        font: helveticaFont,
                        size: (textObj.fontSize || 12) * scaleY * objScaleY,
                        color: rgb(0,0,0) // Placeholder
                    });
                } else if (obj.type === 'rect') {
                    page.drawRectangle({
                        x: left * scaleX,
                        y: pageHeight - (top + (obj.height || 0) * objScaleY) * scaleY,
                        width: (obj.width || 0) * objScaleX * scaleX,
                        height: (obj.height || 0) * objScaleY * scaleY,
                        borderColor: rgb(0,0,1),
                        borderWidth: (obj.strokeWidth || 1),
                        color: rgb(0,0,1),
                        opacity: 0.3
                    });
                } else if (obj.type === 'image') {
                    const imgObj = obj as fabric.Image;
                    const imageElement = imgObj.getElement();
                    if (imageElement instanceof HTMLImageElement) {
                        const imageBytes = await fetch(imageElement.src).then(res => res.arrayBuffer());
                        const pdfImage = await pdfDoc.embedPng(imageBytes);
                        page.drawImage(pdfImage, {
                            x: left * scaleX,
                            y: pageHeight - (top + (imgObj.height || 0) * objScaleY) * scaleY,
                            width: (imgObj.width || 0) * objScaleX * scaleX,
                            height: (imgObj.height || 0) * objScaleY * scaleY,
                        });
                    }
                }
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
        setIsSaving(false);
    }
  };

  const editorTools = [
    { id: 'select', icon: MousePointer, label: 'Select' },
    { id: 'text', icon: Type, label: 'Add Text', action: addText },
    { id: 'image', icon: ImageIcon, label: 'Add Image', action: () => imageInputRef.current?.click() },
    { id: 'shape', icon: Square, label: 'Add Shape', action: addShape },
  ] as const;

  if (!file && !isLoading) {
    return (
        <Card className="bg-white dark:bg-card shadow-lg max-w-lg mx-auto">
            <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">PDF Editor</CardTitle>
                <CardDescription>Upload a PDF to start editing.</CardDescription>
            </CardHeader>
            <CardContent>
            <div
                {...getRootProps()}
                className={cn(
                "flex flex-col items-center justify-center p-6 sm:p-10 rounded-lg border-2 border-dashed transition-colors duration-300",
                !isLoading && "hover:border-primary/50",
                isDragActive && "border-primary bg-primary/10",
                (isLoading || isSaving) && "opacity-70 pointer-events-none"
                )}
            >
                <input {...getInputProps()} />
                <input type="file" ref={imageInputRef} style={{display: 'none'}} onChange={addImage} accept="image/*" />
                <UploadCloud className="w-10 h-10 text-muted-foreground sm:w-12 sm:h-12" />
                <p className="mt-2 text-base font-semibold text-foreground sm:text-lg">Drop a PDF file here</p>
                <p className="text-xs text-muted-foreground sm:text-sm">or click the button below</p>
                <Button type="button" onClick={open} className="mt-4" disabled={isLoading || isSaving}>
                    <FolderOpen className="mr-2 h-4 w-4" />Choose File
                </Button>
            </CardContent>
        </Card>
    );
  }

  return (
    <div className="space-y-6">
        {file?.isEncrypted && isPasswordDialogOpen && (
            <PasswordDialog
                isOpen={isPasswordDialogOpen}
                onOpenChange={(isOpen) => !isOpen && cleanup()}
                file={file.file}
                onUnlockSuccess={onUnlockSuccess}
            />
        )}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
          <aside className="w-full lg:w-64 space-y-4 shrink-0">
              <Card>
                  <CardHeader className="p-3">
                      <CardTitle className="text-base">Pages</CardTitle>
                      <CardDescription className="text-xs">{file?.totalPages ? `${file.totalPages} pages` : 'Loading...'}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-2 max-h-[70vh] overflow-y-auto">
                      {isLoading ? Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="w-full aspect-[7/10] mb-2" />) :
                      <div className="grid grid-cols-3 lg:grid-cols-2 gap-2">
                         {pagePreviews.map(p => (
                          <div 
                              key={p.page} 
                              className={cn("relative rounded-md overflow-hidden border-2 transition-all aspect-[7/10] bg-muted cursor-pointer", activePage === p.page ? 'border-primary' : 'border-transparent hover:border-primary/50')}
                              onClick={() => handlePageChange(p.page)}
                          >
                             {p.url ? <img src={p.url} className="w-full h-full object-contain" alt={`Page ${p.page} preview`} /> : <Skeleton className="w-full h-full" />}
                             <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-0.5 font-medium">{p.page}</div>
                          </div>
                         ))}
                      </div>
                      }
                  </CardContent>
              </Card>
          </aside>
          <main className="flex-grow min-w-0 w-full lg:w-auto">
              <Card className="sticky top-20 z-10 bg-background/80 backdrop-blur-sm">
                 <div className="p-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex gap-1">
                          {editorTools.map(tool => (
                              <Button key={tool.id} variant={editMode === tool.id ? 'secondary' : 'ghost'} size="icon" onClick={() => tool.action ? tool.action() : setEditMode(tool.id)} title={tool.label} disabled={isLoading || isSaving || file?.isEncrypted}>
                                  <tool.icon className="w-5 h-5" />
                              </Button>
                          ))}
                           <Button variant="ghost" size="icon" title="Delete Selected" className="text-muted-foreground/80 hover:bg-destructive/10 hover:text-destructive" onClick={deleteSelected} disabled={isLoading || isSaving || file?.isEncrypted}>
                              <Trash2 className="w-5 h-5" />
                           </Button>
                      </div>
                      <div className="flex gap-2">
                          <Button variant="ghost" size="icon" className="text-muted-foreground/80 hover:bg-destructive/10 hover:text-destructive" onClick={cleanup} disabled={isSaving || isLoading} title="Close File">
                              <X className="w-5 h-5" />
                          </Button>
                          <Button onClick={handleSave} disabled={isSaving || isLoading || !file || file.isEncrypted}>
                              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                              Save PDF
                          </Button>
                      </div>
                 </div>
              </Card>
              <div className="mt-4 bg-muted flex items-center justify-center overflow-auto p-4 rounded-md">
                  {isLoading ? <Loader2 className="w-8 h-8 animate-spin text-primary" /> :
                   file?.isEncrypted ? 
                   <div className="p-10 text-center text-muted-foreground"><Lock className="w-10 h-10 mx-auto mb-2" /> Please unlock the file to start editing.</div> : 
                   <FabricJSCanvas className="shadow-lg" onReady={onReady} />}
              </div>
          </main>
      </div>
    </div>
  );
}
