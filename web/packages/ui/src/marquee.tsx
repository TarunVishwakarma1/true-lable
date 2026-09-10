export function Marquee({ items, label }: { items: string[]; label?: string }) {
  const loop = [...items, ...items];

  return (
    <div className="relative overflow-hidden border-y border-line py-4">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-[5] w-24 bg-gradient-to-r from-bg to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-[5] w-24 bg-gradient-to-l from-bg to-transparent" />
      <div className="flex w-max animate-marquee hover:[animation-play-state:paused]" aria-hidden>
        {loop.map((item, i) => (
          <span key={i} className="flex items-center font-mono text-xs tracking-[0.14em] whitespace-nowrap text-muted uppercase">
            {item}
            <span className="mx-8 text-accent">·</span>
          </span>
        ))}
      </div>
      {label && (
        <p className="sr-only">
          {label} {items.join(", ")}.
        </p>
      )}
    </div>
  );
}
