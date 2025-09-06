
'use client';

import AnimateOnScroll from '@/components/AnimateOnScroll';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import FeatureGrid from '@/components/FeatureGrid';
import { ListChecks, ShieldCheck, Zap, FileText, Download, Pencil } from 'lucide-react';

const InvoiceGeneratorLoader = dynamic(() => import('@/components/InvoiceGeneratorLoader'), {
  ssr: false,
  loading: () => (
    <div className="grid md:grid-cols-2 gap-4 h-[70vh]">
        <Skeleton className="w-full h-full" />
        <Skeleton className="w-full h-full" />
    </div>
  )
});

const features = [
    {
        icon: <Pencil className="w-8 h-8 text-blue-500" />,
        title: 'Easy Editing',
        description: 'Click on any field to edit it directly. Add items, set taxes, and include notes with a simple and intuitive interface.',
    },
    {
        icon: <FileText className="w-8 h-8 text-green-500" />,
        title: 'Live Preview',
        description: 'See your invoice update in real-time as you make changes. What you see is exactly what you get.',
    },
    {
        icon: <Download className="w-8 h-8 text-purple-500" />,
        title: 'Download as PDF',
        description: 'Once your invoice is ready, download a professional, print-ready PDF with a single click.',
    },
];

const howToSteps = [
    {
        title: 'Fill in Details',
        description: 'Add your company info, client details, and invoice items. Everything is editable.',
    },
    {
        title: 'Customize Your Invoice',
        description: 'Set quantities, rates, taxes, and add notes. The totals are calculated automatically.',
    },
    {
        title: 'Download Your PDF',
        description: 'Click the "Download PDF" button to save your finished invoice, ready to be sent.',
    },
];


export default function InvoiceGeneratorPage() {
  return (
    <>
      <div className="flex flex-col flex-1 py-8 sm:py-12">
        <section className="text-center mb-12">
          <AnimateOnScroll
              animation="animate-in fade-in-0 slide-in-from-bottom-12"
              className="duration-500"
          >
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-4">
              Invoice Generator
              <br />
              <span className="relative inline-block">
                <span className="relative bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">Simple & Professional</span>
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-muted-foreground text-base md:text-lg">
              Create and download professional invoices in seconds with our easy-to-use editor.
            </p>
          </AnimateOnScroll>
        </section>
        
        <main className="flex-1 w-full flex flex-col">
          <InvoiceGeneratorLoader />
        </main>
        
        <FeatureGrid
          title="Invoicing Made Effortless"
          description="Our Invoice Generator is designed for speed and convenience, helping you get paid faster."
          features={features}
          steps={howToSteps}
          stepsTitle="How to Create an Invoice"
        />

      </div>
    </>
  );
}
