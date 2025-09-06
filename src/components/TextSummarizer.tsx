
"use client";

import React, { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "./ui/scroll-area";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { cn } from "@/lib/utils";
import { Textarea } from "./ui/textarea";
import { Pilcrow, Copy, Check, Wand2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import { summarizeText, SummarizeInput } from "@/ai/flows/summarize-flow";

const WordCounter = ({ text }: { text: string }) => {
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    const charCount = text.length;
    return (
        <div className="text-xs text-muted-foreground">
            {wordCount} {wordCount === 1 ? 'word' : 'words'} &bull; {charCount} {charCount === 1 ? 'character' : 'characters'}
        </div>
    )
}

export function TextSummarizer() {
    const [inputText, setInputText] = useState("");
    const [summary, setSummary] = useState("");
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const { toast } = useToast();
    const isMobile = useIsMobile();
    
    const handleSummarize = useCallback(async () => {
        if (inputText.length < 50) {
            toast({ variant: 'destructive', title: 'Text too short', description: 'Please enter at least 50 characters to generate a summary.'});
            return;
        }
        setIsSummarizing(true);
        setSummary("");

        try {
            const input: SummarizeInput = { text: inputText };
            const result = await summarizeText(input);
            setSummary(result.summary);
            toast({ variant: 'success', title: 'Summary Generated!', description: 'Your text has been successfully summarized.' });
        } catch(e: any) {
            toast({ variant: 'destructive', title: 'Summarization Failed', description: e.message || 'An unexpected error occurred.' });
        } finally {
            setIsSummarizing(false);
        }
    }, [inputText, toast]);

    const handleCopy = useCallback(() => {
        if (!summary) return;
        navigator.clipboard.writeText(summary);
        toast({
            variant: "success",
            title: "Summary Copied!",
            description: "The summary has been copied to your clipboard.",
        });
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    }, [summary, toast]);
    
    const editorPanel = (
        <div className="flex-1 flex overflow-hidden flex-col h-full">
            <Textarea 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste your text here... (minimum 50 characters)"
                className="w-full h-full resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-4"
                disabled={isSummarizing}
            />
             <div className="p-2 border-t flex-shrink-0 flex justify-end items-center">
                <WordCounter text={inputText} />
            </div>
        </div>
    );
    
    const summaryPanel = (
        <div className="flex-1 flex overflow-hidden flex-col h-full">
             <ScrollArea className="w-full h-full flex-1">
                <AnimatePresence mode="wait">
                {isSummarizing ? (
                     <motion.div key="loader" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4"/>
                        <p className="font-semibold">Summarizing your text...</p>
                        <p className="text-sm">This may take a moment for longer documents.</p>
                     </motion.div>
                ) : summary ? (
                    <motion.div key="summary" initial={{opacity: 0}} animate={{opacity: 1}} className="p-4 prose dark:prose-invert max-w-full">
                        {summary}
                    </motion.div>
                ) : (
                     <motion.div key="placeholder" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                        <Pilcrow className="w-12 h-12 mb-4"/>
                        <h3 className="font-semibold">Your summary will appear here</h3>
                        <p className="text-sm">Paste your text and click "Summarize" to begin.</p>
                     </motion.div>
                )}
                </AnimatePresence>
            </ScrollArea>
             <div className="p-2 border-t flex-shrink-0 flex justify-end items-center">
                <WordCounter text={summary} />
            </div>
        </div>
    );
    
    const renderLayout = () => {
      if (isMobile) {
        return (
          <Tabs defaultValue="input" className="w-full h-full flex flex-col">
            <div className="flex-shrink-0 border-b">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="input">Input Text</TabsTrigger>
                <TabsTrigger value="summary">Summary</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="input" className="flex-1 min-h-0">
              <div className="h-full flex flex-col">
                {editorPanel}
                 <div className="p-2 border-t flex-shrink-0">
                    <Button onClick={handleSummarize} className="w-full" disabled={isSummarizing || inputText.length < 50}>
                       {isSummarizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wand2 className="mr-2 h-4 w-4"/>}
                       Summarize
                    </Button>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="summary" className="flex-1 flex flex-col min-h-0">
               {summaryPanel}
            </TabsContent>
          </Tabs>
        );
      }
      
      return (
        <ResizablePanelGroup direction="horizontal" className="flex-1">
            <ResizablePanel defaultSize={50} className="flex flex-col min-h-0">
                <div className="p-1.5 border-b flex justify-between items-center text-sm font-medium text-muted-foreground flex-shrink-0">
                    <span className="px-2">INPUT TEXT</span>
                </div>
                {editorPanel}
            </ResizablePanel>
            <div className="relative flex items-center justify-center">
                <ResizableHandle withHandle />
                <Button onClick={handleSummarize} size="icon" className="absolute z-10 rounded-full h-12 w-12 shadow-lg" disabled={isSummarizing || inputText.length < 50}>
                    <AnimatePresence mode="wait">
                        {isSummarizing ? (
                             <motion.div key="loader-icon" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
                                <Loader2 className="h-5 w-5 animate-spin"/>
                             </motion.div>
                        ) : (
                            <motion.div key="wand-icon" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
                                <Wand2 className="h-5 w-5"/>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Button>
            </div>
            <ResizablePanel defaultSize={50} className="flex flex-col min-h-0">
                <div className="p-1.5 border-b flex justify-between items-center text-sm font-medium text-muted-foreground flex-shrink-0">
                    <span className="px-2">SUMMARY</span>
                    <Button variant="ghost" size="sm" onClick={handleCopy} disabled={!summary || isSummarizing}>
                       {isCopied ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
                       {isCopied ? "Copied!" : "Copy"}
                    </Button>
                </div>
                {summaryPanel}
            </ResizablePanel>
        </ResizablePanelGroup>
      );
    }
    
    return (
        <div className={cn("border rounded-xl bg-card shadow-sm flex flex-col flex-1")}>
            {renderLayout()}
        </div>
    );
}
