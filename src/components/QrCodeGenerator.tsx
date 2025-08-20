
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Download, Link, Type, Palette, Check, RefreshCw } from "lucide-react";
import QRCode from 'qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Slider } from "./ui/slider";

type QrType = "url" | "text";
type ErrorCorrectionLevel = "low" | "medium" | "quartile" | "high";

export function QrCodeGenerator() {
  const [qrType, setQrType] = useState<QrType>("url");
  const [inputValue, setInputValue] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Advanced Options
  const [size, setSize] = useState(300);
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [errorCorrection, setErrorCorrection] = useState<ErrorCorrectionLevel>('medium');

  const { toast } = useToast();
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    if (inputValue.trim() === '') {
        setQrCodeUrl(null);
        return;
    }

    setIsLoading(true);
    debounceTimeout.current = setTimeout(() => {
        generateQrCode();
    }, 300);

    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    }

  }, [inputValue, size, fgColor, bgColor, errorCorrection]);
  
  const generateQrCode = async () => {
    if (!inputValue.trim()) {
      setQrCodeUrl(null);
      setIsLoading(false);
      return;
    }
    
    try {
      const url = await QRCode.toDataURL(inputValue, {
        width: size,
        margin: 2,
        color: {
          dark: fgColor,
          light: bgColor,
        },
        errorCorrectionLevel: errorCorrection,
      });
      setQrCodeUrl(url);
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "Could not generate QR code. Please check your input.",
      });
      setQrCodeUrl(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!qrCodeUrl) return;
    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = "qrcode.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
        variant: "success",
        title: "QR Code Downloaded!",
    })
  };

  const handleResetOptions = () => {
    setSize(300);
    setFgColor("#000000");
    setBgColor("#ffffff");
    setErrorCorrection("medium");
    toast({ title: "Options Reset", description: "Advanced settings have been reset to default."});
  };

  const onTabChange = (value: string) => {
    setQrType(value as QrType);
    setInputValue("");
    setQrCodeUrl(null);
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <Card className="bg-transparent shadow-lg sticky top-24">
            <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">QR Code Preview</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-6 min-h-[350px]">
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                            <Loader2 className="w-12 h-12 animate-spin text-primary" />
                            <p>Generating...</p>
                        </motion.div>
                    ) : qrCodeUrl ? (
                         <motion.div key="qr" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="flex flex-col items-center gap-6">
                           <img src={qrCodeUrl} alt="Generated QR Code" className="rounded-lg shadow-md border" />
                           <Button onClick={handleDownload}><Download className="mr-2 h-4 w-4" />Download PNG</Button>
                        </motion.div>
                    ) : (
                        <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center text-center gap-2 text-muted-foreground">
                           <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                              <Check className="w-8 h-8 text-primary" />
                           </div>
                           <p className="font-semibold mt-2">Your QR code will appear here</p>
                           <p className="text-sm">Enter content to start generating.</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>

        <div className="space-y-6">
            <Card className="bg-transparent shadow-lg">
                <CardHeader>
                    <CardTitle className="text-xl sm:text-2xl">Enter Content</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs value={qrType} onValueChange={onTabChange} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="url"><Link className="mr-2 h-4 w-4" />URL</TabsTrigger>
                            <TabsTrigger value="text"><Type className="mr-2 h-4 w-4"/>Text</TabsTrigger>
                        </TabsList>
                        <TabsContent value="url" className="pt-4">
                            <Label htmlFor="url-input">Website URL</Label>
                            <Input id="url-input" value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder="https://example.com" />
                        </TabsContent>
                        <TabsContent value="text" className="pt-4">
                             <Label htmlFor="text-input">Your Text</Label>
                             <Textarea id="text-input" value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder="Enter any text here" rows={4} />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            <Card className="bg-transparent shadow-lg">
                <CardHeader className="cursor-pointer" onClick={() => setShowAdvanced(!showAdvanced)}>
                     <div className="flex justify-between items-center">
                        <CardTitle className="text-xl sm:text-2xl flex items-center gap-2"><Palette/> Advanced Options</CardTitle>
                        <motion.div animate={{ rotate: showAdvanced ? 180 : 0 }}>
                            <RefreshCw className={cn("h-4 w-4 text-muted-foreground transition-transform", showAdvanced && "text-primary")} />
                        </motion.div>
                    </div>
                </CardHeader>
                <AnimatePresence>
                {showAdvanced && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <CardContent className="space-y-6 pt-2">
                             <div className="space-y-2">
                                <Label>Size: <span className="font-bold text-primary">{size}px</span></Label>
                                <Slider value={[size]} onValueChange={([val]) => setSize(val)} min={50} max={1000} step={10} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fgColor">Foreground Color</Label>
                                    <div className="relative">
                                      <Input id="fgColor" type="text" value={fgColor} onChange={e => setFgColor(e.target.value)} className="pr-12"/>
                                      <Input type="color" value={fgColor} onChange={e => setFgColor(e.target.value)} className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-10 p-1 cursor-pointer" />
                                    </div>
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="bgColor">Background Color</Label>
                                     <div className="relative">
                                      <Input id="bgColor" type="text" value={bgColor} onChange={e => setBgColor(e.target.value)} className="pr-12"/>
                                      <Input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-10 p-1 cursor-pointer" />
                                    </div>
                                </div>
                            </div>
                             <div className="space-y-2">
                                <Label>Error Correction</Label>
                                <Select value={errorCorrection} onValueChange={v => setErrorCorrection(v as ErrorCorrectionLevel)}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low (~7% correction)</SelectItem>
                                        <SelectItem value="medium">Medium (~15% correction)</SelectItem>
                                        <SelectItem value="quartile">Quartile (~25% correction)</SelectItem>
                                        <SelectItem value="high">High (~30% correction)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             <Button variant="outline" onClick={handleResetOptions}><RefreshCw className="mr-2 h-4 w-4"/>Reset Options</Button>
                        </CardContent>
                    </motion.div>
                )}
                </AnimatePresence>
            </Card>
        </div>
    </div>
  );
}
