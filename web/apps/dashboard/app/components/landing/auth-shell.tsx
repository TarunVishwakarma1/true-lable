"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useIsDark } from "@repo/ui/use-media";
import { EASE_OUT } from "./motion-primitives";

const TerrainScene = dynamic(() => import("./terrain-scene"), { ssr: false });

/**
 * Split shell for sign in and register. The scene panel is desktop only: on a
 * phone the form is the whole job, and a canvas above it would push the first
 * field below the fold to say nothing.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  aside,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
  aside: string;
}) {
  const dark = useIsDark();
  const reduce = useReducedMotion();

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Form side */}
      <div className="flex items-center justify-center px-5 py-12 sm:px-8">
        <motion.div
          className="w-full max-w-[400px]"
          initial={{ opacity: 0, transform: "translateY(14px)" }}
          animate={{ opacity: 1, transform: "translateY(0px)" }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
        >
          <Link href="/" className="pressable inline-flex items-center gap-2.5 rounded-[10px]">
            <Image
              src="/brand/logo-light.png"
              alt=""
              width={26}
              height={26}
              className="h-[26px] w-[26px] rounded-[7px] dark:hidden"
            />
            <Image
              src="/brand/logo-dark.png"
              alt=""
              width={26}
              height={26}
              className="hidden h-[26px] w-[26px] rounded-[7px] dark:block"
            />
            <span className="display text-[20px] text-fg">
              True<span className="text-fg3">Label</span>
            </span>
          </Link>

          <h1 className="display mt-8 text-[30px] text-fg sm:text-[34px]">{title}</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-fg2">{subtitle}</p>

          <div className="mt-7">{children}</div>

          <div className="mt-6 text-[13px] text-fg2">{footer}</div>
        </motion.div>
      </div>

      {/* Scene side */}
      <div className="relative hidden overflow-hidden border-l border-line bg-surface/50 lg:block">
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.15, ease: EASE_OUT }}
          aria-hidden
        >
          <TerrainScene dark={dark} still={Boolean(reduce)} />
        </motion.div>

        {/* The line sits over the field, so it gets its own ground. Without
            this the text fails contrast wherever a bright bar passes under it. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-bg via-bg/85 to-transparent"
        />

        <motion.p
          className="absolute right-10 bottom-10 left-10 max-w-[34ch] text-[15px] leading-relaxed text-fg2"
          initial={{ opacity: 0, transform: "translateY(10px)" }}
          animate={{ opacity: 1, transform: "translateY(0px)" }}
          transition={{ duration: 0.7, delay: 0.5, ease: EASE_OUT }}
        >
          {aside}
        </motion.p>
      </div>
    </div>
  );
}
