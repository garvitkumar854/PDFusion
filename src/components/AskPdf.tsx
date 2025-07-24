
"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud,
  X,
  Loader2,
  FolderOpen,
  Lock,
  MessageSquare,
  Send,
  User,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import * as pdfjsLib from 'pdfjs-dist';
import { askPdf } from "@/ai/flows/ask-pdf-flow";

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

const MAX_FILE_SIZE_MB = 100;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

type PDFFile = {
  id: string;
  file: File;
  totalPages: number;
  pdfjsDoc: pdfjsLib.PDFDocumentProxy;
  isEncrypted: boolean;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export function AskPdf() {
  const [file, setFile] = useState<PDFFile | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false);
  
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState('');
  
  const operationId = useRef<number>(0);
  const { toast } = useToast();
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const loadPdf = useCallback(async (fileToLoad: File) => {
    const currentOperationId = ++operationId.current;
    setIsLoading(true);
    setFile(null);
    setExtractedText('');
    setPreviewUrl(null);
    setChatHistory([]);
    
    try {
      const pdfBytes = await fileToLoad.arrayBuffer();
      const pdfjsDoc = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
      
      if (operationId.current !== currentOperationId) {
        pdfjsDoc.destroy();
        return;
      }

      // Extract text from all pages
      let fullText = '';
      for (let i = 1; i <= pdfjsDoc.numPages; i++) {
        const page = await pdfjsDoc.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => ('str' in item ? item.str : '')).join(' ');
        fullText += pageText + '\n\n';
      }

      setExtractedText(fullText);

      // Render first page for preview
      const firstPage = await pdfjsDoc.getPage(1);
      const viewport = firstPage.getViewport({ scale: 1.5 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext('2d');
      if (context) {
        await firstPage.render({ canvasContext: context, viewport }).promise;
        setPreviewUrl(canvas.toDataURL());
      }
      
      setFile({
        id: `${fileToLoad.name}-${Date.now()}`,
        file: fileToLoad,
        totalPages: pdfjsDoc.numPages,
        pdfjsDoc,
        isEncrypted: false
      });
      setChatHistory([{ role: 'assistant', content: "I've analyzed your document. What would you like to know?" }]);

    } catch (error: any) {
      if (operationId.current !== currentOperationId) return;

      if (error.name === 'PasswordException') {
        setFile({ id: `${fileToLoad.name}-${Date.now()}`, file: fileToLoad, isEncrypted: true, totalPages: 0, pdfjsDoc: null as any });
      } else {
        toast({ variant: "destructive", title: "Could not read PDF", description: "The file might be corrupted or in an unsupported format." });
      }
    } finally {
      if (operationId.current === currentOperationId) {
        setIsLoading(false);
      }
    }
  }, [toast]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    loadPdf(acceptedFiles[0]);
  }, [loadPdf]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxSize: MAX_FILE_SIZE_BYTES,
    multiple: false,
    noClick: true,
    noKeyboard: true,
    disabled: isLoading,
  });

  const removeFile = () => {
    operationId.current++;
    setFile(null);
    setExtractedText('');
    setPreviewUrl(null);
    setChatHistory([]);
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isAnswering) return;

    const newHistory: ChatMessage[] = [...chatHistory, { role: "user", content: question }];
    setChatHistory(newHistory);
    const currentQuestion = question;
    setQuestion('');
    setIsAnswering(true);
    
    try {
        const answer = await askPdf({ context: extractedText, question: currentQuestion });
        setChatHistory(prev => [...prev, { role: 'assistant', content: answer }]);
    } catch(err: any) {
        console.error(err);
        setChatHistory(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error trying to answer that question." }]);
    } finally {
        setIsAnswering(false);
    }
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <Card className="bg-white dark:bg-card shadow-lg">
          <CardContent className="p-6">
            <div {...getRootProps()} className={cn("flex flex-col items-center justify-center p-10 rounded-lg border-2 border-dashed transition-colors", isDragActive ? "border-primary bg-primary/10" : "hover:border-primary/50")}>
              <input {...getInputProps()} />
              <UploadCloud className="w-12 h-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-semibold">Drop PDF here or click to upload</p>
              <p className="text-sm text-muted-foreground">Ask questions about your document's content.</p>
              <Button type="button" onClick={open} className="mt-4" disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <FolderOpen className="mr-2 h-4 w-4"/>}Choose File</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="space-y-4">
            <Card className="bg-white dark:bg-card shadow-lg">
                <CardContent className="p-4 relative">
                     {previewUrl ? <img src={previewUrl} alt="PDF Preview" className="rounded-md shadow-md w-full" />
                     : <div className="aspect-[7/10] bg-muted rounded-md flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>}
                     <Button variant="destructive" size="icon" className="absolute top-2 right-2 w-8 h-8" onClick={removeFile}><X className="w-4 h-4"/></Button>
                </CardContent>
            </Card>
            {file.isEncrypted && (
                <Card className="border-destructive">
                    <CardContent className="p-4 text-center text-destructive-foreground bg-destructive rounded-lg">
                        <div className="flex items-center justify-center gap-2"><Lock className="w-5 h-5"/>This PDF is password-protected and cannot be analyzed.</div>
                    </CardContent>
                </Card>
            )}
          </div>
          <Card className="bg-white dark:bg-card shadow-lg h-[70vh] flex flex-col">
            <CardContent className="p-4 flex-1 flex flex-col">
                <ScrollArea className="flex-1 pr-4" ref={chatContainerRef}>
                   <div className="space-y-4">
                        {chatHistory.map((msg, index) => (
                            <div key={index} className={cn("flex items-start gap-3", msg.role === 'user' ? 'justify-end' : '')}>
                                {msg.role === 'assistant' && <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0"><Bot className="w-5 h-5"/></div>}
                                <div className={cn("p-3 rounded-lg max-w-sm", msg.role === 'assistant' ? 'bg-muted' : 'bg-primary text-primary-foreground')}>
                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                </div>
                                {msg.role === 'user' && <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0"><User className="w-5 h-5"/></div>}
                            </div>
                        ))}
                   </div>
                </ScrollArea>
                <form onSubmit={handleAskQuestion} className="mt-4 flex items-center gap-2 border-t pt-4">
                    <Input 
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="Ask a question about your document..."
                        className="flex-1"
                        disabled={isAnswering || file.isEncrypted}
                    />
                    <Button type="submit" disabled={isAnswering || !question.trim() || file.isEncrypted}>
                        {isAnswering ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
                    </Button>
                </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
