
'use client';

import AnimateOnScroll from '@/components/AnimateOnScroll';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import FeatureGrid from '@/components/FeatureGrid';
import { ListChecks, ShieldCheck, Zap } from 'lucide-react';

const PdfCompressorLoader = dynamic(() => import('@/components/PdfCompressorLoader'), {
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
        title: 'Adjustable Quality',
        description: 'You have full control over the compression level, allowing you to balance file size and quality to meet your specific needs.',
    },
    {
        icon: <ShieldCheck className="w-8 h-8 text-green-500" />,
        title: 'Secure & Private',
        description: 'Your files are processed using a secure server-side function and are not stored, ensuring your data remains confidential.',
    },
    {
        icon: <Zap className="w-8 h-8 text-yellow-500" />,
        title: 'Optimized for Size',
        description: 'Our AI-powered flow intelligently reduces the size of your PDF by optimizing images and removing redundant data without compromising quality.',
    },
];

const howToSteps = [
    {
        title: 'Upload Your PDF',
        description: 'Click the "Choose File" button or drag and drop your PDF document into the designated area.',
    },
    {
        title: 'Choose Compression Level',
        description: 'Use the slider to select your desired image quality. A lower quality will result in a smaller file size.',
    },
    {
        title: 'Compress & Download',
        description: 'Click the "Compress PDF" button to start the process. Your smaller PDF will be ready for download in moments.',
    },
];


export default function CompressPdfPage() {
  return (
    <>
      <div className="flex flex-col flex-1 py-8 sm:py-12">
        <section className="text-center mb-12">
          <AnimateOnScroll
              animation="animate-in fade-in-0 slide-in-from-bottom-12"
              className="duration-500"
          >
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-4">
              Compress PDF
              <br />
              <span className="relative inline-block">
                <span className="relative bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">Intelligently</span>
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-muted-foreground text-base md:text-lg">
              Reduce the file size of your PDF while maintaining optimal quality.
              <br />
              Fast, secure, and powered by AI.
            </p>
          </AnimateOnScroll>
        </section>
        
        <main className="flex-1 w-full">
          <div className="max-w-4xl mx-auto">
            <PdfCompressorLoader />
          </div>
        </main>

        <FeatureGrid
          title="Powerful PDF Compression"
          description="Discover the advantages of our AI-driven PDF compressor for reducing file sizes efficiently."
          features={features}
          steps={howToSteps}
          stepsTitle="How to Compress a PDF"
        />

      </div>
    </>
  );
}
