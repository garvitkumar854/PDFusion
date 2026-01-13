
'use client';
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, ShieldCheck, FileLock, Cookie, Mail } from "lucide-react";
import Link from 'next/link';

const policyPoints = [
    {
        icon: <FileLock className="w-8 h-8 text-green-500" />,
        title: "Your Files Are Your Own",
        description: "PDFusion operates entirely within your browser. When you use our tools to merge, split, or edit a PDF, the files are never uploaded or transferred to our servers. All processing happens locally on your computer, ensuring your documents remain private and secure."
    },
    {
        icon: <ShieldCheck className="w-8 h-8 text-blue-500" />,
        title: "No Personal Data Collection",
        description: "We do not require you to sign up or provide any personal information like your name, email address, or other contact details to use our services. PDFusion is free to use anonymously."
    },
    {
        icon: <Cookie className="w-8 h-8 text-orange-500" />,
        title: "Cookies",
        description: "Our website uses a minimal number of cookies for essential functionality, such as theme preferences (light/dark mode). We do not use cookies to track your activity across other sites."
    },
    {
        icon: <Mail className="w-8 h-8 text-red-500" />,
        title: "Contact & Policy Updates",
        description: "If you have any questions about our Privacy Policy, please feel free to contact us. We may update this policy from time to time. Any changes will be posted on this page, so we encourage you to review it periodically."
    }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
    },
  },
};


export default function PrivacyPolicyPage() {
  return (
    <>
      <section className="relative py-20 md:py-24 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10 dark:opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,hsl(var(--primary)/0.3),rgba(255,255,255,0))]"></div>
        </div>
        <motion.div 
            className="container mx-auto px-4 text-center relative z-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary font-semibold py-1 px-3 rounded-full text-sm mb-6">
              <Sparkles className="w-4 h-4" />
              Your Privacy Matters
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground mb-4">
              Privacy{' '}
              <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                Policy
              </span>
            </h1>
            <p className="max-w-3xl mx-auto text-muted-foreground text-base md:text-lg">
              At PDFusion, we are committed to protecting your privacy. Our philosophy is simple: your files are your business, not ours. This policy outlines our commitment to your privacy.
            </p>
            <p className="text-xs text-muted-foreground mt-4">Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </motion.div>
      </section>

      <section className="py-16">
        <motion.div 
          className="container mx-auto px-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
            <div className="max-w-4xl mx-auto space-y-8">
                {policyPoints.map((point) => (
                    <motion.div key={point.title} variants={itemVariants}>
                        <Card className="bg-card/50 backdrop-blur-sm border border-border/20 shadow-lg">
                            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 shrink-0">
                                    {point.icon}
                                </div>
                                <CardTitle className="text-xl sm:text-2xl font-bold">{point.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground text-base">{point.description}</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}

                 <motion.div variants={itemVariants}>
                    <Card className="bg-card/50 backdrop-blur-sm border border-border/20 shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-xl sm:text-2xl font-bold">Questions?</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground text-base">
                                If you have any questions or concerns about our privacy practices, please don't hesitate to{' '}
                                <Link href="/contact" className="text-primary hover:underline font-semibold">
                                    contact us
                                </Link>
                                . Your peace of mind is our top priority.
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </motion.div>
      </section>
    </>
  );
}
