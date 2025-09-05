
"use client";

import React, { useState, useEffect, useRef } from "react";
import { marked } from "marked";
import { Button } from "@/components/ui/button";
import { Copy, Download, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "./ui/scroll-area";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-markup";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


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

export function MarkdownToHtmlConverter() {
    const [markdown, setMarkdown] = useState(defaultMarkdown);
    const [html, setHtml] = useState("");
    const [isCopied, setIsCopied] = useState(false);
    
    useEffect(() => {
        const parsedHtml = marked.parse(markdown) as string;
        setHtml(parsedHtml);
    }, [markdown]);

    const handleCopy = () => {
        navigator.clipboard.writeText(html);
        toast({
            variant: "success",
            title: "HTML Copied!",
            description: "The generated HTML has been copied to your clipboard.",
        });
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleDownload = () => {
        const blob = new Blob([`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Converted Markdown</title>
                <style>
                    body { font-family: sans-serif; line-height: 1.6; padding: 2rem; }
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
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const textarea = e.target as HTMLTextAreaElement;
        const { selectionStart, selectionEnd, value } = textarea;
        const lines = value.split('\n');
        const currentLineIndex = value.substring(0, selectionStart).split('\n').length - 1;

        if (e.key === "Tab") {
            e.preventDefault();
            const indentation = "  ";
            const start = selectionStart;
            
            const newValue = value.substring(0, start) + indentation + value.substring(selectionEnd);
            setMarkdown(newValue);
            setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = start + indentation.length;
            }, 0);
        }
        
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            const line = lines[currentLineIndex];
            lines.splice(currentLineIndex, 0, line);
            const newValue = lines.join('\n');
            const newCursorPos = selectionStart + line.length + 1;
            
            setMarkdown(newValue);

            setTimeout(() => {
                 textarea.selectionStart = textarea.selectionEnd = newCursorPos;
            }, 0);
        }

        if (e.altKey) {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (currentLineIndex > 0) {
                    const newLines = [...lines];
                    [newLines[currentLineIndex - 1], newLines[currentLineIndex]] = [newLines[currentLineIndex], newLines[currentLineIndex - 1]];
                    const lineLength = lines[currentLineIndex].length;
                    const prevLineLength = lines[currentLineIndex - 1].length;
                    const newCursorPos = selectionStart - prevLineLength - 1;
                    
                    setMarkdown(newLines.join('\n'));
                    setTimeout(() => {
                        textarea.selectionStart = textarea.selectionEnd = newCursorPos;
                    }, 0);
                }
            } else if (e.key === 'ArrowDown') {
                 e.preventDefault();
                 if (currentLineIndex < lines.length - 1) {
                    const newLines = [...lines];
                    [newLines[currentLineIndex + 1], newLines[currentLineIndex]] = [newLines[currentLineIndex], newLines[currentLineIndex + 1]];
                    const lineLength = lines[currentLineIndex].length;
                    const nextLineLength = lines[currentLineIndex + 1].length;
                    const newCursorPos = selectionStart + nextLineLength + 1;

                    setMarkdown(newLines.join('\n'));
                     setTimeout(() => {
                        textarea.selectionStart = textarea.selectionEnd = newCursorPos;
                    }, 0);
                 }
            }
        }
    };

    return (
      <div className="border rounded-xl bg-card shadow-sm h-[75vh] flex flex-col">
        <ResizablePanelGroup direction="horizontal" className="flex-1 rounded-t-xl overflow-hidden">
          <ResizablePanel defaultSize={50} className="flex flex-col min-h-0">
            <div className="p-3 border-b text-center text-sm font-medium text-muted-foreground">
              MARKDOWN
            </div>
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
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={50} className="flex flex-col min-h-0">
            <Tabs defaultValue="preview" className="flex flex-col h-full">
                <div className="flex justify-between items-center border-b pr-2">
                    <TabsList className="bg-transparent p-0 m-1">
                        <TabsTrigger value="preview" className="text-sm">Preview</TabsTrigger>
                        <TabsTrigger value="raw" className="text-sm">Raw HTML</TabsTrigger>
                    </TabsList>
                    <div className="flex items-center gap-2">
                         <Button variant="ghost" size="sm" onClick={handleCopy} className="h-8">
                            {isCopied ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
                            {isCopied ? "Copied!" : "Copy"}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleDownload} className="h-8">
                            <Download className="w-4 h-4 mr-2" />
                            Download
                        </Button>
                    </div>
                </div>
                <TabsContent value="preview" className="flex-1 overflow-y-auto mt-0">
                   <ScrollArea className="h-full">
                    <div
                        className="html-preview"
                        dangerouslySetInnerHTML={{ __html: html }}
                    />
                   </ScrollArea>
                </TabsContent>
                <TabsContent value="raw" className="flex-1 overflow-y-auto mt-0 code-editor-container">
                  <ScrollArea className="h-full w-full">
                     <Editor
                      value={html}
                      onValueChange={() => {}} // Read-only
                      highlight={code => Prism.highlight(code, Prism.languages.markup, 'markup')}
                      padding={16}
                      readOnly
                      className="code-editor flex-1 min-h-full"
                    />
                  </ScrollArea>
                </TabsContent>
            </Tabs>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    );
}
