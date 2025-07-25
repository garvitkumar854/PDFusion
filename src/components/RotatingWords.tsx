
"use client";

import React, { useCallback, useEffect, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const FlipWords = ({
  words,
  colors,
  duration = 3000,
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

  const textRef = useRef<HTMLSpanElement>(null);

  const startAnimation = useCallback(() => {
    const nextIndex = (index + 1) % words.length;
    setIndex(nextIndex);
    setIsAnimating(true);
  }, [index, words.length]);
  
  useEffect(() => {
    if (textRef.current) {
        setContainerSize({
            width: textRef.current.offsetWidth,
            height: textRef.current.offsetHeight,
        });
    }
  }, [index, words]);

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
  const nextWord = words[(index + 1) % words.length];

  return (
    <div
      style={{
        width: containerSize.width,
        height: containerSize.height,
      }}
      className="relative inline-block transition-all duration-300 ease-in-out align-bottom"
    >
      <span ref={textRef} className="absolute invisible whitespace-nowrap" aria-hidden="true">
        {nextWord}
      </span>
      <AnimatePresence initial={false} onExitComplete={onExitComplete}>
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
          exit={{
            opacity: 0,
            y: -10,
            filter: "blur(2px)",
          }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 10,
          }}
          className={cn("absolute left-0 right-0 whitespace-nowrap", className)}
          style={{ color: currentColor, willChange: 'transform, opacity' }}
        >
          {currentWord.split("").map((letter, letterIndex) => (
             <motion.span
                key={currentWord + letterIndex}
                initial={{ opacity: 0, y: 10, filter: "blur(2px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{
                  delay: letterIndex * 0.05,
                  duration: 0.2,
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
