"use client";

import { AnimatePresence, animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "motion/react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { Button, TextLink } from "@repo/ui/button";
import { Container } from "@repo/ui/container";
import { holdProgress } from "@repo/ui/hold";
import { play } from "@repo/ui/sound";
import { Typewriter } from "@repo/ui/typewriter";
import { useAccent } from "@repo/ui/theme";
import { useIsDark, useMedia } from "@repo/ui/use-media";
import { REPO_URL } from "../lib/site";

const BarcodeScene = dynamic(() => import("@repo/ui/scene/barcode-scene"), { ssr: false });

const EASE = [0.16, 1, 0.3, 1] as const;
// The preloader lifts at ~1.6s; the hero starts after it.
const T0 = 1.7;
const HOLD_MS = 1300;

const READINGS = [
  { ean: "890 4213 08 7654", name: "Instant noodles, masala", read: "1,020 mg sodium. About half your day." },
  { ean: "890 2290 45 0117", name: "Mango fruit drink", read: "26 g sugar in one pack. About six teaspoons." },
  { ean: "890 7019 12 3308", name: "Glucose biscuits", read: "6.2 g sugar in four. The whole pack, about six teaspoons." },
  { ean: "890 5561 77 2043", name: "Aloo bhujia, 42 g", read: "640 mg sodium in one small pack. A third of your day." },
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
  const stage = useRef<HTMLDivElement>(null);
  const dark = useIsDark();
  const { accent } = useAccent();
  const reduced = useReducedMotion() ?? false;
  const wide = useMedia("(min-width: 768px)", true);
  const [active, setActive] = useState(true);
  const [beat, setBeat] = useState(0);
  const [manual, setManual] = useState<number | null>(null);
  const [holding, setHolding] = useState(false);
  // Mount the scene after the preloader has lifted, so its shader compile never blocks hydration.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 1400);
    return () => clearTimeout(t);
  }, []);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setActive(v < 1);
    setBeat(v < 0.42 ? 0 : v < 0.72 ? 1 : 2);
  });

  const introOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const introY = useTransform(scrollYProgress, [0, 0.3], [0, -40]);
  const scanLine = useTransform(scrollYProgress, [0.08, 0.88], ["0%", "100%"]);
  const hintOpacity = useTransform(scrollYProgress, [0, 0.08], [1, 0]);
  const stageScale = useTransform(scrollYProgress, [0.85, 1], [1, 0.96]);
  const stageOpacity = useTransform(scrollYProgress, [0.85, 1], [1, 0.6]);

  // Hold anywhere on the stage to run a manual scan from the cursor outward.
  const hold = useMotionValue(0);
  const holdAnim = useRef<ReturnType<typeof animate> | null>(null);
  const holdX = useMotionValue(0);
  const holdY = useMotionValue(0);
  useMotionValueEvent(hold, "change", (v) => holdProgress.set(v));

  const release = useCallback(() => {
    setHolding(false);
    holdAnim.current?.stop();
    holdAnim.current = animate(hold, 0, { duration: 0.5, ease: EASE });
  }, [hold]);

  function press(e: PointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest("a, button")) return;
    if (e.pointerType === "touch") return; // touch scrolls; scroll is the scan there
    holdX.set(e.clientX);
    holdY.set(e.clientY);
    setHolding(true);
    play("tick");
    holdAnim.current?.stop();
    holdAnim.current = animate(hold, 1, {
      duration: HOLD_MS / 1000,
      ease: "linear",
      onComplete: () => {
        setHolding(false);
        setManual((m) => (m === null ? 2 : (m + 1) % READINGS.length));
        play("scan");
        holdAnim.current = animate(hold, 0, { duration: 1.4, ease: EASE, delay: 0.6 });
      },
    });
  }

  useEffect(() => {
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    return () => {
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
    };
  }, [release]);

  // A manual scan shows its reading for a while, then the stage settles back.
  useEffect(() => {
    if (manual === null) return;
    const t = setTimeout(() => setManual(null), 7000);
    return () => clearTimeout(t);
  }, [manual]);

  const reading = manual !== null ? READINGS[manual]! : READINGS[beat === 2 ? 1 : 0]!;
  const dim = manual !== null && beat === 0;
  const show = beat > 0 || manual !== null;

  return (
    <section ref={ref} id="top" className="relative h-[260vh]">
      <motion.div
        ref={stage}
        onPointerDown={press}
        style={{ scale: stageScale, opacity: stageOpacity }}
        className="sticky top-0 h-svh touch-pan-y overflow-hidden select-none"
        data-cursor="scan"
      >
        <motion.div
          className="absolute inset-0"
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: ready ? 1 : 0 }}
          transition={{ duration: 1.2, ease: EASE }}
        >
          {ready && (
          <BarcodeScene
            progress={scrollYProgress}
            hold={hold}
            dark={dark}
            reduced={reduced}
            active={active}
            quality={wide && !reduced ? "high" : "low"}
            accent={accent}
            eventSource={stage}
          />
          )}
        </motion.div>
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-bg to-transparent" />

        <AnimatePresence>
          {holding && (
            <motion.p
              key="holding"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ x: holdX, y: holdY }}
              className="pointer-events-none absolute top-0 left-0 z-20 ml-6 -mt-3 font-mono text-[10px] tracking-[0.18em] text-accent uppercase"
            >
              Scanning
            </motion.p>
          )}
        </AnimatePresence>

        <Container className="pointer-events-none relative flex h-full flex-col justify-between pt-24 pb-6 md:pb-8">
          <motion.div style={{ opacity: introOpacity, y: introY }}>
            <h1 className="text-[clamp(3.25rem,10vw,9.5rem)] leading-[0.9] font-medium tracking-[-0.045em]">
              <Words text="The label knows." delay={T0} />
              <br />
              <Words text="Now you do." delay={T0 + 0.2} className="text-accent" />
            </h1>
            <motion.div animate={{ opacity: dim ? 0 : 1, y: dim ? -8 : 0 }} transition={{ duration: 0.6, ease: EASE }}>
            <motion.p {...fade(T0 + 0.7)} className="mt-6 max-w-md text-lg leading-relaxed text-pretty text-muted md:mt-8">
              A free, open-source scanner that reads the back of the packet out loud, in plain language,
              for the food actually on Indian shelves.
            </motion.p>
            <motion.div {...fade(T0 + 0.85)} className="pointer-events-auto mt-8 flex flex-wrap items-center gap-x-8 gap-y-3">
              <Button href={REPO_URL} target="_blank" rel="noreferrer">
                Get early access
              </Button>
              <TextLink href="#journey">How it works</TextLink>
            </motion.div>
            </motion.div>
          </motion.div>

          <div>
            <AnimatePresence mode="wait">
              {show && (
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
                  <p className="mt-3 max-w-3xl text-2xl font-medium tracking-[-0.03em] text-balance sm:text-4xl lg:text-5xl">
                    {reading.name}.{" "}
                    <Typewriter text={reading.read} speed={22} className="text-muted" />
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div {...fade(T0 + 1.3)} className="border-t border-line pt-4">
              <div className="flex items-center justify-between font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
                <motion.span style={{ opacity: hintOpacity }}>
                  <span className="hidden md:inline">Scroll, or hold anywhere, to scan</span>
                  <span className="md:hidden">Scroll to scan</span>
                </motion.span>
                <span className="hidden sm:inline">Free · Open source · India-first</span>
                <span className="tabular-nums">0{beat + 1} / 03</span>
              </div>
              <div className="relative mt-3 h-px w-full bg-line">
                <motion.div style={{ width: scanLine }} className="absolute inset-y-0 left-0 bg-accent" />
              </div>
            </motion.div>
          </div>
        </Container>
      </motion.div>
    </section>
  );
}
