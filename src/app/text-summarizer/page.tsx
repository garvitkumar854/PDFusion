import AnimateOnScroll from "@/components/AnimateOnScroll";
import FeatureGrid from "@/components/FeatureGrid";
import { FileText, Zap, BrainCircuit } from "lucide-react";
import type { Metadata } from "next";
import TextSummarizerLoader from "@/components/TextSummarizerLoader";

export const metadata: Metadata = {
  title: "AI Text Summarizer - Free Article Summarizer | PDFusion",
  description:
    "Free AI-powered text summarizer. Summarize articles, documents and long content instantly.",
};

const features = [
  {
    icon: (
      <div className="p-4 rounded-lg bg-blue-100 dark:bg-blue-900/20">
        <BrainCircuit className="w-8 h-8 text-blue-500" />
      </div>
    ),
    title: "AI-Powered Summaries",
    description:
      "Our advanced AI understands your content and produces accurate summaries.",
  },
  {
    icon: (
      <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900/20">
        <Zap className="w-8 h-8 text-green-500" />
      </div>
    ),
    title: "Instant Results",
    description:
      "Get your summary in seconds with fast AI processing.",
  },
  {
    icon: (
      <div className="p-4 rounded-lg bg-purple-100 dark:bg-purple-900/20">
        <FileText className="w-8 h-8 text-purple-500" />
      </div>
    ),
    title: "Copy with One Click",
    description:
      "Easily copy your summarized text and reuse it anywhere.",
  },
];

const howToSteps = [
  {
    title: "Paste your text",
    description: "Paste any article or long content into the input box.",
  },
  {
    title: "Click summarize",
    description: "Our AI analyzes the content instantly.",
  },
  {
    title: "Copy & use",
    description: "Use the summary wherever you want.",
  },
];

export default function TextSummarizerPage() {
  return (
    <div className="flex flex-col flex-1 py-8 sm:py-12">
      <section className="text-center mb-12">
        <AnimateOnScroll className="duration-500">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-4">
            AI Text Summarizer
            <br />
            <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
              Get the Gist, Fast
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-muted-foreground">
            Summarize long articles and documents instantly using AI.
          </p>
        </AnimateOnScroll>
      </section>

      <main className="flex-1 w-full flex flex-col">
        <TextSummarizerLoader />
      </main>

      <FeatureGrid
        title="Understand More, Read Less"
        description="Built for speed, privacy, and accuracy."
        features={features}
        steps={howToSteps}
        stepsTitle="How It Works"
      />
    </div>
  );
}
