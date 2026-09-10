"use client";

import { motion, useScroll, useSpring, useTransform } from "motion/react";
import { useRef, type ReactNode } from "react";

// Moves its children against the scroll. `speed` is the fraction of the page's travel the
// element lags by (0.3 = it drifts 30% slower); `scale` zooms it in slightly as it passes
// the middle of the viewport; `rotate` adds a few degrees of tilt on the way through.
export function Parallax({
  children,
  speed = 0.2,
  scale = 0,
  rotate = 0,
  className = "",
  style,
}: {
  children: ReactNode;
  speed?: number;
  scale?: number;
  rotate?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });
  const y = useTransform(smooth, [0, 1], [`${speed * 80}%`, `${-speed * 80}%`]);
  const s = useTransform(smooth, [0, 0.5, 1], [1 - scale, 1 + scale * 0.4, 1 - scale]);
  const r = useTransform(smooth, [0, 1], [rotate, -rotate]);
  return (
    <motion.div ref={ref} style={{ y, scale: s, rotate: r, ...style }} className={className}>
      {children}
    </motion.div>
  );
}

// A huge outlined numeral that sits behind a section and drifts at a different rate.
export function Numeral({ n, className = "" }: { n: string; className?: string }) {
  return (
    <Parallax
      speed={0.9}
      rotate={4}
      className={`pointer-events-none absolute -z-10 font-mono text-[42vw] leading-none font-medium tracking-[-0.08em] text-transparent select-none [-webkit-text-stroke:1px_var(--line)] ${className}`}
    >
      {n}
    </Parallax>
  );
}
