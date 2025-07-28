
"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { motion, AnimatePresence } from "framer-motion"

const spring = {
  type: "spring",
  stiffness: 500,
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
    return <div className="w-16 h-8 rounded-full bg-muted" />;
  }

  const isLight = theme === "light";

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${isLight ? 'dark' : 'light'} mode`}
      className={cn(
        "relative w-16 h-8 rounded-full transition-colors duration-500 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isLight ? "bg-blue-400" : "bg-gray-800"
      )}
    >
      <motion.div
        layout
        transition={spring}
        className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md"
      >
        <div className="relative w-full h-full flex items-center justify-center">
            {/* Sun Rays */}
            <AnimatePresence>
            {isLight && (
                <motion.div
                    key="sun"
                    initial={{ scale: 0, opacity: 0, rotate: -90 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    exit={{ scale: 0, opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="absolute inset-0"
                >
                    {[...Array(8)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute left-1/2 top-1/2 h-full w-[1.5px] origin-center"
                            style={{ transform: `rotate(${i * 45}deg)` }}
                        >
                            <div className="absolute top-[-3px] h-[6px] w-full rounded-full bg-yellow-400"></div>
                        </div>
                    ))}
                </motion.div>
            )}
            </AnimatePresence>

            {/* Moon Craters */}
             <AnimatePresence>
            {!isLight && (
                 <motion.div
                    key="moon"
                    initial={{ scale: 0, opacity: 0, rotate: 90 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    exit={{ scale: 0, opacity: 0, rotate: -90 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="absolute inset-0"
                >
                    <div className="absolute top-1.5 right-1.5 w-1 h-1 rounded-full bg-slate-300 opacity-80" />
                    <div className="absolute bottom-1 left-2 w-[5px] h-[5px] rounded-full bg-slate-300 opacity-90" />
                    <div className="absolute bottom-2 right-1.5 w-0.5 h-0.5 rounded-full bg-slate-300" />
                </motion.div>
            )}
            </AnimatePresence>
        </div>
      </motion.div>
    </button>
  );
}

// Helper function to get cn working
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}
