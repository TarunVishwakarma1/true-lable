"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { useState, type MouseEvent } from "react";
import { ScanCard } from "./scan-card";
import { GhostWordCycle } from "./ghost-word-cycle";

const SEED = "TRUELABEL·SCANVERIFYKNOW·2026";

const BARS = Array.from({ length: 40 }, (_, i) => {
  const code = SEED.charCodeAt(i % SEED.length);
  return {
    width: (code % 4) + 1,
    delay: i * 12,
  };
});

export function HeroVisual() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 60, damping: 20 });
  const springY = useSpring(y, { stiffness: 60, damping: 20 });

  const reticleX = useMotionValue(0);
  const reticleY = useMotionValue(0);
  const reticleSpringX = useSpring(reticleX, { stiffness: 300, damping: 30 });
  const reticleSpringY = useSpring(reticleY, { stiffness: 300, damping: 30 });
  const [hovering, setHovering] = useState(false);
  const [scanned, setScanned] = useState(false);

  function handleMove(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const relY = e.clientY - rect.top;
    x.set((relX / rect.width - 0.5) * 24);
    y.set((relY / rect.height - 0.5) * 24);
    reticleX.set(relX);
    reticleY.set(relY);
  }

  function handleLeave() {
    x.set(0);
    y.set(0);
    setHovering(false);
  }

  return (
    <div
      onMouseMove={handleMove}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={handleLeave}
      className="relative hidden h-full min-h-[28rem] items-center justify-center overflow-hidden lg:flex"
    >
      {/* corner ticks */}
      <span className="pointer-events-none absolute top-6 left-0 h-3 w-px bg-neutral-300 dark:bg-neutral-700" />
      <span className="pointer-events-none absolute top-6 left-0 h-px w-3 bg-neutral-300 dark:bg-neutral-700" />
      <span className="pointer-events-none absolute right-0 bottom-6 h-3 w-px bg-neutral-300 dark:bg-neutral-700" />
      <span className="pointer-events-none absolute right-0 bottom-6 h-px w-3 bg-neutral-300 dark:bg-neutral-700" />
      <span className="pointer-events-none absolute top-6 left-4 font-mono text-[10px] tracking-wider text-neutral-400 dark:text-neutral-600">
        REF // 0091
      </span>
      <span
        className={`pointer-events-none absolute right-4 bottom-6 font-mono text-[10px] tracking-wider transition-colors duration-300 ${
          scanned
            ? "text-emerald-500 dark:text-emerald-400"
            : "text-neutral-400 dark:text-neutral-600"
        }`}
      >
        STATUS: {scanned ? "VERIFIED" : "IDLE"}
        <span className="ml-0.5 animate-pulse">_</span>
      </span>

      <GhostWordCycle />

      <motion.div
        style={{ x: springX, y: springY }}
        className="relative z-10 flex flex-col items-center"
      >
        <div
          onMouseEnter={() => setScanned(true)}
          onMouseLeave={() => setScanned(false)}
          className="relative flex h-48 items-stretch gap-1"
        >
          {BARS.map((bar, i) => (
            <div
              key={i}
              className={`transition-colors duration-300 ${
                scanned
                  ? "bg-emerald-500"
                  : "bg-neutral-800 dark:bg-neutral-200"
              }`}
              style={{
                width: bar.width,
                transitionDelay: `${bar.delay}ms`,
              }}
            />
          ))}
          <div
            aria-hidden
            className="absolute inset-x-0 h-0.5 animate-[scan-sweep_3s_ease-in-out_infinite] bg-emerald-400 shadow-[0_0_12px_2px_rgba(52,211,153,0.8)]"
          />

          <ScanCard visible={scanned} />
        </div>

        <p className="mt-3 font-mono text-xs tracking-[0.3em] text-neutral-500 dark:text-neutral-500">
          8&nbsp;&nbsp;901234&nbsp;&nbsp;567890
        </p>
      </motion.div>

      <motion.div
        aria-hidden
        style={{ x: reticleSpringX, y: reticleSpringY, opacity: hovering ? 1 : 0 }}
        className="pointer-events-none absolute top-0 left-0 z-30 -translate-x-1/2 -translate-y-1/2"
      >
        <div className="relative h-14 w-14">
          <span className="absolute top-0 left-0 h-3 w-3 border-t-2 border-l-2 border-emerald-400" />
          <span className="absolute top-0 right-0 h-3 w-3 border-t-2 border-r-2 border-emerald-400" />
          <span className="absolute bottom-0 left-0 h-3 w-3 border-b-2 border-l-2 border-emerald-400" />
          <span className="absolute right-0 bottom-0 h-3 w-3 border-r-2 border-b-2 border-emerald-400" />
        </div>
      </motion.div>
    </div>
  );
}
