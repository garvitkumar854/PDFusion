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
        isLight ? "bg-purple-500 justify-start" : "bg-slate-800 justify-end"
      )}
    >
      <motion.div
        className="absolute w-1 h-1 bg-white rounded-full"
        style={{ top: "25%", left: "15%" }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: isLight ? 0 : 1, scale: isLight ? 0 : 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      />
      <motion.div
        className="absolute w-0.5 h-0.5 bg-white rounded-full"
        style={{ top: "60%", left: "35%" }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: isLight ? 0 : 1, scale: isLight ? 0 : 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      />
      
      <motion.div
        className="w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center overflow-hidden"
        layout
        transition={spring}
      >
        <motion.div
            className="w-7 h-7 rounded-full bg-slate-800"
            initial={{ x: 8, opacity: 0 }}
            animate={{
              x: isLight ? 8 : -3,
              opacity: isLight ? 0 : 1,
            }}
            transition={{ duration: 0.35, delay: 0.05 }}
        />
      </motion.div>
    </button>
  );
}
