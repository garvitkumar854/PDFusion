
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
        duration: 0.5,
        ease: [0.6, 0.01, -0.05, 0.95],
        delay: i * 0.025,
      },
    }),
    exit: (i: number) => ({
       y: "-100%",
        transition: {
            duration: 0.3,
            ease: [0.6, 0.01, -0.05, 0.95],
            delay: i * 0.025,
        },
    })
  };


  return (
    <div className={cn("inline-block font-bold", className)}>
       <AnimatePresence mode="wait">
        <motion.div
            key={currentWord}
            className="flex"
            style={{ color: currentColor, willChange: 'transform, opacity' }}
        >
          {currentWord.split("").map((char, i) => (
             <div key={i} className="overflow-hidden">
                <motion.span
                    custom={i}
                    variants={slideUp}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="inline-block"
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
