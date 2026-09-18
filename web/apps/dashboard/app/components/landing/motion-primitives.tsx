"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

// The one curve this page uses for entrances. Strong ease-out: the built-in
// keyword is too weak to read as deliberate at these durations.
export const EASE_OUT = [0.23, 1, 0.32, 1] as const;

// None of these branch their markup or their initial styles on
// useReducedMotion(). That hook reports false during SSR and true on a client
// that prefers reduced motion, so branching on it renders different HTML on
// each side and React throws a hydration mismatch. Providers already sets
// <MotionConfig reducedMotion="user">, which drops transform animations to
// their end value while keeping opacity, so the reduced case is handled
// without the DOM ever diverging.

/**
 * Marketing-surface scroll reveal. Fires once, because re-animating on every
 * scroll-by is an interface fighting its reader.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, transform: "translateY(18px)" }}
      whileInView={{ opacity: 1, transform: "translateY(0px)" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: EASE_OUT }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Headline that rises a word at a time out of a clipping box. Each word is its
 * own overflow-hidden span so the mask is the line, not the glyph box.
 */
export function RisingWords({
  text,
  delay = 0,
  className = "",
}: {
  text: string;
  delay?: number;
  className?: string;
}) {
  return (
    <>
      {/* The words are separate spans with no whitespace between them, so the
          gaps are margins a screen reader cannot see. Read the real sentence
          from here and hide the animated copy. */}
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {text.split(" ").map((word, i) => (
          <span
            key={`${word}-${i}`}
            // The padding reserve keeps descenders (g, y, p) from being clipped
            // by the overflow that makes the mask work.
            className="mr-[0.24em] -mb-[0.16em] inline-block overflow-hidden pb-[0.16em] align-bottom last:mr-0"
          >
            <motion.span
              className={`inline-block ${className}`}
              initial={{ transform: "translateY(115%)" }}
              animate={{ transform: "translateY(0%)" }}
              transition={{ duration: 0.9, delay: delay + i * 0.06, ease: EASE_OUT }}
            >
              {word}
            </motion.span>
          </span>
        ))}
      </span>
    </>
  );
}

/** Fade and lift, for elements that enter on mount rather than on scroll. */
export function Enter({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, transform: "translateY(12px)" }}
      animate={{ opacity: 1, transform: "translateY(0px)" }}
      transition={{ duration: 0.7, delay, ease: EASE_OUT }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
