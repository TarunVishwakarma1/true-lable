"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { ACCENT_KEY } from "./theme-boot";

// Accent presets. Each carries its own "warn" colour so flags never clash with the accent.
export const ACCENTS = {
  emerald: { label: "Emerald", accent: "#10b981", warn: "#f59e0b" },
  saffron: { label: "Saffron", accent: "#f59e0b", warn: "#fb7185" },
  sky: { label: "Sky", accent: "#38bdf8", warn: "#f59e0b" },
  rose: { label: "Rose", accent: "#fb7185", warn: "#f59e0b" },
  lime: { label: "Lime", accent: "#a3e635", warn: "#f59e0b" },
} as const;

export type AccentName = keyof typeof ACCENTS;
const DEFAULT_ACCENT: AccentName = "emerald";
const KEY = ACCENT_KEY;

const listeners = new Set<() => void>();

function read(): AccentName {
  if (typeof document === "undefined") return DEFAULT_ACCENT;
  const a = document.documentElement.dataset.accent as AccentName | undefined;
  return a && a in ACCENTS ? a : DEFAULT_ACCENT;
}

export function setAccent(name: AccentName) {
  if (name === DEFAULT_ACCENT) delete document.documentElement.dataset.accent;
  else document.documentElement.dataset.accent = name;
  try {
    localStorage.setItem(KEY, name);
  } catch {}
  for (const l of listeners) l();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function useAccent() {
  const name = useSyncExternalStore(subscribe, read, () => DEFAULT_ACCENT);
  return { name, ...ACCENTS[name], set: setAccent };
}

export function AccentPicker({ className = "" }: { className?: string }) {
  const { name, set } = useAccent();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", close);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div className={`relative ${className}`} onPointerDown={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Accent colour: ${ACCENTS[name].label}`}
        className="flex h-10 w-10 items-center justify-center text-muted transition-colors hover:text-fg"
      >
        <span className="h-3.5 w-3.5 rounded-full ring-1 ring-fg/30 ring-offset-2 ring-offset-bg" style={{ background: ACCENTS[name].accent }} />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label="Accent colour"
          className="absolute top-full right-0 z-50 mt-2 flex gap-2 border border-line bg-bg p-2 shadow-2xl"
        >
          {(Object.keys(ACCENTS) as AccentName[]).map((k) => (
            <li key={k} role="option" aria-selected={k === name}>
              <button
                type="button"
                onClick={() => {
                  set(k);
                  setOpen(false);
                }}
                aria-label={ACCENTS[k].label}
                className={`flex h-7 w-7 items-center justify-center rounded-full transition-transform hover:scale-110 ${
                  k === name ? "ring-1 ring-fg ring-offset-2 ring-offset-bg" : ""
                }`}
              >
                <span className="h-4 w-4 rounded-full" style={{ background: ACCENTS[k].accent }} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
