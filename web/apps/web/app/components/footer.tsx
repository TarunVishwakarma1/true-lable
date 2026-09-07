export function Footer() {
  return (
    <footer className="border-t border-neutral-200 px-6 py-10 dark:border-neutral-800">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-neutral-500 sm:flex-row dark:text-neutral-500">
        <span className="font-bold tracking-tight text-neutral-900 dark:text-white">
          True<span className="text-emerald-500">Label</span>
        </span>
        <nav className="flex gap-6">
          <a href="#why-it-matters" className="hover:text-emerald-500">
            Why It Matters
          </a>
          <a href="#how-it-works" className="hover:text-emerald-500">
            How It Works
          </a>
        </nav>
        <span>© {new Date().getFullYear()} TrueLabel · Open-source & community-verified</span>
      </div>
    </footer>
  );
}
