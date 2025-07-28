
"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SunIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M12 17.625C15.1066 17.625 17.625 15.1066 17.625 12C17.625 8.8934 15.1066 6.375 12 6.375C8.8934 6.375 6.375 8.8934 6.375 12C6.375 15.1066 8.8934 17.625 12 17.625Z"
        fill="currentColor"
      />
      <path
        d="M12 2.25V4.125"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 19.875V21.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.125 12H2.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21.75 12H19.875"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.89688 5.89746L4.57656 4.57715"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19.4234 19.4229L18.1031 18.1025"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19.4234 4.57715L18.1031 5.89746"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.89688 18.1025L4.57656 19.4229"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
);


export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
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
      className={`relative flex items-center w-20 h-10 rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
        isDark ? "bg-primary" : "bg-primary/20"
      }`}
    >
      <AnimatePresence initial={false}>
        <motion.div
          key={isDark ? "dark" : "light"}
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 30, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute w-full h-full flex items-center justify-center"
        >
          {isDark ? (
            <div className="text-primary-foreground relative">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19.3438 14.6875C19.1406 14.7188 18.9375 14.75 18.7344 14.75C14.6875 14.75 11.375 11.4375 11.375 7.39062C11.375 7.1875 11.375 6.98438 11.4375 6.78125C10.2188 7.34375 9.34375 8.5 9.34375 9.875C9.34375 11.6875 10.7812 13.125 12.5938 13.125C13.625 13.125 14.5312 12.6875 15.1875 12C16.5 13.5625 17.8125 14.375 19.3438 14.6875Z" fill="currentColor"/>
              </svg>
              <motion.div
                className="absolute w-1 h-1 bg-primary-foreground rounded-full"
                style={{ top: "20%", right: "-20%" }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              />
              <motion.div
                className="absolute w-0.5 h-0.5 bg-primary-foreground rounded-full"
                style={{ top: "50%", right: "-30%" }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              />
            </div>
          ) : (
             <SunIcon className="text-primary" />
          )}
        </motion.div>
      </AnimatePresence>
      <motion.div
        layout
        transition={spring}
        className="w-8 h-8 bg-white rounded-full z-10"
        style={{
          position: "absolute",
          left: isDark ? "calc(100% - 36px)" : "4px",
        }}
       />
    </button>
  );
};

