
"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sun, Moon } from 'lucide-react';
import { cn } from "@/lib/utils";

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder to prevent layout shift and server-side rendering issues
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
        "relative flex h-8 w-14 cursor-pointer items-center justify-between rounded-full p-1",
        "bg-secondary transition-colors"
      )}
      title="Toggle theme"
      aria-label="Toggle theme"
    >
      <motion.div
        className="absolute h-6 w-6 rounded-full bg-white shadow-md"
        layout
        transition={spring}
        style={{
          left: isDark ? 'calc(100% - 28px)' : '4px',
        }}
      />
      <Sun className="h-5 w-5 text-yellow-500 z-10" />
      <Moon className="h-5 w-5 text-slate-400 z-10" />
    </div>
  );
};
