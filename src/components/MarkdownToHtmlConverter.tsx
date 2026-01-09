"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { marked } from "marked";
import { Button } from "@/components/ui/button";
import { Copy, Download, Check, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "./ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { cn } from "@/lib/utils";
import { Textarea } from "./ui/textarea";

const defaultMarkdown = `# Welcome to Markdown to HTML!

This is a **live editor**. Start typing in the Markdown panel on the left, and you'll see the HTML output on the right instantly.

## Features

- **Live Preview**: See your changes as you type.
- **Copy & Download**: Easily grab your HTML code.

### Example List

1.  First item
2.  Second item
3.  Third item

\`\`\`javascript
// You can even include code blocks!
function greet() {
  console.log("Hello, world!");
}
\`\`\`

> This is a blockquote. Isn't it neat?

Happy converting!
`;

const Toolbar = ({ onUpload, onCopy, onDownload, isCopied, className }: { onUpload: () => void, onCopy: () => void, onDownload: () => void, isCopied: boolean, className?: string }) => (
    <div className={cn("flex items-center gap-1", className)}>
        <Button variant="ghost" size="sm" onClick={onUpload} className="h-8 px-2 md:px-3">
            <Upload className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Upload</span>
        </Button>
        <Button variant="ghost" size="sm" onClick={onCopy} className="h-8 px-2 md:px-3">
            {isCopied ? <Check className="w-4 h-4 md:mr-2 text-green-500" /> : <Copy className="w-4 h-4 md:mr-2" />}
            <span className="hidden md:inline">{isCopied ? "Copied!" : "Copy"}</span>
        </Button>
        <Button variant="ghost" size="sm" onClick={onDownload} className="h-8 px-2 md:px-3">
            <Download className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Download</span>
        </Button>
    </div>
);


export function MarkdownToHtmlConverter() {
    const [markdown, setMarkdown] = useState(defaultMarkdown);
    const [html, setHtml] = useState("");
    const [isCopied, setIsCopied] = useState(false);
    const { toast } = useToast();
    const isMobile = useIsMobile();
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const parsedHtml = marked.parse(markdown) as string;
        setHtml(parsedHtml);
    }, [markdown]);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(html);
        toast({
            variant: "success",
            title: "HTML Copied!",
            description: "The generated HTML has been copied to your clipboard.",
        });
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    }, [html, toast]);

    const handleDownload = useCallback(() => {
        const blob = new Blob([`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Converted Markdown</title>
                <style>
                    body { font-family: sans-serif; line-height: 1.6; padding: 2rem; max-width: 800px; margin: 0 auto; }
                    pre { background-color: #f4f4f4; padding: 1rem; border-radius: 0.5rem; white-space: pre-wrap; word-wrap: break-word; }
                    code { font-family: monospace; }
                </style>
            </head>
            <body>
                ${html}
            </body>
            </html>
        `], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'converted.html';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [html]);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                setMarkdown(content);
                toast({ title: "File Uploaded", description: `"${file.name}" has been loaded.` });
            };
            reader.onerror = () => {
                toast({ variant: "destructive", title: "Error", description: "Failed to read the file." });
            };
            reader.readAsText(file);
        }
    };
    
    const editorPanel = (
        <div className="flex-1 flex overflow-hidden flex-col border rounded-lg h-full">
             <div className="p-1.5 border-b flex justify-between items-center text-sm font-medium text-muted-foreground flex-shrink-0 flex-wrap">
                <span className="px-2">MARKDOWN</span>
            </div>
            <div className="flex-grow relative">
                <ScrollArea className="absolute inset-0">
                    <Textarea 
                        value={markdown} 
                        onChange={(e) => setMarkdown(e.target.value)}
                        className="h-full w-full resize-none border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 font-mono text-sm leading-6 p-4"
                    />
                </ScrollArea>
            </div>
        </div>
    );
    
    const htmlResultPanel = (
        <TabsContent value="preview" className="flex-1 overflow-y-auto mt-0">
          <ScrollArea className="h-full">
            <div className="html-preview" dangerouslySetInnerHTML={{ __html: html }} />
          </ScrollArea>
        </TabsContent>
    );

    const htmlRawPanel = (
         <TabsContent value="raw" className="flex-1 overflow-y-auto mt-0">
            <ScrollArea className="h-full w-full">
              <pre className="p-4 text-sm"><code className="language-markup">{html}</code></pre>
            </ScrollArea>
          </TabsContent>
    );
    
    const renderLayout = () => {
      if (isMobile) {
        return (
          <Tabs defaultValue="markdown" className="w-full h-full flex flex-col">
            <div className="flex-shrink-0 border-b">
              <div className="flex justify-between items-center p-2">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="markdown">Markdown</TabsTrigger>
                  <TabsTrigger value="result">Result</TabsTrigger>
                </TabsList>
              </div>
              <div className="flex justify-center items-center p-1 border-t flex-shrink-0">
                  <Toolbar onUpload={handleUploadClick} onCopy={handleCopy} onDownload={handleDownload} isCopied={isCopied} />
              </div>
            </div>
            <TabsContent value="markdown" className="flex-1 min-h-0">
              {editorPanel}
            </TabsContent>
            <TabsContent value="result" className="flex-1 flex flex-col min-h-0">
               <Tabs defaultValue="preview" className="flex flex-col h-full">
                  <div className="flex justify-between items-center border-b pr-2 flex-shrink-0">
                    <TabsList className="bg-transparent p-0 m-1">
                      <TabsTrigger value="preview" className="text-sm">Preview</TabsTrigger>
                      <TabsTrigger value="raw" className="text-sm">Raw HTML</TabsTrigger>
                    </TabsList>
                  </div>
                  {htmlResultPanel}
                  {htmlRawPanel}
              </Tabs>
            </TabsContent>
          </Tabs>
        );
      }
      
      return (
        <div className="grid md:grid-cols-2 gap-4 flex-1 min-h-0">
            {editorPanel}
             <div className="flex flex-col border rounded-lg h-full">
                <Tabs defaultValue="preview" className="flex flex-col h-full">
                    <div className="p-1.5 border-b flex justify-between items-center flex-shrink-0 flex-wrap gap-2">
                        <TabsList className="bg-transparent p-0 m-0 h-auto">
                            <TabsTrigger value="preview" className="text-sm h-8">Preview</TabsTrigger>
                            <TabsTrigger value="raw" className="text-sm h-8">Raw HTML</TabsTrigger>
                        </TabsList>
                        <Toolbar onUpload={handleUploadClick} onCopy={handleCopy} onDownload={handleDownload} isCopied={isCopied} />
                    </div>
                    {htmlResultPanel}
                    {htmlRawPanel}
                </Tabs>
            </div>
        </div>
      );
    }
    
    return (
        <div className={cn("bg-card flex flex-col flex-1 h-full")}>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".md,.markdown"
                className="hidden"
            />
            {renderLayout()}
        </div>
    );
}
