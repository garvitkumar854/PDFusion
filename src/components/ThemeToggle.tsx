"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

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
    return <div className="w-20 h-10 rounded-full bg-muted" />;
  }

  const isLight = theme === "light";

  const toggleTheme = () => {
    setTheme(isLight ? "dark" : "light");
  };

  return (
    <div className="flex items-center justify-center">
      <motion.button
        onClick={toggleTheme}
        aria-label="Toggle theme"
        className="relative flex items-center w-20 h-10 rounded-full cursor-pointer p-1"
        animate={{
          background: isLight ? "#8B5CF6" : "#1E293B", // Purple for light, Dark Blue for dark
        }}
        transition={{ duration: 0.5 }}
      >
        {/* Stars */}
        <motion.div
          className="absolute w-1 h-1 bg-white rounded-full"
          style={{ top: "25%", left: "60%" }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: isLight ? 0 : 1, scale: isLight ? 0 : 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        />
        <motion.div
          className="absolute w-1 h-1 bg-white rounded-full"
          style={{ top: "55%", left: "75%" }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: isLight ? 0 : 1, scale: isLight ? 0 : 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        />
        
        <div
          className={`flex w-full justify-${isLight ? "start" : "end"}`}
        >
          <motion.div
            className="relative w-8 h-8 rounded-full bg-white flex items-center justify-center overflow-hidden"
            layout
            transition={spring}
          >
            {/* This is the masking div that creates the crescent shape */}
            <motion.div
              className="absolute w-8 h-8 rounded-full"
              style={{ background: "#1E293B" }} // Must match dark background
              initial={{ x: "100%" }}
              animate={{ x: isLight ? "100%" : "50%" }}
              transition={{ ...spring, stiffness: 500, damping: 35 }}
            />
          </motion.div>
        </div>
      </motion.button>
    </div>
  );
}
