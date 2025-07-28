
"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

const spring = {
  type: "spring",
  stiffness: 700,
  damping: 30,
};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  if (!isMounted) {
    return <div className="w-[70px] h-[34px] rounded-full bg-muted" />;
  }

  const isLight = theme === "light";

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className={cn(
        "relative flex items-center w-[70px] h-[34px] rounded-full cursor-pointer transition-colors duration-500 ease-in-out",
        isLight ? "bg-primary/20" : "bg-black"
      )}
      style={{ justifyContent: isLight ? "flex-start" : "flex-end" }}
    >
       <AnimatePresence>
        {!isLight && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {/* Stars */}
            <div
              className="absolute left-[18px] top-[8px] w-1 h-1 bg-white rounded-full"
              style={{ opacity: 0.9 }}
            />
            <div
              className="absolute left-[28px] top-[16px] w-[3px] h-[3px] bg-white rounded-full"
              style={{ opacity: 0.7 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        className="h-[26px] w-[26px] bg-white rounded-full z-10"
        layout
        transition={spring}
      >
        <div className="relative w-full h-full">
            {/* Moon Craters */}
            <AnimatePresence>
            {!isLight && (
                <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{ duration: 0.3, delay: 0.15 }}
                    className="absolute inset-0"
                >
                    <div className="absolute top-[5px] right-[4px] w-[5px] h-[5px] bg-slate-300 rounded-full" />
                    <div className="absolute top-[12px] right-[10px] w-[3px] h-[3px] bg-slate-300 rounded-full" />
                </motion.div>
            )}
            </AnimatePresence>
        </div>
      </motion.div>
    </button>
  );
}
