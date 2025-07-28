"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

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

  const spring = {
    type: "spring",
    stiffness: 500,
    damping: 40,
  };

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className={cn(
        "relative flex h-10 w-20 items-center rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isDark ? "bg-[#1E293B] justify-end" : "bg-primary justify-start"
      )}
    >
        <motion.div
            layout
            transition={spring}
            className="relative h-8 w-8 rounded-full bg-white shadow-md"
        >
            {/* Moon mask */}
            <motion.div
                className="absolute right-0 top-0 h-full w-full rounded-full bg-[#1E293B]"
                initial={{ scale: 0, x: 0 }}
                animate={{
                    scale: isDark ? 1 : 0,
                    x: isDark ? -2 : 0,
                }}
                transition={{...spring, delay: 0.05}}
             />

             {/* Stars for dark mode */}
             <AnimatePresence>
                {isDark && (
                <>
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1, transition: { delay: 0.2, ...spring } }}
                    exit={{ opacity: 0, scale: 0 }}
                    className="absolute left-1 top-2 h-1 w-1 rounded-full bg-slate-400"
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1, transition: { delay: 0.3, ...spring } }}
                    exit={{ opacity: 0, scale: 0 }}
                    className="absolute right-2 top-4 h-[3px] w-[3px] rounded-full bg-slate-400"
                  />
                </>
                )}
             </AnimatePresence>

        </motion.div>
    </button>
  );
};
