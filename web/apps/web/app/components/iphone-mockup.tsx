"use client";

import Image from "next/image";
import { motion } from "motion/react";

interface IPhoneMockupProps {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
  glow?: boolean;
}

export function IPhoneMockup({ src, alt, priority = false, className = "", glow = true }: IPhoneMockupProps) {
  return (
    <div className={`relative mx-auto flex items-center justify-center ${className}`}>
      {glow && (
        <div
          aria-hidden
          className="absolute -inset-6 -z-10 rounded-[64px] bg-gradient-to-tr from-accent/20 via-transparent to-accent/10 opacity-70 blur-2xl transition-opacity duration-700 group-hover:opacity-100"
        />
      )}

      {/* Outer Phone Shell (Titanium & Subtle Edge Highlights) */}
      <div className="relative w-full max-w-[320px] sm:max-w-[340px] rounded-[54px] p-[10px] bg-gradient-to-b from-[#383430] via-[#1a1816] to-[#11100e] ring-1 ring-white/15 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_30px_rgba(0,0,0,0.5)]">
        {/* Hardware Buttons */}
        {/* Action Button */}
        <div className="absolute -left-[12px] top-[95px] h-[26px] w-[3px] rounded-l-sm bg-[#3a3632] ring-1 ring-white/10" />
        {/* Volume Up */}
        <div className="absolute -left-[12px] top-[138px] h-[48px] w-[3px] rounded-l-sm bg-[#3a3632] ring-1 ring-white/10" />
        {/* Volume Down */}
        <div className="absolute -left-[12px] top-[198px] h-[48px] w-[3px] rounded-l-sm bg-[#3a3632] ring-1 ring-white/10" />
        {/* Power / Lock Button */}
        <div className="absolute -right-[12px] top-[150px] h-[72px] w-[3px] rounded-r-sm bg-[#3a3632] ring-1 ring-white/10" />

        {/* Screen Bezel */}
        <div className="relative aspect-[504/1024] w-full overflow-hidden rounded-[44px] bg-black ring-1 ring-black/80">
          {/* Dynamic Island */}
          <div className="absolute top-3.5 left-1/2 z-30 flex h-[28px] w-[100px] -translate-x-1/2 items-center justify-between rounded-full bg-black px-3 shadow-md ring-1 ring-white/5">
            <div className="h-2.5 w-2.5 rounded-full bg-[#0d1322] ring-1 ring-white/10" />
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-accent/80 animate-pulse" />
              <div className="h-2 w-2 rounded-full bg-[#181a20]" />
            </div>
          </div>

          {/* Status Bar UI */}
          <div className="absolute top-2 inset-x-0 z-20 flex items-center justify-between px-7 text-[12px] font-semibold text-white/90">
            <span>9:41</span>
            <div className="flex items-center gap-1.5">
              {/* Cellular signal */}
              <svg width="14" height="10" viewBox="0 0 17 11" fill="currentColor">
                <rect x="0" y="7" width="2.5" height="4" rx="0.8" />
                <rect x="4" y="5" width="2.5" height="6" rx="0.8" />
                <rect x="8" y="2.5" width="2.5" height="8.5" rx="0.8" />
                <rect x="12" y="0" width="2.5" height="11" rx="0.8" />
              </svg>
              {/* Battery */}
              <div className="flex items-center">
                <div className="h-3 w-5 rounded-[3px] border border-white/80 p-[1.5px]">
                  <div className="h-full w-full rounded-[1px] bg-white" />
                </div>
                <div className="h-1.5 w-[1.5px] rounded-r-[1px] bg-white/80" />
              </div>
            </div>
          </div>

          {/* Screenshot Image */}
          <div className="relative h-full w-full">
            <Image
              src={src}
              alt={alt}
              fill
              priority={priority}
              sizes="(max-width: 768px) 100vw, 400px"
              className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.02]"
            />
          </div>

          {/* Glass Specular Glare Reflection */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/[0.03] via-white/[0.08] to-transparent opacity-80"
          />

          {/* Home Indicator */}
          <div className="absolute bottom-2 left-1/2 z-30 h-1 w-28 -translate-x-1/2 rounded-full bg-white/40 backdrop-blur-sm" />
        </div>
      </div>
    </div>
  );
}
