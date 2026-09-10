"use client";

import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useEffect, useState } from "react";
import { holdProgress } from "./hold";

const RING = 32;
const R = RING / 2 - 1;
const CIRC = 2 * Math.PI * R;

// Quiet by design: a dot that snaps, a hairline ring that lags a little,
// and nothing else unless you're holding to scan.
export function Cursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const rx = useSpring(x, { stiffness: 400, damping: 40, mass: 0.5 });
  const ry = useSpring(y, { stiffness: 400, damping: 40, mass: 0.5 });
  const dash = useTransform(holdProgress, (p) => CIRC * (1 - p));
  const holdOpacity = useTransform(holdProgress, [0, 0.02], [0, 1]);

  const [mode, setMode] = useState<"idle" | "link" | "scan">("idle");
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    function move(e: MouseEvent) {
      x.set(e.clientX);
      y.set(e.clientY);
      setHidden(false);
    }
    function over(e: MouseEvent) {
      const t = e.target as HTMLElement;
      if (t.closest("a, button, input, label, [role='button'], [role='option']")) setMode("link");
      else if (t.closest("[data-cursor='scan']")) setMode("scan");
      else setMode("idle");
    }
    const leave = () => setHidden(true);
    const enter = () => setHidden(false);
    window.addEventListener("mousemove", move, { passive: true });
    window.addEventListener("mouseover", over);
    document.documentElement.addEventListener("mouseleave", leave);
    document.documentElement.addEventListener("mouseenter", enter);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
      document.documentElement.removeEventListener("mouseleave", leave);
      document.documentElement.removeEventListener("mouseenter", enter);
    };
  }, [x, y]);

  return (
    <div
      aria-hidden
      className="cursor pointer-events-none fixed inset-0 z-[150] transition-opacity duration-300"
      style={{ opacity: hidden ? 0 : 1 }}
    >
      <motion.div style={{ x: rx, y: ry }} className="absolute top-0 left-0 h-0 w-0">
        <motion.div
          animate={{ scale: mode === "link" ? 1.5 : mode === "scan" ? 1.15 : 1, opacity: mode === "idle" ? 0.45 : 0.9 }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
          style={{ width: RING, height: RING, marginLeft: -RING / 2, marginTop: -RING / 2 }}
          className="mix-blend-difference"
        >
          <svg viewBox={`0 0 ${RING} ${RING}`} className="h-full w-full overflow-visible">
            <circle cx={RING / 2} cy={RING / 2} r={R} fill={mode === "link" ? "rgba(255,255,255,0.18)" : "none"} stroke="#fff" strokeWidth="1" />
          </svg>
        </motion.div>
        <motion.svg
          viewBox={`0 0 ${RING} ${RING}`}
          style={{ width: RING, height: RING, marginLeft: -RING / 2, marginTop: -RING / 2, opacity: holdOpacity }}
          className="absolute top-0 left-0 overflow-visible"
        >
          <motion.circle
            cx={RING / 2}
            cy={RING / 2}
            r={R}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            style={{ strokeDashoffset: dash, rotate: -90, transformOrigin: "center" }}
          />
        </motion.svg>
      </motion.div>

      <motion.div style={{ x, y }} className="absolute top-0 left-0 h-0 w-0">
        <motion.div
          animate={{ scale: mode === "link" ? 0 : 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="-mt-[2.5px] -ml-[2.5px] h-[5px] w-[5px] rounded-full bg-accent"
        />
      </motion.div>
    </div>
  );
}
