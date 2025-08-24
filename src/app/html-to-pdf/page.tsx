
'use client';

import AnimateOnScroll from '@/components/AnimateOnScroll';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import FeatureGrid from '@/components/FeatureGrid';
import { ListChecks, ShieldCheck, Zap } from 'lucide-react';

const HtmlToPdfLoader = dynamic(() => import('@/components/HtmlToPdfLoader'), {
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
        icon: <ListChecks className="w-8 h-8 text-blue-500" />,
        title: 'Simple & Direct',
        description: 'Just paste the URL of the webpage you want to convert. Our tool handles the rest, turning it into a clean PDF.',
    },
    {
        icon: <ShieldCheck className="w-8 h-8 text-green-500" />,
        title: 'Secure Conversion',
        description: 'The webpage content is fetched securely, and the PDF is generated without storing any data, ensuring your privacy.',
    },
    {
        icon: <Zap className="w-8 h-8 text-yellow-500" />,
        title: 'Instant & Free',
        description: 'No server queues or waiting. Your PDF is generated quickly and is available for download immediately, completely free.',
    },
];

const howToSteps = [
    {
        title: 'Enter the URL',
        description: 'Paste the full URL of the webpage you wish to convert into the input field.',
    },
    {
        title: 'Click "Convert to PDF"',
        description: 'Our tool will fetch the content of the webpage and begin the conversion process instantly.',
    },
    {
        title: 'Download Your PDF',
        description: 'Once the conversion is complete, a download button will appear. Click it to save your new PDF document.',
    },
];


export default function HtmlToPdfPage() {
  return (
    <>
      <div className="flex flex-col flex-1 py-8 sm:py-12">
        <section className="text-center mb-12">
          <AnimateOnScroll
              animation="animate-in fade-in-0 slide-in-from-bottom-12"
              className="duration-500"
          >
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-4">
              HTML to PDF
              <br />
              <span className="relative inline-block">
                <span className="relative bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">Effortlessly</span>
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-muted-foreground text-base md:text-lg">
              Convert any webpage into a PDF document by simply providing a URL.
            </p>
          </AnimateOnScroll>
        </section>
        
        <main className="flex-1 w-full">
          <div className="max-w-4xl mx-auto">
            <HtmlToPdfLoader />
          </div>
        </main>
        
        <FeatureGrid
          title="Convert Webpages with Ease"
          description="Learn why our HTML to PDF converter is the perfect tool for saving online articles, receipts, and reports."
          features={features}
          steps={howToSteps}
          stepsTitle="How to Convert HTML to PDF"
        />

      </div>
    </>
  );
}
