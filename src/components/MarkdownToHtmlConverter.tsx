
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

export function MarkdownToHtmlConverter() {
    const [markdown, setMarkdown] = useState(defaultMarkdown);
    const [html, setHtml] = useState("");
    const [isCopied, setIsCopied] = useState(false);
    const [lineCount, setLineCount] = useState(defaultMarkdown.split('\n').length);
    const { toast } = useToast();

    const editorRef = useRef<any>(null);
    const lineNumbersRef = useRef<HTMLDivElement>(null);
    const editorContainerRef = useRef<HTMLDivElement>(null);


    useEffect(() => {
        const convertedHtml = marked.parse(markdown);
        setHtml(convertedHtml as string);
        setLineCount(markdown.split('\n').length);
    }, [markdown]);

    const handleCopy = () => {
        navigator.clipboard.writeText(html);
        setIsCopied(true);
        toast({
            variant: "success",
            title: "HTML Copied!",
            description: "The generated HTML has been copied to your clipboard.",
        });
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
                    pre { background-color: #f4f4f4; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word; }
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

        // Handle Tab and Shift+Tab for indentation
        if (e.key === "Tab") {
            e.preventDefault();
            const indentation = "  ";
            const newValue = value.substring(0, selectionStart) + indentation + value.substring(selectionEnd);
            setMarkdown(newValue);
            setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = selectionStart + indentation.length;
            }, 0);
        }
        
        // Handle Ctrl+D for line duplication
        if (e.ctrlKey && e.key === 'd') {
            e.preventDefault();
            const lines = value.split('\n');
            const startLine = value.substring(0, selectionStart).split('\n').length - 1;
            const lineToDuplicate = lines[startLine];
            
            lines.splice(startLine, 0, lineToDuplicate);
            
            const newValue = lines.join('\n');
            const newCursorPos = value.substring(0, selectionStart).length + lineToDuplicate.length + 1;
            
            setMarkdown(newValue);
            setTimeout(() => {
                 textarea.selectionStart = textarea.selectionEnd = newCursorPos;
            }, 0);
        }
    };
    
    const syncScroll = () => {
        if (editorRef.current?._input && lineNumbersRef.current) {
            lineNumbersRef.current.scrollTop = editorRef.current._input.scrollTop;
        }
    };

    return (
      <div className="border rounded-xl bg-card shadow-sm h-full min-h-[70vh] flex flex-col">
        <ResizablePanelGroup direction="horizontal" className="flex-1 rounded-t-xl overflow-hidden">
          <ResizablePanel defaultSize={50} className="flex flex-col min-h-0">
            <div className="p-3 border-b text-center text-sm font-medium text-muted-foreground">
              MARKDOWN
            </div>
             <div ref={editorContainerRef} className="flex-1 flex overflow-hidden code-editor-container">
                <ScrollArea className="h-full">
                    <div ref={lineNumbersRef} className="line-numbers">
                        {Array.from({ length: lineCount }, (_, i) => i + 1).map(num => (
                            <div key={num}>{num}</div>
                        ))}
                    </div>
                </ScrollArea>
                <ScrollArea className="h-full flex-1">
                  <Editor
                      ref={editorRef}
                      value={markdown}
                      onValueChange={setMarkdown}
                      highlight={code => Prism.highlight(code, Prism.languages.markdown, 'markdown')}
                      padding={16}
                      onKeyDown={handleKeyDown}
                      onScroll={syncScroll}
                      className="code-editor h-full"
                  />
                </ScrollArea>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={50} className="flex flex-col min-h-0">
            <div className="flex flex-col h-full">
              <div className="p-3 border-b text-center text-sm font-medium text-muted-foreground">
                HTML PREVIEW
              </div>
              <ScrollArea className="flex-1 p-4">
                <div
                  className="prose prose-sm dark:prose-invert max-w-none prose-pre:whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              </ScrollArea>
              <div className="flex items-center justify-end p-2 border-t gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {isCopied ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
                  {isCopied ? "Copied!" : "Copy HTML"}
                </Button>
                <Button size="sm" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Download .html
                </Button>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    );
}

