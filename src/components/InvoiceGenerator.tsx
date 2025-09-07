
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { ArrowRight, CalendarIcon, Check, ChevronsUpDown, Edit2, Image as ImageIcon, Info, Plus, Percent, NotebookText, Trash2, Copy, Scale, Pilcrow, FileText as FileTextIcon, MessageSquare, X, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm, FormProvider, useFormContext, Controller, useFieldArray, Control } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { countryList } from '@/lib/country-data';
import { currencyList } from '@/lib/currency-data';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


const invoiceDetailsSchema = z.object({
    invoiceTitle: z.string().min(1, "Invoice title is required."),
    invoiceNumber: z.string().min(1, "Invoice number is required."),
    invoiceDate: z.date({ required_error: "Invoice date is required."}),
    dueDate: z.date().optional(),
    
    topLevelCustomFields: z.array(z.object({ key: z.string().min(1, "Field name is required."), value: z.string().min(1, "Value is required.") })).optional(),
    
    billedByCountry: z.string().min(1, "Country is required."),
    billedByBusinessName: z.string().min(1, "Business name is required."),
    billedByGstin: z.string().optional(),
    billedByAddress: z.string().optional(),
    billedByCity: z.string().optional(),
    billedByZip: z.string().optional(),
    billedByState: z.string().optional(),
    billedByEmail: z.string().email({ message: "Invalid email address." }).optional().or(z.literal('')),
    billedByPan: z.string().optional(),
    billedByPhone: z.string().optional(),
    billedByCustomFields: z.array(z.object({ key: z.string().min(1, "Field name is required."), value: z.string().min(1, "Value is required.") })).optional(),

    billedToCountry: z.string().min(1, "Country is required."),
    billedToBusinessName: z.string().min(1, "Client's business name is required."),
    billedToGstin: z.string().optional(),
    billedToAddress: z.string().optional(),
    billedToCity: z.string().optional(),
    billedToZip: z.string().optional(),
    billedToState: z.string().optional(),
    billedToEmail: z.string().email({ message: "Invalid email address." }).optional().or(z.literal('')),
    billedToPan: z.string().optional(),
    billedToPhone: z.string().optional(),
    billedToCustomFields: z.array(z.object({ key: z.string().min(1, "Field name is required."), value: z.string().min(1, "Value is required.") })).optional(),
    
    currency: z.string().min(1, "Currency is required."),
    logo: z.any().optional(),

    items: z.array(z.object({
        name: z.string().min(1, "Item name is required."),
        description: z.string().optional(),
        hsn: z.string().optional(),
        quantity: z.number().min(0),
        rate: z.number().min(0),
        gstRate: z.number().optional(),
        thumbnail: z.any().optional(),
        unit: z.string().optional(),
        type: z.string().optional(),
    })).min(1, "Please add at least one item."),
});

type InvoiceDetailsValues = z.infer<typeof invoiceDetailsSchema>;

const StageStepper = ({ currentStage }: { currentStage: number }) => {
    const stages = ["Add Invoice Details", "Add Banking Details", "Download"];

    return (
        <div className="flex items-center justify-center mb-12">
            {stages.map((stage, index) => (
                <React.Fragment key={stage}>
                    <div className="flex items-center gap-2">
                        <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold", 
                            index + 1 === currentStage ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}>
                            {index + 1}
                        </div>
                        <span className={cn("font-semibold", index + 1 === currentStage ? "text-primary" : "text-muted-foreground")}>{stage}</span>
                    </div>
                    {index < stages.length - 1 && <div className="w-12 h-px bg-border mx-4 hidden sm:block"></div>}
                </React.Fragment>
            ))}
        </div>
    )
}

const EditableField = ({ name, placeholder, className, as = "input", type = "text" }: { name: string, placeholder?: string, className?: string, as?: 'input' | 'textarea', type?: string }) => {
    const { control } = useFormContext();
    const Comp = as === 'input' ? Input : Textarea;
    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <Comp
                    {...field}
                    placeholder={placeholder}
                    type={type}
                    className={cn(
                        "w-full p-1 bg-transparent border-0 border-b rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:bg-muted/50 text-sm h-auto",
                        className
                    )}
                />
            )}
        />
    )
}

const CountrySelector = ({ field, label }: { field: any, label: string }) => {
    const [open, setOpen] = React.useState(false)
    const selectedCountry = countryList.find(c => c.code === field.value);
    
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <FormControl>
            <Button
              variant="outline"
              role="combobox"
              className={cn(
                "w-full justify-between text-muted-foreground text-sm h-auto p-1 border-0 border-b rounded-none hover:bg-muted/50 font-normal",
                !field.value && "text-muted-foreground"
              )}
            >
              {selectedCountry ? <div className="flex items-center gap-2"><span className="text-lg">{selectedCountry.flag}</span> <span>{selectedCountry.name}</span></div> : label}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search country..." />
            <CommandList>
                <CommandEmpty>No country found.</CommandEmpty>
                <CommandGroup className="max-h-64 overflow-y-auto">
                {countryList.map((country) => (
                    <CommandItem
                    value={country.name}
                    key={country.code}
                    onSelect={() => {
                        field.onChange(country.code)
                        setOpen(false)
                    }}
                    >
                    <Check
                        className={cn(
                        "mr-2 h-4 w-4",
                        country.code === field.value
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                    />
                    {country.flag} {country.name}
                    </CommandItem>
                ))}
                </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
}

const PhoneInput = ({ control, prefix }: { control: any, prefix: string }) => {
    const { watch } = useFormContext<InvoiceDetailsValues>();
    const countryCode = watch(`${prefix}Country` as const);
    const phoneCode = countryList.find(c => c.code === countryCode)?.phoneCode || '';
    
    return (
        <div className="flex items-center gap-2 border-b">
            <Input value={phoneCode} className="w-16 bg-transparent border-none text-sm h-auto p-1" readOnly placeholder="Code"/>
            <FormField
                control={control}
                name={`${prefix}Phone`}
                render={({ field }) => (
                    <FormItem className="flex-1">
                        <FormControl>
                            <Input type="tel" placeholder="Phone Number" {...field} className="text-sm h-auto p-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:bg-muted/50 rounded-none" />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    )
}

const BilledPartyForm = ({ type }: { type: 'By' | 'To' }) => {
    const { control, watch, setValue } = useFormContext<InvoiceDetailsValues>();
    const prefix = `billed${type}` as const;
    const { fields, append, remove } = useFieldArray({ control, name: `${prefix}CustomFields` });

    const showEmail = watch(`${prefix}Email`) !== undefined;
    const showPan = watch(`${prefix}Pan`) !== undefined;

    return (
        <Card className="p-4">
            <h3 className="font-bold text-lg mb-1">Billed {type}</h3>
            <p className="text-sm text-muted-foreground mb-4">{type === 'By' ? 'Your Details' : "Client's Details"}</p>
            <div className="space-y-2">
                <FormField control={control} name={`${prefix}Country`} render={({ field }) => (<CountrySelector field={field} label="Select country"/>)} />
                <EditableField name={`${prefix}BusinessName`} placeholder={type === 'By' ? 'Your Business Name*' : "Client's Business Name*"} />
                
                <div className="grid grid-cols-2 gap-2">
                    {showEmail ? <EditableField name={`${prefix}Email`} placeholder="Email Address" /> : <div/>}
                    <PhoneInput control={control} prefix={prefix} />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                    <EditableField name={`${prefix}Gstin`} placeholder="GSTIN" />
                    {showPan ? <EditableField name={`${prefix}Pan`} placeholder="PAN Number" /> : <div/>}
                </div>

                <EditableField name={`${prefix}Address`} placeholder="Address" as="input"/>
                
                <div className="grid grid-cols-2 gap-2">
                    <EditableField name={`${prefix}City`} placeholder="City" />
                    <EditableField name={`${prefix}Zip`} placeholder="Postal Code / ZIP" />
                </div>
                <EditableField name={`${prefix}State`} placeholder="State" />
                
                {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                       <EditableField name={`${prefix}CustomFields.${index}.key`} placeholder="Field Name" />
                       <EditableField name={`${prefix}CustomFields.${index}.value`} placeholder="Value" />
                       <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                ))}
                
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs pt-2">
                    {!showEmail && <Button type="button" variant="link" size="sm" className="p-0 h-auto text-primary" onClick={() => setValue(`${prefix}Email` as const, '')}><Mail className="w-3 h-3 mr-1"/>Add Email</Button>}
                    {!showPan && <Button type="button" variant="link" size="sm" className="p-0 h-auto text-primary" onClick={() => setValue(`${prefix}Pan` as const, '')}><FileTextIcon className="w-3 h-3 mr-1"/>Add PAN</Button>}
                    <Button type="button" variant="link" size="sm" className="p-0 h-auto text-primary" onClick={() => append({ key: '', value: '' })}><Plus className="w-3 h-3 mr-1"/>Add Custom Field</Button>
                </div>
            </div>
        </Card>
    )
}

const ItemRow = ({ index }: { index: number }) => {
    const { control, watch, setValue } = useFormContext<InvoiceDetailsValues>();
    const { fields, remove, insert } = useFieldArray({ control, name: "items" });
    const [showDescription, setShowDescription] = useState(false);
    
    const item = watch(`items.${index}`);
    const quantity = Number(item.quantity) || 0;
    const rate = Number(item.rate) || 0;
    const gstRate = Number(item.gstRate) || 0;

    const amount = quantity * rate;
    const gstAmount = amount * (gstRate / 100);
    const total = amount + gstAmount;

    const { getRootProps, getInputProps } = useDropzone({
        onDrop: (acceptedFiles) => {
            const file = acceptedFiles[0];
            if (file) {
                setValue(`items.${index}.thumbnail`, file);
            }
        },
        accept: { 'image/*': ['.jpeg', '.png'] },
        multiple: false,
    });


    return (
        <Card className="p-2 bg-background/50">
            <div className="grid grid-cols-[2fr_repeat(8,_1fr)_auto] gap-x-2 gap-y-1 items-start text-sm">
                 <EditableField name={`items.${index}.name`} placeholder="Item Name" as="input" />
                 <EditableField name={`items.${index}.hsn`} placeholder="HSN/SAC" className="text-right" />
                 <EditableField name={`items.${index}.gstRate`} placeholder="%" className="text-right" />
                 <EditableField name={`items.${index}.quantity`} placeholder="Qty" className="text-right" type="number" />
                 <EditableField name={`items.${index}.rate`} placeholder="Rate" className="text-right" type="number" />
                 <div className="text-right pt-1">{amount.toFixed(2)}</div>
                 <div className="text-right pt-1">{(gstAmount / 2).toFixed(2)}</div>
                 <div className="text-right pt-1">{(gstAmount / 2).toFixed(2)}</div>
                 <div className="text-right pt-1 font-bold">{total.toFixed(2)}</div>
                 <Button type="button" variant="ghost" size="icon" className="w-6 h-6 justify-self-end" onClick={() => remove(index)}><X className="w-4 h-4 text-destructive"/></Button>
            </div>
             {showDescription && (
                <div className="mt-2 pr-8">
                     <EditableField name={`items.${index}.description`} placeholder="Add a description..." as="textarea" className="h-12 resize-none" />
                </div>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs">
                <Button type="button" variant="link" size="sm" className="p-0 h-auto text-primary" onClick={() => setShowDescription(s => !s)}><Plus className="w-3 h-3 mr-1"/>Add Description</Button>
                <div {...getRootProps()}><Button type="button" variant="link" size="sm" className="p-0 h-auto text-primary"><ImageIcon className="w-3 h-3 mr-1"/>Add Thumbnail</Button><input {...getInputProps()} /></div>
                <div className="flex-grow"/>
                <Button type="button" variant="link" size="sm" className="p-0 h-auto text-primary" onClick={() => fields.length > 1 && insert(index + 1, item)}><Copy className="w-3 h-3 mr-1"/>Duplicate</Button>
            </div>
        </Card>
    )
}

export function InvoiceGenerator() {
    const [currentStage, setCurrentStage] = useState(1);
    const { toast } = useToast();
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [showDueDate, setShowDueDate] = useState(false);

    const form = useForm<InvoiceDetailsValues>({
        resolver: zodResolver(invoiceDetailsSchema),
        defaultValues: {
            invoiceTitle: "Invoice",
            invoiceNumber: "",
            invoiceDate: new Date(),
            billedByCountry: "IN",
            billedToCountry: "IN",
            currency: "INR",
            items: [{ name: "", quantity: 1, rate: 0, gstRate: 18, description: "", hsn: "", unit: "", type: "product", thumbnail: null }],
            topLevelCustomFields: [],
            billedByCustomFields: [],
            billedToCustomFields: [],
            billedByBusinessName: "",
            billedToBusinessName: "",
            billedByGstin: "",
            billedToGstin: "",
            billedByAddress: "",
            billedToAddress: "",
            billedByCity: "",
            billedToCity: "",
            billedByState: "",
            billedToState: "",
            billedByZip: "",
            billedToZip: "",
            billedByEmail: undefined,
            billedByPan: undefined,
            billedByPhone: "",
            billedToEmail: undefined,
            billedToPan: undefined,
            billedToPhone: "",
            dueDate: undefined,
        }
    });

    const { control, setValue } = form;
    const { fields: topLevelFields, append: appendTopLevel, remove: removeTopLevel } = useFieldArray({ control: form.control, name: "topLevelCustomFields" });
    const { fields: itemFields, append: appendItem } = useFieldArray({ control: form.control, name: "items" });

    const onDrop = React.useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file) {
            form.setValue('logo', file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    }, [form]);

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.jpeg', '.png'] },
        multiple: false,
    });


    function onSubmit(data: InvoiceDetailsValues) {
       console.log(data);
       toast({ title: 'Invoice Details Saved!', description: 'Moving to the next step.' });
       setCurrentStage(2);
    }
    
  return (
    <FormProvider {...form}>
        <div className="w-full max-w-7xl mx-auto">
            <StageStepper currentStage={currentStage} />
            
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                 <div className="text-center mb-8">
                     <FormField
                        control={form.control}
                        name="invoiceTitle"
                        render={({ field }) => (
                            <FormItem className="inline-flex items-center gap-2">
                                <FormControl>
                                    <Input 
                                        {...field} 
                                        className="text-4xl font-bold h-auto p-2 text-center border-none focus-visible:ring-1 focus-visible:ring-primary w-auto"
                                     />
                                </FormControl>
                                <Button type="button" variant="ghost" size="icon"><Edit2 className="w-6 h-6 text-muted-foreground" /></Button>
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                   <div className="space-y-4">
                         <FormField control={form.control} name="invoiceNumber" render={({ field }) => (<FormItem className="flex items-center gap-4 space-y-0"><FormLabel className="w-28 mt-2">Invoice No*</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                         <FormField control={form.control} name="invoiceDate" render={({ field }) => (
                            <FormItem className="flex items-center gap-4 space-y-0">
                                <FormLabel className="w-28">Invoice Date*</FormLabel>
                                <Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>{field.value ? format(field.value, "LLL dd, y") : (<span>Pick a date</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover>
                                <FormMessage />
                            </FormItem>
                         )} />
                        {showDueDate && <FormField control={form.control} name="dueDate" render={({ field }) => (
                            <FormItem className="flex items-center gap-4 space-y-0">
                                <FormLabel className="w-28">Due Date</FormLabel>
                                <Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>{field.value ? format(field.value, "LLL dd, y") : (<span>Pick a date</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover>
                                <FormMessage />
                            </FormItem>
                        )} />}
                         {topLevelFields.map((field, index) => (
                            <div key={field.id} className="flex items-end gap-2">
                               <FormField control={form.control} name={`topLevelCustomFields.${index}.key`} render={({ field }) => (<FormItem className="flex-1"><FormControl><Input placeholder="Field Name" {...field} /></FormControl><FormMessage /></FormItem>)} />
                               <FormField control={form.control} name={`topLevelCustomFields.${index}.value`} render={({ field }) => (<FormItem className="flex-1"><FormControl><Input placeholder="Value" {...field} /></FormControl><FormMessage /></FormItem>)} />
                               <Button type="button" variant="ghost" size="icon" onClick={() => removeTopLevel(index)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                            </div>
                        ))}
                        <div className="flex flex-wrap gap-x-4 gap-y-2">
                            {!showDueDate && <Button type="button" variant="link" className="p-0 h-auto text-primary" onClick={() => {setShowDueDate(true); form.setValue('dueDate', new Date())}}><Plus className="w-4 h-4 mr-1"/>Add due date</Button>}
                            <Button type="button" variant="link" className="p-0 h-auto text-primary" onClick={() => appendTopLevel({key: '', value: ''})}><Plus className="w-4 h-4 mr-1"/>Add More Fields</Button>
                        </div>
                   </div>
                    <div {...getRootProps()} className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary h-full flex items-center justify-center">
                        <input {...getInputProps()} />
                        {logoPreview ? (
                            <Image src={logoPreview} alt="Logo preview" width={128} height={128} className="max-h-32 w-auto object-contain" />
                        ) : (
                            <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                <ImageIcon className="w-8 h-8" />
                                <p className="font-semibold text-primary">Add Business Logo</p>
                                <p className="text-xs">Resolution up to 1080x1080px.</p>
                                <p className="text-xs">PNG or JPEG file.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <BilledPartyForm type="By" />
                    <BilledPartyForm type="To" />
                </div>
                
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <Button type="button" variant="outline"><Percent className="w-4 h-4 mr-2"/>Configure GST</Button>
                        <FormField
                            control={form.control}
                            name="currency"
                            render={({ field }) => (
                                <FormItem className="flex items-center gap-2 space-y-0">
                                <FormLabel>Currency*</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue placeholder="Select currency" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    {currencyList.map(c => <SelectItem key={c.code} value={c.code}>{c.name} ({c.symbol})</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <Button type="button" variant="outline"><NotebookText className="w-4 h-4 mr-2"/>Number and Currency Format</Button>
                    </div>

                     <div className="bg-primary/10 p-4 rounded-lg">
                        <div className="grid-cols-[2fr_repeat(8,_1fr)_auto] gap-x-2 text-sm font-bold text-primary mb-2 hidden sm:grid">
                           <span>Item</span>
                           <span className="text-right">HSN/SAC</span>
                           <span className="text-right">GST Rate</span>
                           <span className="text-right">Quantity</span>
                           <span className="text-right">Rate</span>
                           <span className="text-right">Amount</span>
                           <span className="text-right">CGST</span>
                           <span className="text-right">SGST</span>
                           <span className="text-right">Total</span>
                           <span/>
                        </div>
                        <div className="space-y-2">
                            {itemFields.map((item, index) => <ItemRow key={item.id} index={index} />)}
                        </div>
                        <Button type="button" variant="link" className="mt-4" onClick={() => appendItem({ name: "", quantity: 1, rate: 0, gstRate: 18, description: "", hsn: "", unit: "", type: "product", thumbnail: null })}><Plus className="w-4 h-4 mr-2"/>Add another line</Button>
                     </div>
                </div>

                 <div className="flex justify-end pt-8 mt-8 border-t">
                    <Button type="submit" size="lg">
                        Continue <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </form>
            </Form>
        </div>
    </FormProvider>
  );
}


    