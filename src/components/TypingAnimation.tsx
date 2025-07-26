
"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const TypingAnimation = ({
  words,
  colors,
  className,
}: {
  words: string[];
  colors: string[];
  className?: string;
}) => {
  const [index, setIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Adjusted speeds for a more natural feel
  const typingSpeed = 100;
  const deletingSpeed = 60;
  const delay = 2000; // Longer pause before deleting

  const handleTyping = useCallback(() => {
    const currentWord = words[index];
    
    if (isDeleting) {
      // Deleting logic
      if (displayedText.length > 0) {
        setDisplayedText((prev) => prev.slice(0, -1));
      } else {
        setIsDeleting(false);
        setIndex((prev) => (prev + 1) % words.length);
      }
    } else {
      // Typing logic
      if (displayedText.length < currentWord.length) {
        setDisplayedText((prev) => currentWord.substring(0, prev.length + 1));
      } else {
        // Wait before starting to delete
        setTimeout(() => setIsDeleting(true), delay);
      }
    }
  }, [displayedText, isDeleting, index, words, delay]);

  useEffect(() => {
    const timer = setTimeout(handleTyping, isDeleting ? deletingSpeed : typingSpeed);
    return () => clearTimeout(timer);
  }, [handleTyping, isDeleting, typingSpeed, deletingSpeed]);

  const currentColor = colors[index % colors.length];

  return (
    <motion.span layout className={cn("inline-flex items-center", className)}>
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          style={{ color: currentColor }}
          className="whitespace-nowrap"
        >
          {displayedText}
        </motion.span>
      </AnimatePresence>
      <motion.span
        key={`cursor-${index}`}
        initial={{ opacity: 1 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
        className="ml-1 inline-block h-[1.1em] w-[2px] align-text-bottom"
        style={{ backgroundColor: currentColor }}
        layout
      />
    </motion.span>
  );
};

export default TypingAnimation;
