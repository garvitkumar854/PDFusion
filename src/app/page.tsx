import { MergePdfs } from '@/components/MergePdfs';
import { ArrowLeft } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <a href="#" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </a>
            <h1 className="text-2xl font-bold text-primary">Merge PDFs</h1>
          </div>
          <MergePdfs />
        </div>
      </main>
    </div>
  );
}
