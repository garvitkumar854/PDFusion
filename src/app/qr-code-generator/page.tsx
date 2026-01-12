
'use client';

import AnimateOnScroll from '@/components/AnimateOnScroll';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import FeatureGrid from '@/components/FeatureGrid';
import { ListChecks, ShieldCheck, Zap } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'QR Code Generator',
  description: 'Create custom QR codes for URLs, text, contacts (VCard), and more. Customize colors and download your QR code instantly for free.',
  keywords: ['qr code generator', 'create qr code', 'free qr code', 'vcard qr code', 'text to qr'],
};


const QrCodeGeneratorLoader = dynamic(() => import('@/components/QrCodeGeneratorLoader'), {
  ssr: false,
  loading: () => (
    <div className="space-y-6">
        <div className="flex flex-col items-center justify-center p-6 sm:p-10 rounded-lg border-2 border-dashed">
             <Skeleton className="w-12 h-12 rounded-full" />
             <Skeleton className="h-6 w-48 mt-4" />
             <Skeleton className="h-4 w-64 mt-2" />
             <Skeleton className="h-10 w-32 mt-4" />
        </div>
    </div>
  )
});

const features = [
    {
        icon: <div className="p-4 rounded-lg bg-blue-100 dark:bg-blue-900/20"><ListChecks className="w-8 h-8 text-blue-500" /></div>,
        title: 'Multiple Data Types',
        description: 'Create QR codes for URLs, plain text, contact cards (VCard), phone numbers, SMS messages, and email addresses.',
    },
    {
        icon: <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900/20"><ShieldCheck className="w-8 h-8 text-green-500" /></div>,
        title: 'Complete Customization',
        description: 'Adjust the size, foreground and background colors, and error correction level to match your branding.',
    },
    {
        icon: <div className="p-4 rounded-lg bg-yellow-100 dark:bg-yellow-900/20"><Zap className="w-8 h-8 text-yellow-500" /></div>,
        title: 'Live Preview',
        description: 'See your QR code update in real-time as you type and change settings, ensuring it looks perfect before you download.',
    },
];

const howToSteps = [
    {
        title: 'Select Content Type',
        description: 'Choose what you want your QR code to do, such as open a URL or create a contact.',
    },
    {
        title: 'Enter Your Data',
        description: 'Fill in the required information for the selected content type. The QR code will update instantly.',
    },
    {
        title: 'Customize & Download',
        description: 'Fine-tune the styling options if needed, then click "Download PNG" to save your QR code.',
    },
];


export default function QrCodeGeneratorPage() {
  return (
    <>
      <div className="flex flex-col flex-1 py-8 sm:py-12">
        <section className="text-center mb-12">
          <AnimateOnScroll
              animation="animate-in fade-in-0 slide-in-from-bottom-12"
              className="duration-500"
          >
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-4">
              QR Code Generator
              <br />
              <span className="relative inline-block">
                <span className="relative bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">Visually</span>
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-muted-foreground text-base md:text-lg">
              Create custom QR codes for URLs, text, and more with live previews and download options.
            </p>
          </AnimateOnScroll>
        </section>
        
        <main className="flex-1 w-full">
          <div className="max-w-4xl mx-auto">
            <QrCodeGeneratorLoader />
          </div>
        </main>
        
        <FeatureGrid
          title="Create QR Codes in Seconds"
          description="Our tool provides a fast, customizable, and user-friendly way to generate QR codes for any purpose."
          features={features}
          steps={howToSteps}
          stepsTitle="How to Generate a QR Code"
        />

      </div>
    </>
  );
}
