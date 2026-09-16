"use client";

import { motion } from "framer-motion";

export function FadeInProvider({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, ease: "easeOut" }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
}