"use client";

import { motion } from "framer-motion";

const dotVariants = {
  initial: {
    y: "0%",
  },
  animate: {
    y: ["0%", "100%", "0%"],
    transition: {
      duration: 0.8,
      ease: "easeInOut",
      repeat: Infinity,
    },
  },
};

const LoadingDots = () => {
  return (
    <div className="flex items-center justify-center space-x-2">
      <motion.div
        className="h-3 w-3 rounded-full bg-primary"
        variants={dotVariants}
        initial="initial"
        animate="animate"
        style={{ animationDelay: "0s" }}
      />
      <motion.div
        className="h-3 w-3 rounded-full bg-primary"
        variants={dotVariants}
        initial="initial"
        animate="animate"
        style={{ animationDelay: "0.2s" }}
      />
      <motion.div
        className="h-3 w-3 rounded-full bg-primary"
        variants={dotVariants}
        initial="initial"
        animate="animate"
        style={{ animationDelay: "0.4s" }}
      />
    </div>
  );
};

export default LoadingDots;
