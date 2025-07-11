import { Combine } from 'lucide-react';
import { PDFusionApp } from '@/components/PDFusionApp';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto flex items-center gap-3 h-16 px-4 md:px-6">
          <Combine className="w-7 h-7 text-primary" />
          <h1 className="text-2xl font-bold font-headline text-primary">PDFusion</h1>
        </div>
      </header>
      <main className="flex-grow container mx-auto p-4 md:p-6">
        <PDFusionApp />
      </main>
      <footer className="text-center p-4 text-sm text-muted-foreground border-t">
        <p>&copy; {new Date().getFullYear()} PDFusion. All files are processed on your device for privacy.</p>
      </footer>
    </div>
  );
}
