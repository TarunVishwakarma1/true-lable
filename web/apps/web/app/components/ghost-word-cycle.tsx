"use client";

import { useEffect, useState } from "react";

const WORDS = ["SCAN", "VERIFY", "KNOW"];

export function GhostWordCycle() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % WORDS.length);
        setVisible(true);
      }, 400);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <span
      aria-hidden
      className="pointer-events-none absolute top-1/2 left-1/2 z-0 -translate-x-1/2 -translate-y-1/2 text-[14rem] leading-none font-black whitespace-nowrap text-transparent select-none [-webkit-text-stroke:1px_rgba(16,185,129,0.15)]"
      style={{
        opacity: visible ? 1 : 0,
        transition: "opacity 400ms ease-in-out",
      }}
    >
      {WORDS[index]}
    </span>
  );
}
