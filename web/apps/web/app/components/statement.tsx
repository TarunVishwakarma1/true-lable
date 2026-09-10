"use client";

import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";
import { Container } from "@repo/ui/container";

const TEXT =
  "The back of every packet already tells you everything. In seven-point type. In grams you can't picture. Graded for an average person who isn't you. TrueLabel reads it the way a friend who knows food would: out loud, in teaspoons, and only ever with your rules.";

const WORDS = TEXT.split(" ");

function Word({ word, i, progress }: { word: string; i: number; progress: MotionValue<number> }) {
  const start = i / WORDS.length;
  const end = start + 1.5 / WORDS.length;
  const opacity = useTransform(progress, [start, end], [0.14, 1]);
  return (
    <motion.span style={{ opacity }} className="mr-[0.26em] inline-block">
      {word}
    </motion.span>
  );
}

// Slides up over the hero as a tilted sheet, then flattens and fills its words in.
export function Statement() {
  const ref = useRef<HTMLElement>(null);
  const text = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress: enter } = useScroll({ target: ref, offset: ["start end", "start 20%"] });
  const { scrollYProgress } = useScroll({ target: text, offset: ["start 80%", "end 45%"] });
  const rotateX = useTransform(enter, [0, 1], [16, 0]);
  const y = useTransform(enter, [0, 1], [140, 0]);
  const radius = useTransform(enter, [0, 1], ["2.5rem", "0rem"]);

  return (
    <section ref={ref} className="relative z-10 -mt-[1px]" style={{ perspective: 1200 }}>
      <motion.div style={{ rotateX, y, borderTopLeftRadius: radius, borderTopRightRadius: radius, transformOrigin: "top center" }} className="bg-bg py-28 shadow-[0_-40px_120px_-40px_rgba(0,0,0,0.6)] md:py-44">
        <Container>
          <p ref={text} className="max-w-6xl text-3xl font-medium tracking-[-0.03em] text-balance sm:text-5xl lg:text-[4.25rem] lg:leading-[1.05]">
            {WORDS.map((w, i) => (
              <Word key={i} word={w} i={i} progress={scrollYProgress} />
            ))}
          </p>
        </Container>
      </motion.div>
    </section>
  );
}
