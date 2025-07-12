import { ArrowRight, FilePlus2, Wand2, Download } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function Home() {
  const features = [
    {
      icon: <FilePlus2 className="w-6 h-6 text-blue-600" />,
      title: 'Upload PDFs',
      description: 'Drag and drop multiple PDF files',
      bgColor: 'bg-blue-100',
    },
    {
      icon: <Wand2 className="w-6 h-6 text-purple-600" />,
      title: 'Merge & Edit',
      description: 'Combine, reorder, and edit pages',
      bgColor: 'bg-purple-100',
    },
    {
      icon: <Download className="w-6 h-6 text-green-600" />,
      title: 'Download',
      description: 'Get your merged PDF instantly',
      bgColor: 'bg-green-100',
    },
  ];

  return (
    <>
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-block bg-primary/10 text-primary font-semibold py-1 px-3 rounded-full text-sm mb-6">
            ✨ The Ultimate PDF Merger
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground mb-4">
            Merge PDFs with{' '}
            <span className="relative inline-block">
              <span className="relative text-primary">Ease</span>
              <svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 100 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
              >
                <path
                  d="M1 10.3c15.2-4.1 31.4-6.3 47.7-6.3 16.3 0 32.5 2.2 47.7 6.3"
                  stroke="hsl(var(--primary))"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-muted-foreground md:text-lg mb-8">
            Combine multiple PDF files into one document quickly and securely.
            <br />
            No file size limits, no watermarks, completely free.
          </p>
          <div className="flex justify-center items-center gap-4">
            <Button asChild size="lg" className="font-bold rounded-[30px] hover:scale-105 hover:shadow-lg transition-all">
              <Link href="/merger">
                Get Started <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button asChild variant="link" size="lg" className="text-foreground font-bold">
              <Link href="#">Learn more</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="pb-20 md:pb-32">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-left shadow-sm hover:shadow-lg transition-shadow duration-300 border-border/50">
                <CardContent className="p-6">
                  <div className="flex flex-col items-start gap-4">
                    <div className={`p-3 rounded-lg ${feature.bgColor}`}>
                      {feature.icon}
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
