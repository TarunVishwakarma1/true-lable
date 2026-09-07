"use client";

import { useEffect, useState } from "react";

const GLYPHS = "!<>-_\\/[]{}—=+*^?#";

export function TextScramble({
  text,
  className,
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    let frame = 0;
    let raf: number;
    const totalFrames = 24;
    const startTimeout = setTimeout(() => {
      function tick() {
        frame++;
        const progress = frame / totalFrames;
        const revealCount = Math.floor(progress * text.length);
        const next = text
          .split("")
          .map((char, i) => {
            if (char === " ") return " ";
            if (i < revealCount) return char;
            return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          })
          .join("");
        setDisplay(next);
        if (frame < totalFrames) {
          raf = requestAnimationFrame(tick);
        } else {
          setDisplay(text);
        }
      }
      raf = requestAnimationFrame(tick);
    }, delay * 1000);

    return () => {
      clearTimeout(startTimeout);
      cancelAnimationFrame(raf);
    };
  }, [text, delay]);

  return (
    <span className={className} aria-label={text}>
      {display}
    </span>
  );
}
