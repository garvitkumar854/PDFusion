
"use client";

import React, { useState, useEffect } from "react";
import { marked } from "marked";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Copy, Download, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";

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
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'converted.html';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <Card className="bg-transparent shadow-lg border-0 md:border">
            <CardContent className="p-0 md:p-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 h-[75vh] md:h-[65vh]">
                    {/* Markdown Editor */}
                    <div className="flex flex-col h-full">
                        <div className="p-2 border-b font-semibold text-sm text-center text-muted-foreground">MARKDOWN</div>
                        <ScrollArea className="flex-1 rounded-bl-lg">
                           <Textarea
                                value={markdown}
                                onChange={(e) => setMarkdown(e.target.value)}
                                className="w-full h-full resize-none p-4 font-mono text-sm border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                                placeholder="Type your Markdown here..."
                            />
                        </ScrollArea>
                    </div>
                    
                     {/* HTML Preview */}
                    <div className="flex flex-col h-full">
                        <div className="p-2 border-b font-semibold text-sm text-center text-muted-foreground">HTML</div>
                        <ScrollArea className="flex-1 bg-muted/30 rounded-br-lg p-4">
                             <div
                                className="prose prose-sm dark:prose-invert max-w-none"
                                dangerouslySetInnerHTML={{ __html: html }}
                            />
                        </ScrollArea>
                    </div>
                </div>
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
            </CardContent>
        </Card>
    );
}
