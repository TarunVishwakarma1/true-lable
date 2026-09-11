"use client";

import { AnimatePresence, motion, useInView, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { Container } from "@repo/ui/container";
import { Typewriter } from "@repo/ui/typewriter";
import { useAccent } from "@repo/ui/theme";
import { useIsDark } from "@repo/ui/use-media";

const ParticlesScene = dynamic(() => import("@repo/ui/scene/particles-scene"), { ssr: false });

const BEATS = [
  { n: "01", title: "Thousands of labels, scattered.", body: "Every packet on every shelf is a point of data nobody has gathered." },
  { n: "02", title: "One barcode finds it.", body: "Thirteen digits, and the point becomes a product page." },
  { n: "03", title: "The label, as rows you can read.", body: "Energy, sugar, sodium, additives. Set the way a friend would explain it." },
  { n: "04", title: "Your day, as a share.", body: "26 g of sugar isn't a number. It's 52% of today." },
];

const EASE = [0.16, 1, 0.3, 1] as const;

export function DataField() {
  const ref = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const dark = useIsDark();
  const { accent } = useAccent();
  const [i, setI] = useState(0);
  const [active, setActive] = useState(false);
  const near = useInView(ref, { once: true, margin: "60% 0px 60% 0px" });

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  // Morph runs across the pinned middle of the section; the ends are the scroll-in and scroll-out.
  const morph = useTransform(scrollYProgress, [0.18, 0.82], [0, 3]);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setActive(v > 0 && v < 1);
    // Captions switch when a shape has mostly settled, not when the morph begins.
    // (The "beat" sound itself now plays from particles-scene.tsx, gated on the
    // particles actually having settled into the shape rather than this threshold.)
    const next = Math.min(3, Math.max(0, Math.round(((v - 0.18) / 0.64) * 3)));
    setI(next);
  });
  const beat = BEATS[i]!;

  return (
    <section ref={ref} id="data" className="relative h-[420vh]">
      <div ref={stage} className="sticky top-0 h-svh overflow-hidden" data-cursor="scan">
        <div className="absolute inset-0" aria-hidden>
          {near && <ParticlesScene morph={morph} accent={accent} dark={dark} active={active} eventSource={stage} />}
        </div>

        <AnimatePresence>
          {i === 1 && (
            <motion.p
              key="ean"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="pointer-events-none absolute inset-x-0 top-[74%] text-center font-mono text-sm tracking-[0.45em] text-fg tabular-nums sm:text-base"
            >
              <Typewriter text="8 902290 450117" speed={55} />
            </motion.p>
          )}
        </AnimatePresence>

        <Container className="pointer-events-none relative flex h-full flex-col justify-between pt-24 pb-8">
          <div className="flex items-baseline justify-between border-t border-line pt-5 font-mono text-xs text-muted">
            <p>
              <span className="tabular-nums">00</span>
              <span className="mx-2">/</span>The data
            </p>
            <p className="tabular-nums">
              <span className="text-fg">{beat.n}</span> / 04
            </p>
          </div>

          <div className="grid items-end gap-6 md:grid-cols-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={beat.n}
                initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -16, filter: "blur(6px)" }}
                transition={{ duration: 0.7, ease: EASE }}
                className="md:col-span-7"
              >
                <h2 className="max-w-2xl text-4xl font-medium tracking-[-0.035em] text-balance sm:text-5xl lg:text-6xl">{beat.title}</h2>
                <p className="mt-4 max-w-md text-lg text-pretty text-muted">{beat.body}</p>
              </motion.div>
            </AnimatePresence>
            <AnimatePresence>
              {i === 3 && (
                <motion.p
                  key="pct"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: EASE }}
                  className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase md:col-span-5 md:text-right"
                >
                  <span className="block text-5xl font-medium tracking-[-0.04em] text-fg tabular-nums sm:text-7xl">52%</span>
                  of a 50 g sugar day, one 200 ml pack
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </Container>
      </div>
    </section>
  );
}
