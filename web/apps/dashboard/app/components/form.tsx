import { Loader2 } from "lucide-react";
import type { InputHTMLAttributes, ButtonHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const CONTROL =
  "w-full rounded-[10px] border border-line bg-surface px-3.5 text-[14px] text-fg outline-none transition-colors duration-200 placeholder:text-fg3 hover:border-line-strong focus:border-accent";

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
      <span className="mb-1.5 flex items-baseline justify-between">
        <span className="text-[12px] font-medium text-fg2">{label}</span>
        {optional && <span className="eyebrow">optional</span>}
      </span>
      {children}
    </label>
  );
}

export function TextField(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`h-11 ${CONTROL} ${props.className ?? ""}`} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`py-2.5 leading-relaxed ${CONTROL} ${props.className ?? ""}`} />;
}

export function SelectField(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`h-11 capitalize ${CONTROL} ${props.className ?? ""}`} />;
}

export function ButtonSpinner({
  size = 15,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return <Loader2 size={size} className={`animate-spin shrink-0 ${className}`} aria-hidden />;
}

export function SubmitButton({
  children,
  loading,
  loadingText,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  loadingText?: string;
}) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      aria-busy={loading ? "true" : undefined}
      className={`pressable flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-accent text-[14px] font-medium text-on-accent hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${props.className ?? ""}`}
    >
      {loading ? (
        <>
          <ButtonSpinner size={15} />
          <span>{loadingText || children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-[10px] border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-[13px] leading-relaxed text-danger"
    >
      {message}
    </p>
  );
}
