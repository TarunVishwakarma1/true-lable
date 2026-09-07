import { Magnetic } from "./magnetic";

export function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-black/5 bg-white/70 backdrop-blur-md dark:border-white/10 dark:bg-neutral-950/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="#" className="text-lg font-bold tracking-tight">
          True<span className="text-emerald-500">Label</span>
        </a>
        <nav className="hidden gap-8 text-sm font-medium text-neutral-600 sm:flex dark:text-neutral-400">
          <a
            href="#why-it-matters"
            className="transition-colors hover:text-emerald-500"
          >
            Why It Matters
          </a>
          <a
            href="#how-it-works"
            className="transition-colors hover:text-emerald-500"
          >
            How It Works
          </a>
        </nav>
        <Magnetic className="inline-block">
          <a
            href="#scan"
            className="inline-block rounded-full bg-emerald-500 px-5 py-2 text-sm font-medium text-white"
          >
            Scan Now
          </a>
        </Magnetic>
      </div>
    </header>
  );
}
