
import AnimateOnScroll from '@/components/AnimateOnScroll';
import dynamic from 'next/dynamic';

const PdfOrganizerLoader = dynamic(() => import('@/components/PdfOrganizerLoader'), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-96"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div></div>
});

export default function OrganizePdfPage() {
  return (
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
              <span className="relative bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">Visually</span>
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-muted-foreground text-base md:text-lg">
            Easily reorder, rotate, and delete pages from your PDF with a simple drag-and-drop interface.
          </p>
        </AnimateOnScroll>
      </section>
      
      <main className="flex-1 w-full">
        <div className="max-w-7xl mx-auto">
          <PdfOrganizerLoader />
        </div>
      </main>
    </div>
  );
}
