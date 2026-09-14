"use client";

import { useEffect, useState, type MouseEvent } from "react";

let inFlight = false;

export function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle(e: MouseEvent<HTMLButtonElement>) {
    const next = !dark;
    const apply = () => {
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("theme", next ? "dark" : "light");
      setDark(next);
    };

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!document.startViewTransition || reduced || inFlight) return apply();

    const x = e.clientX;
    const y = e.clientY;
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    inFlight = true;
    document.documentElement.classList.add("vt-active");
    const transition = document.startViewTransition(apply);
    transition.ready
      .then(() => {
        const wipe = document.documentElement.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
          { duration: 650, easing: "cubic-bezier(0.16, 1, 0.3, 1)", pseudoElement: "::view-transition-new(root)" },
        );
        return wipe.finished;
      })
      .catch(() => {})
      .finally(() => {
        inFlight = false;
        document.documentElement.classList.remove("vt-active");
      });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex h-10 w-10 items-center justify-center text-muted transition-colors hover:text-fg"
    >
      <span className="relative block h-4 w-4">
        <svg
          className={`absolute inset-0 transition-[transform,opacity] duration-500 ease-out-expo ${dark ? "rotate-0 opacity-100" : "-rotate-90 opacity-0"}`}
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" strokeLinecap="round" />
        </svg>
        <svg
          className={`absolute inset-0 transition-[transform,opacity] duration-500 ease-out-expo ${dark ? "rotate-90 opacity-0" : "rotate-0 opacity-100"}`}
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </button>
  );
}
