import PdfLoader from '@/components/PdfLoader';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function MergerPage() {
  return (
    <div className="flex flex-col flex-1 py-8 sm:py-12">
      <div className="max-w-4xl mx-auto w-full mb-8">
        <div className="flex justify-between items-center">
          <Button asChild variant="ghost">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary">Merge PDFs</h1>
        </div>
      </div>
      <main className="flex-1 w-full">
        <div className="max-w-4xl mx-auto">
          <PdfLoader />
        </div>
      </main>
    </div>
  );
}
