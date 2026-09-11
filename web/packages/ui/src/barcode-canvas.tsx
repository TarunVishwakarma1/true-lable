"use client";

import { useEffect, useMemo, useRef } from "react";
import { holdTone, sweepTone } from "./sound";
import { useAccent } from "./theme";
import { useIsDark } from "./use-media";

const SEED = "STARTKNOWINGWHATYOUEAT·TRUELABEL·FREE·OPENSOURCE·INDIA·SCANVERIFYKNOW·COMMUNITY";

// A 2D barcode that leans toward the cursor: bars nearby grow and turn emerald.
export function BarcodeCanvas({ seed = SEED, className = "block h-32 w-full sm:h-44 lg:h-56" }: { seed?: string; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const dark = useIsDark();
  const { accent } = useAccent();
  const rgb = useMemo(() => {
    const n = parseInt(accent.slice(1), 16);
    return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
  }, [accent]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const widths = (seed + seed).split("").map((c) => (c.charCodeAt(0) % 3) + 1);
    const heights = new Float32Array(widths.length).fill(0.55);
    const mixes = new Float32Array(widths.length);
    let mouse = { x: -9999, y: 0, inside: false };
    let w = 0;
    let h = 0;
    let raf = 0;
    let held = false;
    let heldAt = 0;
    let prevX = 0;
    let prevT = 0;
    let prevInside = false;

    const fg = () => (dark ? "230,230,227" : "20,20,20");

    function resize() {
      const r = canvas!.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width;
      h = r.height;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function frame(t: number) {
      const unit = w / (widths.reduce((a, b) => a + b, 0) + widths.length * 0.6);
      const gap = unit * 0.6;
      let x = 0;
      let nearDist = Infinity;
      ctx!.clearRect(0, 0, w, h);
      for (let i = 0; i < widths.length; i++) {
        const bw = widths[i]! * unit;
        const cx = x + bw / 2;
        const d = (cx - mouse.x) / (w * 0.06);
        const ad = Math.abs(d);
        if (ad < nearDist) nearDist = ad;
        const lift = mouse.inside ? Math.exp(-d * d) : 0;
        const idle = reduced ? 0 : Math.sin(t / 900 + i * 0.35) * 0.04;
        const target = 0.55 + lift * 0.45 + idle;
        heights[i] = heights[i]! + (target - heights[i]!) * 0.12;
        mixes[i] = mixes[i]! + (lift - mixes[i]!) * 0.12;
        const bh = heights[i]! * h;
        const m = mixes[i]!;
        ctx!.fillStyle = `rgba(${fg()},${1 - m})`;
        ctx!.fillRect(x, h - bh, bw, bh);
        if (m > 0.01) {
          ctx!.fillStyle = `rgba(${rgb},${m})`;
          ctx!.fillRect(x, h - bh, bw, bh);
        }
        x += bw + gap;
      }
      // A soft "vroom" while the cursor is actually sweeping (speed-driven, so a still
      // cursor goes quiet even mid-hover), and a deeper "hum" that builds while pressed
      // — both drive one persistent drone each (./sound.tsx), so sweeping/holding never
      // spawns nodes.
      const speed = mouse.inside && prevInside ? (Math.abs(mouse.x - prevX) / Math.max(t - prevT, 1)) * 1000 : 0;
      prevX = mouse.x;
      prevT = t;
      prevInside = mouse.inside;
      const nearness = Math.max(0, 1 - nearDist / 1.4);
      sweepTone(mouse.inside, Math.min(1, speed / (w * 1.5)) * nearness);
      holdTone(held, held ? Math.min(1, (t - heldAt) / 900) : 0);
      raf = requestAnimationFrame(frame);
    }

    function onMove(e: MouseEvent) {
      const r = canvas!.getBoundingClientRect();
      mouse = { x: e.clientX - r.left, y: e.clientY - r.top, inside: true };
    }
    function onLeave() {
      mouse = { ...mouse, inside: false };
    }
    function onDown(e: PointerEvent) {
      held = true;
      heldAt = performance.now();
      onMove(e);
    }
    function onUp() {
      held = false;
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);
    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      // Silence the shared drones so a mid-gesture unmount can't leave them humming.
      sweepTone(false);
      holdTone(false);
    };
  }, [dark, seed, rgb]);

  return <canvas ref={ref} aria-hidden data-cursor="scan" className={className} />;
}
