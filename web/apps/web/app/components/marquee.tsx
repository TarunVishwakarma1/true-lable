const ITEMS = [
  "Open-Source",
  "Community-Verified",
  "India-First",
  "Free Forever",
  "Offline-Ready",
];

export function Marquee() {
  const loop = [...ITEMS, ...ITEMS];

  return (
    <div className="overflow-hidden border-y border-neutral-200 py-6 dark:border-neutral-800">
      <div className="flex w-max animate-[marquee_30s_linear_infinite] gap-12 hover:[animation-play-state:paused]">
        {loop.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-12 text-2xl font-semibold tracking-tight text-neutral-300 dark:text-neutral-700"
          >
            {item}
            <span className="text-emerald-500">•</span>
          </span>
        ))}
      </div>
    </div>
  );
}
