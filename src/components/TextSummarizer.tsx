
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Copy, Check, Wand2 } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import { summarizeText, SummarizeInput } from "@/ai/flows/summarize-flow";

export function TextSummarizer() {
  const [inputText, setInputText] = useState("");
  const [summary, setSummary] = useState("");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const handleSummarize = async () => {
    if (!inputText.trim()) {
      toast({ variant: "destructive", title: "Input is empty", description: "Please enter some text to summarize." });
      return;
    }

    setIsSummarizing(true);
    setSummary("");
    try {
      const input: SummarizeInput = { text: inputText };
      const result = await summarizeText(input);
      setSummary(result.summary);
      toast({ variant: "success", title: "Summary Generated!", description: "The AI has successfully summarized your text." });
    } catch (error: any) {
      console.error("Summarization failed:", error);
      toast({ variant: "destructive", title: "Summarization Failed", description: error.message || "An unexpected error occurred." });
    } finally {
      setIsSummarizing(false);
    }
  };
  
  const handleCopy = () => {
    if (summary) {
      navigator.clipboard.writeText(summary);
      setIsCopied(true);
      toast({
        variant: 'success',
        title: "Summary Copied!",
        description: "The summary has been copied to your clipboard.",
      });
      setTimeout(() => setIsCopied(false), 2000);
    }
  };
  
  const charCount = inputText.length;
  const wordCount = inputText.trim().split(/\s+/).filter(Boolean).length;
  const summaryWordCount = summary.trim().split(/\s+/).filter(Boolean).length;
  const reduction = wordCount > 0 ? (1 - (summaryWordCount / wordCount)) * 100 : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-transparent shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">Enter Your Text</CardTitle>
                <CardDescription>Paste the text you want to summarize below.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <Textarea 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Paste your English text here..."
                        rows={15}
                        disabled={isSummarizing}
                    />
                    <div className="text-xs text-muted-foreground flex justify-between">
                       <span>Character count: {charCount}</span>
                       <span>Word count: {wordCount}</span>
                    </div>
                    <Button 
                        size="lg" 
                        className="w-full text-base font-bold" 
                        onClick={handleSummarize} 
                        disabled={isSummarizing || !inputText.trim()}
                    >
                        {isSummarizing ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                            <Sparkles className="mr-2 h-5 w-5" />
                        )}
                        Summarize
                    </Button>
                </div>
            </CardContent>
        </Card>

        <Card className="bg-transparent shadow-lg">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-xl sm:text-2xl">AI Summary</CardTitle>
                        <CardDescription>The concise version of your text.</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleCopy} disabled={!summary}>
                         <AnimatePresence mode="wait">
                            {isCopied ? (
                                <motion.div key="check" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.1 }}>
                                    <Check className="w-5 h-5 text-green-500"/>
                                </motion.div>
                            ) : (
                                <motion.div key="copy" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.1 }}>
                                    <Copy className="w-5 h-5"/>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <AnimatePresence mode="wait">
                {isSummarizing ? (
                    <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full min-h-[300px] text-muted-foreground space-y-2">
                        <Wand2 className="w-10 h-10 text-primary" />
                        <p className="font-semibold">AI is thinking...</p>
                        <p className="text-sm text-center">Generating your summary. This may take a few seconds.</p>
                    </motion.div>
                ) : summary ? (
                    <motion.div key="summary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                        <Textarea 
                            value={summary}
                            readOnly
                            rows={15}
                            className="bg-muted/50"
                        />
                         <div className="text-xs text-muted-foreground flex justify-between">
                            <span>Word count: {summaryWordCount}</span>
                            <span>Reduction: {reduction > 0 ? reduction.toFixed(0) : 0}%</span>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full min-h-[300px] text-muted-foreground text-center space-y-2">
                         <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                            <Sparkles className="w-8 h-8 text-primary" />
                        </div>
                        <p className="font-semibold">Your summary will appear here</p>
                        <p className="text-sm">Enter some text and click "Summarize" to begin.</p>
                    </motion.div>
                )}
                </AnimatePresence>
            </CardContent>
        </Card>
    </div>
  );
}
