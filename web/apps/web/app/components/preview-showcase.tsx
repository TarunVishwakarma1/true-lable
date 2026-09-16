"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Container } from "@repo/ui/container";
import { IPhoneMockup } from "./iphone-mockup";
import { IPhone3D } from "./iphone-3d";
import { REPO_URL } from "../lib/site";

const SCREENS = [
  {
    id: "home",
    title: "Home Hub",
    badge: "Instant Lookup",
    subtitle: "What's really in it? Point at a barcode.",
    image: "/screenshots/IMG_3325.webp",
    description:
      "A quiet, editorial start screen with zero advertisements. View your total scans, weekly progress, community verification tally, and tap the floating scanner anywhere.",
    highlights: [
      "Floating one-tap scanner with haptic feedback",
      "Recent product cards with calculated Nutri-Score badges",
      "Clean search bar for barcode, brand, or item name",
    ],
  },
  {
    id: "verify",
    title: "Verify Consensus Queue",
    badge: "Consensus Engine",
    subtitle: "Does this look right? 3 confirmations seal it.",
    image: "/screenshots/IMG_3327.webp",
    description:
      "When someone scans a new product, it enters the community verification queue. Swipe right if the numbers match the pack in your hands. 3 independent verifications lock the record.",
    highlights: [
      "120Hz gesture physics (Matches / Skip buttons)",
      "Instant per-100g sugar, fat, and sodium breakdown",
      "Live 3-confirmation community consensus indicator",
    ],
  },
  {
    id: "product",
    title: "Product Score & Breakdown",
    badge: "Nutri-Score E",
    subtitle: "Scientific scoring & NOVA 4 ultra-processing gauge",
    image: "/screenshots/IMG_3329.webp",
    description:
      "Inspect detailed health evaluations like Kurkure (30/100, Nutri-Score E, NOVA 4). Visual gauge bars indicate macro thresholds for energy, fat, carbs, and protein.",
    highlights: [
      "Dynamic TrueLabel Nutri-Score & health rating",
      "NOVA classification: Ultra-processed warnings",
      "Per-100g macro breakdown with visual indicators",
    ],
  },
  {
    id: "nutrition",
    title: "Nutrition Facts & Ingredients",
    badge: "Ingredient OCR",
    subtitle: "Full nutritional factsheet & raw ingredients list",
    image: "/screenshots/IMG_3330.webp",
    description:
      "Access the standardized Nutrition Facts panel with calories, saturated/trans fat, sodium, fiber, and complete ingredient list (palmolein, seasonings, additives).",
    highlights: [
      "Standardized Nutrition Facts panel",
      "Full ingredient transparency with percentage disclosures",
      "Highlighted additive & preservative tags",
    ],
  },
  {
    id: "history",
    title: "Scan History & Compare",
    badge: "Timeline",
    subtitle: "Search, filter, and side-by-side product compare",
    image: "/screenshots/IMG_3326.webp",
    description:
      "Browse through your past scans organized chronologically. Quickly search your history or tap Compare to place multiple products side-by-side.",
    highlights: [
      "Chronological scan timeline with verified badges",
      "Multi-product side-by-side comparison tool",
      "Offline cache stored securely on your device",
    ],
  },
  {
    id: "profile",
    title: "What You Scan",
    badge: "Private Profile",
    subtitle: "A to E score distribution & community contributions",
    image: "/screenshots/IMG_3328.webp",
    description:
      "Understand your overall dietary tendencies with a visual A–E grade distribution curve. See how many labels you've looked up, confirmed, and added.",
    highlights: [
      "Visual Nutri-Score distribution breakdown",
      "Community contribution counters (Looked up, Confirmed, Added)",
      "100% on-device storage with zero tracking servers",
    ],
  },
  {
    id: "trends",
    title: "Your Trends & Intake Benchmarks",
    badge: "Health Analytics",
    subtitle: "7d, 30d, and 90d WHO & ICMR safety guidelines",
    image: "/screenshots/IMG_3332.webp",
    description:
      "Track your average sugar and sodium intake across 7, 30, and 90 days, benchmarked directly against World Health Organization (WHO) and ICMR safety limits.",
    highlights: [
      "7d, 30d, and 90d intake averaging",
      "WHO free-sugar (50g/day) & ICMR sodium (2000mg/day) indicators",
      "TrueLabel Plus trend analytics and ranked swaps",
    ],
  },
  {
    id: "dietary",
    title: "Custom Dietary Watch & Privacy",
    badge: "Custom Filters",
    subtitle: "Vegan, Jain, Gluten-free, Palm oil & allergy alerts",
    image: "/screenshots/IMG_3333.webp",
    description:
      "Set personalized dietary watch filters. Every scan instantly flags allergens and restricted ingredients. All preferences and history live on your phone only.",
    highlights: [
      "Custom filters: Vegetarian, Vegan, Jain, Gluten-Free, Low Sodium",
      "Allergen warnings: Peanut allergy, Lactose sensitive, Palm oil",
      "One-tap clear history with zero external telemetry",
    ],
  },
];

const EASE = [0.16, 1, 0.3, 1] as const;

export function PreviewShowcase() {
  const [selected, setSelected] = useState(0);
  const activeScreen = SCREENS[selected] ?? SCREENS[0]!;

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20">
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/4 left-1/2 -z-10 h-[500px] w-[600px] -translate-x-1/2 rounded-full bg-accent/10 blur-[120px]"
        />

        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-1.5 text-xs font-medium text-muted backdrop-blur-sm"
            >
              <span className="h-2 w-2 rounded-full bg-good animate-pulse" />
              <span>iOS & Android App in Active Development</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
              className="mt-6 text-4xl font-medium tracking-tight text-fg sm:text-6xl lg:text-7xl font-serif"
            >
              What&apos;s cooking for TrueLabel.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: EASE }}
              className="mt-6 text-base leading-relaxed text-muted sm:text-lg"
            >
              A sneak peek into the native mobile experience. Crafted with warm charcoal materials, editorial typography, zero tracking servers, and scientifically accurate Nutri-Score evaluation.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: EASE }}
              className="mt-8 flex flex-wrap items-center justify-center gap-4"
            >
              <a
                href="#interactive"
                className="inline-flex h-12 items-center gap-2 bg-fg px-6 text-sm font-medium text-bg transition-colors duration-300 hover:bg-accent hover:text-ink"
              >
                Explore 8 Screens
              </a>
              <a
                href={REPO_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 items-center gap-2 border border-line bg-surface px-6 text-sm font-medium text-fg transition-colors hover:border-fg/30 hover:bg-elevated"
              >
                GitHub Repository
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M7 17 17 7M9 7h8v8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* Interactive Showcase Section */}
      <section id="interactive" className="relative border-y border-line bg-surface/40 py-20 lg:py-24">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-12">
            {/* Left: 3D iPhone Air Mockup with dynamic screen & rotate physics */}
            <div className="flex flex-col items-center lg:col-span-6 lg:items-end">
              <div className="relative w-full max-w-[360px]">
                <IPhone3D
                  imageSrc={activeScreen.image}
                  alt={activeScreen.title}
                  className="h-[520px] sm:h-[620px] w-full"
                />
              </div>

              {/* Mobile Screen Switcher (Directly below 3D model on mobile for instant feedback) */}
              <div className="mt-4 flex w-full max-w-[360px] flex-col items-center gap-3 lg:hidden">
                {/* Horizontal Scrollable Tabs */}
                <div className="flex w-full items-center justify-start gap-1.5 overflow-x-auto pb-1.5 scrollbar-none snap-x">
                  {SCREENS.map((s, idx) => {
                    const isSelected = selected === idx;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelected(idx)}
                        className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 snap-center ${
                          isSelected
                            ? "bg-accent text-ink shadow-md"
                            : "border border-line bg-surface/90 text-muted backdrop-blur-sm hover:border-fg/20 hover:text-fg"
                        }`}
                      >
                        <span className="font-mono text-[10px] font-bold">0{idx + 1}</span>
                        <span>{s.title.split(" ")[0]}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Quick Prev / Next Controls */}
                <div className="flex w-full items-center justify-between border-t border-line pt-2.5">
                  <button
                    type="button"
                    onClick={() => setSelected((prev) => (prev > 0 ? prev - 1 : SCREENS.length - 1))}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-fg transition-colors hover:bg-elevated active:scale-95"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="m15 18-6-6 6-6" />
                    </svg>
                    Prev
                  </button>

                  <span className="font-mono text-xs text-muted">
                    Screen <span className="font-semibold text-accent">{String(selected + 1).padStart(2, "0")}</span> / 08
                  </span>

                  <button
                    type="button"
                    onClick={() => setSelected((prev) => (prev < SCREENS.length - 1 ? prev + 1 : 0))}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-fg transition-colors hover:bg-elevated active:scale-95"
                  >
                    Next
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Screen Selector & Details */}
            <div className="lg:col-span-6">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold tracking-wider text-accent uppercase">
                  Screen {String(selected + 1).padStart(2, "0")} / 08
                </span>
                <span className="text-line">·</span>
                <span className="rounded-full bg-accent/10 px-2.5 py-0.5 font-mono text-[11px] font-medium text-accent">
                  {activeScreen.badge}
                </span>
              </div>

              <h2 className="mt-3 text-3xl font-medium tracking-tight sm:text-4xl">
                {activeScreen.title}
              </h2>
              <p className="mt-2 text-base font-medium text-fg2">
                {activeScreen.subtitle}
              </p>
              <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
                {activeScreen.description}
              </p>

              {/* Highlights List */}
              <ul className="mt-6 space-y-2.5 border-t border-line pt-6">
                {activeScreen.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-fg2">
                    <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent">
                      ✓
                    </span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>

              {/* Interactive Screen Navigation Tabs (Desktop grid view) */}
              <div className="mt-8 hidden border-t border-line pt-6 lg:block">
                <p className="font-mono text-xs text-muted uppercase tracking-wider">
                  Select screen to preview:
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {SCREENS.map((s, idx) => {
                    const isSelected = selected === idx;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelected(idx)}
                        className={`rounded-lg px-3 py-2 text-left text-xs font-medium transition-all duration-200 ${
                          isSelected
                            ? "bg-accent text-ink shadow-md"
                            : "border border-line bg-surface text-muted hover:border-fg/20 hover:text-fg"
                        }`}
                      >
                        <span className="block font-mono text-[10px] opacity-75">0{idx + 1}</span>
                        <span className="truncate">{s.title.split(" ")[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Full Gallery Grid */}
      <section className="py-24">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <span className="font-mono text-xs tracking-wider text-muted uppercase">
              Full App Tour
            </span>
            <h2 className="mt-3 text-3xl font-medium tracking-tight sm:text-5xl font-serif">
              Every screen, side by side.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
              Explore all 8 interfaces designed to bring transparency to grocery packaging.
            </p>
          </div>

          <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {SCREENS.map((screen, idx) => (
              <div
                key={screen.id}
                className="group relative flex flex-col rounded-3xl border border-line bg-surface/50 p-5 transition-all duration-500 hover:border-line-active hover:bg-elevated/40"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-mono text-xs text-muted">0{idx + 1}</span>
                  <span className="rounded-full border border-line bg-bg px-2 py-0.5 font-mono text-[10px] text-accent uppercase">
                    {screen.badge}
                  </span>
                </div>

                <div className="my-auto h-[440px] w-full py-2">
                  <IPhone3D
                    imageSrc={screen.image}
                    alt={screen.title}
                    interactive={false}
                    showHint={false}
                    className="h-full w-full"
                  />
                </div>

                <div className="mt-4 border-t border-line pt-3">
                  <h3 className="text-base font-medium text-fg">{screen.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted line-clamp-2">
                    {screen.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Design Principles / Technology Callouts */}
      <section className="border-t border-line bg-surface/30 py-24">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-medium tracking-tight sm:text-4xl font-serif">
              Built on uncompromising principles.
            </h2>
            <p className="mt-4 text-sm text-muted sm:text-base">
              The iOS app adheres to the same open-source ethos as the backend and web platforms.
            </p>
          </div>

          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-line bg-surface p-6">
              <div className="font-mono text-2xl font-semibold text-accent">01</div>
              <h3 className="mt-3 text-base font-medium text-fg">Zero Tracking</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                What you scan stays on your device. We do not sell user profiles or monetize your grocery habits.
              </p>
            </div>

            <div className="rounded-2xl border border-line bg-surface p-6">
              <div className="font-mono text-2xl font-semibold text-accent">02</div>
              <h3 className="mt-3 text-base font-medium text-fg">TrueLabel Nutri-Score</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                Scientific computation based on exact per-100g sugar, fat, and sodium data — never unearned 100/100 scores.
              </p>
            </div>

            <div className="rounded-2xl border border-line bg-surface p-6">
              <div className="font-mono text-2xl font-semibold text-accent">03</div>
              <h3 className="mt-3 text-base font-medium text-fg">3-Way Consensus</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                Community crowd-sourcing with 3 physical confirmations to verify barcode OCR accuracy before locking.
              </p>
            </div>

            <div className="rounded-2xl border border-line bg-surface p-6">
              <div className="font-mono text-2xl font-semibold text-accent">04</div>
              <h3 className="mt-3 text-base font-medium text-fg">Native SwiftUI Polish</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                Engineered specifically for iOS with 120Hz gesture physics, continuous squircles, and Haptic feedback.
              </p>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
