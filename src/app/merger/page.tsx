
'use client';

import PdfLoader from '@/components/PdfLoader';
import AnimateOnScroll from '@/components/AnimateOnScroll';
import FeatureGrid from '@/components/FeatureGrid';
import { ListChecks, ShieldCheck, Zap } from 'lucide-react';

const features = [
    {
        icon: <ListChecks className="w-8 h-8 text-blue-500" />,
        title: 'Simple Drag & Drop',
        description: 'Easily upload multiple PDF files and reorder them with a simple drag-and-drop interface before merging.',
    },
    {
        icon: <ShieldCheck className="w-8 h-8 text-green-500" />,
        title: 'Secure & Private',
        description: 'All processing happens in your browser. Your files are never uploaded to a server, ensuring your data remains confidential.',
    },
    {
        icon: <Zap className="w-8 h-8 text-yellow-500" />,
        title: 'Lightning Fast',
        description: 'No server uploads means no waiting. Your merged PDF is created in seconds, right on your device.',
    },
];

const howToSteps = [
    {
        title: 'Upload Your PDFs',
        description: 'Click the "Choose Files" button or drag and drop your PDF documents into the designated area.',
    },
    {
        title: 'Order Your Files',
        description: 'Drag and drop the uploaded files to arrange them in the desired order for the final merged document.',
    },
    {
        title: 'Merge & Download',
        description: 'Click the "Merge PDFs" button to instantly combine your files into a single PDF, then download it.',
    },
];

export default function MergerPage() {
  return (
    <>
      <div className="flex flex-col flex-1 py-8 sm:py-12">
        <section className="text-center mb-12">
          <AnimateOnScroll
              animation="animate-in fade-in-0 slide-in-from-bottom-12"
              className="duration-500"
          >
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-4">
              Merge PDFs with{' '}
              <br />
              <span className="relative inline-block">
                <span className="relative bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">Ease</span>
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-muted-foreground text-base md:text-lg">
              Combine multiple PDF files into one document quickly and securely.
              <br />
              No file size limits, no watermarks, completely free.
            </p>
          </AnimateOnScroll>
        </section>
        
        <main className="flex-1 w-full">
          <div className="max-w-4xl mx-auto">
            <PdfLoader />
          </div>
        </main>

        <FeatureGrid
          title="The Ultimate PDF Merging Tool"
          description="Find out why our PDF merger is the best choice for combining your documents quickly, securely, and with ease."
          features={features}
          steps={howToSteps}
          stepsTitle="How to Merge PDFs"
        />
      </div>
    </>
  );
}
