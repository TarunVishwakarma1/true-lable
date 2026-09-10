"use client";

import { motion, useInView, useScroll, useTransform } from "motion/react";
import { useRef, type ReactNode } from "react";
import { Container } from "@repo/ui/container";
import { LabelCard } from "@repo/ui/label-card";
import { Numeral, Parallax } from "@repo/ui/parallax";
import { Reveal } from "@repo/ui/reveal";
import { SectionHeading } from "@repo/ui/section-heading";
import { Typewriter } from "@repo/ui/typewriter";
import { useMedia } from "@repo/ui/use-media";

const EASE = [0.16, 1, 0.3, 1] as const;

function LabelLens() {
  const ref = useRef<HTMLDivElement>(null);
  const on = useInView(ref, { amount: 0.6 });
  return (
    <div ref={ref} className="relative w-full max-w-sm">
      <motion.div animate={{ filter: on ? "blur(0px)" : "blur(3px)", opacity: on ? 1 : 0.5 }} transition={{ duration: 1, ease: EASE }}>
        <LabelCard />
      </motion.div>
      <motion.div
        initial={false}
        animate={{ scale: on ? 1 : 0.2, opacity: on ? 1 : 0 }}
        transition={{ type: "spring", stiffness: 160, damping: 18, delay: on ? 0.45 : 0 }}
        className="absolute -right-3 -bottom-8 flex h-36 w-36 flex-col items-center justify-center rounded-full border border-accent bg-bg text-center"
      >
        <span className="font-mono text-[9px] tracking-[0.12em] text-muted uppercase">Sodium, per pack</span>
        <span className="mt-1 text-2xl font-medium tracking-tight tabular-nums">1,020 mg</span>
        <span className="text-xs text-accent">about half your day</span>
      </motion.div>
    </div>
  );
}

function TwoVerdicts() {
  const ref = useRef<HTMLDivElement>(null);
  const on = useInView(ref, { amount: 0.6 });
  const rows = [
    ["Arjun, 24, trains most days", "Fine · 8 g protein", "text-accent"],
    ["Meera, 51, watching blood pressure", "Careful · 640 mg sodium", "text-warn"],
  ];
  return (
    <div ref={ref} className="w-full max-w-sm border-t border-line text-sm" style={{ perspective: 800 }}>
      <div className="flex items-baseline justify-between border-b border-line py-3">
        <span>
          Masala oats <span className="font-mono text-[11px] text-muted">· 40 g serve</span>
        </span>
        <span className="font-mono text-[11px] text-muted">a generic app says: healthy</span>
      </div>
      {rows.map(([who, verdict, tone], i) => (
        <motion.div
          key={who}
          initial={false}
          animate={{ rotateX: on ? 0 : -90, opacity: on ? 1 : 0 }}
          transition={{ duration: 0.7, delay: on ? 0.3 + i * 0.2 : 0, ease: EASE }}
          className="flex origin-top items-baseline justify-between gap-6 border-b border-line py-3"
        >
          <span className="text-muted">{who}</span>
          <span className={`shrink-0 font-mono text-[11px] ${tone}`}>{verdict}</span>
        </motion.div>
      ))}
      <motion.p
        initial={false}
        animate={{ opacity: on ? 1 : 0 }}
        transition={{ delay: on ? 0.9 : 0, duration: 0.6 }}
        className="pt-3 font-mono text-[11px] text-muted"
      >
        Same packet. Two honest answers.
      </motion.p>
    </div>
  );
}

function SearchMiss() {
  const ref = useRef<HTMLDivElement>(null);
  const on = useInView(ref, { amount: 0.6 });
  return (
    <div ref={ref} className="w-full max-w-sm space-y-6 text-sm">
      <div className="border-t border-line pt-3">
        <p className="font-mono text-[11px] text-muted">A global nutrition app</p>
        <p className="mt-2 min-h-[1.5em]">
          <span className="text-muted">Search:</span> <Typewriter text="aloo bhujia" start={on} speed={70} />
        </p>
        <motion.p initial={false} animate={{ opacity: on ? 1 : 0 }} transition={{ delay: on ? 1.1 : 0 }} className="mt-1 text-muted">
          No results. Did you mean “potato chips”?
        </motion.p>
      </div>
      <div className="border-t border-accent pt-3">
        <p className="font-mono text-[11px] text-accent">TrueLabel</p>
        <p className="mt-2 min-h-[1.5em]">
          <span className="text-muted">Search:</span> <Typewriter text="aloo bhujia" start={on} speed={70} />
        </p>
        <ul className="mt-1 space-y-1">
          {["Aloo bhujia, 200 g · verified", "Aloo bhujia, 42 g · verified", "Aloo bhujia, 1 kg · in review"].map((r, i) => (
            <motion.li
              key={r}
              initial={false}
              animate={{ opacity: on ? 1 : 0, x: on ? 0 : -8 }}
              transition={{ delay: on ? 1.2 + i * 0.12 : 0, duration: 0.5, ease: EASE }}
              className="flex items-center gap-2"
            >
              <span className={`h-1 w-1 rounded-full ${r.endsWith("review") ? "bg-warn" : "bg-accent"}`} />
              {r}
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const ROWS: { n: string; title: string; body: string; visual: ReactNode }[] = [
  {
    n: "01",
    title: "Seven-point type is a design decision.",
    body: "Serving sizes that don't match the pack. “No added sugar” printed beside 26 g of it from concentrate. INS numbers nobody explains. The label technically tells you everything. It just isn't written to be understood in the two seconds you give it in the aisle.",
    visual: <LabelLens />,
  },
  {
    n: "02",
    title: "One score doesn't fit your body.",
    body: "A green “healthy” badge means nothing if you're managing blood sugar, blood pressure or dairy. Generic apps grade the packet for an average person who doesn't exist. Nobody grades it for you.",
    visual: <TwoVerdicts />,
  },
  {
    n: "03",
    title: "Indian products barely exist in the databases.",
    body: "Search a global nutrition app for the bhujia, the local dairy's lassi or the paneer tikka masala mix and you get a shrug, or a US product with different numbers. The data isn't wrong. It's missing.",
    visual: <SearchMiss />,
  },
];

function Panel({ row }: { row: (typeof ROWS)[number] }) {
  return (
    <div className="grid h-full w-full shrink-0 items-center gap-10 lg:w-screen lg:grid-cols-12 lg:gap-8 lg:px-10">
      <div className="lg:col-span-6 lg:col-start-2">
        <span className="font-mono text-xs text-muted tabular-nums">{row.n}</span>
        <h3 className="mt-6 max-w-xl text-4xl font-medium tracking-[-0.03em] text-balance sm:text-5xl lg:text-6xl">{row.title}</h3>
        <p className="mt-6 max-w-lg text-lg leading-relaxed text-pretty text-muted">{row.body}</p>
      </div>
      <Parallax speed={0.3} scale={0.04} className="flex items-center lg:col-span-4 lg:col-start-8 lg:justify-end">
        {row.visual}
      </Parallax>
    </div>
  );
}

export function Problem() {
  const desktop = useMedia("(min-width: 1024px)");
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0.12, 0.88], ["0vw", `-${(ROWS.length - 1) * 100}vw`]);
  const counter = useTransform(scrollYProgress, (v) => `0${Math.min(ROWS.length, Math.floor(v * ROWS.length) + 1)}`);

  if (!desktop) {
    return (
      <section id="problem" ref={ref} className="scroll-mt-16 py-24">
        <Container>
          <SectionHeading
            index="01"
            label="The problem"
            title="Labels are written to be skimmed past."
            body="Not with lies. With serving sizes that don't match the pack, claims that mean nothing, and numbers that never become a decision."
          />
          <ol className="mt-16 border-t border-line">
            {ROWS.map((row) => (
              <li key={row.n} className="border-b border-line py-14">
                <Reveal>
                  <Panel row={row} />
                </Reveal>
              </li>
            ))}
          </ol>
        </Container>
      </section>
    );
  }

  return (
    <section id="problem" ref={ref} className="relative h-[400vh] scroll-mt-0">
      <div className="sticky top-0 flex h-svh flex-col overflow-hidden">
        <Numeral n="01" className="right-[-4vw] bottom-[-10vh]" />
        <Container className="pt-24">
          <div className="flex items-baseline justify-between border-t border-line pt-5 font-mono text-xs text-muted">
            <p>
              <span className="tabular-nums">01</span>
              <span className="mx-2">/</span>The problem
            </p>
            <p className="tabular-nums">
              <motion.span className="text-fg">{counter}</motion.span> / 03
            </p>
          </div>
        </Container>
        <motion.div style={{ x }} className="flex h-full items-stretch">
          {ROWS.map((row) => (
            <Panel key={row.n} row={row} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
