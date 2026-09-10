"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { useEffect, useState } from "react";

export function Cursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 900, damping: 60, mass: 0.2 });
  const sy = useSpring(y, { stiffness: 900, damping: 60, mass: 0.2 });
  const rx = useSpring(x, { stiffness: 260, damping: 28, mass: 0.6 });
  const ry = useSpring(y, { stiffness: 260, damping: 28, mass: 0.6 });
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
      if (t.closest("[data-cursor='scan']")) setMode("scan");
      else if (t.closest("a, button, input, label")) setMode("link");
      else setMode("idle");
    }
    const leave = () => setHidden(true);
    window.addEventListener("mousemove", move, { passive: true });
    window.addEventListener("mouseover", over);
    document.documentElement.addEventListener("mouseleave", leave);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
      document.documentElement.removeEventListener("mouseleave", leave);
    };
  }, [x, y]);

  const size = mode === "scan" ? 56 : mode === "link" ? 40 : 28;

  return (
    <div aria-hidden className="cursor pointer-events-none fixed inset-0 z-[150]" style={{ opacity: hidden ? 0 : 1 }}>
      <motion.div
        style={{ x: sx, y: sy }}
        className="absolute top-0 left-0 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent"
      />
      <motion.div
        style={{ x: rx, y: ry }}
        className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2"
      >
        <motion.div
          animate={{ width: size, height: size, borderRadius: mode === "scan" ? 6 : 999, opacity: mode === "idle" ? 0.5 : 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className={`relative -translate-x-1/2 -translate-y-1/2 ${mode === "scan" ? "" : "border border-fg/60"}`}
        >
          {mode === "scan" &&
            ["top-0 left-0 border-t border-l", "top-0 right-0 border-t border-r", "bottom-0 left-0 border-b border-l", "right-0 bottom-0 border-r border-b"].map((c) => (
              <span key={c} className={`absolute h-3 w-3 border-accent ${c}`} />
            ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
