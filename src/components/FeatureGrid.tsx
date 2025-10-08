
'use client';

import AnimateOnScroll from "@/components/AnimateOnScroll";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Wand2 } from "lucide-react";

interface Feature {
    icon: React.ReactNode;
    title: string;
    description: string;
}

interface Step {
    title: string;
    description: string;
}

interface FeatureGridProps {
    title: string;
    description: string;
    features: Feature[];
    steps: Step[];
    stepsTitle: string;
}

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

export default function FeatureGrid({ title, description, features, steps, stepsTitle }: FeatureGridProps) {
  return (
    <>
        <section className="py-20 md:py-24">
            <AnimateOnScroll
                animation="animate-in fade-in-0 slide-in-from-bottom-12"
                className="duration-500"
            >
                <div className="container mx-auto px-4 text-center">
                    <div className="inline-flex items-center gap-2 bg-primary/10 text-primary font-semibold py-1 px-3 rounded-full text-sm mb-6">
                    <Wand2 className="w-4 h-4" />
                    Why Choose Us?
                    </div>
                    <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground mb-4">
                        {title}
                    </h2>
                    <p className="max-w-3xl mx-auto text-muted-foreground text-base md:text-lg mb-12">
                        {description}
                    </p>

                    <motion.div 
                        className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left"
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.2 }}
                    >
                    {features.map((feature, index) => (
                        <motion.div key={index} variants={itemVariants}>
                            <Card className="bg-transparent text-card-foreground p-6 h-full border-none shadow-none">
                                <CardHeader className="p-0 flex flex-col items-center text-center gap-4">
                                    <div className="flex items-center justify-center mb-4 shrink-0">
                                        {feature.icon}
                                    </div>
                                    <CardTitle className="text-xl font-bold">{feature.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0 mt-4 text-center">
                                    <p className="text-muted-foreground">{feature.description}</p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                    </motion.div>
                </div>
            </AnimateOnScroll>
        </section>

        <section className="pb-20 md:pb-24">
            <div className="container mx-auto px-4 text-center">
                <AnimateOnScroll
                    animation="animate-in fade-in-0 slide-in-from-bottom-12"
                    className="duration-500"
                >
                    <div className="inline-flex items-center gap-2 bg-primary/10 text-primary font-semibold py-1 px-3 rounded-full text-sm mb-6">
                        <CheckCircle className="w-4 h-4" />
                        Easy Steps
                    </div>
                    <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground mb-12">
                        {stepsTitle}
                    </h2>
                </AnimateOnScroll>
                <motion.div
                    className="relative grid grid-cols-1 md:grid-cols-3 gap-12"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                >
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -translate-y-1/2 hidden md:block"></div>
                    {steps.map((step, index) => (
                        <motion.div key={index} variants={itemVariants} className="relative flex flex-col items-center text-center">
                             <div className="absolute -top-12 w-0.5 h-12 bg-border md:hidden"></div>
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-xl mb-4 border-4 border-background z-10">
                                {index + 1}
                            </div>
                            <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                            <p className="text-muted-foreground">{step.description}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    </>
  )
}
