import { Layers, HelpCircle, Settings } from 'lucide-react';
import PdfLoader from '@/components/PdfLoader';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="py-4 border-b bg-card">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-md">
              <Layers className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">PDFStacker</h1>
              <p className="text-sm text-muted-foreground">Professional PDF Merger</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <HelpCircle className="w-5 h-5 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto">
          <PdfLoader />
        </div>
      </main>
    </div>
  );
}
