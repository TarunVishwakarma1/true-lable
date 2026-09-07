"use client";

import { useEffect, useState } from "react";

export function Preloader() {
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const start = performance.now();
    const duration = 1200;

    let frame: number;
    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      setCount(Math.round(progress * 100));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setTimeout(() => {
          setDone(true);
          document.body.style.overflow = "";
        }, 250);
      }
    }
    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-neutral-950"
      style={{
        transform: done ? "translateY(-100%)" : "translateY(0)",
        transition: "transform 700ms cubic-bezier(0.76, 0, 0.24, 1)",
        pointerEvents: done ? "none" : "auto",
      }}
    >
      <div className="flex items-baseline gap-3">
        <span className="text-xl font-bold tracking-tight text-white">
          True<span className="text-emerald-400">Label</span>
        </span>
        <span className="font-mono text-sm text-neutral-500">{count}%</span>
      </div>
    </div>
  );
}
