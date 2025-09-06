
"use client";

import React, { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "./ui/scroll-area";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { cn } from "@/lib/utils";
import { Textarea } from "./ui/textarea";
import { Pilcrow, Copy, Check, Wand2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import { summarizeText, SummarizeInput } from "@/ai/flows/summarize-flow";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const WordCounter = ({ text }: { text: string }) => {
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    const charCount = text.length;
    return (
        <div className="text-xs text-muted-foreground">
            {wordCount} {wordCount === 1 ? 'word' : 'words'} • {charCount} {charCount === 1 ? 'character' : 'characters'}
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
        if (inputText.length < 20) {
            toast({ variant: 'destructive', title: 'Text too short', description: 'Please enter at least 20 characters to generate a summary.'});
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
         <Card className="shadow-lg h-full flex flex-col">
            <CardHeader>
                <CardTitle className="text-lg">Input Text</CardTitle>
                <CardDescription>Paste the text you want to summarize.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
                <Textarea 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Paste your text here... (minimum 20 characters)"
                    className="w-full h-full resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-4"
                    disabled={isSummarizing}
                />
                <div className="p-2 border-t flex-shrink-0 flex justify-end items-center">
                    <WordCounter text={inputText} />
                </div>
            </CardContent>
        </Card>
    );
    
    const summaryPanel = (
         <Card className="shadow-lg h-full flex flex-col">
            <CardHeader className="flex-row justify-between items-center">
              <div>
                <CardTitle className="text-lg">Summary</CardTitle>
                <CardDescription>AI-generated summary of your text.</CardDescription>
              </div>
               <Button variant="ghost" size="sm" onClick={handleCopy} disabled={!summary || isSummarizing}>
                   {isCopied ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
                   {isCopied ? "Copied!" : "Copy"}
                </Button>
            </CardHeader>
             <CardContent className="flex-1 flex flex-col p-0">
                <ScrollArea className="w-full h-full flex-1">
                    <AnimatePresence mode="wait">
                    {isSummarizing ? (
                        <motion.div key="loader" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="h-full min-h-[300px] flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4"/>
                            <p className="font-semibold">Summarizing your text...</p>
                            <p className="text-sm">This may take a moment for longer documents.</p>
                        </motion.div>
                    ) : summary ? (
                        <motion.div key="summary" initial={{opacity: 0}} animate={{opacity: 1}} className="p-4 prose dark:prose-invert max-w-full">
                            {summary}
                        </motion.div>
                    ) : (
                        <motion.div key="placeholder" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="h-full min-h-[300px] flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
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
            </CardContent>
        </Card>
    );
    
    const renderLayout = () => {
      if (isMobile) {
        return (
          <Tabs defaultValue="input" className="w-full h-full flex flex-col">
            <div className="flex-shrink-0 border-b">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="input">Input</TabsTrigger>
                <TabsTrigger value="summary">Summary</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="input" className="flex-1 min-h-0">
              <div className="h-full flex flex-col">
                <div className="flex-grow min-h-0">{editorPanel}</div>
                 <div className="p-2 border-t flex-shrink-0">
                    <Button onClick={handleSummarize} className="w-full" disabled={isSummarizing || inputText.length < 20}>
                       {isSummarizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wand2 className="mr-2 h-4 w-4"/>}
                       {isSummarizing ? 'Summarizing...' : 'Summarize'}
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
        <div className="flex flex-col flex-1 gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
                {editorPanel}
                {summaryPanel}
            </div>
             <Button onClick={handleSummarize} size="lg" className="w-full text-base" disabled={isSummarizing || inputText.length < 20}>
                <AnimatePresence mode="wait">
                        {isSummarizing ? (
                            <motion.div key="loader-icon" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin"/>
                            </motion.div>
                        ) : (
                        <motion.div key="wand-icon" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <Wand2 className="mr-2 h-5 w-5"/>
                        </motion.div>
                    )}
                </AnimatePresence>
                {isSummarizing ? 'Summarizing...' : 'Summarize'}
            </Button>
        </div>
      );
    }
    
    return (
        <div className={cn("flex flex-col flex-1")}>
            {renderLayout()}
        </div>
    );
}
