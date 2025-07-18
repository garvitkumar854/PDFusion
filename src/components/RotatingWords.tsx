
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
    }, 2000); // Change word every 2 seconds

    return () => clearInterval(interval);
  }, [words.length]);

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={words[index]}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        className={cn("inline-block", className)}
        style={{ color: colors[index % colors.length] }}
      >
        {words[index]}
      </motion.span>
    </AnimatePresence>
  );
};

export default RotatingWords;
