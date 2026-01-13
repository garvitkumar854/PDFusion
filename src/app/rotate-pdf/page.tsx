
import AnimateOnScroll from '@/components/AnimateOnScroll';
import FeatureGrid from '@/components/FeatureGrid';
import { ListChecks, ShieldCheck, Zap } from 'lucide-react';
import type { Metadata } from 'next';
import PdfRotatorLoader from '@/components/PdfRotatorLoader';

export const metadata: Metadata = {
  title: 'Rotate PDF Free - Fix PDF Orientation Online | PDFusion',
  description: 'Easily rotate all pages in your PDF by 90, 180, or 270 degrees. See a live preview before applying changes. Secure, fast, and completely free.',
  keywords: ['rotate pdf', 'pdf rotator', 'fix pdf orientation', 'pdf editor', 'online pdf tool', 'rotate pdf free'],
};


const features = [
    {
        icon: <div className="p-4 rounded-lg bg-blue-100 dark:bg-blue-900/20"><ListChecks className="w-8 h-8 text-blue-500" /></div>,
        title: 'Live Preview',
        description: 'Choose your rotation angle (90°, 180°, or 270°) and see an instant preview of the result before you apply it.',
    },
    {
        icon: <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900/20"><ShieldCheck className="w-8 h-8 text-green-500" /></div>,
        title: 'Secure & Private',
        description: 'All processing is done in your browser. Your PDF never leaves your computer, ensuring complete privacy.',
    },
    {
        icon: <div className="p-4 rounded-lg bg-yellow-100 dark:bg-yellow-900/20"><Zap className="w-8 h-8 text-yellow-500" /></div>,
        title: 'Instant Rotation',
        description: 'No server uploads means no waiting. Your rotated PDF is generated and ready for download in just a few seconds.',
    },
];

const howToSteps = [
    {
        title: 'Upload Your PDF',
        description: 'Click "Choose File" or drag and drop your PDF document into the designated area.',
    },
    {
        title: 'Choose Rotation Angle',
        description: 'Select whether you want to rotate the pages by 90, 180, or 270 degrees. The preview will update automatically.',
    },
    {
        title: 'Rotate & Download',
        description: 'Click the "Rotate PDF" button to apply the changes and instantly download your new, correctly oriented PDF.',
    },
];

export default function RotatePdfPage() {
  return (
    <>
      <div className="flex flex-col flex-1 py-8 sm:py-12">
        <section className="text-center mb-12">
          <AnimateOnScroll
              animation="animate-in fade-in-0 slide-in-from-bottom-12"
              className="duration-500"
          >
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-4">
              Rotate PDF Pages
              <br />
              <span className="relative inline-block">
                <span className="relative bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">With Precision</span>
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-muted-foreground text-base md:text-lg">
              Rotate all pages in your PDF by 90, 180, or 270 degrees.
              <br />
              Secure, fast, and entirely free.
            </p>
          </AnimateOnScroll>
        </section>
        
        <main className="flex-1 w-full">
          <div className="max-w-4xl mx-auto">
            <PdfRotatorLoader />
          </div>
        </main>
        
         <FeatureGrid
          title="The Smartest Way to Rotate PDFs"
          description="Our tool makes it incredibly simple to fix the orientation of your PDF files securely and instantly."
          features={features}
          steps={howToSteps}
          stepsTitle="How to Rotate a PDF"
        />

      </div>
    </>
  );
}
