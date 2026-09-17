import type { ReportStatus, Severity } from "../../lib/api";

export const STATUS_LABEL: Record<ReportStatus, string> = {
  submitted: "Submitted",
  pending: "Pending",
  in_review: "In review",
  in_progress: "In progress",
  done: "Ready",
  wont_fix: "Won't fix",
};

// Status is a position on a path, so the colours walk that path: nothing yet,
// waiting, being looked at, moving, done — with "won't fix" stepped off it
// entirely rather than given a colour of its own.
const STATUS_DOT: Record<ReportStatus, string> = {
  submitted: "dot-idle",
  pending: "dot-warn",
  in_review: "dot-info",
  in_progress: "dot-fair",
  done: "dot-good",
  wont_fix: "dot-idle",
};

// Severity already is the verdict ramp — low sits off it, then amber, orange,
// red. No second palette needed.
const SEVERITY_TONE: Record<Severity, string> = {
  low: "border-line text-fg3",
  medium: "border-warn/30 text-warn",
  high: "border-poor/35 text-poor",
  critical: "border-danger/40 text-danger",
};

export function StatusBadge({ status, duration }: { status: ReportStatus; duration?: string }) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-[13px] text-fg">
      <span className={`dot ${STATUS_DOT[status]}`} aria-hidden />
      <span className={status === "wont_fix" ? "text-fg3" : undefined}>{STATUS_LABEL[status]}</span>
      {duration && <span className="font-mono text-[11px] text-fg3 tnum">{duration}</span>}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span
      className={`inline-flex items-center rounded-[5px] border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] ${SEVERITY_TONE[severity]}`}
    >
      {severity}
    </span>
  );
}

// Platform and environment are facts, not judgements, so they stay neutral.
// Colouring them was the reason six unrelated hues were competing on one row.
function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-[5px] border border-line bg-hover px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-fg2">
      {children}
    </span>
  );
}

export function PlatformBadge({ platform }: { platform: string }) {
  return <Tag>{platform}</Tag>;
}

export function EnvironmentBadge({ env = "Production" }: { env?: string }) {
  return <Tag>{env}</Tag>;
}

export function VerifiedBadge({ verified }: { verified: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-fg">
      <span className={`dot ${verified ? "dot-good" : "dot-idle"}`} aria-hidden />
      <span className={verified ? undefined : "text-fg3"}>{verified ? "Verified" : "Unverified"}</span>
    </span>
  );
}
