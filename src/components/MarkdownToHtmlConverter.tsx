
"use client";

import React, { useState, useEffect } from "react";
import { marked } from "marked";
import { Button } from "@/components/ui/button";
import { Copy, Download, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "./ui/scroll-area";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/components/prism-markdown";
import "prismjs/themes/prism-okaidia.css";
import { cn } from "@/lib/utils";


const defaultMarkdown = `# Welcome to Markdown to HTML!

This is a **live editor**. Start typing in the Markdown panel on the left, and you'll see the HTML output on the right instantly.

## Features

- **Live Preview**: See your changes as you type.
- **Syntax Highlighting**: The HTML output is styled for readability.
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
    const { toast } = useToast();
    
    useEffect(() => {
        const convertedHtml = marked.parse(markdown);
        setHtml(convertedHtml as string);
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
                    pre { background-color: #f4f4f4; padding: 1rem; border-radius: 0.5rem; }
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
    
     const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Tab" && e.target instanceof HTMLTextAreaElement) {
            e.preventDefault();
            const { selectionStart, selectionEnd, value } = e.target;
            
            const newValue = value.substring(0, selectionStart) + "  " + value.substring(selectionEnd);
            setMarkdown(newValue);
            
            setTimeout(() => {
                if(e.target instanceof HTMLTextAreaElement) {
                    e.target.selectionStart = e.target.selectionEnd = selectionStart + 2;
                }
            }, 0);
        }
    };


    return (
      <div className="border rounded-xl bg-card shadow-sm h-[70vh] min-h-[500px] flex flex-col">
        <ResizablePanelGroup direction="horizontal" className="flex-1 rounded-t-xl overflow-hidden">
          <ResizablePanel defaultSize={50} className="flex flex-col">
            <div className="p-3 border-b text-center text-sm font-medium text-muted-foreground">
              MARKDOWN
            </div>
            <ScrollArea className="flex-1">
                <Editor
                    value={markdown}
                    onValueChange={code => setMarkdown(code)}
                    highlight={code => Prism.highlight(code, Prism.languages.markdown, 'markdown')}
                    padding={16}
                    onKeyDown={handleKeyDown}
                    className="language-markdown h-full font-mono text-sm caret-white"
                    textareaClassName="outline-none w-full"
                    preClassName="h-full"
                />
            </ScrollArea>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={50} className="flex flex-col">
            <div className="flex flex-col h-full">
              <div className="p-3 border-b text-center text-sm font-medium text-muted-foreground">
                HTML
              </div>
              <ScrollArea className="flex-1 p-4">
                <div
                  className="prose prose-sm dark:prose-invert max-w-none"
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
