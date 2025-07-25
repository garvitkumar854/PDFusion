
"use client";

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface RotatingWordsProps {
  words: string[];
  colors: string[];
  className?: string;
}

const RotatingWords: React.FC<RotatingWordsProps> = ({ words, colors, className }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % words.length);
    }, 2500); // Change word every 2.5 seconds

    return () => clearInterval(interval);
  }, [words.length]);
  
  const currentWord = words[index];
  const currentColor = colors[index % colors.length];

  const slideUp = {
    initial: {
      y: "100%",
    },
    animate: (i: number) => ({
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.4, 0, 0.2, 1],
        delay: i * 0.03,
      },
    }),
    exit: (i: number) => ({
       y: "-100%",
        transition: {
            duration: 0.4,
            ease: [0.4, 0, 0.2, 1],
            delay: i * 0.03,
        },
    })
  };


  return (
    <div className={cn("inline-block font-bold", className)}>
       <AnimatePresence mode="wait">
        <motion.div
            key={currentWord}
            className="flex"
            style={{ color: currentColor }}
        >
          {currentWord.split("").map((char, i) => (
             <div key={i} className="overflow-hidden py-1">
                <motion.span
                    custom={i}
                    variants={slideUp}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="inline-block"
                    style={{ willChange: 'transform' }}
                >
                    {char === " " ? "\u00A0" : char}
                </motion.span>
            </div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default RotatingWords;
