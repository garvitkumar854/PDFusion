
'use client';

import AnimateOnScroll from '@/components/AnimateOnScroll';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import FeatureGrid from '@/components/FeatureGrid';
import { ListChecks, ShieldCheck, Zap } from 'lucide-react';

const WatermarkAdderLoader = dynamic(() => import('@/components/WatermarkAdderLoader'), {
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
        title: 'Full Customization',
        description: 'Choose between text or image watermarks. Customize text, font, color, opacity, position, and rotation to fit your needs perfectly.',
    },
    {
        icon: <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900/20"><ShieldCheck className="w-8 h-8 text-green-500" /></div>,
        title: 'Secure & Private',
        description: 'Your PDF is processed directly in your browser. No files are uploaded, keeping your documents confidential and secure.',
    },
    {
        icon: <div className="p-4 rounded-lg bg-yellow-100 dark:bg-yellow-900/20"><Zap className="w-8 h-8 text-yellow-500" /></div>,
        title: 'Live Preview',
        description: 'Instantly see how your watermark will look on your PDF before you even apply it, ensuring a perfect result every time.',
    },
];

const howToSteps = [
    {
        title: 'Upload Your PDF',
        description: 'Click "Choose File" or drag and drop your PDF document to load it.',
    },
    {
        title: 'Customize Your Watermark',
        description: 'Select text or image, then adjust the settings. The live preview will update instantly to show your changes.',
    },
    {
        title: 'Add Watermark & Download',
        description: 'Once you are happy with the preview, click "Add Watermark" to generate and download your new PDF.',
    },
];


export default function AddWatermarkPage() {
  return (
    <>
      <div className="flex flex-col flex-1 py-8 sm:py-12">
        <section className="text-center mb-12">
          <AnimateOnScroll
              animation="animate-in fade-in-0 slide-in-from-bottom-12"
              className="duration-500"
          >
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-4">
              Add Watermark to PDF
              <br />
              <span className="relative inline-block">
                <span className="relative bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">With Live Preview</span>
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-muted-foreground text-base md:text-lg">
              Easily stamp text or an image over your PDF pages.
              <br />
              Adjust position, transparency, and style with instant feedback.
            </p>
          </AnimateOnScroll>
        </section>
        
        <main className="flex-1 w-full">
          <div className="max-w-6xl mx-auto">
            <WatermarkAdderLoader />
          </div>
        </main>

        <FeatureGrid
          title="Watermarking Made Simple"
          description="Discover the key features that make our tool the best choice for adding watermarks to your PDFs."
          features={features}
          steps={howToSteps}
          stepsTitle="How to Add a Watermark to a PDF"
        />

      </div>
    </>
  );
}
