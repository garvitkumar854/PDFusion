
"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon } from 'lucide-react';
import { cn } from "@/lib/utils";

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-8 w-14" />;
  }

  const isDark = theme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const spring = {
    type: "spring",
    stiffness: 300,
    damping: 25,
  };

  return (
    <div
      onClick={toggleTheme}
      className={cn(
        "relative flex h-8 w-14 cursor-pointer items-center rounded-full p-1",
        "bg-secondary transition-colors"
      )}
      title="Toggle theme"
      aria-label="Toggle theme"
    >
      <motion.div
        className="absolute flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md"
        layout
        transition={spring}
        style={{
          left: isDark ? 'calc(100% - 28px)' : '4px',
        }}
      >
        <AnimatePresence mode="wait">
            <motion.div
                key={isDark ? "moon" : "sun"}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                transition={{ duration: 0.2 }}
            >
                {isDark ? (
                    <Moon className="h-4 w-4 text-slate-500" />
                ) : (
                    <Sun className="h-4 w-4 text-yellow-500" />
                )}
            </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
