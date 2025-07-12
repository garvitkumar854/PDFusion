import { Layers } from 'lucide-react';
import PdfLoader from '@/components/PdfLoader';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-muted/30 text-foreground dark:bg-background">
      <header className="py-4 border-b border-border/40 bg-background/95 backdrop-blur-sm sticky top-0 z-30">
        <div className="container mx-auto px-4 flex justify-center items-center">
          <div className="flex items-center gap-2">
            <Layers className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">PDFusion</h1>
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto">
          <PdfLoader />
        </div>
      </main>
      <footer className="py-6 border-t border-border/40 bg-background/95">
        <div className="container mx-auto px-4 text-center">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} PDFusion. All rights reserved.
            </p>
        </div>
      </footer>
    </div>
  );
}
