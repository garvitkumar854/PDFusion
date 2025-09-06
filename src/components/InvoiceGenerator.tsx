
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { ArrowRight, CalendarIcon, Check, ChevronsUpDown, Edit2, Image as ImageIcon, Info, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm, FormProvider, useFormContext, Controller } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from './ui/command';
import { countryList } from '@/lib/country-data';


const invoiceDetailsSchema = z.object({
    invoiceNumber: z.string().min(1, "Invoice number is required."),
    invoiceDate: z.date({ required_error: "Invoice date is required."}),
    dueDate: z.date().optional(),
    
    // Billed By
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

    // Billed To
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

    logo: z.any().optional(),
});

type InvoiceDetailsValues = z.infer<typeof invoiceDetailsSchema>;

const StageStepper = ({ currentStage }: { currentStage: number }) => {
    const stages = ["Add Invoice Details", "Add Banking Details", "Design & Share"];

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
                         {index + 1 === currentStage && stage.includes("optional") && <Info className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    {index < stages.length - 1 && <div className="w-12 h-px bg-border mx-4"></div>}
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
    const form = useFormContext<InvoiceDetailsValues>();
    const prefix = `billed${type}`;

    return (
        <Card className="p-6">
            <h3 className="font-bold text-lg mb-1">Billed {type}</h3>
            <p className="text-sm text-muted-foreground mb-4">{type === 'By' ? 'Your Details' : "Client's Details"}</p>
            <div className="space-y-4">
                <FormField
                    control={form.control}
                    name={`${prefix}Country` as keyof InvoiceDetailsValues}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Country</FormLabel>
                            <CountrySelector field={field} />
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name={`${prefix}BusinessName` as keyof InvoiceDetailsValues}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Your Business Name (required)</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name={`${prefix}Gstin` as keyof InvoiceDetailsValues}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Your GSTIN (optional)</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name={`${prefix}Address` as keyof InvoiceDetailsValues}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Address (optional)</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-2 gap-4">
                     <FormField
                        control={form.control}
                        name={`${prefix}City` as keyof InvoiceDetailsValues}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>City (optional)</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name={`${prefix}Zip` as keyof InvoiceDetailsValues}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Postal / ZIP Code</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                 <FormField
                    control={form.control}
                    name={`${prefix}State` as keyof InvoiceDetailsValues}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>State (optional)</FormLabel>
                             <FormControl>
                               <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </Card>
    )
}

export function InvoiceGenerator() {
    const [currentStage, setCurrentStage] = useState(1);
    const { toast } = useToast();

    const form = useForm<InvoiceDetailsValues>({
        resolver: zodResolver(invoiceDetailsSchema),
        defaultValues: {
            invoiceNumber: "A00001",
            billedByCountry: "IN",
            billedToCountry: "IN",
        }
    });

    function onSubmit(data: InvoiceDetailsValues) {
       console.log(data);
       toast({ title: 'Invoice Details Saved!', description: 'Moving to the next step.' });
       setCurrentStage(2);
    }
    
  return (
    <FormProvider {...form}>
        <div className="w-full max-w-5xl mx-auto">
            <StageStepper currentStage={currentStage} />
            
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                 <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2">
                        <h2 className="text-4xl font-bold">Invoice</h2>
                        <Button variant="ghost" size="icon"><Edit2 className="w-6 h-6 text-muted-foreground" /></Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                   <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="invoiceNumber"
                            render={({ field }) => (
                                <FormItem className="flex items-center gap-4 space-y-0">
                                    <FormLabel className="w-28 mt-2">Invoice No*</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="invoiceDate"
                            render={({ field }) => (
                                <FormItem className="flex items-center gap-4 space-y-0">
                                <FormLabel className="w-28">Invoice Date*</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full pl-3 text-left font-normal",
                                            !field.value && "text-muted-foreground"
                                        )}
                                        >
                                        {field.value ? (
                                            format(field.value, "LLL dd, y")
                                        ) : (
                                            <span>Pick a date</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        initialFocus
                                    />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button variant="link" className="p-0 h-auto text-primary"><Plus className="w-4 h-4 mr-2"/>Add due date</Button>
                        <br />
                        <Button variant="link" className="p-0 h-auto text-primary"><Plus className="w-4 h-4 mr-2"/>Add More Fields</Button>
                   </div>
                    <div {...getRootProps()} className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary">
                        <input {...getInputProps()} />
                        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                            <ImageIcon className="w-8 h-8" />
                            <p className="font-semibold text-primary">Add Business Logo</p>
                            <p className="text-xs">Resolution up to 1080x1080px.</p>
                            <p className="text-xs">PNG or JPEG file.</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <BilledPartyForm type="By" />
                    <BilledPartyForm type="To" />
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
