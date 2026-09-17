import { ArrowUpCircle } from "lucide-react";
import type { ReportStatus, Severity } from "../../lib/api";

export const STATUS_LABEL: Record<ReportStatus, string> = {
  submitted: "Submitted",
  pending: "Pending",
  in_review: "In Review",
  in_progress: "In Progress",
  done: "Ready",
  wont_fix: "Won't Fix",
};

const STATUS_DOT_CLASS: Record<ReportStatus, string> = {
  submitted: "bg-zinc-400 shadow-[0_0_6px_rgba(161,161,170,0.5)]",
  pending: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]",
  in_review: "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]",
  in_progress: "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]",
  done: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]",
  wont_fix: "bg-zinc-500",
};

const SEVERITY_STYLE: Record<Severity, string> = {
  low: "bg-fg/[0.04] text-muted border-line",
  medium: "bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/20",
  high: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  critical: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25",
};

export function StatusBadge({ status, duration }: { status: ReportStatus; duration?: string }) {
  return (
    <div className="inline-flex items-center gap-2 text-xs font-medium text-fg">
      <span className={`h-2 w-2 rounded-full ${STATUS_DOT_CLASS[status]}`} aria-hidden />
      <span>{STATUS_LABEL[status]}</span>
      {duration && <span className="text-muted font-normal">{duration}</span>}
    </div>
  );
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize ${SEVERITY_STYLE[severity]}`}
    >
      {severity}
    </span>
  );
}

export function PlatformBadge({ platform }: { platform: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-medium text-sky-600 dark:text-sky-400">
      <ArrowUpCircle size={11} className="shrink-0" />
      <span className="capitalize">{platform}</span>
    </span>
  );
}

export function EnvironmentBadge({ env = "Production" }: { env?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400">
      <ArrowUpCircle size={11} className="shrink-0" />
      <span>{env}</span>
    </span>
  );
}

export function VerifiedBadge({ verified }: { verified: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
        verified
          ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "border-line bg-fg/[0.03] text-muted"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          verified ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]" : "bg-zinc-500"
        }`}
        aria-hidden
      />
      {verified ? "Verified" : "Unverified"}
    </span>
  );
}
