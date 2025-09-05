
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

const Toolbar = ({ onUpload, onCopy, onDownload, isCopied, className }: { onUpload: () => void, onCopy: () => void, onDownload: () => void, isCopied: boolean, className?: string }) => (
  <div className={cn("flex items-center gap-1 sm:gap-2", className)}>
    <Button variant="ghost" size="sm" onClick={onUpload} className="h-8 px-2 sm:px-3">
        <Upload className="w-4 h-4 sm:mr-2" />
        <span className="hidden sm:inline">Upload</span>
    </Button>
    <Button variant="ghost" size="sm" onClick={onCopy} className="h-8 px-2 sm:px-3">
      {isCopied ? <Check className="w-4 h-4 sm:mr-2 text-green-500" /> : <Copy className="w-4 h-4 sm:mr-2" />}
      <span className="hidden sm:inline">{isCopied ? "Copied!" : "Copy"}</span>
    </Button>
    <Button variant="ghost" size="sm" onClick={onDownload} className="h-8 px-2 sm:px-3">
      <Download className="w-4 h-4 sm:mr-2" />
      <span className="hidden sm:inline">Download</span>
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
      
      const currentLineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
      const currentLineEnd = value.indexOf('\n', selectionStart);
      const currentLine = value.substring(currentLineStart, currentLineEnd === -1 ? value.length : currentLineEnd);

      if (e.key === 'Tab' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        const newValue = `${value.substring(0, selectionStart)}  ${value.substring(selectionEnd)}`;
        setMarkdown(newValue);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = selectionStart + 2;
        }, 0);
      } else if (e.key === 'd' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        const lineToDuplicate = currentLine + (currentLineEnd === -1 ? '' : '\n');
        const nextLineStart = currentLineEnd === -1 ? value.length : currentLineEnd + 1;
        const newValue = value.substring(0, nextLineStart) + lineToDuplicate + value.substring(nextLineStart);
        
        setMarkdown(newValue);
        setTimeout(() => {
           const newCursorPos = nextLineStart + lineToDuplicate.length;
           textarea.selectionStart = textarea.selectionEnd = newCursorPos;
        }, 0);
      } else if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
        e.preventDefault();
        const lines = value.split('\n');
        const currentLineIndex = value.substring(0, selectionStart).split('\n').length - 1;

        if (e.key === "ArrowUp" && currentLineIndex > 0) {
            [lines[currentLineIndex - 1], lines[currentLineIndex]] = [lines[currentLineIndex], lines[currentLineIndex - 1]];
            const newCursorOffset = lines.slice(0, currentLineIndex -1).join('\n').length + (currentLineIndex > 1 ? 1 : 0);
            setMarkdown(lines.join('\n'));
            setTimeout(() => {
              textarea.selectionStart = textarea.selectionEnd = newCursorOffset + value.substring(currentLineStart, selectionStart).length;
            }, 0);
        } else if (e.key === "ArrowDown" && currentLineIndex < lines.length - 1) {
            [lines[currentLineIndex], lines[currentLineIndex + 1]] = [lines[currentLineIndex + 1], lines[currentLineIndex]];
             const newCursorOffset = lines.slice(0, currentLineIndex).join('\n').length + 1;
            setMarkdown(lines.join('\n'));
            setTimeout(() => {
               textarea.selectionStart = textarea.selectionEnd = newCursorOffset + lines[currentLineIndex].length + value.substring(currentLineStart, selectionStart).length;
            }, 0);
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        const selectedText = value.substring(selectionStart, selectionEnd);
        const isCommented = selectedText.startsWith('<!-- ') && selectedText.endsWith(' -->');
        
        let newValue, newSelectionStart, newSelectionEnd;

        if (isCommented) {
          newValue = value.substring(0, selectionStart) + selectedText.slice(5, -4) + value.substring(selectionEnd);
          newSelectionStart = selectionStart;
          newSelectionEnd = selectionEnd - 9;
        } else {
          newValue = value.substring(0, selectionStart) + `<!-- ${selectedText} -->` + value.substring(selectionEnd);
          newSelectionStart = selectionStart + 5;
          newSelectionEnd = selectionEnd + 5;
        }

        setMarkdown(newValue);
        setTimeout(() => {
          textarea.selectionStart = newSelectionStart;
          textarea.selectionEnd = newSelectionEnd;
        });
      }
    };
    
    const editorPanel = (
        <div className="flex-1 flex overflow-hidden code-editor-container">
            <ScrollArea className="w-full h-full">
                <Editor value={markdown} onValueChange={setMarkdown} highlight={code => Prism.highlight(code, Prism.languages.markdown, 'markdown')} padding={16} onKeyDown={handleKeyDown} className="code-editor flex-1 min-h-full" />
            </ScrollArea>
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
         <TabsContent value="raw" className="flex-1 overflow-y-auto mt-0 code-editor-container">
            <ScrollArea className="h-full w-full">
              <Editor value={html} onValueChange={() => {}} highlight={code => Prism.highlight(code, Prism.languages.markup, 'markup')} padding={16} readOnly className="code-editor flex-1 min-h-full" />
            </ScrollArea>
          </TabsContent>
    );
    
    const markdownHeader = (
        <div className="p-1.5 border-b flex justify-between items-center text-sm font-medium text-muted-foreground flex-shrink-0 flex-wrap">
            <span className="px-2">MARKDOWN</span>
        </div>
    );

    const resultHeader = (
        <div className="p-1.5 border-b flex justify-between items-center flex-shrink-0 flex-wrap">
            <TabsList className="bg-transparent p-0 m-0 h-auto">
                <TabsTrigger value="preview" className="text-sm h-8">Preview</TabsTrigger>
                <TabsTrigger value="raw" className="text-sm h-8">Raw HTML</TabsTrigger>
            </TabsList>
            <Toolbar onUpload={handleUploadClick} onCopy={handleCopy} onDownload={handleDownload} isCopied={isCopied} />
        </div>
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
      } else {
         const direction = "horizontal";
         return (
            <ResizablePanelGroup direction={direction} className="flex-1">
              <ResizablePanel defaultSize={50} className="flex flex-col min-h-0">
                {markdownHeader}
                {editorPanel}
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={50} className="flex flex-col min-h-0">
                <Tabs defaultValue="preview" className="flex flex-col h-full">
                    {resultHeader}
                    {htmlResultPanel}
                    {htmlRawPanel}
                </Tabs>
              </ResizablePanel>
            </ResizablePanelGroup>
        );
      }
    }
    
    return (
        <div className={cn("border rounded-xl bg-card shadow-sm flex flex-col flex-1")}>
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
