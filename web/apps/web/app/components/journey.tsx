"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { useRef, useState } from "react";
import { Container } from "@repo/ui/container";
import { ScanDemo, type Phase } from "@repo/ui/scan-demo";

const BEATS: { phase: Phase; n: string; title: string; body: string; note?: string }[] = [
  {
    phase: "scan",
    n: "01",
    title: "Scan.",
    body: "Point the camera at the barcode. If we've seen the product, the facts are on screen in under a second. If not, you're the first: adding it is a photo of the label and a minute of your time.",
  },
  {
    phase: "verify",
    n: "02",
    title: "Verify.",
    body: "Every product page shows the photo of the real label beside the typed numbers. Anyone can tap “matches” or “doesn't”. Enough agreement marks it verified; one dispute sends it back to review.",
    note: "A stranger in another city checked this label before you. That is what makes it trustworthy.",
  },
  {
    phase: "know",
    n: "03",
    title: "Know.",
    body: "Numbers become sentences: “six teaspoons of sugar”, “half your sodium for the day”. Per pack or per 100 g, your call. No verdict on whether to buy it. That stays yours.",
    note: "Tell it what you're watching and those flags come first. That part is Premium; the label itself is always free.",
  },
];

const EASE = [0.16, 1, 0.3, 1] as const;

export function Journey() {
  const ref = useRef<HTMLElement>(null);
  const [i, setI] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => setI(Math.min(BEATS.length - 1, Math.floor(v * BEATS.length))));
  const bar = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const beat = BEATS[i]!;

  return (
    <section id="journey" ref={ref} className="relative h-[360vh] scroll-mt-0">
      <div className="sticky top-0 h-svh overflow-hidden">
        <Container className="flex h-full flex-col pt-24 pb-8">
          <div className="flex items-baseline justify-between border-t border-line pt-5 font-mono text-xs text-muted">
            <p>
              <span className="tabular-nums">02</span>
              <span className="mx-2">/</span>How it works
            </p>
            <p className="tabular-nums">
              <span className="text-fg">{beat.n}</span> / 03
            </p>
          </div>

          <div className="grid flex-1 items-center gap-4 lg:grid-cols-12 lg:gap-8">
            <div className="order-2 lg:order-1 lg:col-span-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={beat.n}
                  initial={{ opacity: 0, y: 28, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -20, filter: "blur(6px)" }}
                  transition={{ duration: 0.7, ease: EASE }}
                >
                  <h3 className="text-4xl font-medium tracking-[-0.04em] sm:text-6xl lg:text-8xl">{beat.title}</h3>
                  <p className="mt-4 max-w-lg text-base leading-relaxed text-pretty text-muted sm:mt-6 sm:text-lg">{beat.body}</p>
                  {beat.note && <p className="mt-5 hidden max-w-lg font-mono sm:block text-[11px] leading-relaxed text-muted">{beat.note}</p>}
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="order-1 flex justify-center lg:order-2 lg:col-span-6 lg:justify-end">
              <ScanDemo phase={beat.phase} />
            </div>
          </div>

          <div className="relative h-px w-full bg-line">
            <motion.div style={{ width: bar }} className="absolute inset-y-0 left-0 bg-accent" />
          </div>
        </Container>
      </div>
    </section>
  );
}
