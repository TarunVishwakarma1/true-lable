"use client";

import { useEffect, useState } from "react";

const BARS = "TRUELABEL·KNOW".split("").map((c) => (c.charCodeAt(0) % 3) + 1);

export function Preloader() {
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("tl_preloaded")) {
      setDone(true);
      setCount(100);
      return;
    }

    document.body.style.overflow = "hidden";
    const start = performance.now();
    const duration = 1200;
    let frame = 0;
    function tick(now: number) {
      const p = Math.min((now - start) / duration, 1);
      setCount(Math.round((1 - Math.pow(1 - p, 3)) * 100));
      if (p < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setTimeout(() => {
          setDone(true);
          try {
            sessionStorage.setItem("tl_preloaded", "1");
          } catch {}
          document.body.style.overflow = "";
        }, 200);
      }
    }
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[200] flex flex-col justify-between bg-ink px-6 py-8 text-white md:px-10"
      style={{
        transform: done ? "translateY(-100%)" : "translateY(0)",
        transition: "transform 1000ms cubic-bezier(0.76, 0, 0.24, 1)",
        pointerEvents: done ? "none" : "auto",
      }}
    >
      <div className="flex items-baseline justify-between">
        <span className="text-lg font-medium tracking-tight">
          True<span className="text-accent">Label</span>
        </span>
        <span className="font-mono text-[11px] tracking-[0.18em] text-neutral-500 uppercase">Reading the label</span>
      </div>
      <div className="flex items-end justify-between">
        <div className="flex h-16 items-stretch gap-[3px]">
          {BARS.map((w, i) => (
            <span
              key={i}
              className="transition-colors duration-200"
              style={{ width: w * 3, backgroundColor: count >= (i / BARS.length) * 100 ? "#10b981" : "#ffffff" }}
            />
          ))}
        </div>
        <span className="font-mono text-6xl leading-none tracking-[-0.04em] tabular-nums sm:text-8xl">
          {String(count).padStart(3, "0")}
        </span>
      </div>
    </div>
  );
}
