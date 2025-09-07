
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { ArrowRight, CalendarIcon, Check, ChevronsUpDown, Edit2, Image as ImageIcon, Info, Plus, Percent, NotebookText, Trash2, Copy, Scale, Pilcrow, FileText as FileTextIcon, MessageSquare, X, Mail, HelpCircle, ArrowUp, ArrowDown, Search } from 'lucide-react';
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
import { indianStates } from '@/lib/states-data';
import { currencyList } from '@/lib/currency-data';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { hsnSacCodes } from '@/lib/hsn-data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ScrollArea } from './ui/scroll-area';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from './ui/pagination';


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
    billedByPan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format.").optional().or(z.literal('')),
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
    billedToPan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format.").optional().or(z.literal('')),
    billedToPhone: z.string().optional(),
    billedToCustomFields: z.array(z.object({ key: z.string().min(1, "Field name is required."), value: z.string().min(1, "Value is required.") })).optional(),
    
    currency: z.string().min(1, "Currency is required."),
    logo: z.any().optional(),

    items: z.array(z.object({
        name: z.string().min(1, "Item name is required."),
        description: z.string().optional(),
        hsn: z.string().regex(/^[0-9]*$/, "HSN/SAC must be numeric.").optional(),
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
    const country = watch(`${prefix}Country`);

    return (
        <Card className="p-4">
            <h3 className="font-bold text-lg mb-1">Billed {type}</h3>
            <p className="text-sm text-muted-foreground mb-4">{type === 'By' ? 'Your Details' : "Client's Details"}</p>
            <div className="space-y-2">
                 <FormField control={control} name={`${prefix}Country`} render={({ field }) => (<CountrySelector field={field} label="Select country"/>)} />
                 <EditableField name={`${prefix}BusinessName`} placeholder={type === 'By' ? 'Your Business Name*' : "Client's Business Name*"} />
                
                 <div className="grid grid-cols-2 gap-2">
                    <div className={cn(!showEmail && "col-span-2")}>
                      <PhoneInput control={control} prefix={prefix} />
                    </div>
                    {showEmail && <EditableField name={`${prefix}Email`} placeholder="Email Address" />}
                </div>
                 <div className="grid grid-cols-2 gap-2">
                    <div className={cn(!showPan && "col-span-2")}>
                        <EditableField name={`${prefix}Gstin`} placeholder="GSTIN" />
                    </div>
                    {showPan && <EditableField name={`${prefix}Pan`} placeholder="PAN Number" />}
                </div>

                <EditableField name={`${prefix}Address`} placeholder="Address" as="input"/>
                 <div className="grid grid-cols-2 gap-2">
                    <EditableField name={`${prefix}City`} placeholder="City" />
                    <EditableField name={`${prefix}Zip`} placeholder="Postal Code / ZIP" />
                </div>
                {country === 'IN' ? (
                     <FormField
                        control={control}
                        name={`${prefix}State`}
                        render={({ field }) => (
                           <FormItem>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger className="text-sm h-auto p-1 bg-transparent border-0 border-b rounded-none focus:ring-0 focus:ring-offset-0 hover:bg-muted/50">
                                    <SelectValue placeholder="Select State" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {indianStates.map(state => <SelectItem key={state} value={state}>{state}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage/>
                           </FormItem>
                        )}
                        />
                ) : (
                    <EditableField name={`${prefix}State`} placeholder="State / Province / Region" />
                )}
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

const ItemRow = ({ index, onHsnOpen, currencySymbol, taxType }: { index: number, onHsnOpen: () => void, currencySymbol: string, taxType: 'none' | 'cgst-sgst' | 'igst' }) => {
    const { control, watch, setValue } = useFormContext<InvoiceDetailsValues>();
    const { fields, remove, insert, move } = useFieldArray({ control, name: "items" });
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
            <div className={cn(
                "grid gap-x-2 gap-y-1 items-start text-sm",
                taxType === 'none' ? "grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]" : "grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_auto]"
            )}>
                 <EditableField name={`items.${index}.name`} placeholder="Item Name" as="input" />
                 <div className="flex items-center gap-1 border-b"><EditableField name={`items.${index}.hsn`} placeholder="HSN/SAC" className="text-right border-none" type="text" /><Button type="button" variant="ghost" size="icon" className="w-5 h-5" onClick={onHsnOpen}><HelpCircle className="w-3 h-3 text-muted-foreground"/></Button></div>
                 <div className="flex items-center border-b"><EditableField name={`items.${index}.gstRate`} placeholder="%" className="text-right border-none" type="number" /><Percent className="w-3 h-3 text-muted-foreground"/></div>
                 <EditableField name={`items.${index}.quantity`} placeholder="Qty" className="text-right" type="number" />
                 <div className="flex items-center border-b"><span className="text-muted-foreground">{currencySymbol}</span><EditableField name={`items.${index}.rate`} placeholder="Rate" className="text-right border-none" type="number" /></div>
                 <div className="text-right pt-1"><span className="text-muted-foreground text-xs">{currencySymbol}</span>{amount.toFixed(2)}</div>
                 {taxType !== 'none' && <div className="text-right pt-1">{(gstAmount / 2).toFixed(2)}</div>}
                 {taxType !== 'none' && <div className="text-right pt-1">{(gstAmount / 2).toFixed(2)}</div>}
                 <div className="text-right pt-1 font-bold"><span className="text-muted-foreground text-xs">{currencySymbol}</span>{total.toFixed(2)}</div>
            </div>
             {showDescription && (
                <div className="mt-2 pr-8">
                     <EditableField name={`items.${index}.description`} placeholder="Add a description..." as="textarea" className="h-12 resize-none" />
                </div>
            )}
             <div className="grid grid-cols-[auto_auto_1fr_auto_auto] items-center gap-x-4 gap-y-1 mt-2 text-xs">
                <Button type="button" variant="link" size="sm" className="p-0 h-auto text-primary" onClick={() => setShowDescription(s => !s)}><Plus className="w-3 h-3 mr-1"/>{showDescription ? 'Hide' : 'Add'} Description</Button>
                <div {...getRootProps()}><Button type="button" variant="link" size="sm" className="p-0 h-auto text-primary"><ImageIcon className="w-3 h-3 mr-1"/>Add Thumbnail</Button><input {...getInputProps()} /></div>
                <div className="flex-grow"/>
                <Button type="button" variant="link" size="sm" className="p-0 h-auto text-primary" onClick={() => insert(index + 1, item)}><Copy className="w-3 h-3 mr-1"/>Duplicate</Button>
                 <div className="flex gap-1 justify-self-end">
                    {index > 0 && <Button type="button" variant="ghost" size="icon" className="w-5 h-5" onClick={() => move(index, index - 1)}><ArrowUp className="w-3 h-3"/></Button>}
                    {index < fields.length - 1 && <Button type="button" variant="ghost" size="icon" className="w-5 h-5" onClick={() => move(index, index + 1)}><ArrowDown className="w-3 h-3"/></Button>}
                 </div>
            </div>
        </Card>
    )
}

const HsnSacModal = ({ open, onOpenChange, onSelect }: { open: boolean; onOpenChange: (open: boolean) => void; onSelect: (code: string) => void }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortAsc, setSortAsc] = useState(true);

  const filteredData = useMemo(() => {
    let data = [...hsnSacCodes];
    if (searchTerm) {
      data = data.filter(item =>
        item.code.includes(searchTerm) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    data.sort((a, b) => {
      const comparison = a.code.localeCompare(b.code, undefined, { numeric: true });
      return sortAsc ? comparison : -comparison;
    });
    return data;
  }, [searchTerm, sortAsc]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, itemsPerPage]);

  const handleSelect = (code: string) => {
    onSelect(code);
    onOpenChange(false);
  };

  const getPaginationItems = () => {
    const items = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(i);
      }
    } else {
      items.push(1);
      if (currentPage > 4) items.push('...');
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        items.push(i);
      }
      
      if (currentPage < totalPages - 3) items.push('...');
      items.push(totalPages);
    }
    return items;
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl">HSN/SAC List</DialogTitle>
          <DialogDescription>Select HSN/SAC to apply</DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-4 border-b">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} items
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search items" className="pl-9" value={searchTerm} onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1)}} />
              </div>
            </div>
          </div>
        </div>
        <div className="flex-grow overflow-hidden">
          <ScrollArea className="h-full">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="w-[150px] cursor-pointer" onClick={() => setSortAsc(s => !s)}>
                    <div className="flex items-center gap-1">
                        HSN Code {sortAsc ? <ArrowUp className="w-3 h-3"/> : <ArrowDown className="w-3 h-3"/>}
                    </div>
                  </TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((item) => (
                  <TableRow key={item.code} className="cursor-pointer" onClick={() => handleSelect(item.code)}>
                    <TableCell className="font-medium">{item.code}</TableCell>
                    <TableCell>{item.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
         <div className="p-4 border-t flex items-center justify-between">
           <Pagination>
              <PaginationContent>
                <PaginationPrevious onClick={() => setCurrentPage(p => Math.max(1, p - 1))} />
                {getPaginationItems().map((item, index) => (
                  <PaginationItem key={index}>
                    {typeof item === 'number' ? (
                      <PaginationLink isActive={item === currentPage} onClick={() => setCurrentPage(item)}>
                        {item}
                      </PaginationLink>
                    ) : (
                      <PaginationEllipsis />
                    )}
                  </PaginationItem>
                ))}
                <PaginationNext onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} />
              </PaginationContent>
            </Pagination>
            <div className="flex items-center gap-2">
                <Select value={String(itemsPerPage)} onValueChange={(v) => setItemsPerPage(Number(v))}>
                    <SelectTrigger className="w-[70px] h-9"><SelectValue/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                </Select>
                 <span className="text-sm text-muted-foreground">items per page</span>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function InvoiceGenerator() {
    const [currentStage, setCurrentStage] = useState(1);
    const { toast } = useToast();
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [showDueDate, setShowDueDate] = useState(false);
    const [isGstModalOpen, setIsGstModalOpen] = useState(false);
    const [isHsnModalOpen, setIsHsnModalOpen] = useState(false);
    const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);
    const [taxType, setTaxType] = useState<'none' | 'cgst-sgst' | 'igst'>('cgst-sgst');

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

    const { control, setValue, watch } = form;
    const { fields: topLevelFields, append: appendTopLevel, remove: removeTopLevel } = useFieldArray({ control: form.control, name: "topLevelCustomFields" });
    const { fields: itemFields, append: appendItem } = useFieldArray({ control: form.control, name: "items" });
    
    const selectedCurrency = watch("currency");
    const currencySymbol = useMemo(() => currencyList.find(c => c.code === selectedCurrency)?.symbol || '$', [selectedCurrency]);

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

    const handleHsnSelect = (code: string) => {
        if(activeItemIndex !== null) {
            setValue(`items.${activeItemIndex}.hsn`, code);
        }
    }
    
  return (
    <FormProvider {...form}>
        <div className="w-full max-w-7xl mx-auto">
            <StageStepper currentStage={currentStage} />
            
            <HsnSacModal open={isHsnModalOpen} onOpenChange={setIsHsnModalOpen} onSelect={handleHsnSelect} />
            <Dialog open={isGstModalOpen} onOpenChange={setIsGstModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Configure GST</DialogTitle>
                        <DialogDescription>
                            GST configuration options will be available here soon.
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>

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
                        <Button type="button" variant="outline" onClick={() => setIsGstModalOpen(true)}><Percent className="w-4 h-4 mr-2"/>Configure GST</Button>
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
                        <div className={cn(
                            "grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-x-2 text-sm font-bold text-primary mb-2 hidden sm:grid",
                            taxType !== 'none' && "grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_auto]"
                        )}>
                           <span>Item</span>
                           <span className="text-right">HSN/SAC</span>
                           <span className="text-right">GST Rate</span>
                           <span className="text-right">Quantity</span>
                           <span className="text-right">Rate</span>
                           <span className="text-right">Amount</span>
                           {taxType !== 'none' && <span className="text-right">CGST</span>}
                           {taxType !== 'none' && <span className="text-right">SGST</span>}
                           <span className="text-right">Total</span>
                           <span/>
                        </div>
                        <div className="space-y-2">
                            {itemFields.map((item, index) => <ItemRow key={item.id} index={index} onHsnOpen={() => {setActiveItemIndex(index); setIsHsnModalOpen(true)}} currencySymbol={currencySymbol} taxType={taxType} />)}
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
