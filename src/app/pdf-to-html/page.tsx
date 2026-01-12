
import AnimateOnScroll from '@/components/AnimateOnScroll';
import PdfToHtmlLoader from '@/components/PdfToHtmlLoader';
import FeatureGrid from '@/components/FeatureGrid';
import { ListChecks, ShieldCheck, Zap } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Convert PDF to HTML',
  description: 'Quickly extract text and basic structure from your PDF into a simple, clean HTML file. Fast, secure, and free.',
  keywords: ['pdf to html', 'convert pdf to html', 'pdf extractor', 'pdf text extractor', 'pdf to web'],
};

const features = [
    {
        icon: <div className="p-4 rounded-lg bg-blue-100 dark:bg-blue-900/20"><ListChecks className="w-8 h-8 text-blue-500" /></div>,
        title: 'Quick Extraction',
        description: 'Our tool rapidly extracts text and basic structural elements from your PDF, creating a simple, clean HTML file.',
    },
    {
        icon: <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900/20"><ShieldCheck className="w-8 h-8 text-green-500" /></div>,
        title: 'Secure & Private',
        description: 'Your PDF is processed entirely within your browser. No files are uploaded, ensuring your data remains confidential.',
    },
    {
        icon: <div className="p-4 rounded-lg bg-yellow-100 dark:bg-yellow-900/20"><Zap className="w-8 h-8 text-yellow-500" /></div>,
        title: 'Instant Download',
        description: 'No server queues or waiting times. Your HTML file is generated and ready for download in just a few seconds.',
    },
];

const howToSteps = [
    {
        title: 'Upload Your PDF',
        description: 'Click "Choose File" or drag and drop your PDF document into the designated area to begin.',
    },
    {
        title: 'Automatic Conversion',
        description: 'The tool will automatically start processing the file, extracting the text content from each page.',
    },
    {
        title: 'Download Your HTML',
        description: 'Once the conversion is complete, click the "Download HTML" button to save the file to your device.',
    },
];

export default function PdfToHtmlPage() {
  return (
    <>
      <div className="flex flex-col flex-1 py-8 sm:py-12">
        <section className="text-center mb-12">
          <AnimateOnScroll
              animation="animate-in fade-in-0 slide-in-from-bottom-12"
              className="duration-500"
          >
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-4">
              Convert PDF to HTML
              <br />
              <span className="relative inline-block">
                <span className="relative bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">Quickly</span>
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-muted-foreground text-base md:text-lg">
              Extract text and basic structure from your PDF into a simple HTML file.
            </p>
          </AnimateOnScroll>
        </section>
        
        <main className="flex-1 w-full">
          <div className="max-w-4xl mx-auto">
            <PdfToHtmlLoader />
          </div>
        </main>
        
        <FeatureGrid
          title="Why Convert PDF to HTML?"
          description="Our converter offers a fast, secure, and straightforward way to make your PDF content web-accessible."
          features={features}
          steps={howToSteps}
          stepsTitle="How to Convert PDF to HTML"
        />

      </div>
    </>
  );
}
