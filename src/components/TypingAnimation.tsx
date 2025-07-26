
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
  const [typingSpeed, setTypingSpeed] = useState(120);
  const [deletingSpeed, setDeletingSpeed] = useState(80);
  const [delay, setDelay] = useState(1500);

  const handleTyping = useCallback(() => {
    const currentWord = words[index];
    const currentColor = colors[index % colors.length];

    if (isDeleting) {
      if (displayedText.length > 0) {
        setDisplayedText((prev) => prev.slice(0, -1));
      } else {
        setIsDeleting(false);
        setIndex((prev) => (prev + 1) % words.length);
      }
    } else {
      if (displayedText.length < currentWord.length) {
        setDisplayedText((prev) => currentWord.substring(0, prev.length + 1));
      } else {
        setTimeout(() => setIsDeleting(true), delay);
      }
    }
  }, [displayedText, isDeleting, index, words, delay]);

  useEffect(() => {
    const timer = setTimeout(handleTyping, isDeleting ? deletingSpeed : typingSpeed);
    return () => clearTimeout(timer);
  }, [handleTyping, typingSpeed, deletingSpeed, isDeleting]);

  const currentColor = colors[index % colors.length];

  return (
    <span className={cn("inline", className)}>
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
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="ml-1 inline-block h-[1em] w-[2px]"
        style={{ backgroundColor: currentColor }}
      />
    </span>
  );
};

export default TypingAnimation;
