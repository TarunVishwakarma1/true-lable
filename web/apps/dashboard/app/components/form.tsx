import type { InputHTMLAttributes, ButtonHTMLAttributes } from "react";

export function Field({
  label,
  optional,
  children,
}: {
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between text-xs font-medium text-muted">
        <span>{label}</span>
        {optional && <span className="text-[10px] text-muted/70">optional</span>}
      </span>
      {children}
    </label>
  );
}

export function TextField(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-11 w-full rounded-lg border border-line bg-surface px-3.5 text-sm text-fg outline-none transition-colors placeholder:text-muted/60 focus:border-accent ${props.className ?? ""}`}
    />
  );
}

export function SubmitButton({
  children,
  loading,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`flex h-11 w-full items-center justify-center rounded-lg bg-fg text-sm font-medium text-bg transition-opacity hover:opacity-90 disabled:opacity-50 ${props.className ?? ""}`}
    >
      {loading ? "…" : children}
    </button>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="rounded-lg border border-red-500/25 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-400">
      {message}
    </p>
  );
}
