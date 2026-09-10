"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useRef, useState } from "react";
import { Container } from "@repo/ui/container";
import { ThemeToggle } from "@repo/ui/theme-toggle";
import { NAV, REPO_URL } from "../lib/site";

export function Nav() {
  const { scrollY } = useScroll();
  const last = useRef(0);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (v) => {
    setScrolled(v > 12);
    if (v > last.current + 6 && v > 120) setHidden(true);
    else if (v < last.current - 6) setHidden(false);
    last.current = v;
  });

  function setMenu(next: boolean) {
    setOpen(next);
    if (next) window.appLenis?.stop();
    else window.appLenis?.start();
  }

  return (
    <motion.header
      animate={{ y: hidden && !open ? "-100%" : "0%" }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-x-0 top-0 z-50"
    >
      <div
        className={`transition-[background-color,border-color] duration-500 ${
          scrolled && !open ? "border-b border-line bg-bg/80 backdrop-blur-md" : "border-b border-transparent"
        }`}
      >
        <Container className="flex h-16 items-center justify-between">
          <a href="#top" className="text-[17px] font-medium tracking-tight" aria-label="TrueLabel home">
            True<span className="text-accent">Label</span>
          </a>

          <nav aria-label="Primary" className="hidden items-center gap-8 text-sm md:flex">
            {NAV.map((item) => (
              <a key={item.href} href={item.href} className="text-muted transition-colors hover:text-fg">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-5">
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-1.5 text-sm font-medium transition-colors hover:text-accent md:inline-flex"
            >
              GitHub
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M7 17 17 7M9 7h8v8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMenu(!open)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              className="relative -mr-2 flex h-10 w-10 items-center justify-center md:hidden"
            >
              <span className="relative block h-3 w-5">
                <span className={`absolute inset-x-0 top-0 h-px bg-current transition-transform duration-300 ${open ? "translate-y-[5.5px] rotate-45" : ""}`} />
                <span className={`absolute inset-x-0 bottom-0 h-px bg-current transition-transform duration-300 ${open ? "-translate-y-[5.5px] -rotate-45" : ""}`} />
              </span>
            </button>
          </div>
        </Container>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            id="mobile-menu"
            aria-label="Mobile"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 -z-10 flex flex-col justify-end bg-bg px-6 pb-10 md:hidden"
          >
            <ul className="border-t border-line">
              {NAV.map((item, i) => (
                <motion.li
                  key={item.href}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 + i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="border-b border-line"
                >
                  <a
                    href={item.href}
                    onClick={() => setMenu(false)}
                    className="flex items-baseline justify-between py-5 text-3xl font-medium tracking-tight"
                  >
                    {item.label}
                    <span className="font-mono text-xs text-muted">0{i + 1}</span>
                  </a>
                </motion.li>
              ))}
            </ul>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              onClick={() => setMenu(false)}
              className="mt-8 flex h-14 items-center justify-center bg-fg text-bg"
            >
              Star on GitHub
            </a>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
