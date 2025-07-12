import PdfLoader from '@/components/PdfLoader';

export default function MergerPage() {
  return (
    <div className="flex flex-col flex-1 py-8 sm:py-12">
      <main className="flex-1 w-full">
        <div className="max-w-4xl mx-auto">
          <PdfLoader />
        </div>
      </main>
    </div>
  );
}
