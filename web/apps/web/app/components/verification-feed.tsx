"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";

const EVENTS = [
  { city: "Pune", text: "Aloo bhujia 200 g: 3 people confirmed the label", kind: "verified" },
  { city: "Kochi", text: "Masala oats: sodium corrected 890 → 640 mg, re-verified", kind: "fixed" },
  { city: "Indore", text: "New: peanut chikki, jaggery. Awaiting review", kind: "new" },
  { city: "Guwahati", text: "Mango fruit drink 200 ml: 5 people confirmed the label", kind: "verified" },
  { city: "Jaipur", text: "Cream biscuits: serving size disputed, back in review", kind: "fixed" },
  { city: "Nagpur", text: "New: ready idli batter 1 kg. Awaiting review", kind: "new" },
];

const DOT = { verified: "bg-accent", fixed: "bg-amber-500", new: "bg-sky-500" } as const;

export function VerificationFeed() {
  const [head, setHead] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setHead((h) => (h + 1) % EVENTS.length), 2800);
    return () => clearInterval(t);
  }, []);

  const visible = Array.from({ length: 4 }, (_, i) => EVENTS[(head + i) % EVENTS.length]!);

  return (
    <div>
      <div className="flex items-baseline justify-between border-b border-line pb-4">
        <p className="text-sm">What review looks like</p>
        <span className="font-mono text-[11px] text-muted">sample</span>
      </div>
      <ul aria-live="off">
        {visible.map((e) => (
          <motion.li
            key={e.text}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-start gap-3 border-b border-line py-3"
          >
            <span className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${DOT[e.kind as keyof typeof DOT]}`} />
            <div className="min-w-0">
              <p className="text-sm leading-snug">{e.text}</p>
              <p className="mt-0.5 font-mono text-[11px] text-muted">{e.city}</p>
            </div>
          </motion.li>
        ))}
      </ul>
      <p className="mt-4 font-mono text-[11px] leading-relaxed text-muted">
        Sample events showing how the review loop works. Not a live feed yet; when the app ships, this becomes
        the real one.
      </p>
    </div>
  );
}
