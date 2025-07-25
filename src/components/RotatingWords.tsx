
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const FlipWords = ({
  words,
  colors,
  duration = 2200,
  className,
}: {
  words: string[];
  colors: string[];
  duration?: number;
  className?: string;
}) => {
  const [index, setIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [containerSize, setContainerSize] = useState({ width: "auto", height: "auto" });

  const sizerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (sizerRef.current) {
      const { width, height } = sizerRef.current.getBoundingClientRect();
      setContainerSize({ width: `${width}px`, height: `${height}px` });
    }
  }, [words[index]]);

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

  const onExitComplete = () => {
    setIsAnimating(false);
  };
  
  const currentWord = words[index];
  const currentColor = colors[index % colors.length];

  return (
    <div 
        style={{ width: containerSize.width, height: containerSize.height }}
        className="relative inline-block align-bottom"
    >
      <span ref={sizerRef} className="absolute invisible whitespace-nowrap" aria-hidden="true">
        {currentWord}
      </span>
      <AnimatePresence onExitComplete={onExitComplete}>
        <motion.div
          key={currentWord}
          initial={{
            opacity: 0,
            y: 10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 10,
          }}
          exit={{
            opacity: 0,
            y: -40,
            filter: "blur(8px)",
            scale: 2,
            position: "absolute",
          }}
          className={cn("absolute left-0 right-0 whitespace-nowrap", className)}
          style={{ color: currentColor }}
        >
          {currentWord.split("").map((letter, letterIndex) => (
            <motion.span
              key={currentWord + letterIndex}
              initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{
                delay: letterIndex * 0.08,
                duration: 0.4,
              }}
              className="inline-block"
            >
              {letter}
            </motion.span>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default FlipWords;
