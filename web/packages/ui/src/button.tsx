import type { AnchorHTMLAttributes } from "react";

export function Button({ className = "", ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      className={`inline-flex h-12 items-center gap-3 bg-fg px-6 text-sm font-medium text-bg transition-colors duration-300 hover:bg-accent hover:text-ink ${className}`}
      {...props}
    />
  );
}

export function TextLink({ className = "", children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      className={`group inline-flex h-12 items-center gap-2 text-sm font-medium underline-offset-[6px] transition-colors hover:text-accent ${className}`}
      {...props}
    >
      <span className="group-hover:underline">{children}</span>
      <Arrow />
    </a>
  );
}

export function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
      className={`transition-transform duration-300 ease-out-expo group-hover:translate-x-1 ${className}`}
    >
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
