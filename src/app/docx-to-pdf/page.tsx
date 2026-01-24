
import AnimateOnScroll from '@/components/AnimateOnScroll';
import FeatureGrid from '@/components/FeatureGrid';
import { ListChecks, ShieldCheck, Zap } from 'lucide-react';
import type { Metadata } from 'next';
import DocxToPdfLoader from '@/components/DocxToPdfLoader';

export const metadata: Metadata = {
    title: 'DOCX to PDF Converter - Free Word to PDF Converter | PDFusion',
    description: 'Easily convert your DOCX (Word) documents into high-quality PDF files for free. Our tool works securely in your browser without uploading your files.',
    keywords: ['docx to pdf', 'word to pdf', 'convert docx to pdf', 'docx to pdf converter', 'free word to pdf'],
};

const features = [
    {
        icon: <div className="p-4 rounded-lg bg-blue-100 dark:bg-blue-900/20"><ListChecks className="w-8 h-8 text-blue-500" /></div>,
        title: 'High-Quality Conversion',
        description: 'Retain the formatting of your Word document when converting it to a professional-quality PDF.',
    },
    {
        icon: <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900/20"><ShieldCheck className="w-8 h-8 text-green-500" /></div>,
        title: 'Secure & Private',
        description: 'Your DOCX file is processed entirely in your browser. No data ever leaves your computer, ensuring your privacy.',
    },
    {
        icon: <div className="p-4 rounded-lg bg-yellow-100 dark:bg-yellow-900/20"><Zap className="w-8 h-8 text-yellow-500" /></div>,
        title: 'Instant Processing',
        description: 'No server uploads means no waiting. Your PDF is generated in seconds, directly on your device.',
    },
];

const howToSteps = [
    {
        title: 'Upload Your DOCX',
        description: 'Click the "Choose File" button or drag and drop your Word document into the designated area.',
    },
    {
        title: 'Start Conversion',
        description: 'Click the "Convert to PDF" button to start the conversion process, which happens instantly in your browser.',
    },
    {
        title: 'Download Your PDF',
        description: 'Once the conversion is complete, your new PDF file will be ready for download.',
    },
];


export default function DocxToPdfPage() {
  return (
    <>
      <div className="flex flex-col flex-1 py-8 sm:py-12">
        <section className="text-center mb-12">
          <AnimateOnScroll
              animation="animate-in fade-in-0 slide-in-from-bottom-12"
              className="duration-500"
          >
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-4">
              DOCX to PDF Converter
              <br />
              <span className="relative inline-block">
                <span className="relative bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">Simple & Secure</span>
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-muted-foreground text-base md:text-lg">
              Turn your Microsoft Word documents into high-quality PDFs in just a few clicks.
            </p>
          </AnimateOnScroll>
        </section>

        <main className="flex-1 w-full">
          <DocxToPdfLoader />
        </main>
        
        <FeatureGrid
          title="The Easiest Way to Convert DOCX to PDF"
          description="Discover the advantages of using our fast, private, and powerful DOCX to PDF converter."
          features={features}
          steps={howToSteps}
          stepsTitle="How to Convert DOCX to PDF"
        />

      </div>
    </>
  );
}
