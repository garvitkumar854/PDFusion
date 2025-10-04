
'use client';

import JpgToPdfLoader from '@/components/JpgToPdfLoader';
import AnimateOnScroll from '@/components/AnimateOnScroll';
import FeatureGrid from '@/components/FeatureGrid';
import { ListChecks, ShieldCheck, Zap } from 'lucide-react';

const features = [
    {
        icon: <ListChecks className="w-8 h-8 text-blue-500" />,
        title: 'Full Customization',
        description: 'Control page orientation, size (A4, Letter, Fit), and margins to create the perfect PDF from your images.',
    },
    {
        icon: <ShieldCheck className="w-8 h-8 text-green-500" />,
        title: 'Secure & Private',
        description: 'Your images are processed entirely in your browser. No files are ever uploaded, ensuring your data remains confidential.',
    },
    {
        icon: <Zap className="w-8 h-8 text-yellow-500" />,
        title: 'Instant Conversion',
        description: 'No server uploads means no waiting. Your PDF is generated in seconds, directly on your device, for free.',
    },
];

const howToSteps = [
    {
        title: 'Upload Your Images',
        description: 'Click "Choose Files" or drag and drop your JPG or PNG files into the designated area.',
    },
    {
        title: 'Customize Your PDF',
        description: 'Set your preferred page orientation, size, and margins. Drag and drop to reorder the images as needed.',
    },
    {
        title: 'Convert & Download',
        description: 'Click "Convert to PDF" to instantly generate your document, then download it directly to your computer.',
    },
];

export default function JpgToPdfPage() {
  return (
    <>
      <div className="flex flex-col flex-1 py-8 sm:py-12">
        <section className="text-center mb-12">
          <AnimateOnScroll
              animation="animate-in fade-in-0 slide-in-from-bottom-12"
              className="duration-500"
          >
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-4">
              Convert JPG to PDF
              <br />
              <span className="relative inline-block">
                <span className="relative bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">With Full Control</span>
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-muted-foreground text-base md:text-lg">
              Turn your images into a PDF document with custom orientation, margins, and page size.
              <br />
              Fast, secure, and entirely free.
            </p>
          </AnimateOnScroll>
        </section>
        
        <main className="flex-1 w-full">
          <div className="max-w-7xl mx-auto">
            <JpgToPdfLoader />
          </div>
        </main>
        
        <FeatureGrid
          title="Why Convert JPG to PDF with Us?"
          description="Discover the advantages of using our powerful, private, and customizable image-to-PDF converter."
          features={features}
          steps={howToSteps}
          stepsTitle="How to Convert JPG to PDF"
        />
      </div>
    </>
  );
}
