
"use client";

import { cn } from "@/lib/utils";
import { motion, MotionProps } from "framer-motion";
import React from 'react';

interface GlowingCardProps extends React.HTMLAttributes<HTMLDivElement>, MotionProps {
  children: React.ReactNode;
  className?: string;
}

export const GlowingCard = React.forwardRef<HTMLDivElement, GlowingCardProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div className={cn("group relative rounded-2xl", className)}>
        <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-primary/50 to-blue-500/50 opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-75" />
        <motion.div
          ref={ref}
          className="relative h-full w-full rounded-2xl border border-border/20 bg-card text-card-foreground shadow-sm p-4 sm:p-6 cursor-pointer overflow-hidden"
          whileHover={{
            borderColor: "hsl(var(--primary) / 0.5)",
            boxShadow: "0 0 20px hsl(var(--primary) / 0.2)",
          }}
          transition={{ duration: 0.3 }}
          {...props}
        >
          {children}
        </motion.div>
      </div>
    );
  }
);
GlowingCard.displayName = "GlowingCard";
