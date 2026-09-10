"use client";

import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";
import { Container } from "@repo/ui/container";

const TEXT =
  "Every packet on the shelf already tells you everything. In seven-point type. In units you can't picture. For an average person who isn't you. TrueLabel reads it back the way a friend who knows food would.";

const WORDS = TEXT.split(" ");

function Word({ word, i, progress }: { word: string; i: number; progress: MotionValue<number> }) {
  const start = i / WORDS.length;
  const end = start + 1.5 / WORDS.length;
  const opacity = useTransform(progress, [start, end], [0.16, 1]);
  return (
    <motion.span style={{ opacity }} className="mr-[0.26em] inline-block">
      {word}
    </motion.span>
  );
}

export function Statement() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 80%", "end 45%"] });

  return (
    <section className="py-28 md:py-44">
      <Container>
        <p ref={ref} className="max-w-6xl text-3xl font-medium tracking-[-0.03em] text-balance sm:text-5xl lg:text-[4.25rem] lg:leading-[1.05]">
          {WORDS.map((w, i) => (
            <Word key={i} word={w} i={i} progress={scrollYProgress} />
          ))}
        </p>
      </Container>
    </section>
  );
}
