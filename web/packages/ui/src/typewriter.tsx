"use client";

import { useEffect, useState } from "react";
import { play } from "./sound";

export function Typewriter({
  text,
  start = true,
  speed = 28,
  className = "",
  sound = false,
  onDone,
}: {
  text: string;
  start?: boolean;
  speed?: number;
  className?: string;
  sound?: boolean;
  onDone?: () => void;
}) {
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!start) return;
    setN(0);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setN(i);
      if (sound && i % 3 === 0) play("tick");
      if (i >= text.length) {
        clearInterval(id);
        onDone?.();
      }
    }, speed);
    return () => clearInterval(id);
    // onDone intentionally excluded: retyping on a new callback identity would be wrong.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, start, speed, sound]);

  return (
    <span className={className} aria-label={text}>
      {text.slice(0, n)}
      {start && n < text.length && <span className="animate-blink">_</span>}
    </span>
  );
}
