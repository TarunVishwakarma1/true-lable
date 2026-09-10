"use client";

import { useSyncExternalStore } from "react";

type Cue = "scan" | "tick" | "verify" | "open" | "beat";

// Kenney CC0 samples served by the app from /sounds; the oscillator fallback covers
// the moment before they've loaded (or an app that hasn't copied them).
const FILES: Record<Cue, string> = {
  scan: "/sounds/scan.ogg",
  tick: "/sounds/tick.ogg",
  verify: "/sounds/verify.ogg",
  open: "/sounds/open.ogg",
  beat: "/sounds/beat.ogg",
};
const GAIN: Record<Cue, number> = { scan: 0.35, tick: 0.12, verify: 0.35, open: 0.25, beat: 0.2 };

let enabled = false;
let ctx: AudioContext | null = null;
const buffers = new Map<Cue, AudioBuffer>();
const listeners = new Set<() => void>();
const KEY = "truelabel:sound";
let lastTick = 0;

function emit() {
  for (const l of listeners) l();
}

function context() {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

async function load(ac: AudioContext) {
  await Promise.all(
    (Object.keys(FILES) as Cue[]).map(async (cue) => {
      if (buffers.has(cue)) return;
      try {
        const res = await fetch(FILES[cue]);
        if (!res.ok) return;
        buffers.set(cue, await ac.decodeAudioData(await res.arrayBuffer()));
      } catch {}
    }),
  );
}

function tone(ac: AudioContext, freq: number, at: number, dur: number, gain: number, type: OscillatorType = "sine") {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, at);
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(gain, at + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(ac.destination);
  o.start(at);
  o.stop(at + dur + 0.02);
}

function synth(ac: AudioContext, cue: Cue) {
  const t = ac.currentTime;
  switch (cue) {
    case "scan":
      tone(ac, 880, t, 0.09, 0.06);
      tone(ac, 1318, t + 0.09, 0.16, 0.07);
      break;
    case "tick":
      tone(ac, 2400, t, 0.02, 0.02, "square");
      break;
    case "verify":
      tone(ac, 523, t, 0.25, 0.05);
      tone(ac, 659, t + 0.04, 0.25, 0.05);
      tone(ac, 784, t + 0.08, 0.3, 0.05);
      break;
    case "open":
      tone(ac, 330, t, 0.12, 0.04, "triangle");
      break;
    case "beat":
      tone(ac, 440, t, 0.14, 0.03, "triangle");
      break;
  }
}

export function play(cue: Cue) {
  if (!enabled || typeof window === "undefined") return;
  const ac = context();
  if (cue === "tick") {
    // Typewriters call this often; cap it.
    const now = performance.now();
    if (now - lastTick < 45) return;
    lastTick = now;
  }
  const buf = buffers.get(cue);
  if (!buf) return synth(ac, cue);
  const src = ac.createBufferSource();
  const g = ac.createGain();
  src.buffer = buf;
  g.gain.value = GAIN[cue];
  src.connect(g).connect(ac.destination);
  src.start();
}

export function setSound(next: boolean) {
  enabled = next;
  try {
    localStorage.setItem(KEY, next ? "1" : "0");
  } catch {}
  if (next) {
    const ac = context();
    void load(ac).then(() => play("open"));
  }
  emit();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function useSound() {
  const on = useSyncExternalStore(
    subscribe,
    () => enabled,
    () => false,
  );
  return { enabled: on, toggle: () => setSound(!enabled), play };
}

export function SoundToggle({ className = "" }: { className?: string }) {
  const { enabled: on, toggle } = useSound();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? "Turn sound off" : "Turn sound on"}
      className={`group flex h-10 items-center gap-2 text-muted transition-colors hover:text-fg ${className}`}
    >
      <span className="flex h-4 items-end gap-[2px]" aria-hidden>
        {[3, 6, 9, 5].map((h, i) => (
          <span
            key={i}
            className={`w-[2px] origin-bottom bg-current transition-transform duration-500 ${on ? "" : "scale-y-[0.25]"}`}
            style={{ height: h * 1.5, animation: on ? `sound-bar 900ms ease-in-out ${i * 120}ms infinite alternate` : "none" }}
          />
        ))}
      </span>
      <span className="font-mono text-[11px] tracking-[0.14em] uppercase">{on ? "Sound on" : "Sound off"}</span>
    </button>
  );
}
