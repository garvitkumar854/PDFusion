
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { marked } from "marked";
import { Button } from "@/components/ui/button";
import { Copy, Download, Check, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "./ui/scroll-area";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-markup";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { cn } from "@/lib/utils";

const defaultMarkdown = `# Welcome to Markdown to HTML!

This is a **live editor**. Start typing in the Markdown panel on the left, and you'll see the HTML output on the right instantly.

## Features

- **Live Preview**: See your changes as you type.
- **Syntax Highlighting**: The editor is themed for readability.
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

const DesktopToolbar = ({ onUpload, onCopy, onDownload, isCopied }: { onUpload: () => void, onCopy: () => void, onDownload: () => void, isCopied: boolean }) => (
  <div className="flex items-center gap-2">
    <Button variant="ghost" size="sm" onClick={onUpload} className="h-8">
        <Upload className="w-4 h-4 mr-2" />
        Upload
    </Button>
    <Button variant="ghost" size="sm" onClick={onCopy} className="h-8">
      {isCopied ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
      {isCopied ? "Copied!" : "Copy"}
    </Button>
    <Button variant="ghost" size="sm" onClick={onDownload} className="h-8">
      <Download className="w-4 h-4 mr-2" />
      Download
    </Button>
  </div>
);

const MobileToolbar = ({ onUpload, onCopy, onDownload, isCopied }: { onUpload: () => void, onCopy: () => void, onDownload: () => void, isCopied: boolean }) => (
    <div className="flex justify-end items-center gap-2 p-2 border-b">
        <Button variant="ghost" size="sm" onClick={onUpload}>
            <Upload className="w-4 h-4 mr-2" />
            Upload
        </Button>
        <Button variant="ghost" size="sm" onClick={onCopy}>
            {isCopied ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
            Copy
        </Button>
        <Button variant="ghost" size="sm" onClick={onDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download
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

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      const textarea = e.target as HTMLTextAreaElement;
      const { selectionStart, selectionEnd, value } = textarea;

      if (e.key === 'Tab' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        const newValue = `${value.substring(0, selectionStart)}  ${value.substring(selectionEnd)}`;
        setMarkdown(newValue);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = selectionStart + 2;
        }, 0);
      }
    };

    const editorPanel = (
        <div className="flex-1 flex overflow-hidden code-editor-container">
            <ScrollArea className="w-full h-full">
                <Editor
                    value={markdown}
                    onValueChange={setMarkdown}
                    highlight={code => Prism.highlight(code, Prism.languages.markdown, 'markdown')}
                    padding={16}
                    onKeyDown={handleKeyDown}
                    className="code-editor flex-1 min-h-full"
                />
            </ScrollArea>
        </div>
    );

    const htmlResultPanel = (
        <Tabs defaultValue="preview" className="flex flex-col h-full">
            <div className="flex justify-between items-center border-b pr-2">
                <TabsList className="bg-transparent p-0 m-1">
                    <TabsTrigger value="preview" className="text-sm">Preview</TabsTrigger>
                    <TabsTrigger value="raw" className="text-sm">Raw HTML</TabsTrigger>
                </TabsList>
                {!isMobile && <DesktopToolbar onUpload={handleUploadClick} onCopy={handleCopy} onDownload={handleDownload} isCopied={isCopied} />}
            </div>
            <TabsContent value="preview" className="flex-1 overflow-y-auto mt-0">
                <ScrollArea className="h-full">
                    <div className="html-preview prose-pre:whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: html }} />
                </ScrollArea>
            </TabsContent>
            <TabsContent value="raw" className="flex-1 overflow-y-auto mt-0 code-editor-container">
                <ScrollArea className="h-full w-full">
                    <Editor
                        value={html}
                        onValueChange={() => { }}
                        highlight={code => Prism.highlight(code, Prism.languages.markup, 'markup')}
                        padding={16}
                        readOnly
                        className="code-editor flex-1 min-h-full"
                    />
                </ScrollArea>
            </TabsContent>
        </Tabs>
    );
    
    return (
        <div className={cn("border rounded-xl bg-card shadow-sm flex flex-col", isMobile ? "h-full" : "h-[80vh]")}>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".md,.markdown"
                className="hidden"
            />
            {isMobile ? (
                <Tabs defaultValue="markdown" className="w-full h-full flex flex-col">
                    <MobileToolbar onUpload={handleUploadClick} onCopy={handleCopy} onDownload={handleDownload} isCopied={isCopied} />
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="markdown">Markdown</TabsTrigger>
                        <TabsTrigger value="result">Result</TabsTrigger>
                    </TabsList>
                    <TabsContent value="markdown" className="flex-1 flex flex-col min-h-0">
                        {editorPanel}
                    </TabsContent>
                    <TabsContent value="result" className="flex-1 flex flex-col min-h-0">
                        {htmlResultPanel}
                    </TabsContent>
                </Tabs>
            ) : (
                <ResizablePanelGroup direction="horizontal" className="flex-1 rounded-t-xl overflow-hidden">
                    <ResizablePanel defaultSize={50} className="flex flex-col min-h-0">
                        <div className="p-3 border-b text-center text-sm font-medium text-muted-foreground">
                            MARKDOWN
                        </div>
                        {editorPanel}
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={50} className="flex flex-col min-h-0">
                        {htmlResultPanel}
                    </ResizablePanel>
                </ResizablePanelGroup>
            )}
        </div>
    );
}
