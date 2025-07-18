
"use client";

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const words = [
  { text: "Simple.", className: "from-green-400 to-blue-500", animation: "animate-slide-in-from-bottom" },
  { text: "Secure.", className: "from-purple-400 to-pink-500", animation: "animate-slide-in-from-right" },
  { text: "Amazingly Fast.", className: "from-yellow-400 to-orange-500", animation: "animate-slide-in-from-top" },
  { text: "User-Friendly.", className: "from-cyan-400 to-teal-500", animation: "animate-slide-in-from-left" },
  { text: "Completely Free.", className: "from-rose-400 to-red-500", animation: "animate-slide-in-from-bottom" },
];

const TYPING_SPEED = 100;
const DELETING_SPEED = 50;
const PAUSE_DURATION = 2000;

const AnimatedHeadline = () => {
  const [wordIndex, setWordIndex] = useState(0);
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [animationClass, setAnimationClass] = useState(words[0].animation);

  useEffect(() => {
    const currentWord = words[wordIndex];
    
    const handleTyping = () => {
      if (isDeleting) {
        if (text.length > 0) {
          setText((prev) => prev.slice(0, -1));
        } else {
          setIsDeleting(false);
          setWordIndex((prevIndex) => (prevIndex + 1) % words.length);
        }
      } else {
        if (text.length < currentWord.text.length) {
          setText((prev) => currentWord.text.slice(0, prev.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), PAUSE_DURATION);
        }
      }
    };
    
    const typingSpeed = isDeleting ? DELETING_SPEED : TYPING_SPEED;
    const timer = setTimeout(handleTyping, typingSpeed);
    
    return () => clearTimeout(timer);
  }, [text, isDeleting, wordIndex]);

  useEffect(() => {
    setAnimationClass(words[wordIndex].animation);
  }, [wordIndex]);
  
  const currentWord = words[wordIndex];

  return (
    <span className="relative inline-flex items-center justify-center h-16 sm:h-20 md:h-24 w-full">
       <span
          className={cn(
            "bg-gradient-to-r bg-clip-text text-transparent whitespace-nowrap",
            currentWord.className,
            animationClass
          )}
        >
          {text}
          <span className="border-r-2 border-primary animate-blink-caret ml-1"></span>
        </span>
    </span>
  );
};

export default AnimatedHeadline;
