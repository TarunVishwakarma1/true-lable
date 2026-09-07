export function ScanCard({ visible }: { visible: boolean }) {
  return (
    <div
      className="pointer-events-none absolute -bottom-6 left-1/2 z-20 w-64 -translate-x-1/2 rounded-2xl border border-neutral-200 bg-white/90 p-4 shadow-2xl shadow-black/10 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/90 dark:shadow-black/40"
      style={{
        opacity: visible ? 1 : 0,
        transform: `translateX(-50%) translateY(${visible ? 0 : 12}px) scale(${visible ? 1 : 0.96})`,
        transition: "opacity 350ms cubic-bezier(0.4, 0, 0.2, 1), transform 350ms cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[10px] font-medium tracking-wide text-neutral-400 uppercase dark:text-neutral-500">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          Sample scan
        </span>
        <span className="font-mono text-[10px] text-neutral-400 dark:text-neutral-600">
          #A091
        </span>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="text-emerald-500"
          >
            <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">Verified product</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Score 8.2 / 10
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
          High Protein
        </span>
        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
          Contains Sugar
        </span>
      </div>
    </div>
  );
}
