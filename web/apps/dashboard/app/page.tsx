"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Activity, ArrowRight, Bug, CircleUser, Package, Users } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, XAxis } from "recharts";
import { ThemeToggle } from "@repo/ui/theme-toggle";
import { useIsDark } from "@repo/ui/use-media";
import { useAuth } from "../lib/auth-context";
import { EASE_OUT, Enter, Reveal, RisingWords } from "./components/landing/motion-primitives";

// Three.js is a large bundle and the canvas has nothing to render on the
// server, so the scene arrives after the copy does.
const TerrainScene = dynamic(() => import("./components/landing/terrain-scene"), { ssr: false });

const STROKE = 1.75;

export default function Landing() {
  const { profile, loading } = useAuth();
  const signedIn = !loading && Boolean(profile);

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <Nav signedIn={signedIn} />
      <main id="main">
        <Hero signedIn={signedIn} />
        <ConsolePreview />
        <Capabilities />
        <Closing signedIn={signedIn} />
      </main>
      <Footer />
    </div>
  );
}

/* ---------------------------------------------------------------- nav ---- */

function Nav({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="pressable flex items-center gap-2.5 rounded-[10px] py-1">
          <Image
            src="/brand/logo-light.png"
            alt=""
            width={28}
            height={28}
            priority
            className="h-7 w-7 rounded-[8px] dark:hidden"
          />
          <Image
            src="/brand/logo-dark.png"
            alt=""
            width={28}
            height={28}
            priority
            className="hidden h-7 w-7 rounded-[8px] dark:block"
          />
          <span className="display text-[20px] text-fg">
            True<span className="text-fg3">Label</span>
          </span>
        </Link>

        <div className="flex items-center gap-1.5">
          <div className="scale-90">
            <ThemeToggle />
          </div>
          <Link
            href={signedIn ? "/dashboard" : "/login"}
            className="pressable inline-flex h-9 items-center rounded-[10px] bg-accent px-4 text-[13px] font-medium text-on-accent hover:opacity-90"
          >
            {signedIn ? "Open console" : "Sign in"}
          </Link>
        </div>
      </div>
    </header>
  );
}

/* --------------------------------------------------------------- hero ---- */

function Hero({ signedIn }: { signedIn: boolean }) {
  const dark = useIsDark();
  const reduce = useReducedMotion();
  const stage = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(true);

  // The canvas keeps drawing while it is on screen and stops when it is not.
  // An IntersectionObserver costs nothing; a scroll listener would run on
  // every frame.
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(Boolean(entry?.isIntersecting)), {
      rootMargin: "120px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={stage}
      className="relative isolate flex min-h-[100dvh] items-start overflow-hidden pt-14 pb-20 lg:items-center lg:pt-16"
    >
      {/* Full bleed, behind everything. The scene composes itself off-centre
          (see `align="bleed"`) so the field never sits under the copy. */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.4, delay: 0.25, ease: EASE_OUT }}
        aria-hidden
      >
        <TerrainScene dark={dark} still={Boolean(reduce) || !visible} align="bleed" />
      </motion.div>

      {/* Scrims. Body copy over a lit 3D field fails contrast wherever a bright
          bar passes behind it, so the text side gets its own ground: a lateral
          wash on wide screens, a top-down one where the copy stacks above the
          field instead of beside it. */}
      <div
        aria-hidden
        className="absolute inset-0 z-0 bg-gradient-to-b from-bg from-34% via-bg/75 via-56% to-transparent to-82% lg:hidden"
      />
      <div
        aria-hidden
        className="absolute inset-0 z-0 hidden bg-gradient-to-r from-bg from-14% via-bg/55 via-38% to-transparent to-66% lg:block"
      />
      {/* Settles the field into the section below instead of cutting it off. */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 z-0 h-32 bg-gradient-to-t from-bg to-transparent"
      />

      <div className="relative z-10 mx-auto w-full max-w-[1180px] px-4 sm:px-6 lg:px-8">
        <div className="max-w-[34rem]">
          <motion.p
            className="eyebrow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: EASE_OUT }}
          >
            Operations console
          </motion.p>

          <h1 className="display mt-4 text-[40px] text-fg sm:text-[56px] lg:text-[64px]">
            <RisingWords text="Where label data" delay={0.1} />
            <br />
            <RisingWords text="gets fixed." delay={0.22} className="text-fg3" />
          </h1>

          <Enter delay={0.5}>
            <p className="mt-5 max-w-[46ch] text-[15px] leading-relaxed text-fg2">
              Triage crash reports, correct the product data the scanner read wrong, and keep a
              record of who changed what.
            </p>
          </Enter>

          <Enter delay={0.62} className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={signedIn ? "/dashboard" : "/login"}
              className="pressable group inline-flex h-12 items-center gap-2 rounded-[12px] bg-accent pr-2 pl-5 text-[14px] font-medium text-on-accent hover:opacity-90"
            >
              {signedIn ? "Open console" : "Sign in"}
              <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-on-accent/12 transition-transform duration-300 ease-out group-hover:translate-x-0.5">
                <ArrowRight size={15} strokeWidth={STROKE} />
              </span>
            </Link>
            {!signedIn && (
              <Link
                href="/register"
                className="pressable inline-flex h-12 items-center rounded-[12px] border border-line-strong bg-bg/70 px-5 text-[14px] font-medium text-fg backdrop-blur-sm hover:bg-hover"
              >
                Create an account
              </Link>
            )}
          </Enter>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ preview ---- */

// Sample data. Shaped like a fortnight of intake so the chart has something
// honest to draw, and labelled as sample everywhere it appears.
const SAMPLE_TREND = [
  { day: "Mon", count: 4 },
  { day: "Tue", count: 7 },
  { day: "Wed", count: 3 },
  { day: "Thu", count: 9 },
  { day: "Fri", count: 12 },
  { day: "Sat", count: 5 },
  { day: "Sun", count: 2 },
  { day: "Mon", count: 8 },
  { day: "Tue", count: 14 },
  { day: "Wed", count: 6 },
  { day: "Thu", count: 11 },
  { day: "Fri", count: 15 },
];

const SAMPLE_STATUS = [
  { label: "Submitted", n: 14 },
  { label: "In review", n: 9 },
  { label: "In progress", n: 6 },
  { label: "Done", n: 31 },
];

function ConsolePreview() {
  return (
    <section className="mx-auto max-w-[1180px] px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
      <Reveal className="max-w-[34ch]">
        <h2 className="display text-[30px] text-fg sm:text-[38px]">The overview, as it ships.</h2>
        <p className="mt-3 text-[14px] leading-relaxed text-fg2">
          The same components the console renders, running here on sample data.
        </p>
      </Reveal>

      {/* Outer tray, inner plate. The radii are concentric: 20 outside minus
          the 8px of padding leaves 12 inside. */}
      <Reveal delay={0.1} className="mt-8">
        <div className="rounded-[20px] border border-line bg-surface p-2">
          <div className="rounded-[12px] border border-line bg-bg p-4 sm:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <p className="display text-[22px] text-fg sm:text-[26px]">
                <span className="tnum">29</span> reports need attention
              </p>
              <p className="eyebrow">Sample data</p>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-5">
              <div className="rounded-[12px] border border-line bg-surface p-4 lg:col-span-3">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-[13px] font-medium text-fg">Intake volume</h3>
                  <p className="eyebrow">Last 12 days</p>
                </div>
                <div className="mt-4 h-[150px] sm:h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={SAMPLE_TREND} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="landingTrend" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.28} />
                          <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="day"
                        tick={{ fontSize: 10, fill: "var(--fg3)" }}
                        axisLine={false}
                        tickLine={false}
                        interval={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="var(--accent)"
                        strokeWidth={1.75}
                        fill="url(#landingTrend)"
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-[12px] border border-line bg-surface p-4 lg:col-span-2">
                <h3 className="text-[13px] font-medium text-fg">By status</h3>
                <div className="mt-4 flex flex-col gap-3.5">
                  {SAMPLE_STATUS.map((s) => (
                    <div key={s.label} className="flex items-center gap-3 text-[12px]">
                      <span className="w-[74px] shrink-0 text-fg3">{s.label}</span>
                      <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-hover">
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{ width: `${(s.n / 31) * 100}%` }}
                        />
                      </div>
                      <span className="tnum w-6 shrink-0 text-right text-fg">{s.n}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------- capabilities ---- */

const SURFACES = [
  {
    icon: Bug,
    title: "Crash reports",
    body: "Triage what broke, from the scanner to the API, with severity and platform on every row.",
  },
  {
    icon: Package,
    title: "Products",
    body: "Correct a barcode, a brand, or a nutrition panel the OCR read wrong.",
  },
  {
    icon: CircleUser,
    title: "Users",
    body: "Follow a device through what it scanned and what it contributed back.",
  },
  {
    icon: Users,
    title: "Team",
    body: "Grant and revoke console access as people join and leave.",
  },
  {
    icon: Activity,
    title: "Activity",
    body: "An append-only record of who changed what, and when.",
  },
];

// Cell count matches the surface count exactly: five items, five cells, no
// blank tile padding out the grid.
const CELL_SPANS = [
  "md:col-span-3 md:row-span-2",
  "md:col-span-3",
  "md:col-span-3",
  "md:col-span-3",
  "md:col-span-3",
];

// Two of the five carry a tint so the grid is not five identical text cards.
const CELL_SKIN = [
  "bg-surface",
  "bg-accent-soft",
  "bg-bg",
  "bg-surface",
  "bg-bg",
];

function Capabilities() {
  return (
    <section className="border-t border-line bg-surface/40">
      <div className="mx-auto max-w-[1180px] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <Reveal className="max-w-[40ch]">
          <p className="eyebrow">What it covers</p>
          <h2 className="display mt-4 text-[30px] text-fg sm:text-[38px]">
            Five surfaces, one record of truth.
          </h2>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-3 md:grid-cols-6">
          {SURFACES.map((s, i) => {
            const Icon = s.icon;
            const lead = i === 0;
            return (
              <Reveal
                key={s.title}
                delay={0.04 * i}
                className={`${CELL_SPANS[i]} flex`}
              >
                <div
                  className={`group flex w-full flex-col rounded-[16px] border border-line p-5 transition-colors duration-300 hover:border-line-strong sm:p-6 ${CELL_SKIN[i]}`}
                >
                  <Icon size={18} strokeWidth={STROKE} className="text-fg3" />
                  <h3 className={`mt-4 font-medium text-fg ${lead ? "text-[19px]" : "text-[15px]"}`}>
                    {s.title}
                  </h3>
                  <p className="mt-2 max-w-[42ch] text-[13px] leading-relaxed text-fg2">{s.body}</p>

                  {/* The lead cell carries a real fragment of the console
                      rather than more prose. */}
                  {lead && (
                    <div className="mt-auto pt-8">
                      <div className="flex flex-col gap-2.5">
                        {SAMPLE_STATUS.map((st) => (
                          <div key={st.label} className="flex items-center gap-3 text-[11px]">
                            <span className="w-[74px] shrink-0 text-fg3">{st.label}</span>
                            <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-hover">
                              <div
                                className="h-full rounded-full bg-accent/70"
                                style={{ width: `${(st.n / 31) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="eyebrow mt-4">Sample data</p>
                    </div>
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ closing ---- */

function Closing({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="border-t border-line">
      <div className="mx-auto max-w-[1180px] px-4 py-20 text-center sm:px-6 lg:px-8 lg:py-28">
        <Reveal>
          <h2 className="display mx-auto max-w-[18ch] text-[32px] text-fg sm:text-[44px]">
            The queue is waiting.
          </h2>
          <p className="mx-auto mt-4 max-w-[48ch] text-[14px] leading-relaxed text-fg2">
            Console access is per person, and every change is attributed.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={signedIn ? "/dashboard" : "/login"}
              className="pressable group inline-flex h-12 items-center gap-2 rounded-[12px] bg-accent pr-2 pl-5 text-[14px] font-medium text-on-accent hover:opacity-90"
            >
              {signedIn ? "Open console" : "Sign in"}
              <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-on-accent/12 transition-transform duration-300 ease-out group-hover:translate-x-0.5">
                <ArrowRight size={15} strokeWidth={STROKE} />
              </span>
            </Link>
            {!signedIn && (
              <Link
                href="/register"
                className="pressable inline-flex h-12 items-center rounded-[12px] border border-line-strong px-5 text-[14px] font-medium text-fg hover:bg-hover"
              >
                Create an account
              </Link>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-4 px-4 py-8 sm:px-6 lg:px-8">
        <span className="display text-[17px] text-fg">
          True<span className="text-fg3">Label</span>
        </span>
        <p className="text-[12px] text-fg3">Internal operations console.</p>
      </div>
    </footer>
  );
}
