import { Layers } from 'lucide-react';
import MergePdfs from '@/components/MergePdfs';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-foreground dark:bg-gray-900">
      <header className="py-4">
        <div className="container mx-auto px-4 flex justify-center items-center">
          <div className="flex items-center gap-2">
            <Layers className="w-7 h-7 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">PDFusion</h1>
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <MergePdfs />
        </div>
      </main>
      <footer className="py-4">
        <div className="container mx-auto px-4 text-center">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} PDFusion. All rights reserved.
            </p>
        </div>
      </footer>
    </div>
  );
}
