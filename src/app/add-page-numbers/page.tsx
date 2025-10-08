
'use client';

import AnimateOnScroll from '@/components/AnimateOnScroll';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import FeatureGrid from '@/components/FeatureGrid';
import { ListChecks, ShieldCheck, Zap } from 'lucide-react';

const PageNumberAdderLoader = dynamic(() => import('@/components/PageNumberAdderLoader'), {
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
        title: 'Simple & Intuitive',
        description: 'Just upload your PDF, customize your settings, and see a live preview of the page numbers before you apply them.',
    },
    {
        icon: <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900/20"><ShieldCheck className="w-8 h-8 text-green-500" /></div>,
        title: 'Secure & Private',
        description: 'Your files are processed entirely in your browser. No data ever leaves your computer, ensuring your privacy is protected.',
    },
    {
        icon: <div className="p-4 rounded-lg bg-yellow-100 dark:bg-yellow-900/20"><Zap className="w-8 h-8 text-yellow-500" /></div>,
        title: 'Instant Processing',
        description: 'No server uploads means no waiting. Your numbered PDF is generated in seconds, directly on your device.',
    },
];

const howToSteps = [
    {
        title: 'Upload Your PDF',
        description: 'Click the "Choose File" button or drag and drop your PDF document into the designated area.',
    },
    {
        title: 'Customize Your Settings',
        description: 'Choose the position, format, font, and page range for your numbers. The live preview will update instantly.',
    },
    {
        title: 'Add Numbers & Download',
        description: 'Once you are happy with the preview, click "Add Page Numbers" to generate and download your new PDF.',
    },
];


export default function AddPageNumbersPage() {
  return (
    <>
      <div className="flex flex-col flex-1 py-8 sm:py-12">
        <section className="text-center mb-12">
          <AnimateOnScroll
              animation="animate-in fade-in-0 slide-in-from-bottom-12"
              className="duration-500"
          >
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-4">
              Add Page Numbers
              <br />
              <span className="relative inline-block">
                <span className="relative bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">With Live Preview</span>
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-muted-foreground text-base md:text-lg">
              Easily insert and customize page numbers on your PDF.
              <br />
              Adjust position, format, style, and more with instant feedback.
            </p>
          </AnimateOnScroll>
        </section>
        
        <main className="flex-1 w-full">
          <div className="max-w-6xl mx-auto">
            <PageNumberAdderLoader />
          </div>
        </main>

        <FeatureGrid
          title="Numbering Made Easy"
          description="Discover the key features that make our tool the best choice for adding page numbers to your PDFs."
          features={features}
          steps={howToSteps}
          stepsTitle="How to Add Page Numbers to a PDF"
        />

      </div>
    </>
  );
}
