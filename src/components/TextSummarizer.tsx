<<<<<<< HEAD
"use client";

import React, { useState, useCallback } from "react";
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
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

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
    
    // New options
    const [summaryLength, setSummaryLength] = useState<SummarizeInput['length']>('medium');
    const [summaryFormat, setSummaryFormat] = useState<SummarizeInput['format']>('paragraph');
    const [summaryTone, setSummaryTone] = useState<SummarizeInput['tone']>('neutral');
    const [summaryAudience, setSummaryAudience] = useState<SummarizeInput['audience']>('general');
    const [summaryLanguage, setSummaryLanguage] = useState<string>('English');


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
            const input: SummarizeInput = { 
                text: inputText, 
                length: summaryLength, 
                format: summaryFormat,
                tone: summaryTone,
                audience: summaryAudience,
                language: summaryLanguage,
            };
            const result = await summarizeText(input);
            setSummary(result.summary);
            toast({ variant: 'success', title: 'Summary Generated!', description: 'Your text has been successfully summarized.' });
        } catch(e: any) {
            toast({ variant: 'destructive', title: 'Summarization Failed', description: e.message || 'An unexpected error occurred.' });
        } finally {
            setIsSummarizing(false);
        }
    }, [inputText, summaryLength, summaryFormat, summaryTone, summaryAudience, summaryLanguage, toast]);

    const handleCopy = useCallback(() => {
        if (!summary) return;
        const plainText = new DOMParser().parseFromString(summary, "text/html").documentElement.textContent || summary;
        navigator.clipboard.writeText(plainText);
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
                        <motion.div key="summary" initial={{opacity: 0}} animate={{opacity: 1}} className="html-preview" dangerouslySetInnerHTML={{ __html: summary }}/>
                    ) : (
                        <motion.div key="placeholder" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="h-full min-h-[300px] flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                            <Pilcrow className="w-12 h-12 mb-4"/>
                            <h3 className="font-semibold">Your summary will appear here</h3>
                            <p className="text-sm">Enter some text, choose your options, and click "Summarize".</p>
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

    const optionsPanel = (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
                <Label htmlFor="summary-length">Length</Label>
                <Select value={summaryLength} onValueChange={v => setSummaryLength(v as any)} disabled={isSummarizing}>
                    <SelectTrigger id="summary-length" className="mt-1"><SelectValue/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="short">Short</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="long">Long</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <div>
                <Label htmlFor="summary-format">Format</Label>
                <Select value={summaryFormat} onValueChange={v => setSummaryFormat(v as any)} disabled={isSummarizing}>
                    <SelectTrigger id="summary-format" className="mt-1"><SelectValue/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="paragraph">Paragraph</SelectItem>
                        <SelectItem value="bullets">Bullet Points</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div>
                <Label htmlFor="summary-tone">Tone</Label>
                <Select value={summaryTone} onValueChange={v => setSummaryTone(v as any)} disabled={isSummarizing}>
                    <SelectTrigger id="summary-tone" className="mt-1"><SelectValue/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="neutral">Neutral</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="confident">Confident</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <div>
                <Label htmlFor="summary-audience">Audience</Label>
                <Select value={summaryAudience} onValueChange={v => setSummaryAudience(v as any)} disabled={isSummarizing}>
                    <SelectTrigger id="summary-audience" className="mt-1"><SelectValue/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div>
                <Label htmlFor="summary-language">Language</Label>
                <Select value={summaryLanguage} onValueChange={v => setSummaryLanguage(v)} disabled={isSummarizing}>
                  <SelectTrigger id="summary-language" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Hindi">Hindi</SelectItem>
                    <SelectItem value="Sanskrit">Sanskrit</SelectItem>
                    <SelectItem value="Hinglish">Hinglish</SelectItem>
                    <SelectItem value="Russian">Russian</SelectItem>
                    <SelectItem value="Italian">Italian</SelectItem>
                    <SelectItem value="Spanish">Spanish</SelectItem>
                    <SelectItem value="French">French</SelectItem>
                    <SelectItem value="German">German</SelectItem>
                    <SelectItem value="Chinese">Chinese</SelectItem>
                  </SelectContent>
                </Select>
            </div>
        </div>
    );
    
    const renderLayout = () => {
      if (isMobile) {
        return (
            <div className="flex flex-col gap-4 h-full">
                <div className="flex-1 min-h-[200px]">{editorPanel}</div>
                 <div className="flex-shrink-0">{optionsPanel}</div>
                <div className="flex-shrink-0">
                    <Button onClick={handleSummarize} className="w-full" disabled={isSummarizing || inputText.length < 20}>
                       {isSummarizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wand2 className="mr-2 h-4 w-4"/>}
                       {isSummarizing ? 'Summarizing...' : 'Summarize'}
                    </Button>
                </div>
                <div className="flex-1 min-h-[200px]">{summaryPanel}</div>
            </div>
        );
      }
      
      return (
        <div className="flex flex-col flex-1 gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
                {editorPanel}
                {summaryPanel}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-end">
                <Card className="shadow-lg p-4">{optionsPanel}</Card>
                <Button onClick={handleSummarize} size="lg" className="w-full text-base self-end h-auto py-6" disabled={isSummarizing || inputText.length < 20}>
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
        </div>
      );
    }
    
    return (
        <div className={cn("flex flex-col flex-1")}>
            {renderLayout()}
        </div>
    );
=======

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
>>>>>>> 4d83a8a61579353434de1f8d218e0c57f9bc372f
}
