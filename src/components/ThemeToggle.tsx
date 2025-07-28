
"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder to prevent layout shift and server-side rendering issues
    return <div className="h-10 w-10" />;
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
    <button
      onClick={toggleTheme}
      className="theme-toggle relative inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      title="Toggle theme"
      aria-label="Toggle theme"
    >
      <svg
        className="sun-and-moon"
        aria-hidden="true"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        strokeWidth="2"
      >
        <mask className="moon" id="moon-mask">
          <rect x="0" y="0" width="100%" height="100%" fill="white" />
          <motion.circle
            cx={isDark ? 17 : 24}
            cy="10"
            r="6"
            fill="black"
            animate={{ cx: isDark ? 17 : 24 }}
            transition={spring}
          />
        </mask>
        <motion.circle
          className="sun"
          cx="12"
          cy="12"
          r="6"
          mask="url(#moon-mask)"
          fill="currentColor"
          animate={{ scale: isDark ? 1.75 : 1 }}
          transition={spring}
        />
        <motion.g
          className="sun-beams"
          stroke="currentColor"
          animate={{
            rotate: isDark ? -25 : 0,
            opacity: isDark ? 0 : 1,
          }}
          transition={spring}
        >
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </motion.g>
      </svg>
    </button>
  );
};
