
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { ArrowRight, CalendarIcon, Check, ChevronsUpDown, Edit2, Image as ImageIcon, Info, Plus, Percent, NotebookText, Trash2, Copy, Scale } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm, FormProvider, useFormContext, Controller, useFieldArray } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from './ui/command';
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
    billedByEmail: z.string().email().optional().or(z.literal('')),
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
    billedToEmail: z.string().email().optional().or(z.literal('')),
    billedToPan: z.string().optional(),
    billedToPhone: z.string().optional(),
    billedToCustomFields: z.array(z.object({ key: z.string().min(1, "Field name is required."), value: z.string().min(1, "Value is required.") })).optional(),
    
    currency: z.string().min(1, "Currency is required."),
    logo: z.any().optional(),

    items: z.array(z.object({
        name: z.string().min(1, "Item name is required."),
        description: z.string().optional(),
        hsn: z.string().optional(),
        gstRate: z.number().optional(),
        quantity: z.number().min(0),
        rate: z.number().min(0),
    })).optional(),
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

const CountrySelector = ({ field }: { field: any }) => {
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
                "w-full justify-between",
                !field.value && "text-muted-foreground"
              )}
            >
              {selectedCountry ? `${selectedCountry.flag} ${selectedCountry.name}` : "Select country"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search country..." />
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
          </Command>
        </PopoverContent>
      </Popover>
    )
}

const BilledPartyForm = ({ type }: { type: 'By' | 'To' }) => {
    const { control, watch } = useFormContext<InvoiceDetailsValues>();
    const prefix = `billed${type}` as const;
    const { fields, append, remove } = useFieldArray({ control, name: `${prefix}CustomFields` });

    const showEmail = watch(`${prefix}Email` as const) !== undefined;
    const showPan = watch(`${prefix}Pan` as const) !== undefined;
    const showPhone = watch(`${prefix}Phone` as const) !== undefined;

    return (
        <Card className="p-6">
            <h3 className="font-bold text-lg mb-1">Billed {type}</h3>
            <p className="text-sm text-muted-foreground mb-4">{type === 'By' ? 'Your Details' : "Client's Details"}</p>
            <div className="space-y-4">
                 <FormField control={control} name={`${prefix}BusinessName`} render={({ field }) => (<FormItem><FormLabel>Business Name*</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                 <FormField control={control} name={`${prefix}Country`} render={({ field }) => (<FormItem><FormLabel>Country</FormLabel><CountrySelector field={field} /><FormMessage /></FormItem>)} />
                 <FormField control={control} name={`${prefix}Gstin`} render={({ field }) => (<FormItem><FormLabel>GSTIN (optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                 <FormField control={control} name={`${prefix}Address`} render={({ field }) => (<FormItem><FormLabel>Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                {showEmail && <FormField control={control} name={`${prefix}Email`} render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />}
                {showPan && <FormField control={control} name={`${prefix}Pan`} render={({ field }) => (<FormItem><FormLabel>PAN</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />}
                {showPhone && <FormField control={control} name={`${prefix}Phone`} render={({ field }) => (<FormItem><FormLabel>Phone</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>)} />}

                {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                       <FormField control={control} name={`${prefix}CustomFields.${index}.key`} render={({ field }) => (<FormItem><FormLabel>Field Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                       <FormField control={control} name={`${prefix}CustomFields.${index}.value`} render={({ field }) => (<FormItem><FormLabel>Value</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                       <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                ))}
                
                <div className="flex flex-wrap gap-2 pt-2">
                    {!showEmail && <Button type="button" variant="link" className="p-0 h-auto" onClick={() => control.setValue(`${prefix}Email` as const, '')}><Plus className="w-4 h-4 mr-1"/>Add Email</Button>}
                    {!showPan && <Button type="button" variant="link" className="p-0 h-auto" onClick={() => control.setValue(`${prefix}Pan` as const, '')}><Plus className="w-4 h-4 mr-1"/>Add PAN</Button>}
                    {!showPhone && <Button type="button" variant="link" className="p-0 h-auto" onClick={() => control.setValue(`${prefix}Phone` as const, '')}><Plus className="w-4 h-4 mr-1"/>Add Phone</Button>}
                    <Button type="button" variant="link" className="p-0 h-auto" onClick={() => append({ key: '', value: '' })}><Plus className="w-4 h-4 mr-1"/>Add Custom Field</Button>
                </div>
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
            invoiceNumber: "INV-001",
            invoiceDate: new Date(),
            billedByCountry: "IN",
            billedToCountry: "IN",
            currency: "INR",
            items: [{ name: "", quantity: 1, rate: 0 }],
            topLevelCustomFields: [],
            billedByCustomFields: [],
            billedToCustomFields: [],
            billedByBusinessName: "",
            billedToBusinessName: "",
            billedByGstin: "",
            billedToGstin: "",
            billedByAddress: "",
            billedToAddress: "",
            billedByEmail: undefined,
            billedByPan: undefined,
            billedByPhone: undefined,
            billedToEmail: undefined,
            billedToPan: undefined,
            billedToPhone: undefined,
            dueDate: undefined
        }
    });

    const { fields: topLevelFields, append: appendTopLevel, remove: removeTopLevel } = useFieldArray({ control: form.control, name: "topLevelCustomFields" });
    const { fields: itemFields, append: appendItem, remove: removeItem, duplicate } = useFieldArray({ control: form.control, name: "items" });

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
        <div className="w-full max-w-6xl mx-auto">
            <StageStepper currentStage={currentStage} />
            
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
                        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 text-sm font-bold text-primary mb-2">
                           <span>Item</span>
                           <span className="text-right">Quantity</span>
                           <span className="text-right">Rate</span>
                           <span className="text-right">Amount</span>
                           <span className="text-right">GST</span>
                           <span className="text-right">Total</span>
                        </div>
                        <div className="space-y-2">
                            {itemFields.map((item, index) => (
                                <Card key={item.id} className="p-4 bg-background">
                                    <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_auto] gap-4 items-start">
                                        <FormField control={form.control} name={`items.${index}.name`} render={({field}) => <FormItem><FormControl><Textarea placeholder="Item Name" {...field} className="text-sm h-10 resize-none"/></FormControl></FormItem>} />
                                        <FormField control={form.control} name={`items.${index}.quantity`} render={({field}) => <FormItem><FormControl><Input type="number" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} className="text-right text-sm h-10" /></FormControl></FormItem>} />
                                        <FormField control={form.control} name={`items.${index}.rate`} render={({field}) => <FormItem><FormControl><Input type="number" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} className="text-right text-sm h-10" /></FormControl></FormItem>} />
                                        <div className="text-right text-sm pt-2">₹{(form.watch(`items.${index}.quantity`) * form.watch(`items.${index}.rate`)).toFixed(2)}</div>
                                        <FormField control={form.control} name={`items.${index}.gstRate`} render={({field}) => <FormItem><FormControl><Input type="number" placeholder="%" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} className="text-right text-sm h-10" /></FormControl></FormItem>} />
                                        <div className="text-right text-sm font-bold pt-2">₹{((form.watch(`items.${index}.quantity`) * form.watch(`items.${index}.rate`)) * (1 + (form.watch(`items.${index}.gstRate`) || 0)/100)).toFixed(2)}</div>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}><Trash2 className="w-4 h-4 text-destructive"/></Button>
                                    </div>
                                    <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
                                        <Button type="button" variant="link" size="sm" className="p-0 h-auto"><Plus className="w-3 h-3 mr-1"/>Add Description</Button>
                                        <Button type="button" variant="link" size="sm" className="p-0 h-auto"><ImageIcon className="w-3 h-3 mr-1"/>Add Thumbnail</Button>
                                        <Button type="button" variant="link" size="sm" className="p-0 h-auto"><Scale className="w-3 h-3 mr-1"/>Add Unit</Button>
                                        <div className="flex-grow"/>
                                        <Button type="button" variant="link" size="sm" className="p-0 h-auto" onClick={() => duplicate(index)}><Copy className="w-3 h-3 mr-1"/>Duplicate</Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                        <Button type="button" variant="link" className="mt-4" onClick={() => appendItem({ name: "", quantity: 1, rate: 0 })}><Plus className="w-4 h-4 mr-2"/>Add another line</Button>
                     </div>
                </div>

                 <div className="flex justify-end pt-8 mt-8 border-t">
                    <Button type="submit" size="lg">
                        Continue <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </form>
        </div>
    </FormProvider>
  );
}
