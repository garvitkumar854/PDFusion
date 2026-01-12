
import AnimateOnScroll from '@/components/AnimateOnScroll';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import FeatureGrid from '@/components/FeatureGrid';
import { ListChecks, ShieldCheck, Zap } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Organize PDF Pages',
  description: 'Easily reorder, rotate, and delete pages from your PDF with a simple, visual drag-and-drop interface. Fast, secure, and free.',
  keywords: ['organize pdf', 'reorder pdf pages', 'delete pdf pages', 'rotate pdf pages', 'pdf editor'],
};


const PdfOrganizerLoader = dynamic(() => import('@/components/PdfOrganizerLoader'), {
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
        title: 'Visual Drag & Drop',
        description: 'Easily reorder pages with a simple drag-and-drop interface. Rotate or delete pages with a single click.',
    },
    {
        icon: <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900/20"><ShieldCheck className="w-8 h-8 text-green-500" /></div>,
        title: 'Completely Secure',
        description: 'Your PDF is processed directly in your browser. No files are uploaded to our servers, ensuring total privacy.',
    },
    {
        icon: <div className="p-4 rounded-lg bg-yellow-100 dark:bg-yellow-900/20"><Zap className="w-8 h-8 text-yellow-500" /></div>,
        title: 'Instant Organization',
        description: 'No waiting for uploads or server processing. Organize your PDF and download the new version instantly.',
    },
];

const howToSteps = [
    {
        title: 'Upload Your PDF',
        description: 'Click "Choose File" or drag and drop your PDF document to load all its pages.',
    },
    {
        title: 'Organize Your Pages',
        description: 'Drag and drop page thumbnails to reorder them. Use the toolbar to rotate or delete selected pages.',
    },
    {
        title: 'Save Your Changes',
        description: 'Once you are satisfied with the new order, click "Save" to download your newly organized PDF.',
    },
];

export default function OrganizePdfPage() {
  return (
    <>
      <div className="flex flex-col flex-1 py-8 sm:py-12">
        <section className="text-center mb-12">
          <AnimateOnScroll
              animation="animate-in fade-in-0 slide-in-from-bottom-12"
              className="duration-500"
          >
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-4">
              Organize PDF Pages
              <br />
              <span className="relative inline-block">
                <span className="relative bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">Visually</span>
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-muted-foreground text-base md:text-lg">
              Easily reorder, rotate, and delete pages from your PDF with a simple drag-and-drop interface.
            </p>
          </AnimateOnScroll>
        </section>
        <main className="flex-1 w-full">
          <div className="max-w-full mx-auto">
            <PdfOrganizerLoader/>
          </div>
        </main>
        <FeatureGrid
            title="The Easiest Way to Organize PDFs"
            description="Our tool provides a powerful, secure, and user-friendly solution for managing your PDF pages."
            features={features}
            steps={howToSteps}
            stepsTitle="How to Organize a PDF"
        />
      </div>
    </>
  );
}
