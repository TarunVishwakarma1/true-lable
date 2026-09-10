"use client";

import { useEffect, useRef, type RefObject } from "react";

// Normalised device coordinates of the pointer over an element, measured against the
// element's live bounding box on every move. R3F's own pointer uses a box measured at
// resize time, which goes stale inside sticky sections.
export function usePointer(el: RefObject<HTMLElement | null>) {
  const ndc = useRef({ x: 0, y: 0, inside: false });
  useEffect(() => {
    const node = el.current;
    if (!node) return;
    function move(e: PointerEvent) {
      const r = node!.getBoundingClientRect();
      ndc.current.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      ndc.current.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
      ndc.current.inside = true;
    }
    const leave = () => {
      ndc.current.inside = false;
    };
    node.addEventListener("pointermove", move, { passive: true });
    node.addEventListener("pointerleave", leave);
    return () => {
      node.removeEventListener("pointermove", move);
      node.removeEventListener("pointerleave", leave);
    };
  }, [el]);
  return ndc;
}
