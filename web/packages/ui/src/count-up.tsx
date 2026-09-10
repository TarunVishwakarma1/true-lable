"use client";

import { animate, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";

export function CountUp({ value }: { value: number | string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView || typeof value !== "number") return;
    const controls = animate(0, value, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setN(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, value]);

  return <span ref={ref}>{typeof value === "number" ? n : value}</span>;
}
