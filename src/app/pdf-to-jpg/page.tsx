
'use client';

import PdfToJpgLoader from '@/components/PdfToJpgLoader';
import AnimateOnScroll from '@/components/AnimateOnScroll';
import FeatureGrid from '@/components/FeatureGrid';
import { ListChecks, ShieldCheck, Zap } from 'lucide-react';

const features = [
    {
        icon: <div className="p-4 rounded-lg bg-blue-100 dark:bg-blue-900/20"><ListChecks className="w-8 h-8 text-blue-500" /></div>,
        title: 'Selective Conversion',
        description: 'Choose to convert all pages or select specific pages to turn into high-quality JPG images.',
    },
    {
        icon: <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900/20"><ShieldCheck className="w-8 h-8 text-green-500" /></div>,
        title: 'Secure & Private',
        description: 'Your PDF is processed directly in your browser. No files are uploaded, keeping your sensitive documents safe.',
    },
    {
        icon: <div className="p-4 rounded-lg bg-yellow-100 dark:bg-yellow-900/20"><Zap className="w-8 h-8 text-yellow-500" /></div>,
        title: 'Instant & Free',
        description: 'No server uploads means no waiting. Your JPG images are generated in seconds and are completely free to download.',
    },
];

const howToSteps = [
    {
        title: 'Upload Your PDF',
        description: 'Click "Choose File" or drag and drop your PDF document to see all its pages.',
    },
    {
        title: 'Select Pages to Convert',
        description: 'By default, all pages are selected. You can uncheck the "Select All" box to choose specific pages.',
    },
    {
        title: 'Convert & Download',
        description: 'Click "Convert to JPG" to instantly generate your images, which will be downloaded as a ZIP file.',
    },
];

export default function PdfToJpgPage() {
  return (
    <>
      <div className="flex flex-col flex-1 py-8 sm:py-12">
        <section className="text-center mb-12">
          <AnimateOnScroll
              animation="animate-in fade-in-0 slide-in-from-bottom-12"
              className="duration-500"
          >
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-4">
              Convert PDF to JPG
              <br />
              <span className="relative inline-block">
                <span className="relative bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">Effortlessly</span>
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-muted-foreground text-base md:text-lg">
              Turn each page of your PDF into a high-quality JPG image.
              <br />
              Fast, secure, and entirely free.
            </p>
          </AnimateOnScroll>
        </section>
        
        <main className="flex-1 w-full">
          <div className="max-w-4xl mx-auto">
            <PdfToJpgLoader />
          </div>
        </main>
        
         <FeatureGrid
          title="The Best Way to Convert PDF to JPG"
          description="Our tool provides a fast, secure, and user-friendly solution for converting your PDF pages into images."
          features={features}
          steps={howToSteps}
          stepsTitle="How to Convert PDF to JPG"
        />
      </div>
    </>
  );
}
