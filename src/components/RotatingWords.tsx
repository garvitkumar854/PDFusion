
"use client";

import React, { useCallback, useEffect, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const FlipWords = ({
  words,
  colors,
  duration = 2500,
  className,
}: {
  words: string[];
  colors: string[];
  duration?: number;
  className?: string;
}) => {
  const [index, setIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [containerWidth, setContainerWidth] = useState<number | "auto">("auto");

  const wordRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (wordRef.current) {
        setContainerWidth(wordRef.current.offsetWidth);
    }
  }, [index, words]);

  const startAnimation = useCallback(() => {
    const nextIndex = (index + 1) % words.length;
    setIndex(nextIndex);
    setIsAnimating(true);
  }, [index, words.length]);

  useEffect(() => {
    if (!isAnimating) {
      const timeout = setTimeout(() => {
        startAnimation();
      }, duration);
      return () => clearTimeout(timeout);
    }
  }, [isAnimating, duration, startAnimation]);

  const currentWord = words[index];
  const currentColor = colors[index % colors.length];
  const nextWord = words[(index + 1) % words.length];

  return (
    <div
      style={{ width: containerWidth }}
      className="relative inline-block transition-all duration-300 ease-in-out"
    >
      <span
        ref={wordRef}
        className="absolute invisible whitespace-nowrap"
        aria-hidden="true"
      >
        {nextWord}
      </span>

      <AnimatePresence
        initial={false}
        onExitComplete={() => {
            setIsAnimating(false);
        }}
      >
        <motion.div
            key={currentWord}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{
                type: "spring",
                stiffness: 200,
                damping: 20,
            }}
            className={cn("absolute left-0 right-0", className)}
            style={{ color: currentColor, willChange: 'transform, opacity' }}
        >
          {currentWord}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default FlipWords;
