"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Copy, ExternalLink, Github, Loader2 } from "lucide-react";
import { STATUS_LABEL, PlatformBadge, SeverityBadge, StatusBadge } from "../../../components/badges";
import { Skeleton } from "../../../components/skeleton";
import { ApiError, api, type CrashReport, type ReportStatus, type Severity } from "../../../../lib/api";
import { useAuth } from "../../../../lib/auth-context";

const STATUSES: ReportStatus[] = ["submitted", "pending", "in_review", "in_progress", "done", "wont_fix"];
const SEVERITIES: Severity[] = ["low", "medium", "high", "critical"];

export default function CrashReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token, profile } = useAuth();
  const canEdit = profile?.role === "admin" || profile?.role === "member";
  const [report, setReport] = useState<CrashReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingField, setUpdatingField] = useState<"status" | "severity" | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [copiedTrace, setCopiedTrace] = useState(false);

  useEffect(() => {
    if (!token) return;
    api.crashReports
      .get(token, id)
      .then(setReport)
      .catch(() => setError("Couldn't load this crash report."))
      .finally(() => setLoading(false));
  }, [token, id]);

  async function updateField(patch: { status?: ReportStatus; severity?: Severity }, field: "status" | "severity") {
    if (!token || !canEdit) return;
    setUpdatingField(field);
    setError(null);
    try {
      setReport(await api.crashReports.update(token, id, patch));
    } catch {
      setError("Couldn't save that change.");
    } finally {
      setUpdatingField(null);
    }
  }

  async function publish() {
    if (!token) return;
    setPublishing(true);
    setPublishError(null);
    try {
      await api.crashReports.publishToGithub(token, id);
      setReport(await api.crashReports.get(token, id));
    } catch (err) {
      setPublishError(err instanceof ApiError ? err.message : "Couldn't publish to GitHub.");
    } finally {
      setPublishing(false);
    }
  }

  function copyTrace() {
    if (!report?.stack_trace) return;
    navigator.clipboard.writeText(report.stack_trace);
    setCopiedTrace(true);
    setTimeout(() => setCopiedTrace(false), 2000);
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Skeleton className="h-4 w-32" />
        <div className="mt-6 flex flex-col gap-8 lg:flex-row">
          <div className="min-w-0 flex-1 space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <aside className="w-full shrink-0 lg:w-72">
            <div className="rounded-xl border border-line bg-surface p-5 space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-3 border-b border-line pb-3 last:border-0 last:pb-0">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>
          </aside>
        </div>
      </main>
    );
  }

  if (error || !report) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-6 text-sm text-rose-500">
          {error ?? "Crash report not found."}
        </div>
        <div className="mt-4">
          <BackLink />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="flex items-center justify-between">
        <BackLink />
        <div className="flex items-center gap-2">
          {report.github_issue_url ? (
            <a
              href={report.github_issue_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 text-xs font-medium text-fg transition-all hover:border-fg/20"
            >
              <Github size={13} />
              <span>Issue #{report.github_issue_number}</span>
              <ExternalLink size={11} className="text-muted" />
            </a>
          ) : profile?.role === "admin" ? (
            <button
              onClick={publish}
              disabled={publishing}
              aria-busy={publishing ? "true" : undefined}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-fg px-4 text-xs font-medium text-bg transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
            >
              {publishing ? <Loader2 size={12} className="animate-spin text-bg" /> : <Github size={13} />}
              <span>{publishing ? "Publishing…" : "Publish to GitHub"}</span>
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-8 lg:flex-row">
        {/* Main Content Area */}
        <div className="min-w-0 flex-1 space-y-6">
          {/* Header Card */}
          <div className="rounded-xl border border-line bg-surface p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-fg">{report.title}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-mono text-[11px] text-muted">-o- {report.id.slice(0, 8)}</span>
                  <span className="text-muted/60">·</span>
                  <span className="text-muted">
                    Reported on {new Date(report.created_at).toLocaleDateString()}
                  </span>
                  {report.app_version && (
                    <>
                      <span className="text-muted/60">·</span>
                      <span className="rounded-md border border-line bg-fg/[0.03] px-2 py-0.5 text-[11px] text-fg">
                        v{report.app_version}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            {report.description && (
              <p className="mt-4 text-sm leading-relaxed text-muted">{report.description}</p>
            )}
          </div>

          {/* Stack Trace Box */}
          {report.stack_trace && (
            <div className="rounded-xl border border-line bg-surface p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">Stack Trace</h2>
                <button
                  onClick={copyTrace}
                  className="inline-flex items-center gap-1.5 rounded-md border border-line bg-fg/[0.03] px-2.5 py-1 text-[11px] font-medium text-fg transition-colors hover:border-fg/20"
                >
                  {copiedTrace ? (
                    <>
                      <Check size={11} className="text-emerald-500" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={11} className="text-muted" />
                      <span>Copy Trace</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="max-h-96 overflow-x-auto rounded-lg border border-line bg-bg p-4 font-mono text-xs leading-relaxed text-fg">
                {report.stack_trace}
              </pre>
            </div>
          )}

          {/* Metadata Box */}
          {Object.keys(report.metadata).length > 0 && (
            <div className="rounded-xl border border-line bg-surface p-6 space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">Payload Metadata</h2>
              <pre className="overflow-x-auto rounded-lg border border-line bg-bg p-4 font-mono text-xs leading-relaxed text-fg">
                {JSON.stringify(report.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Sidebar Specifications */}
        <aside className="w-full shrink-0 lg:w-80 space-y-4">
          <div className="rounded-xl border border-line bg-surface p-5">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted">Diagnostics State</h2>
            <div className="divide-y divide-line">
              <Property label="Status">
                {canEdit ? (
                  <div className="relative flex items-center">
                    <select
                      value={report.status}
                      disabled={updatingField !== null}
                      onChange={(e) => updateField({ status: e.target.value as ReportStatus }, "status")}
                      className="h-7 rounded-md border border-line bg-surface pr-6 pl-2 text-xs text-fg outline-none focus:border-accent disabled:opacity-50"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABEL[s]}
                        </option>
                      ))}
                    </select>
                    {updatingField === "status" && (
                      <Loader2 size={11} className="pointer-events-none absolute right-1.5 animate-spin text-muted" />
                    )}
                  </div>
                ) : (
                  <StatusBadge status={report.status} />
                )}
              </Property>

              <Property label="Severity">
                {canEdit ? (
                  <div className="relative flex items-center">
                    <select
                      value={report.severity}
                      disabled={updatingField !== null}
                      onChange={(e) => updateField({ severity: e.target.value as Severity }, "severity")}
                      className="h-7 rounded-md border border-line bg-surface pr-6 pl-2 text-xs capitalize text-fg outline-none focus:border-accent disabled:opacity-50"
                    >
                      {SEVERITIES.map((s) => (
                        <option key={s} value={s} className="capitalize">
                          {s}
                        </option>
                      ))}
                    </select>
                    {updatingField === "severity" && (
                      <Loader2 size={11} className="pointer-events-none absolute right-1.5 animate-spin text-muted" />
                    )}
                  </div>
                ) : (
                  <SeverityBadge severity={report.severity} />
                )}
              </Property>

              <Property label="Platform">
                <PlatformBadge platform={report.platform} />
              </Property>

              <Property label="Source">
                <span className="rounded-md border border-line bg-fg/[0.03] px-2 py-0.5 text-[11px] text-fg">
                  {report.source === "manual" ? "Manual filing" : "Client app"}
                </span>
              </Property>

              {report.os_version && (
                <Property label="OS Version">
                  <span className="font-mono text-xs text-fg">{report.os_version}</span>
                </Property>
              )}

              {report.device_model && (
                <Property label="Device Model">
                  <span className="text-xs text-fg">{report.device_model}</span>
                </Property>
              )}

              {report.device_id && (
                <Property label="Device ID">
                  <span className="font-mono text-[11px] text-muted truncate max-w-[120px]" title={report.device_id}>
                    {report.device_id}
                  </span>
                </Property>
              )}

              <Property label="Created">
                <span className="text-xs text-muted">{new Date(report.created_at).toLocaleDateString()}</span>
              </Property>

              {report.resolved_at && (
                <Property label="Resolved">
                  <span className="text-xs text-emerald-500 font-medium">{new Date(report.resolved_at).toLocaleDateString()}</span>
                </Property>
              )}
            </div>
          </div>

          {publishError && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-xs text-rose-500 leading-relaxed">
              {publishError}
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

function BackLink() {
  return (
    <Link
      href="/dashboard/crash-reports"
      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-muted transition-colors hover:border-fg/20 hover:text-fg"
    >
      <ArrowLeft size={12} />
      <span>Back to Crash Reports</span>
    </Link>
  );
}

function Property({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 text-xs">
      <span className="shrink-0 text-muted">{label}</span>
      <div className="min-w-0 text-right">{children}</div>
    </div>
  );
}
