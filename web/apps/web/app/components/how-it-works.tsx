"use client";

import { motion } from "motion/react";
import { Reveal } from "./reveal";

const STEPS = [
  {
    title: "Scan",
    description:
      "Point your camera at any product barcode. Instant lookup in our open database.",
  },
  {
    title: "Verify",
    description:
      "Community confirms the data is accurate. If new product, help verify and build the database together.",
  },
  {
    title: "Know",
    description:
      "Get personalized nutrition insights based on your health. See why this product matters (or doesn't) for YOU.",
  },
];

const circleVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { type: "spring" as const, stiffness: 260, damping: 20 } },
};

const lineVariants = {
  hidden: { scaleX: 0 },
  visible: { scaleX: 1, transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] as const } },
};

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-5xl px-6 py-24">
      <Reveal>
        <h2 className="text-center text-3xl font-bold tracking-tighter sm:text-4xl">
          How TrueLabel Works
        </h2>
        <p className="mt-3 text-center text-neutral-600 dark:text-neutral-400">
          Three simple steps to know what you're eating
        </p>
      </Reveal>

      <motion.div
        className="mt-16 flex items-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        transition={{ staggerChildren: 0.15 }}
      >
        {STEPS.map((step, i) => (
          <div key={step.title} className="flex flex-1 items-center last:flex-none">
            <motion.div
              variants={circleVariants}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-emerald-500 text-lg font-bold text-emerald-500"
            >
              {i + 1}
            </motion.div>
            {i < STEPS.length - 1 && (
              <motion.div
                variants={lineVariants}
                className="mx-2 h-px flex-1 origin-left bg-neutral-300 dark:bg-neutral-700"
              />
            )}
          </div>
        ))}
      </motion.div>

      <div className="mt-6 grid gap-8 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <Reveal key={step.title} delay={0.4 + i * 0.1}>
            <h3 className="text-lg font-semibold">{step.title}</h3>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              {step.description}
            </p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
