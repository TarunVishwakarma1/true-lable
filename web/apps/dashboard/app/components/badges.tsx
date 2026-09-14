import type { ReportStatus, Severity } from "../../lib/api";

export const STATUS_LABEL: Record<ReportStatus, string> = {
  submitted: "Submitted",
  pending: "Pending",
  in_review: "In Review",
  in_progress: "In Progress",
  done: "Done",
  wont_fix: "Won't Fix",
};

const STATUS_DOT: Record<ReportStatus, string> = {
  submitted: "bg-zinc-400",
  pending: "bg-amber-400",
  in_review: "bg-violet-400",
  in_progress: "bg-blue-400",
  done: "bg-emerald-400",
  wont_fix: "bg-zinc-500",
};

const SEVERITY_STYLE: Record<Severity, string> = {
  low: "bg-zinc-500/10 text-zinc-400 ring-zinc-500/20",
  medium: "bg-blue-500/10 text-blue-400 ring-blue-500/20",
  high: "bg-orange-500/10 text-orange-400 ring-orange-500/20",
  critical: "bg-red-500/10 text-red-400 ring-red-500/20",
};

export function StatusBadge({ status }: { status: ReportStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-fg">
      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status]}`} aria-hidden />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${SEVERITY_STYLE[severity]}`}
    >
      {severity}
    </span>
  );
}

export function PlatformBadge({ platform }: { platform: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-fg/5 px-2 py-0.5 font-mono text-[11px] text-muted uppercase">
      {platform}
    </span>
  );
}

export function VerifiedBadge({ verified }: { verified: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${verified ? "text-fg" : "text-muted"}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${verified ? "bg-emerald-400" : "bg-zinc-500"}`} aria-hidden />
      {verified ? "Verified" : "Unverified"}
    </span>
  );
}
