
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent } from './ui/card';
import { Download, Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import html2pdf from 'html2pdf.js';
import { useForm, useFieldArray, FormProvider, useFormContext, Controller } from 'react-hook-form';

type InvoiceItem = {
  description: string;
  quantity: number;
  rate: number;
};

type InvoiceFormValues = {
  companyName: string;
  yourName: string;
  companyAddress: string;
  companyCity: string;
  clientName: string;
  clientAddress: string;
  clientCity: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  items: InvoiceItem[];
  notes: string;
  taxRate: number;
  logo: string | null;
};

const EditableField = ({ name, placeholder, className, as: Component = Input }: { name: string, placeholder?: string, className?: string, as?: React.ElementType }) => {
    const { control } = useFormContext<InvoiceFormValues>();
    return (
        <Controller
            control={control}
            name={name as keyof InvoiceFormValues}
            render={({ field }) => (
                <Component
                    {...field}
                    placeholder={placeholder}
                    className={cn("w-full p-1 bg-transparent border-none focus:ring-0 focus:bg-muted/50 rounded-md", className)}
                />
            )}
        />
    )
}

const InvoiceItems = () => {
    const { control } = useFormContext<InvoiceFormValues>();
    const { fields, append, remove } = useFieldArray({
        control,
        name: "items"
    });

    return (
        <tbody>
            {fields.map((field, index) => (
                <tr key={field.id} className="border-b border-gray-200 dark:border-gray-700">
                    <td className="py-2 px-1"><EditableField name={`items.${index}.description`} placeholder="Item description" as={Textarea} className="text-sm min-h-[40px]" /></td>
                    <td className="py-2 px-1 w-24"><EditableField name={`items.${index}.quantity`} placeholder="1" type="number" className="text-right text-sm" /></td>
                    <td className="py-2 px-1 w-28"><EditableField name={`items.${index}.rate`} placeholder="0.00" type="number" className="text-right text-sm" /></td>
                    <td className="py-2 px-1 text-right w-32">
                        <Controller
                            control={control}
                            name={`items.${index}`}
                            render={({ field: { value } }) => (
                                <p className="text-sm font-semibold">${(value.quantity * value.rate).toFixed(2)}</p>
                            )}
                        />
                    </td>
                    <td className="py-2 text-right w-12">
                        <Button variant="ghost" size="icon" onClick={() => remove(index)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-4 w-4"/>
                        </Button>
                    </td>
                </tr>
            ))}
            <tr>
                <td colSpan={5} className="pt-2">
                    <Button variant="outline" size="sm" onClick={() => append({ description: '', quantity: 1, rate: 0 })}>
                        <Plus className="h-4 w-4 mr-2"/> Add Item
                    </Button>
                </td>
            </tr>
        </tbody>
    )
}


export function InvoiceGenerator() {
    const formMethods = useForm<InvoiceFormValues>({
        defaultValues: {
            companyName: 'Your Company',
            yourName: 'Your Name',
            companyAddress: '123 Street, Suite 1A',
            companyCity: 'City, State, Zip',
            clientName: 'Client Company',
            clientAddress: '456 Avenue, Suite 2B',
            clientCity: 'City, State, Zip',
            invoiceNumber: 'INV-001',
            invoiceDate: new Date().toISOString().split('T')[0],
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            items: [{ description: 'Website Design', quantity: 1, rate: 1500 }],
            notes: 'Thank you for your business!',
            taxRate: 8,
            logo: null
        }
    });

    const { watch, setValue } = formMethods;
    const items = watch('items');
    const taxRate = watch('taxRate');
    const logo = watch('logo');
    const invoiceRef = useRef(null);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.rate), 0);
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;

    const handleDownload = () => {
        const element = invoiceRef.current;
        if (!element) return;
        const opt = {
          margin: 0,
          filename: 'invoice.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        html2pdf().from(element).set(opt).save();
        toast({ title: 'Invoice Downloading', description: 'Your PDF is being generated.' });
    };

    const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setValue('logo', reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
  return (
    <FormProvider {...formMethods}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3">
                <Card className="shadow-lg">
                    <CardContent className="p-4 sm:p-6">
                        <div ref={invoiceRef} className="bg-white dark:bg-card text-foreground p-8 rounded-lg shadow-2xl">
                            <header className="flex justify-between items-start mb-10">
                                <div>
                                    {logo ? (
                                        <div className="relative group">
                                            <img src={logo} alt="Company Logo" className="max-h-20" />
                                             <Button variant="destructive" size="sm" className="absolute -top-2 -right-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setValue('logo', null)}>
                                                <Trash2 className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button variant="outline" onClick={() => logoInputRef.current?.click()} className="group">
                                            <ImageIcon className="h-4 w-4 mr-2"/> Upload Logo
                                        </Button>
                                    )}
                                    <input type="file" ref={logoInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                                    <h1 className="text-3xl font-bold text-primary mt-4"><EditableField name="companyName" placeholder="Your Company"/></h1>
                                    <p className="text-muted-foreground"><EditableField name="yourName" placeholder="Your Name"/></p>
                                </div>
                                <div className="text-right">
                                    <h2 className="text-4xl font-extrabold text-foreground">INVOICE</h2>
                                    <p className="text-muted-foreground mt-1"># <EditableField name="invoiceNumber" placeholder="INV-001" className="text-right" /></p>
                                </div>
                            </header>
                            
                            <section className="grid grid-cols-2 gap-10 mb-10">
                                <div className="space-y-1">
                                    <h3 className="font-semibold text-muted-foreground">Bill To</h3>
                                    <p className="font-bold text-lg"><EditableField name="clientName" placeholder="Client Company"/></p>
                                    <p><EditableField name="clientAddress" placeholder="Client Address"/></p>
                                    <p><EditableField name="clientCity" placeholder="City, State, Zip" /></p>
                                </div>
                                <div className="space-y-1 text-right">
                                     <p><span className="font-semibold">Date:</span> <EditableField name="invoiceDate" type="date" className="text-right" /></p>
                                     <p><span className="font-semibold">Due Date:</span> <EditableField name="dueDate" type="date" className="text-right" /></p>
                                </div>
                            </section>

                            <section>
                                <table className="w-full text-left">
                                    <thead className="bg-muted">
                                        <tr>
                                            <th className="py-2 px-4 font-semibold">Description</th>
                                            <th className="py-2 px-4 font-semibold text-right">Quantity</th>
                                            <th className="py-2 px-4 font-semibold text-right">Rate</th>
                                            <th className="py-2 px-4 font-semibold text-right">Amount</th>
                                            <th className="w-12"></th>
                                        </tr>
                                    </thead>
                                    <InvoiceItems />
                                </table>
                            </section>
                            
                            <section className="grid grid-cols-2 mt-6">
                                <div>
                                    <h4 className="font-semibold">Notes</h4>
                                    <EditableField name="notes" as={Textarea} className="text-sm mt-1 h-24"/>
                                </div>
                                <div className="text-right space-y-2">
                                    <div className="flex justify-end items-center gap-4">
                                        <p className="font-semibold">Subtotal:</p>
                                        <p>${subtotal.toFixed(2)}</p>
                                    </div>
                                    <div className="flex justify-end items-center gap-4">
                                        <p className="font-semibold">Tax (<EditableField name="taxRate" type="number" className="w-16 text-right inline-block" />%):</p>
                                        <p>${tax.toFixed(2)}</p>
                                    </div>
                                    <hr className="my-2 border-border"/>
                                    <div className="flex justify-end items-center gap-4 text-2xl font-bold text-primary">
                                        <p>Total:</p>
                                        <p>${total.toFixed(2)}</p>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="lg:col-span-2">
                <Card className="shadow-lg sticky top-24">
                    <CardContent className="p-6">
                         <h3 className="text-lg font-semibold mb-4">Actions</h3>
                         <Button onClick={handleDownload} className="w-full text-base">
                            <Download className="h-5 w-5 mr-2"/> Download PDF
                         </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    </FormProvider>
  );
}
