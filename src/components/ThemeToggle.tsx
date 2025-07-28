"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-24 h-12 rounded-full bg-muted" />;

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`w-24 h-12 rounded-full relative transition-all duration-500 ${
        isDark ? "bg-[#1e294b]" : "bg-[#5d9bfa]"
      } flex items-center justify-center px-2 overflow-hidden`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.div
            key="moon"
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-2"
          >
            <div className="relative w-7 h-7 rounded-full bg-white shadow-md shadow-white/20 before:absolute before:w-7 before:h-7 before:bg-[#1e294b] before:rounded-full before:left-[5px] before:-top-[1px]" />
            <div className="w-[3px] h-[3px] bg-white/70 rounded-full" />
            <div className="w-[5px] h-[5px] bg-white/90 rounded-full" />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -40, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 bg-white rounded-full shadow-lg shadow-yellow-200/50" />
            <div className="w-2 h-2 bg-white/90 rounded-full shadow-md shadow-yellow-100/50" />
            <div className="w-1.5 h-1.5 bg-white/80 rounded-full shadow-sm shadow-yellow-50/50" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}
