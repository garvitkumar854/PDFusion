"use client";

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const words = [
  { text: "Simple", className: "from-green-400 to-blue-500" },
  { text: "Fast", className: "from-yellow-400 to-orange-500" },
  { text: "Secure", className: "from-purple-400 to-pink-500" },
  { text: "Free", className: "from-cyan-400 to-teal-500" },
];

const AnimatedHeadline = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % words.length);
      setAnimationKey(prevKey => prevKey + 1); // Reset animation
    }, 3000); // Change word every 3 seconds

    return () => clearInterval(interval);
  }, []);

  const currentWord = words[currentIndex];

  return (
    <span
      key={animationKey}
      className={cn(
        "bg-gradient-to-r bg-clip-text text-transparent animate-fade-in-up",
        currentWord.className
      )}
    >
      {currentWord.text}
    </span>
  );
};

export default AnimatedHeadline;
