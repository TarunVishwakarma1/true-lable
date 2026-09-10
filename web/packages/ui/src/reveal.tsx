"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

type Variant = "rise" | "wipe" | "scale" | "fade";

const VARIANTS = {
  rise: {
    initial: { opacity: 0, y: 28, filter: "blur(6px)" },
    whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
  },
  wipe: {
    initial: { clipPath: "inset(0 0 100% 0)", y: 24 },
    whileInView: { clipPath: "inset(0 0 0% 0)", y: 0 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.94 },
    whileInView: { opacity: 1, scale: 1 },
  },
  fade: {
    initial: { opacity: 0 },
    whileInView: { opacity: 1 },
  },
};

export function Reveal({
  children,
  delay = 0,
  className,
  variant = "rise",
  amount = 0.2,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  variant?: Variant;
  amount?: number;
}) {
  return (
    <motion.div
      {...VARIANTS[variant]}
      viewport={{ once: true, amount }}
      transition={{ duration: 1, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
