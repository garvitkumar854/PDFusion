
import PageNumberAdderLoader from '@/components/PageNumberAdderLoader';
import AnimateOnScroll from '@/components/AnimateOnScroll';

export default function AddPageNumbersPage() {
  return (
    <div className="flex flex-col flex-1 py-8 sm:py-12">
      <section className="text-center mb-12">
        <AnimateOnScroll
            animation="animate-in fade-in-0 slide-in-from-bottom-12"
            className="duration-500"
        >
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-4">
            Add Page Numbers
            <br />
            <span className="relative inline-block">
              <span className="relative bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">To Your PDF</span>
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-muted-foreground text-base md:text-lg">
            Easily insert page numbers into your PDF documents.
            <br />
            Customize position, format, font, and more.
          </p>
        </AnimateOnScroll>
      </section>
      
      <main className="flex-1 w-full">
        <div className="max-w-4xl mx-auto">
          <PageNumberAdderLoader />
        </div>
      </main>
    </div>
  );
}
