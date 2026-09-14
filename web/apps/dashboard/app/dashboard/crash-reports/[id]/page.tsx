"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, Github } from "lucide-react";
import { STATUS_LABEL, PlatformBadge, SeverityBadge } from "../../../components/badges";
import { ApiError, api, type CrashReport, type ReportStatus, type Severity } from "../../../../lib/api";
import { useAuth } from "../../../../lib/auth-context";

const STATUSES: ReportStatus[] = ["submitted", "pending", "in_review", "in_progress", "done", "wont_fix"];
const SEVERITIES: Severity[] = ["low", "medium", "high", "critical"];

export default function CrashReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token, profile } = useAuth();
  const [report, setReport] = useState<CrashReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api.crashReports
      .get(token, id)
      .then(setReport)
      .catch(() => setError("Couldn't load this crash report."))
      .finally(() => setLoading(false));
  }, [token, id]);

  async function updateField(patch: { status?: ReportStatus; severity?: Severity }) {
    if (!token) return;
    try {
      setReport(await api.crashReports.update(token, id, patch));
    } catch {
      setError("Couldn't save that change.");
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

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-8 py-10">
        <p className="text-sm text-muted">Loading…</p>
      </main>
    );
  }

  if (error || !report) {
    return (
      <main className="mx-auto max-w-4xl px-8 py-10">
        <p className="text-sm text-red-400">{error ?? "Not found."}</p>
        <BackLink />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-8 py-10">
      <BackLink />

      <div className="mt-4 flex flex-col gap-8 sm:flex-row">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-medium text-fg">{report.title}</h1>
          {report.description && (
            <p className="mt-3 text-sm leading-relaxed text-muted">{report.description}</p>
          )}

          {report.stack_trace && (
            <div className="mt-6">
              <p className="mb-2 text-xs font-medium text-muted">Stack trace</p>
              <pre className="overflow-x-auto rounded-lg border border-line bg-surface p-4 font-mono text-xs text-fg">
                {report.stack_trace}
              </pre>
            </div>
          )}

          {Object.keys(report.metadata).length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-xs font-medium text-muted">Metadata</p>
              <pre className="overflow-x-auto rounded-lg border border-line bg-surface p-4 font-mono text-xs text-fg">
                {JSON.stringify(report.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <aside className="w-full shrink-0 sm:w-56">
          <div className="rounded-xl border border-line p-4">
            <Property label="Status">
              <select
                value={report.status}
                onChange={(e) => updateField({ status: e.target.value as ReportStatus })}
                className="h-8 w-full rounded-md border border-line bg-surface px-2 text-xs text-fg outline-none focus:border-accent"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </Property>

            <Property label="Severity">
              <select
                value={report.severity}
                onChange={(e) => updateField({ severity: e.target.value as Severity })}
                className="h-8 w-full rounded-md border border-line bg-surface px-2 text-xs text-fg capitalize outline-none focus:border-accent"
              >
                {SEVERITIES.map((s) => (
                  <option key={s} value={s} className="capitalize">
                    {s}
                  </option>
                ))}
              </select>
            </Property>

            <Property label="Platform">
              <PlatformBadge platform={report.platform} />
            </Property>

            {report.app_version && <Property label="App version">{report.app_version}</Property>}
            {report.os_version && <Property label="OS version">{report.os_version}</Property>}
            {report.device_model && <Property label="Device">{report.device_model}</Property>}
            {report.device_id && (
              <Property label="Device ID">
                <span className="font-mono text-xs">{report.device_id}</span>
              </Property>
            )}

            <Property label="Reported">{new Date(report.created_at).toLocaleDateString()}</Property>
            {report.resolved_at && (
              <Property label="Resolved">{new Date(report.resolved_at).toLocaleDateString()}</Property>
            )}
          </div>

          <div className="mt-3">
            {report.github_issue_url ? (
              <a
                href={report.github_issue_url}
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-line text-sm text-fg transition-colors hover:border-fg/20"
              >
                <Github size={14} />
                Issue #{report.github_issue_number}
                <ExternalLink size={12} className="text-muted" />
              </a>
            ) : profile?.role === "admin" ? (
              <>
                <button
                  onClick={publish}
                  disabled={publishing}
                  className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-fg text-sm font-medium text-bg transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  <Github size={14} />
                  {publishing ? "Publishing…" : "Publish to GitHub"}
                </button>
                {publishError && <p className="mt-2 text-xs text-red-400">{publishError}</p>}
              </>
            ) : (
              <p className="text-xs text-muted">Only admins can publish to GitHub.</p>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}

function BackLink() {
  return (
    <Link
      href="/dashboard/crash-reports"
      className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg"
    >
      <ArrowLeft size={14} />
      Crash reports
    </Link>
  );
}

function Property({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line py-2.5 text-sm last:border-0">
      <span className="shrink-0 text-xs text-muted">{label}</span>
      <span className="min-w-0 truncate text-right text-fg">{children}</span>
    </div>
  );
}
