"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "react-beautiful-dnd";
import { PDFDocument } from "pdf-lib";
import { pdfjs, Document, Page } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import { analyzeDocuments, type AnalyzeDocumentsOutput } from "@/ai/flows/document-analyzer";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, GripVertical, Trash2, Combine, Scan, Loader2, FilePlus } from "lucide-react";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

type PDFFile = {
  id: string;
  name: string;
  file: File;
};

type PageItem = {
  id: string; // for dnd
  fileId: string;
  pageIndex: number; // 0-based
};

export function PDFusionApp() {
  const [isClient, setIsClient] = useState(false);
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [orderedPages, setOrderedPages] = useState<PageItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [mergeProgress, setMergeProgress] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<AnalyzeDocumentsOutput | null>(null);
  const [enableCompression, setEnableCompression] = useState(true);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleFileChange = useCallback(async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    setIsLoading(true);

    const newFiles: PDFFile[] = Array.from(selectedFiles)
      .filter((file) => file.type === "application/pdf")
      .map((file) => ({ id: `${file.name}-${Date.now()}`, name: file.name, file }));

    const newPageItems: PageItem[] = [];

    for (const pdfFile of newFiles) {
        try {
            const doc = await pdfjs.getDocument(await pdfFile.file.arrayBuffer()).promise;
            for (let i = 0; i < doc.numPages; i++) {
                newPageItems.push({
                    id: `${pdfFile.id}-page-${i}`,
                    fileId: pdfFile.id,
                    pageIndex: i,
                });
            }
        } catch (error) {
            console.error("Failed to load PDF:", pdfFile.name, error);
            toast({
                variant: "destructive",
                title: "Error loading PDF",
                description: `Could not load ${pdfFile.name}. It might be corrupted or protected.`,
            });
        }
    }

    setFiles((prev) => [...prev, ...newFiles]);
    setOrderedPages((prev) => [...prev, ...newPageItems]);
    setIsLoading(false);
  }, [toast]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileChange(e.dataTransfer.files);
  }, [handleFileChange]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(orderedPages);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setOrderedPages(items);
  };

  const deletePage = (pageId: string) => {
    setOrderedPages((prev) => prev.filter((p) => p.id !== pageId));
  };
  
  const clearAll = () => {
    setFiles([]);
    setOrderedPages([]);
  };

  const handleScan = async () => {
    if (files.length === 0) {
      toast({
        variant: "destructive",
        title: "No files to scan",
        description: "Please upload some PDF files first.",
      });
      return;
    }
    setIsScanning(true);
    try {
      const fileToDataUri = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (error) => reject(error);
          reader.readAsDataURL(file);
        });
      };

      const documentsToAnalyze = await Promise.all(
        files.map(async (f) => ({
          fileName: f.name,
          fileDataUri: await fileToDataUri(f.file),
        }))
      );
      
      const results = await analyzeDocuments(documentsToAnalyze);
      setScanResults(results);
    } catch (error) {
      console.error("AI Scan failed:", error);
      toast({
        variant: "destructive",
        title: "Scan Failed",
        description: "The AI document scan failed. Please try again.",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleMerge = async () => {
    if (orderedPages.length === 0) {
        toast({
            variant: "destructive",
            title: "No pages to merge",
            description: "Please upload some PDF files.",
        });
        return;
    }
    setIsMerging(true);
    setMergeProgress(0);

    try {
        const mergedPdf = await PDFDocument.create();
        const sourcePdfs: { [key: string]: PDFDocument } = {};

        for (let i = 0; i < orderedPages.length; i++) {
            const pageItem = orderedPages[i];
            if (!sourcePdfs[pageItem.fileId]) {
                const pdfFile = files.find(f => f.id === pageItem.fileId);
                if (pdfFile) {
                    sourcePdfs[pageItem.fileId] = await PDFDocument.load(await pdfFile.file.arrayBuffer());
                }
            }
            
            const sourcePdf = sourcePdfs[pageItem.fileId];
            if(sourcePdf) {
                const [copiedPage] = await mergedPdf.copyPages(sourcePdf, [pageItem.pageIndex]);
                mergedPdf.addPage(copiedPage);
            }
            setMergeProgress(((i + 1) / orderedPages.length) * 100);
        }

        const mergedPdfBytes = await mergedPdf.save({ useObjectStreams: enableCompression });
        const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'PDFusion_merged.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast({
            title: "Merge Successful!",
            description: "Your PDF has been downloaded.",
        });
    } catch (error) {
        console.error("Merge failed:", error);
        toast({
            variant: "destructive",
            title: "Merge Failed",
            description: "An error occurred while merging the PDFs.",
        });
    } finally {
        setIsMerging(false);
    }
  };
  
  const fileNames = useMemo(() => files.map(f => f.name).join(', '), [files]);

  if (files.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center p-8 md:p-12 border-2 border-dashed border-muted-foreground/30 rounded-xl min-h-[400px] bg-muted/20 hover:bg-muted/40 hover:border-accent transition-colors"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input type="file" multiple accept=".pdf" ref={fileInputRef} onChange={(e) => handleFileChange(e.target.files)} className="hidden" />
        <UploadCloud className="w-16 h-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-2xl font-semibold mb-2 text-center">Drag & Drop Your PDFs Here</h2>
        <p className="text-muted-foreground mb-6 text-center">or</p>
        <Button size="lg" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FilePlus className="mr-2 h-4 w-4" />}
          {isLoading ? 'Processing...' : 'Select Files'}
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
      <div className="order-2 lg:order-1">
          {isClient && (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="pages" direction="horizontal">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                    {orderedPages.map((page, index) => {
                      const file = files.find((f) => f.id === page.fileId);
                      if (!file) return null;
                      return (
                        <Draggable key={page.id} draggableId={page.id} index={index}>
                          {(provided) => (
                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                              <Card className="group relative overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1">
                                <CardContent className="p-0 aspect-[2/2.8]">
                                    <Document file={file.file} loading={<div className="w-full h-full flex items-center justify-center"><Skeleton className="w-full h-full" /></div>}>
                                        <Page pageNumber={page.pageIndex + 1} scale={0.5} renderTextLayer={false} renderAnnotationLayer={false} />
                                    </Document>
                                </CardContent>
                                <CardFooter className="p-2 bg-background/80 backdrop-blur-sm text-xs justify-between items-center">
                                    <p className="truncate text-muted-foreground">{file.name}</p>
                                    <p className="font-bold">p.{page.pageIndex + 1}</p>
                                </CardFooter>
                                <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => deletePage(page.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Delete Page</TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                                <div className="absolute top-1/2 -left-1 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <GripVertical className="text-muted-foreground"/>
                                </div>
                              </Card>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
      </div>

      <div className="order-1 lg:order-2">
        <Card className="sticky top-20">
          <CardHeader>
            <h3 className="text-lg font-semibold">Actions</h3>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label>Uploaded Files</Label>
                <ScrollArea className="h-24 w-full rounded-md border p-2">
                    <p className="text-sm text-muted-foreground">{fileNames}</p>
                </ScrollArea>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="compression-mode" checked={enableCompression} onCheckedChange={setEnableCompression} />
              <Label htmlFor="compression-mode">Enable Compression</Label>
            </div>
            <div className="flex flex-col gap-2">
                <Button onClick={handleScan} disabled={isScanning || isMerging}>
                  {isScanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Scan className="mr-2 h-4 w-4" />}
                  {isScanning ? 'Scanning...' : 'Scan Documents'}
                </Button>
                <Button onClick={handleMerge} disabled={isMerging || isScanning} className="bg-accent text-accent-foreground hover:bg-accent/90">
                  {isMerging ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Combine className="mr-2 h-4 w-4" />}
                  {isMerging ? 'Merging...' : 'Merge PDFs'}
                </Button>
            </div>
            {isMerging && <Progress value={mergeProgress} className="w-full" />}
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Button variant="outline" size="sm" className="w-full" onClick={() => fileInputRef.current?.click()}>Add More Files</Button>
            <Button variant="destructive" size="sm" className="w-full" onClick={clearAll}>Clear All</Button>
          </CardFooter>
        </Card>
      </div>
      
      <AlertDialog open={!!scanResults} onOpenChange={() => setScanResults(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Document Scan Results</AlertDialogTitle>
            <AlertDialogDescription>
              Our AI has analyzed your documents. Here are the findings:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <ScrollArea className="max-h-60 pr-4">
            <div className="space-y-4">
              {scanResults?.analysisResults.map((result, index) => (
                <div key={result.fileName + index}>
                  <p className="font-semibold">{result.fileName}</p>
                  {result.issues.length > 0 ? (
                    <ul className="list-disc pl-5 text-sm text-destructive">
                      {result.issues.map((issue, i) => (
                        <li key={i}>{issue}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No issues found.</p>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setScanResults(null)}>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
