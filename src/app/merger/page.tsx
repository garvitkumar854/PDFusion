import PdfLoader from '@/components/PdfLoader';

export default function MergerPage() {
  return (
    <div className="flex flex-col flex-1">
      <main className="flex-1 container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto">
          <PdfLoader />
        </div>
      </main>
    </div>
  );
}
