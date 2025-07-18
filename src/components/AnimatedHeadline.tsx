
"use client";

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const words = [
  { text: "Simple.", className: "from-green-400 to-blue-500" },
  { text: "Secure.", className: "from-purple-400 to-pink-500" },
  { text: "Amazingly Fast.", className: "from-yellow-400 to-orange-500" },
  { text: "User-Friendly.", className: "from-cyan-400 to-teal-500" },
  { text: "Completely Free.", className: "from-rose-400 to-red-500" },
];

const TYPING_SPEED = 100;
const DELETING_SPEED = 50;
const PAUSE_DURATION = 2000;

const animations = [
  "animate-slide-in-from-bottom",
  "animate-slide-in-from-right",
  "animate-slide-in-from-top",
  "animate-slide-in-from-left",
];

const AnimatedHeadline = () => {
  const [wordIndex, setWordIndex] = useState(0);
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [animationClass, setAnimationClass] = useState(animations[0]);

  useEffect(() => {
    const currentWord = words[wordIndex];
    
    const handleTyping = () => {
      if (isDeleting) {
        if (text.length > 0) {
          setText((prev) => prev.slice(0, -1));
        } else {
          setIsDeleting(false);
          setWordIndex((prevIndex) => {
            const nextIndex = (prevIndex + 1) % words.length;
            setAnimationClass(animations[nextIndex % animations.length]);
            return nextIndex;
          });
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
  
  const currentWordStyle = words[wordIndex];

  return (
    <span className="relative inline-flex items-center justify-center h-16 sm:h-20 md:h-24 w-full">
       <span
          className={cn(
            "bg-gradient-to-r bg-clip-text text-transparent whitespace-nowrap",
            currentWordStyle.className,
            animationClass
          )}
        >
          {text}
          <span className="border-r-[3px] border-primary animate-blink-caret ml-1 h-12 sm:h-16 md:h-20 align-middle"></span>
        </span>
    </span>
  );
};

export default AnimatedHeadline;
