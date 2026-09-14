"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { STATUS_LABEL, PlatformBadge, SeverityBadge, StatusBadge } from "../../components/badges";
import { SkeletonRows } from "../../components/skeleton";
import {
  api,
  type CrashReport,
  type Platform,
  type ReportStatus,
  type Severity,
} from "../../../lib/api";
import { useAuth } from "../../../lib/auth-context";

const PAGE_SIZE = 20;
const STATUSES: ReportStatus[] = ["submitted", "pending", "in_review", "in_progress", "done", "wont_fix"];
const PLATFORMS: Platform[] = ["ios", "backend", "web"];
const SEVERITIES: Severity[] = ["low", "medium", "high", "critical"];

export default function CrashReportsPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<CrashReport[]>([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<Partial<Record<ReportStatus, number>>>({});
  const [offset, setOffset] = useState(0);
  const [status, setStatus] = useState<ReportStatus | "">("");
  const [platform, setPlatform] = useState<Platform | "">("");
  const [severity, setSeverity] = useState<Severity | "">("");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setOffset(0);
      setDebouncedQ(q);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (!token) return;
    Promise.all(STATUSES.map((s) => api.crashReports.list(token, { status: s, limit: 1 })))
      .then((pages) => {
        const next: Partial<Record<ReportStatus, number>> = {};
        STATUSES.forEach((s, i) => (next[s] = pages[i]?.total ?? 0));
        setCounts(next);
      })
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError(null);
    api.crashReports
      .list(token, {
        status: status || undefined,
        platform: platform || undefined,
        severity: severity || undefined,
        q: debouncedQ || undefined,
        limit: PAGE_SIZE,
        offset,
      })
      .then((page) => {
        setItems(page.items);
        setTotal(page.total);
      })
      .catch(() => setError("Couldn't load crash reports."))
      .finally(() => setLoading(false));
  }, [token, status, platform, severity, debouncedQ, offset]);

  function resetAnd<T>(setter: (v: T) => void) {
    return (v: T) => {
      setOffset(0);
      setter(v);
    };
  }

  function toggleStatusFilter(s: ReportStatus) {
    resetAnd(setStatus)(status === s ? "" : s);
  }

  return (
    <main className="mx-auto max-w-5xl px-8 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-fg">Crash Reports</h1>
          <p className="mt-1 text-sm text-muted">{total} total</p>
        </div>
        <Link
          href="/dashboard/crash-reports/new"
          className="flex h-9 items-center gap-1.5 rounded-lg bg-fg px-3.5 text-sm font-medium text-bg transition-opacity hover:opacity-90"
        >
          <Plus size={15} />
          New report
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => toggleStatusFilter(s)}
            className={`rounded-xl border p-3.5 text-left transition-colors ${
              status === s ? "border-fg/25 bg-fg/[0.04]" : "border-line hover:border-fg/15"
            }`}
          >
            <p className="text-2xl font-medium tabular-nums text-fg">{counts[s] ?? "–"}</p>
            <p className="mt-1 truncate text-xs text-muted">{STATUS_LABEL[s]}</p>
          </button>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search size={13} className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search reports…"
            className="h-8 w-52 rounded-md border border-line bg-surface pr-2.5 pl-7 text-xs text-fg outline-none placeholder:text-muted/60 focus:border-accent"
          />
        </div>
        <Select label="Platform" value={platform} onChange={resetAnd(setPlatform)} options={PLATFORMS} />
        <Select label="Severity" value={severity} onChange={resetAnd(setSeverity)} options={SEVERITIES} />
        {status && (
          <button
            onClick={() => resetAnd(setStatus)("")}
            className="h-8 rounded-md px-2.5 text-xs text-muted transition-colors hover:text-fg"
          >
            Clear status: {STATUS_LABEL[status]} ×
          </button>
        )}
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-line">
        {loading ? (
          <SkeletonRows rows={8} cols={5} />
        ) : error ? (
          <p className="p-6 text-sm text-red-400">{error}</p>
        ) : items.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted">No crash reports match these filters.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th className="px-4 py-2.5 font-medium">Title</th>
                <th className="px-4 py-2.5 font-medium">Platform</th>
                <th className="px-4 py-2.5 font-medium">Severity</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Reported</th>
              </tr>
            </thead>
            <tbody>
              {items.map((report) => (
                <tr
                  key={report.id}
                  onClick={() => router.push(`/dashboard/crash-reports/${report.id}`)}
                  className="cursor-pointer border-b border-line last:border-0 hover:bg-fg/[0.03]"
                >
                  <td className="max-w-xs truncate px-4 py-3 text-fg">{report.title}</td>
                  <td className="px-4 py-3">
                    <PlatformBadge platform={report.platform} />
                  </td>
                  <td className="px-4 py-3">
                    <SeverityBadge severity={report.severity} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={report.status} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted">
                    {new Date(report.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <button
          onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
          disabled={offset === 0}
          className="text-muted transition-colors hover:text-fg disabled:opacity-30"
        >
          ← Previous
        </button>
        <span className="text-xs text-muted">
          {total === 0 ? 0 : offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total}
        </span>
        <button
          onClick={() => setOffset(offset + PAGE_SIZE)}
          disabled={offset + PAGE_SIZE >= total}
          className="text-muted transition-colors hover:text-fg disabled:opacity-30"
        >
          Next →
        </button>
      </div>
    </main>
  );
}

function Select<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T | "";
  onChange: (v: T | "") => void;
  options: readonly T[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T | "")}
      aria-label={label}
      className="h-8 rounded-md border border-line bg-surface px-2.5 text-xs text-fg outline-none focus:border-accent"
    >
      <option value="">All {label.toLowerCase()}</option>
      {options.map((opt) => (
        <option key={opt} value={opt} className="capitalize">
          {opt.replace("_", " ")}
        </option>
      ))}
    </select>
  );
}
