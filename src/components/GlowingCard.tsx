
"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export const GlowingCard = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("group relative rounded-2xl", className)}>
      <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-primary/50 to-blue-500/50 opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-75" />
      <motion.div
        className="relative h-full w-full rounded-2xl border border-border/20 bg-card text-card-foreground shadow-sm"
        // Animate border color on hover
        whileHover={{
          borderColor: "hsl(var(--primary) / 0.5)",
          boxShadow: "0 0 20px hsl(var(--primary) / 0.2)",
        }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    </div>
  );
};
