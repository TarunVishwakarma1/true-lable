"use client";

import { useEffect } from "react";
import Lenis from "lenis";

declare global {
  interface Window {
    // Named appLenis, not lenis — the `lenis` package itself already
    // declares a differently-shaped `window.lenis` for its own devtools.
    appLenis?: Lenis;
  }
}

export function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis();
    window.appLenis = lenis;

    function raf(time: number) {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    }
    let frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
      delete window.appLenis;
    };
  }, []);

  return null;
}
