"use client";

import { AnimatePresence, motion, useMotionValue, useSpring } from "motion/react";
import type { MouseEvent } from "react";

export type Phase = "scan" | "verify" | "know";

const PRODUCT = {
  name: "Mango fruit drink",
  serve: "1 pack · 200 ml",
  ean: "890 2290 45 0117",
  verified: 22,
  rows: [
    { label: "Energy", value: "110 kcal", pct: 6 },
    { label: "Sugar", value: "26 g", pct: 52, flag: true },
    { label: "Carbs", value: "27 g", pct: 9 },
    { label: "Sodium", value: "12 mg", pct: 1 },
  ],
};

const BARS = "TRUELABEL·KNOWWHATYOUEAT·INDIA".split("").map((c) => (c.charCodeAt(0) % 3) + 1);
const EASE = [0.16, 1, 0.3, 1] as const;

function Sheet({ phase }: { phase: Phase }) {
  return (
    <motion.div
      initial={{ y: "108%" }}
      animate={{ y: 0 }}
      exit={{ y: "108%" }}
      transition={{ type: "spring", stiffness: 240, damping: 30 }}
      className="absolute inset-x-1.5 bottom-1.5 z-20 rounded-[2rem] border border-white/10 bg-[#0e0e0e]/95 p-4 backdrop-blur-xl sm:p-5"
    >
      <span className="mx-auto block h-1 w-10 rounded-full bg-white/15" />
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-medium tracking-tight">{PRODUCT.name}</p>
          <p className="mt-0.5 font-mono text-[10px] text-neutral-400">{PRODUCT.serve}</p>
        </div>
        <span className="shrink-0 font-mono text-[10px] text-accent">{PRODUCT.verified} verified</span>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {phase === "verify" ? (
          <motion.div
            key="verify"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="mt-4"
          >
            <div className="flex gap-3">
              <div className="w-[42%] bg-white p-2 font-mono text-[6px] leading-[1.7] text-neutral-500 uppercase">
                <span className="block text-[7px] font-semibold text-neutral-800">Nutrition per 100 ml</span>
                Energy 55 kcal · Carbs 13.5 g · Sugars 13 g · Sodium 6 mg
                <span className="mt-1 block text-neutral-400">Photo · 2 days ago</span>
              </div>
              <ul className="flex-1 space-y-1 font-mono text-[10px]">
                {[["Energy", "55 kcal"], ["Carbs", "13.5 g"], ["Sugars", "13 g"], ["Sodium", "6 mg"]].map(([k, v]) => (
                  <li key={k} className="flex justify-between border-b border-white/10 pb-1">
                    <span className="text-neutral-400">{k}</span>
                    <span className="tabular-nums">{v}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-3 text-[11px] text-neutral-300">Does the photo match the numbers?</p>
            <div className="mt-2 flex gap-2 text-[11px]">
              <motion.span
                initial={{ scale: 1 }}
                animate={{ scale: [1, 0.96, 1] }}
                transition={{ delay: 0.9, duration: 0.35 }}
                className="flex flex-1 items-center justify-center bg-accent py-2 font-medium text-ink"
              >
                Matches · 23
              </motion.span>
              <span className="flex flex-1 items-center justify-center py-2 text-neutral-400 ring-1 ring-white/15">
                Doesn't · 0
              </span>
            </div>
          </motion.div>
        ) : phase === "know" ? (
          <motion.div
            key="know"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="mt-4"
          >
            <div className="flex items-baseline justify-between text-[12px]">
              <span className="text-neutral-400">Sugar, per pack</span>
              <span className="font-mono tabular-nums">26 g</span>
            </div>
            <div className="mt-2 flex gap-1" aria-label="About six teaspoons">
              {Array.from({ length: 6 }, (_, k) => (
                <motion.span
                  key={k}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: 0.2 + k * 0.08, duration: 0.4, ease: EASE }}
                  className="h-6 flex-1 origin-bottom border border-amber-400/70 bg-amber-400/20"
                />
              ))}
            </div>
            <p className="mt-2 font-mono text-[10px] text-neutral-500">≈ 6 teaspoons · 52% of a 50 g day</p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="mt-4 border-l border-accent pl-3 text-[12px] leading-snug text-neutral-200"
            >
              One small pack is about six teaspoons of sugar. Half the day's 50 g, gone.
            </motion.p>
            <p className="mt-3 hidden font-mono text-[9px] text-neutral-600 sm:block">illustrative values · per pack</p>
          </motion.div>
        ) : (
          <motion.div
            key="scan"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            <ul className="mt-4 space-y-2.5">
              {PRODUCT.rows.map((row, k) => (
                <li key={row.label} className="text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">{row.label}</span>
                    <span className={`font-mono tabular-nums ${row.flag ? "text-amber-300" : "text-white"}`}>{row.value}</span>
                  </div>
                  <div className="mt-1 h-px overflow-hidden bg-white/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${row.pct}%` }}
                      transition={{ duration: 0.9, delay: 0.25 + k * 0.08, ease: EASE }}
                      className={`h-full ${row.flag ? "bg-amber-400" : "bg-accent"}`}
                    />
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-3 hidden font-mono text-[9px] text-neutral-600 sm:block">% of a 2,000 kcal day · illustrative values</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function ScanDemo({ phase }: { phase: Phase }) {
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rotateX = useSpring(rx, { stiffness: 80, damping: 18 });
  const rotateY = useSpring(ry, { stiffness: 80, damping: 18 });

  function onMove(e: MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 12);
    rx.set(-((e.clientY - r.top) / r.height - 0.5) * 12);
  }
  function onLeave() {
    rx.set(0);
    ry.set(0);
  }

  const found = phase !== "scan";

  return (
    <div
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="relative w-[clamp(190px,26svh,300px)] lg:w-[clamp(200px,32svh,300px)]"
      style={{ perspective: 1600 }}
      role="img"
      aria-label={`TrueLabel app, ${phase} step, showing ${PRODUCT.name}`}
      data-cursor="scan"
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        animate={{ rotateZ: phase === "scan" ? -2 : phase === "verify" ? 0 : 2 }}
        transition={{ duration: 0.9, ease: EASE }}
        className="relative aspect-[9/19] rounded-[2.75rem] border border-white/10 bg-[#161616] p-[6px] shadow-[0_60px_120px_-40px_rgba(0,0,0,0.85)]"
      >
        <div className="relative h-full overflow-hidden rounded-[2.4rem] bg-ink text-white">
          <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-7 pt-4 font-mono text-[11px]">
            <span>9:41</span>
            <span className="h-[22px] w-[80px] rounded-full bg-black" />
            <span className="h-2.5 w-4 rounded-[3px] border border-white/70 p-px">
              <span className="block h-full w-2/3 rounded-[1px] bg-white/80" />
            </span>
          </div>

          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,#262626,#0a0a0a_72%)]">
            <div className="absolute inset-x-0 top-16 px-6 text-center">
              <p
                className={`inline-block px-3 py-1 font-mono text-[10px] tracking-[0.16em] uppercase transition-colors duration-500 ${
                  found ? "bg-accent text-ink" : "bg-white/10 text-neutral-300"
                }`}
              >
                {found ? "Found · verified" : "Point at a barcode"}
                {!found && <span className="ml-0.5 animate-blink">_</span>}
              </p>
            </div>

            <div className="absolute top-[23%] left-1/2 w-[76%] bg-white p-4 text-ink shadow-2xl [transform:translateX(-50%)_rotate(-3deg)]">
              <p className="font-mono text-[8px] tracking-wider text-neutral-500 uppercase">Net qty · Best before</p>
              <div className="mt-2 flex h-14 items-stretch gap-[2px]">
                {BARS.map((w, k) => (
                  <span
                    key={k}
                    className="transition-colors duration-300"
                    style={{
                      width: w,
                      backgroundColor: found ? "var(--color-accent)" : "#0a0a0a",
                      transitionDelay: found ? `${k * 18}ms` : "0ms",
                    }}
                  />
                ))}
              </div>
              <p className="mt-1.5 text-center font-mono text-[10px] tracking-[0.25em] text-neutral-700">{PRODUCT.ean}</p>
            </div>

            <div className="absolute top-[18%] left-1/2 h-[26%] w-[88%] -translate-x-1/2">
              {["top-0 left-0 border-t border-l", "top-0 right-0 border-t border-r", "bottom-0 left-0 border-b border-l", "right-0 bottom-0 border-r border-b"].map((c) => (
                <span
                  key={c}
                  className={`absolute h-5 w-5 transition-colors duration-500 ${c} ${found ? "border-accent" : "border-white/70"}`}
                />
              ))}
              {!found && <span className="absolute inset-x-2 h-px animate-scan bg-accent shadow-[0_0_14px_2px_rgba(16,185,129,0.7)]" />}
            </div>
          </div>

          <AnimatePresence>{found && <Sheet key="sheet" phase={phase} />}</AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
