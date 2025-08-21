
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Download, Link as LinkIcon, Type, Palette, Check, RefreshCw, Smartphone, Mail, User, MessageSquare } from "lucide-react";
import QRCode from 'qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Slider } from "./ui/slider";
import { useForm, FormProvider, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";


type QrType = "url" | "text" | "contact" | "phone" | "sms" | "email";
type ErrorCorrectionLevel = "low" | "medium" | "quartile" | "high";

const qrTypeOptions: { value: QrType; label: string; icon: React.ReactNode }[] = [
    { value: 'url', label: 'URL', icon: <LinkIcon className="h-4 w-4" /> },
    { value: 'text', label: 'Text', icon: <Type className="h-4 w-4" /> },
    { value: 'contact', label: 'Contact (VCard)', icon: <User className="h-4 w-4" /> },
    { value: 'phone', label: 'Phone Number', icon: <Smartphone className="h-4 w-4" /> },
    { value: 'sms', label: 'SMS Message', icon: <MessageSquare className="h-4 w-4" /> },
    { value: 'email', label: 'Email', icon: <Mail className="h-4 w-4" /> },
];

const phoneRegex = new RegExp(
  /^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-.\s]?[0-9])+$/
);

const urlSchema = z.object({ value: z.string().url({ message: "Please enter a valid URL." }).min(1, "URL cannot be empty.") });
const textSchema = z.object({ value: z.string().min(1, "Text cannot be empty.") });
const phoneSchema = z.object({ value: z.string().regex(phoneRegex, "Invalid phone number format.") });
const smsSchema = z.object({
  phone: z.string().regex(phoneRegex, "Invalid phone number format."),
  message: z.string().optional(),
});
const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address.").min(1, "Email cannot be empty."),
  subject: z.string().optional(),
  body: z.string().optional(),
});
const contactSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().optional(),
  phone: z.string().regex(phoneRegex, { message: "Invalid phone number format." }).optional().or(z.literal('')),
  email: z.string().email("Invalid email address.").optional().or(z.literal('')),
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
};

const generateQrData = (type: QrType, data: any): string => {
    const cleanPhone = (p: string) => (p || '').replace(/[\s().-]/g, '');
    switch (type) {
      case 'url':
      case 'text':
        return data.value || "";
      case 'phone':
        return `tel:${cleanPhone(data.value || '')}`;
      case 'sms':
        return `SMSTO:${cleanPhone(data.phone || '')}:${data.message || ''}`;
      case 'email':
        const subject = data.subject ? `subject=${encodeURIComponent(data.subject)}` : '';
        const body = data.body ? `body=${encodeURIComponent(data.body)}` : '';
        const params = [subject, body].filter(Boolean).join('&');
        return `mailto:${data.email || ''}${params ? `?${params}`: ''}`;
      case 'contact':
        return `BEGIN:VCARD\nVERSION:3.0\nN:${data.lastName || ''};${data.firstName || ''}\nFN:${data.firstName || ''} ${data.lastName || ''}\n${data.title ? `TITLE:${data.title}\n` : ''}${data.company ? `ORG:${data.company}\n` : ''}${data.phone ? `TEL;TYPE=CELL:${cleanPhone(data.phone)}\n` : ''}${data.email ? `EMAIL:${data.email}\n` : ''}END:VCARD`;
      default:
        return "";
    }
}

const QrCodeForm = React.memo(({ qrType }: { qrType: QrType }) => {
    const { control } = useFormContext();
    const labelClass = "text-foreground font-semibold";
    
    switch(qrType) {
        case "url": return <FormField control={control} name="value" render={({ field }) => (<FormItem><FormLabel className={labelClass}>Website URL</FormLabel><FormControl><Input placeholder="https://example.com" {...field} /></FormControl><FormMessage /></FormItem>)} />;
        case "text": return <FormField control={control} name="value" render={({ field }) => (<FormItem><FormLabel className={labelClass}>Your Text</FormLabel><FormControl><Textarea placeholder="Enter any text here" rows={4} {...field} /></FormControl><FormMessage /></FormItem>)} />;
        case "phone": return <FormField control={control} name="value" render={({ field }) => (<FormItem><FormLabel className={labelClass}>Phone Number</FormLabel><FormControl><Input type="tel" placeholder="+1 123 456 7890" {...field} /></FormControl><FormMessage /></FormItem>)} />;
        case "sms": return <div className="space-y-4"><FormField control={control} name="phone" render={({ field }) => (<FormItem><FormLabel className={labelClass}>Recipient Phone Number</FormLabel><FormControl><Input type="tel" placeholder="+1 123 456 7890" {...field} /></FormControl><FormMessage /></FormItem>)} /><FormField control={control} name="message" render={({ field }) => (<FormItem><FormLabel className={labelClass}>Message (optional)</FormLabel><FormControl><Textarea placeholder="Your message here..." {...field} /></FormControl><FormMessage /></FormItem>)} /></div>;
        case "email": return <div className="space-y-4"><FormField control={control} name="email" render={({ field }) => (<FormItem><FormLabel className={labelClass}>Recipient Email</FormLabel><FormControl><Input type="email" placeholder="recipient@example.com" {...field} /></FormControl><FormMessage /></FormItem>)} /><FormField control={control} name="subject" render={({ field }) => (<FormItem><FormLabel className={labelClass}>Subject (optional)</FormLabel><FormControl><Input placeholder="Email subject" {...field} /></FormControl><FormMessage /></FormItem>)} /><FormField control={control} name="body" render={({ field }) => (<FormItem><FormLabel className={labelClass}>Body (optional)</FormLabel><FormControl><Textarea placeholder="Your email body..." {...field} /></FormControl><FormMessage /></FormItem>)} /></div>;
        case "contact": return (
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={control} name="firstName" render={({ field }) => (<FormItem><FormLabel className={labelClass}>First Name</FormLabel><FormControl><Input placeholder="John" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={control} name="lastName" render={({ field }) => (<FormItem><FormLabel className={labelClass}>Last Name</FormLabel><FormControl><Input placeholder="Doe" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <FormField control={control} name="phone" render={({ field }) => (<FormItem><FormLabel className={labelClass}>Phone</FormLabel><FormControl><Input type="tel" placeholder="+1 123 456 7890" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={control} name="email" render={({ field }) => (<FormItem><FormLabel className={labelClass}>Email</FormLabel><FormControl><Input type="email" placeholder="john.doe@example.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={control} name="company" render={({ field }) => (<FormItem><FormLabel className={labelClass}>Company</FormLabel><FormControl><Input placeholder="Example Inc." {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={control} name="title" render={({ field }) => (<FormItem><FormLabel className={labelClass}>Job Title</FormLabel><FormControl><Input placeholder="Developer" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
            </div>
        );
        default: return null;
    }
});
QrCodeForm.displayName = 'QrCodeForm';


const QrCodeFormProvider = ({
  qrType,
  onDataChange,
  children,
}: {
  qrType: QrType;
  onDataChange: (data: string | null) => void;
  children: React.ReactNode;
}) => {
  const form = useForm({
    resolver: zodResolver(formSchemas[qrType]),
    defaultValues: defaultValues[qrType],
    mode: 'onBlur',
  });

  useEffect(() => {
    const subscription = form.watch(async (value) => {
      const isValid = await form.trigger();
      if (isValid) {
        const generated = generateQrData(qrType, value);
        onDataChange(generated.trim() ? generated : null);
      } else {
        onDataChange(null);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, qrType, onDataChange]);

  return <FormProvider {...form}>{children}</FormProvider>;
};


export function QrCodeGenerator() {
  const [qrType, setQrType] = useState<QrType>("url");
  const [qrData, setQrData] = useState<string | null>(null);
  const [debouncedQrData, setDebouncedQrData] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [size, setSize] = useState(300);
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [errorCorrection, setErrorCorrection] = useState<ErrorCorrectionLevel>('medium');
  const { toast } = useToast();

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQrData(qrData);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [qrData]);

  useEffect(() => {
    setIsLoading(true);
    const generate = async () => {
        if (!debouncedQrData) {
            setQrCodeUrl(null);
            setIsLoading(false);
            return;
        }
        try {
            const url = await QRCode.toDataURL(debouncedQrData, {
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
    };

    generate();
    
  }, [debouncedQrData, size, fgColor, bgColor, errorCorrection]);


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
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        <div className="space-y-6 lg:col-span-3">
            <Card className="bg-transparent shadow-lg w-full">
                <CardHeader>
                    <CardTitle className="text-xl sm:text-2xl">Enter Content</CardTitle>
                    <CardDescription>Select a content type and fill in the details.</CardDescription>
                </CardHeader>
                <CardContent>
                <QrCodeFormProvider qrType={qrType} onDataChange={setQrData} key={qrType}>
                    <div className="space-y-4">
                        <Label>Content Type</Label>
                        <Select value={qrType} onValueChange={(v) => setQrType(v as QrType)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select content type" />
                            </SelectTrigger>
                            <SelectContent>
                                {qrTypeOptions.map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                        <div className="flex items-center gap-2">
                                        {option.icon}
                                        {option.label}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="space-y-4 pt-4">
                            <QrCodeForm qrType={qrType} />
                        </div>
                    </div>
                 </QrCodeFormProvider>
                </CardContent>
            </Card>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Palette />
                    <span>Styling Options</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-6 pt-4">
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
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
        </div>

        <div className="w-full lg:col-span-2 lg:sticky lg:top-24">
             <Card className="bg-transparent shadow-lg w-full">
                <CardHeader>
                    <CardTitle className="text-xl sm:text-2xl">Preview</CardTitle>
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
    </div>
  );
}
