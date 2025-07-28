
"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder to prevent layout shift
    return <div className="w-20 h-10 rounded-full bg-muted" />;
  }

  const isDark = theme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const sunVariants = {
    initial: { x: -20, opacity: 0, scale: 0.8 },
    animate: { x: 0, opacity: 1, scale: 1, transition: { type: "spring", stiffness: 400, damping: 25 } },
    exit: { x: 20, opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
  };

  const moonVariants = {
    initial: { x: 20, opacity: 0, scale: 0.8 },
    animate: { x: 0, opacity: 1, scale: 1, transition: { type: "spring", stiffness: 400, damping: 25 } },
    exit: { x: -20, opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
  };

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className={cn(
        "relative flex w-20 h-10 items-center rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isDark ? "bg-black justify-start" : "bg-primary justify-end"
      )}
    >
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={isDark ? "moon" : "sun"}
          className="h-full w-1/2 flex items-center justify-center"
          variants={isDark ? moonVariants : sunVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {isDark ? (
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="white"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transform: "rotate(-30deg)" }}
            >
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
          ) : (
            <div className="w-6 h-6 bg-white rounded-full" />
          )}
        </motion.div>
      </AnimatePresence>
    </button>
  );
};
