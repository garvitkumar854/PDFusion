
'use client';

import PdfSplitterLoader from '@/components/PdfSplitterLoader';
import AnimateOnScroll from '@/components/AnimateOnScroll';
import FeatureGrid from '@/components/FeatureGrid';
import { ListChecks, ShieldCheck, Zap } from 'lucide-react';

const features = [
    {
        icon: <ListChecks className="w-8 h-8 text-blue-500" />,
        title: 'Flexible Splitting',
        description: 'Extract pages by providing custom ranges, setting a fixed number of pages per file, or selecting pages visually.',
    },
    {
        icon: <ShieldCheck className="w-8 h-8 text-green-500" />,
        title: 'Completely Secure',
        description: 'Your PDF is processed directly in your browser. No files are ever uploaded, so your data remains 100% private.',
    },
    {
        icon: <Zap className="w-8 h-8 text-yellow-500" />,
        title: 'Instant Results',
        description: 'No waiting for server uploads. Your new, split PDF files are generated and ready for download in seconds.',
    },
];

const howToSteps = [
    {
        title: 'Upload Your PDF',
        description: 'Click "Choose File" or drag and drop your PDF document to load all its pages.',
    },
    {
        title: 'Choose Your Split Mode',
        description: 'Select your preferred method: split by range, extract specific pages, or create files with a fixed number of pages.',
    },
    {
        title: 'Split & Download',
        description: 'Click "Split PDF" to instantly generate your new documents, which will be downloaded as a ZIP file.',
    },
];


export default function SplitPdfPage() {
  return (
    <>
      <div className="flex flex-col flex-1 py-8 sm:py-12">
        <section className="text-center mb-12">
          <AnimateOnScroll
              animation="animate-in fade-in-0 slide-in-from-bottom-12"
              className="duration-500"
          >
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-4">
              Split a PDF{' '}
              <br />
              <span className="relative inline-block">
                <span className="relative bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">Precisely</span>
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-muted-foreground text-base md:text-lg">
              Extract pages from your PDF file quickly and securely.
              <br />
              No file size limits, no watermarks, completely free.
            </p>
          </AnimateOnScroll>
        </section>
        
        <main className="flex-1 w-full">
          <div className="max-w-4xl mx-auto">
            <PdfSplitterLoader />
          </div>
        </main>

         <FeatureGrid
          title="Powerful PDF Splitting at Your Fingertips"
          description="Discover why our tool is the best choice for securely and accurately splitting your PDF documents."
          features={features}
          steps={howToSteps}
          stepsTitle="How to Split a PDF"
        />

      </div>
    </>
  );
}
