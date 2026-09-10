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
    const lenis = new Lenis({ autoRaf: true, lerp: 0.09, anchors: { offset: -72 } });
    window.appLenis = lenis;
    return () => {
      lenis.destroy();
      delete window.appLenis;
    };
  }, []);

  return null;
}
