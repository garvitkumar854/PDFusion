
"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Download, CheckCircle, AlertTriangle, Globe } from "lucide-react";
import html2pdf from 'html2pdf.js';

type Status = "idle" | "fetching" | "converting" | "done" | "error";

export function HtmlToPdfConverter() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultFilename, setResultFilename] = useState<string>("");

  const operationId = useRef<number>(0);
  const { toast } = useToast();

  const isBusy = status === "fetching" || status === "converting";

  const getStatusLabel = () => {
    switch (status) {
      case "fetching": return "Fetching website content...";
      case "converting": return "Converting to PDF...";
      default: return "";
    }
  };

  const handleConvert = async () => {
    if (!url) {
      setError("Please enter a valid URL.");
      return;
    }
    
    // Simple URL validation
    try {
      new URL(url);
    } catch (_) {
      setError("Invalid URL format. Please include http:// or https://");
      return;
    }
    
    setError(null);
    const currentOperationId = ++operationId.current;
    setStatus("fetching");

    try {
      const response = await fetch(`/api/proxy?url=${encodeURIComponent(url)}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch content: ${errorText}`);
      }

      if (operationId.current !== currentOperationId) return;
      const htmlContent = await response.text();

      setStatus("converting");

      const element = document.createElement('div');
      element.innerHTML = htmlContent;
      // Append to body so styles are applied, but keep it invisible
      element.style.position = 'absolute';
      element.style.top = '-9999px';
      element.style.left = '-9999px';
      document.body.appendChild(element);
      
      const opt = {
        margin:       0.5,
        filename:     `${new URL(url).hostname}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      const pdfBlob = await html2pdf().from(element).set(opt).output('blob');

      document.body.removeChild(element);

      if (operationId.current !== currentOperationId) return;

      const pdfUrl = URL.createObjectURL(pdfBlob);
      setResultUrl(pdfUrl);
      setResultFilename(opt.filename);
      setStatus("done");

      toast({
        title: "Conversion Successful!",
        description: "Your PDF is ready for download.",
        action: <div className="p-1 rounded-full bg-green-500"><CheckCircle className="w-5 h-5 text-white" /></div>
      });

    } catch (err: any) {
      if (operationId.current === currentOperationId) {
        setStatus("error");
        setError(err.message || "An unexpected error occurred.");
        toast({
          variant: "destructive",
          title: "Conversion Failed",
          description: err.message,
        });
      }
    }
  };

  const handleConvertAgain = () => {
    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
    }
    setResultUrl(null);
    setResultFilename("");
    setUrl("");
    setStatus("idle");
    setError(null);
  };

  if (status === "done" && resultUrl) {
    return (
      <div className="text-center flex flex-col items-center justify-center py-12 animate-in fade-in duration-500 bg-white dark:bg-card p-4 sm:p-8 rounded-xl shadow-lg border">
        <CheckCircle className="w-16 h-16 sm:w-20 sm:h-20 text-green-500 mb-6" />
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Conversion Complete!</h2>
        <p className="text-muted-foreground mb-8 text-sm sm:text-base">Your PDF is ready for download.</p>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4">
          <a href={resultUrl} download={resultFilename}>
            <Button size="lg" className="w-full sm:w-auto text-base font-bold bg-green-600 hover:bg-green-700 text-white">
              <Download className="mr-2 h-5 w-5" /> Download PDF
            </Button>
          </a>
          <Button size="lg" variant="outline" onClick={handleConvertAgain} className="w-full sm:w-auto text-base">
            Convert Another URL
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className="bg-white dark:bg-card shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl">Enter Website URL</CardTitle>
        <CardDescription>
          Provide the URL of the webpage you want to convert to a PDF.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url-input">Website URL</Label>
            <div className="relative">
                 <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                 <Input
                    id="url-input"
                    value={url}
                    onChange={(e) => {
                        setUrl(e.target.value);
                        if (error) setError(null);
                    }}
                    placeholder="https://example.com"
                    disabled={isBusy}
                    className={cn("pl-10", error && "border-destructive")}
                 />
            </div>
            {error && (
              <p className="text-destructive text-sm flex items-center gap-2 pt-1">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </p>
            )}
          </div>
          <div>
            {isBusy ? (
              <div className="p-4 border rounded-lg bg-primary/5 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  <p className="text-sm font-medium text-primary">{getStatusLabel()}</p>
                </div>
              </div>
            ) : (
              <Button size="lg" className="w-full text-base font-bold" onClick={handleConvert} disabled={!url}>
                Convert to PDF
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
