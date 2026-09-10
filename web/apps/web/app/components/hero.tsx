"use client";

import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "motion/react";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { REPO_URL } from "../lib/site";
import { Button, TextLink } from "@repo/ui/button";
import { Container } from "@repo/ui/container";
import { useIsDark } from "@repo/ui/use-media";

const BarcodeScene = dynamic(() => import("@repo/ui/scene/barcode-scene"), { ssr: false });

const EASE = [0.16, 1, 0.3, 1] as const;
// The preloader lifts at ~1.6s; the hero starts after it.
const T0 = 1.7;

const READINGS = [
  { ean: "890 4213 08 7654", name: "Instant noodles, masala", read: "1,020 mg sodium. About half your day." },
  { ean: "890 2290 45 0117", name: "Mango fruit drink", read: "26 g sugar in one pack. About six teaspoons." },
];

function Words({ text, delay, className = "" }: { text: string; delay: number; className?: string }) {
  return (
    <>
      {text.split(" ").map((word, i) => (
        <span key={i} className="-mb-[0.14em] mr-[0.22em] inline-block overflow-hidden pb-[0.14em] align-bottom last:mr-0">
          <motion.span
            className={`inline-block ${className}`}
            initial={{ y: "110%" }}
            animate={{ y: 0 }}
            transition={{ duration: 1.1, delay: delay + i * 0.07, ease: EASE }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </>
  );
}

const fade = (delay: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.9, delay, ease: EASE },
});

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const dark = useIsDark();
  const reduced = useReducedMotion() ?? false;
  const [active, setActive] = useState(true);
  const [beat, setBeat] = useState(0);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setActive(v < 1);
    setBeat(v < 0.42 ? 0 : v < 0.72 ? 1 : 2);
  });

  const introOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const introY = useTransform(scrollYProgress, [0, 0.3], [0, -40]);
  const scanLine = useTransform(scrollYProgress, [0.08, 0.88], ["0%", "100%"]);
  const hintOpacity = useTransform(scrollYProgress, [0, 0.08], [1, 0]);

  const reading = READINGS[beat === 2 ? 1 : 0]!;

  return (
    <section ref={ref} id="top" className="relative h-[260vh]">
      <div className="sticky top-0 h-svh overflow-hidden">
        <div className="absolute inset-0" aria-hidden>
          <BarcodeScene progress={scrollYProgress} dark={dark} reduced={reduced} active={active} />
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-bg to-transparent"
        />

        <Container className="relative flex h-full flex-col justify-between pt-24 pb-6 md:pb-8">
          <motion.div style={{ opacity: introOpacity, y: introY }} className="pointer-events-none">
            <h1 className="text-[clamp(3.25rem,10vw,9.5rem)] leading-[0.9] font-medium tracking-[-0.045em]">
              <Words text="Know what" delay={T0} />
              <br />
              <Words text="you eat." delay={T0 + 0.15} className="text-accent" />
            </h1>
            <motion.p
              {...fade(T0 + 0.6)}
              className="mt-6 max-w-md text-lg leading-relaxed text-pretty text-muted md:mt-8"
            >
              A free, open-source scanner that reads the nutrition label back to you in plain language.
              Built for the packets actually on Indian shelves.
            </motion.p>
            <motion.div {...fade(T0 + 0.75)} className="pointer-events-auto mt-8 flex flex-wrap items-center gap-x-8 gap-y-3">
              <Button href={REPO_URL} target="_blank" rel="noreferrer" data-cursor="scan">
                Get early access
              </Button>
              <TextLink href="#journey">How it works</TextLink>
            </motion.div>
          </motion.div>

          <div className="pointer-events-none">
            <AnimatePresence mode="wait">
              {beat > 0 && (
                <motion.div
                  key={reading.ean}
                  initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -16, filter: "blur(6px)" }}
                  transition={{ duration: 0.8, ease: EASE }}
                  className="mb-8 max-w-4xl"
                >
                  <p className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
                    <span className="text-accent">Found</span>
                    <span className="mx-2">·</span>
                    {reading.ean}
                  </p>
                  <p className="mt-3 text-3xl font-medium tracking-[-0.03em] text-balance sm:text-5xl lg:text-6xl">
                    {reading.name}.{" "}
                    <span className="text-muted">{reading.read}</span>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div {...fade(T0 + 1.2)} className="border-t border-line pt-4">
              <div className="flex items-center justify-between font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
                <motion.span style={{ opacity: hintOpacity }}>Scroll to scan</motion.span>
                <span className="hidden sm:inline">Free · Open source · India-first</span>
                <span className="tabular-nums">0{beat + 1} / 03</span>
              </div>
              <div className="relative mt-3 h-px w-full bg-line">
                <motion.div style={{ width: scanLine }} className="absolute inset-y-0 left-0 bg-accent" />
              </div>
            </motion.div>
          </div>
        </Container>
      </div>
    </section>
  );
}
