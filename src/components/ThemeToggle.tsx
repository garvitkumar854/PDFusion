"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const spring = {
  type: "spring",
  stiffness: 700,
  damping: 30,
};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    // Render a skeleton or an empty div to prevent layout shift
    return <div className="w-[70px] h-[34px] rounded-full bg-muted" />;
  }

  const isLight = theme === "light";

  const toggleTheme = () => {
    setTheme(isLight ? "dark" : "light");
  };

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className={cn(
        "relative flex items-center w-[70px] h-[34px] rounded-full cursor-pointer transition-colors duration-500 ease-in-out p-1",
        isLight ? "bg-primary/20 justify-start" : "bg-slate-800 justify-end"
      )}
    >
      {/* Stars in the background, only visible in dark mode */}
      <motion.div
        className="absolute w-1 h-1 bg-white rounded-full"
        style={{ top: "25%", left: "25%" }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: isLight ? 0 : 1, scale: isLight ? 0 : 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      />
      <motion.div
        className="absolute w-0.5 h-0.5 bg-white rounded-full"
        style={{ top: "60%", left: "15%" }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: isLight ? 0 : 1, scale: isLight ? 0 : 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      />
      <motion.div
        className="absolute w-0.5 h-0.5 bg-white rounded-full"
        style={{ top: "40%", left: "40%" }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: isLight ? 0 : 1, scale: isLight ? 0 : 1 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      />
      
      {/* Sliding Thumb */}
      <motion.div
        className="relative w-6 h-6 bg-white rounded-full shadow-md"
        layout
        transition={spring}
      >
        {/* Moon Mask */}
        <motion.div
          className="absolute w-5 h-5 rounded-full"
          style={{
            background: isLight ? "transparent" : "#1E293B", // Use dark mode bg for mask
            top: "1px",
            right: "-3px", // Positioned to carve out the crescent from the right
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: isLight ? 0 : 1,
            opacity: isLight ? 0 : 1,
          }}
          transition={{ duration: 0.35, delay: 0.05 }}
        />
      </motion.div>
    </button>
  );
}
