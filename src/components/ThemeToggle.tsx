
"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon } from 'lucide-react';
import { cn } from "@/lib/utils";

export const ThemeToggle = () => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render a placeholder to prevent layout shift
    return <div className="h-7 w-12" />;
  }

  const isDark = resolvedTheme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const spring = {
    type: "spring",
    stiffness: 500,
    damping: 30,
  };

  return (
    <div
      onClick={toggleTheme}
      className={cn(
        "relative flex h-7 w-12 cursor-pointer items-center rounded-full p-1",
        "bg-secondary transition-colors"
      )}
      title="Toggle theme"
      aria-label="Toggle theme"
    >
      <motion.div
        className="absolute flex h-5 w-5 items-center justify-center rounded-full bg-background shadow-md"
        transition={spring}
        style={{
          left: isDark ? 'calc(100% - 24px)' : '4px',
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            layoutId="theme-icon"
            key={isDark ? "moon" : "sun"}
            initial={{ y: 0, opacity: 0, rotate: -90 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: 0, opacity: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
          >
            {isDark ? (
              <Moon className="h-3 w-3 text-slate-500" />
            ) : (
              <Sun className="h-3 w-3 text-yellow-500" />
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
