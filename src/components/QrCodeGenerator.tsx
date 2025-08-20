
"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Download, Link, Type, Palette, Check, RefreshCw, Smartphone, Mail, User, MessageSquare, ChevronDown } from "lucide-react";
import QRCode from 'qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Slider } from "./ui/slider";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";


type QrType = "url" | "text" | "contact" | "sms" | "email" | "phone";
type ErrorCorrectionLevel = "low" | "medium" | "quartile" | "high";

const urlSchema = z.object({ value: z.string().url("Please enter a valid URL.") });
const textSchema = z.object({ value: z.string().min(1, "Text cannot be empty.") });
const phoneSchema = z.object({ value: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Please enter a valid phone number.") });
const smsSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Please enter a valid phone number."),
  message: z.string(),
});
const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  subject: z.string(),
  body: z.string(),
});
const contactSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string(),
  phone: z.string().optional(),
  email: z.string().email("Please enter a valid email.").optional().or(z.literal('')),
  company: z.string().optional(),
  title: z.string().optional(),
});


const formSchemas: Record<QrType, z.ZodSchema> = {
  url: urlSchema,
  text: textSchema,
  phone: phoneSchema,
  sms: smsSchema,
  email: emailSchema,
  contact: contactSchema,
};

const defaultValues: Record<QrType, any> = {
    url: { value: "" },
    text: { value: "" },
    phone: { value: "" },
    sms: { phone: "", message: "" },
    email: { email: "", subject: "", body: "" },
    contact: { firstName: "", lastName: "", phone: "", email: "", company: "", title: "" },
}

export function QrCodeGenerator() {
  const [qrType, setQrType] = useState<QrType>("url");
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Advanced Options
  const [size, setSize] = useState(300);
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [errorCorrection, setErrorCorrection] = useState<ErrorCorrectionLevel>('medium');

  const { toast } = useToast();
  
  const form = useForm({
    resolver: zodResolver(formSchemas[qrType]),
    defaultValues: defaultValues[qrType],
    mode: 'onChange'
  });
  
  const formData = form.watch();

  const generateQrData = (type: QrType, data: any): string => {
    switch (type) {
      case 'url':
      case 'text':
      case 'phone':
        return type === 'phone' ? `tel:${data.value}` : data.value;
      case 'sms':
        return `SMSTO:${data.phone}:${data.message}`;
      case 'email':
        return `mailto:${data.email}?subject=${encodeURIComponent(data.subject)}&body=${encodeURIComponent(data.body)}`;
      case 'contact':
        return `BEGIN:VCARD\nVERSION:3.0\nN:${data.lastName};${data.firstName}\nFN:${data.firstName} ${data.lastName}\n${data.title ? `TITLE:${data.title}\n` : ''}${data.company ? `ORG:${data.company}\n` : ''}${data.phone ? `TEL;TYPE=CELL:${data.phone}\n` : ''}${data.email ? `EMAIL:${data.email}\n` : ''}END:VCARD`;
      default:
        return "";
    }
  }

  const debouncedGenerate = useMemo(() => {
    let timeout: NodeJS.Timeout;
    return () => {
      clearTimeout(timeout);
      timeout = setTimeout(async () => {
          const isValid = await form.trigger();
          if (!isValid) {
            setQrCodeUrl(null);
            setIsLoading(false);
            return;
          }
          const qrData = generateQrData(qrType, form.getValues());
          if (!qrData.trim()) {
              setQrCodeUrl(null);
              setIsLoading(false);
              return;
          }

          try {
            const url = await QRCode.toDataURL(qrData, {
              width: size,
              margin: 2,
              color: { dark: fgColor, light: bgColor },
              errorCorrectionLevel: errorCorrection,
            });
            setQrCodeUrl(url);
          } catch (err) {
            console.error(err);
            setQrCodeUrl(null);
          } finally {
            setIsLoading(false);
          }
      }, 300);
    };
  }, [form, qrType, size, fgColor, bgColor, errorCorrection]);


  useEffect(() => {
    setIsLoading(true);
    debouncedGenerate();
  }, [formData, qrType, size, fgColor, bgColor, errorCorrection, debouncedGenerate]);


  useEffect(() => {
    form.reset(defaultValues[qrType]);
    setQrCodeUrl(null);
  }, [qrType, form]);

  const handleDownload = () => {
    if (!qrCodeUrl) return;
    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = "qrcode.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ variant: "success", title: "QR Code Downloaded!" });
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
  };
  
  const FormContent = () => (
    <Tabs value={qrType} onValueChange={onTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="url"><Link className="mr-1 h-4 w-4" />URL</TabsTrigger>
            <TabsTrigger value="text"><Type className="mr-1 h-4 w-4"/>Text</TabsTrigger>
            <TabsTrigger value="contact"><User className="mr-1 h-4 w-4"/>Contact</TabsTrigger>
            <TabsTrigger value="phone"><Smartphone className="mr-1 h-4 w-4"/>Phone</TabsTrigger>
            <TabsTrigger value="sms"><MessageSquare className="mr-1 h-4 w-4"/>SMS</TabsTrigger>
            <TabsTrigger value="email"><Mail className="mr-1 h-4 w-4"/>Email</TabsTrigger>
        </TabsList>
        
        <Form {...form}>
            <form className="space-y-4 pt-4">
                <TabsContent value="url" className="m-0">
                    <FormField control={form.control} name="value" render={({ field }) => (
                        <FormItem><FormLabel>Website URL</FormLabel><FormControl><Input placeholder="https://example.com" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </TabsContent>
                <TabsContent value="text" className="m-0">
                     <FormField control={form.control} name="value" render={({ field }) => (
                        <FormItem><FormLabel>Your Text</FormLabel><FormControl><Textarea placeholder="Enter any text here" rows={4} {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </TabsContent>
                <TabsContent value="phone" className="m-0">
                    <FormField control={form.control} name="value" render={({ field }) => (
                        <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="+11234567890" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </TabsContent>
                 <TabsContent value="sms" className="m-0 space-y-4">
                    <FormField control={form.control} name="phone" render={({ field }) => (
                        <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="+11234567890" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="message" render={({ field }) => (
                        <FormItem><FormLabel>Message (optional)</FormLabel><FormControl><Textarea placeholder="Your message here..." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </TabsContent>
                <TabsContent value="email" className="m-0 space-y-4">
                    <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem><FormLabel>Recipient Email</FormLabel><FormControl><Input type="email" placeholder="recipient@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                     <FormField control={form.control} name="subject" render={({ field }) => (
                        <FormItem><FormLabel>Subject (optional)</FormLabel><FormControl><Input placeholder="Email subject" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="body" render={({ field }) => (
                        <FormItem><FormLabel>Body (optional)</FormLabel><FormControl><Textarea placeholder="Your email body..." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </TabsContent>
                <TabsContent value="contact" className="m-0 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="firstName" render={({ field }) => (
                          <FormItem><FormLabel>First Name</FormLabel><FormControl><Input placeholder="John" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="lastName" render={({ field }) => (
                          <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input placeholder="Doe" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                     <FormField control={form.control} name="phone" render={({ field }) => (
                        <FormItem><FormLabel>Phone (optional)</FormLabel><FormControl><Input type="tel" placeholder="+11234567890" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                     <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem><FormLabel>Email (optional)</FormLabel><FormControl><Input type="email" placeholder="john.doe@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                     <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="company" render={({ field }) => (
                            <FormItem><FormLabel>Company (optional)</FormLabel><FormControl><Input placeholder="Example Inc." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="title" render={({ field }) => (
                            <FormItem><FormLabel>Job Title (optional)</FormLabel><FormControl><Input placeholder="Developer" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                </TabsContent>
            </form>
        </Form>
    </Tabs>
  )
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <Card className="bg-transparent shadow-lg w-full">
                <CardHeader>
                    <CardTitle className="text-xl sm:text-2xl">Enter Content</CardTitle>
                </CardHeader>
                <CardContent>
                   <FormContent />
                </CardContent>
            </Card>

            <Card className="bg-transparent shadow-lg w-full md:sticky md:top-24">
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
                            <p className="text-sm">Enter valid content to start generating.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-1 w-full">
             <Card className="bg-transparent shadow-lg sticky top-24">
                <CardHeader className="cursor-pointer" onClick={() => setShowAdvanced(!showAdvanced)}>
                     <div className="flex justify-between items-center">
                        <CardTitle className="text-xl flex items-center gap-2"><Palette/> Options</CardTitle>
                        <motion.div animate={{ rotate: showAdvanced ? 180 : 0 }}>
                            <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform", showAdvanced && "text-primary")} />
                        </motion.div>
                    </div>
                    <CardDescription>Customize the appearance of your QR Code.</CardDescription>
                </CardHeader>
                <AnimatePresence>
                {showAdvanced && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <CardContent className="space-y-6 pt-0">
                             <div className="space-y-2">
                                <Label>Size: <span className="font-bold text-primary">{size}px</span></Label>
                                <Slider value={[size]} onValueChange={([val]) => setSize(val)} min={50} max={1000} step={10} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fgColor">Foreground</Label>
                                    <div className="relative">
                                      <Input id="fgColor" type="text" value={fgColor} onChange={e => setFgColor(e.target.value)} className="pr-12"/>
                                      <Input type="color" value={fgColor} onChange={e => setFgColor(e.target.value)} className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-10 p-1 cursor-pointer" />
                                    </div>
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="bgColor">Background</Label>
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
                             <Button variant="outline" size="sm" onClick={handleResetOptions}><RefreshCw className="mr-2 h-4 w-4"/>Reset Options</Button>
                        </CardContent>
                    </motion.div>
                )}
                </AnimatePresence>
            </Card>
        </div>
    </div>
  );
}
