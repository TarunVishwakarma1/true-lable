"use client";

import { useEffect, useRef } from "react";
import { Reveal } from "./reveal";
import { Magnetic } from "./magnetic";
import { HeroVisual } from "./hero-visual";
import { TextScramble } from "./text-scramble";

export function Hero() {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onScroll() {
      const el = contentRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const progress = Math.min(Math.max(-rect.top / rect.height, 0), 1);
      el.style.opacity = String(1 - progress * 0.85);
      el.style.transform = `translateY(${progress * 80}px)`;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.appLenis?.on("scroll", onScroll);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.appLenis?.off("scroll", onScroll);
    };
  }, []);

  return (
    <section className="relative flex min-h-screen items-center overflow-hidden px-6 pt-24 pb-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20 bg-[linear-gradient(to_right,rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.05)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)]"
      />
      <div
        className="pointer-events-none absolute -top-32 -left-32 -z-10 h-[32rem] w-[32rem] rounded-full bg-emerald-500/25 blur-[100px]"
        style={{ animation: "drift 14s ease-in-out infinite" }}
      />
      <div
        className="pointer-events-none absolute -right-32 -bottom-32 -z-10 h-[32rem] w-[32rem] rounded-full bg-teal-400/20 blur-[100px]"
        style={{ animation: "drift 18s ease-in-out infinite 2s" }}
      />

      <div
        ref={contentRef}
        style={{ transition: "opacity 100ms linear" }}
        className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-2"
      >
        <div className="text-center lg:text-left">
          <Reveal>
            <span className="inline-block rounded-full border border-neutral-300 px-3 py-1 text-xs font-medium tracking-wide text-neutral-500 uppercase dark:border-neutral-700 dark:text-neutral-400">
              Open-Source &middot; Community-Verified
            </span>
          </Reveal>

          <Reveal delay={0.1}>
            <h1 className="mt-6 text-6xl font-bold tracking-tighter sm:text-7xl lg:text-8xl">
              <TextScramble text="Scan. Verify." delay={0.3} />{" "}
              <TextScramble
                text="Know."
                delay={0.5}
                className="text-emerald-500 dark:text-emerald-400"
              />
            </h1>
          </Reveal>

          <Reveal delay={0.25}>
            <p className="mx-auto mt-6 max-w-xl text-lg text-neutral-600 sm:text-xl lg:mx-0 dark:text-neutral-400">
              Open-source nutrition data for every product you buy.
              Community-verified, India-first, completely free.
            </p>
          </Reveal>

          <Reveal delay={0.4}>
            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
              <Magnetic className="inline-block">
                <a
                  href="#scan"
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-emerald-500 px-8 py-3 font-medium text-white shadow-lg shadow-emerald-500/25 transition-shadow duration-200 ease-out hover:shadow-emerald-500/40"
                >
                  Scan Your First Product
                </a>
              </Magnetic>
              <a
                href="#how-it-works"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-neutral-300 px-8 py-3 font-medium transition-colors duration-150 ease-out hover:border-neutral-400 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:border-neutral-500 dark:hover:bg-neutral-900"
              >
                See How It Works
              </a>
            </div>
          </Reveal>
        </div>

        <HeroVisual />
      </div>

      <a
        href="#why-it-matters"
        aria-label="Scroll to next section"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-neutral-400 dark:text-neutral-600"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12l7 7 7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
    </section>
  );
}
