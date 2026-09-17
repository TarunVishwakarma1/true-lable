"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bug, ChevronLeft, ChevronRight, Loader2, Plus, Search, X } from "lucide-react";
import {
  PlatformBadge,
  STATUS_LABEL,
  SeverityBadge,
  StatusBadge,
} from "../../components/badges";
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

  const isSearching = q !== debouncedQ;

  useEffect(() => {
    const t = setTimeout(() => {
      setOffset(0);
      setDebouncedQ(q);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (!token) return;
    Promise.all(STATUSES.map((s) => api.crashReports.list(token, { status: s, limit: 1 }))),
      api.crashReports.list(token, { limit: 1 })
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
    <main className="mx-auto max-w-6xl px-8 py-8">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">Crash Reports</h1>
          <p className="mt-1 text-xs text-muted">
            {total} total reports across clients and backend services
          </p>
        </div>
        <Link
          href="/dashboard/crash-reports/new"
          className="inline-flex h-8 items-center gap-1.5 rounded-full bg-fg px-3.5 text-xs font-medium text-bg transition-all hover:opacity-90 shadow-xs"
        >
          <Plus size={13} />
          <span>New report</span>
        </Link>
      </div>

      {/* Status KPI Metric Cards */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {STATUSES.map((s) => {
          const isSelected = status === s;
          const count = counts[s] ?? 0;
          return (
            <button
              key={s}
              onClick={() => toggleStatusFilter(s)}
              className={`rounded-xl border p-3.5 text-left transition-all ${
                isSelected
                  ? "border-fg/40 bg-fg/[0.08] shadow-xs"
                  : "border-line bg-surface hover:border-fg/20 hover:bg-fg/[0.02]"
              }`}
            >
              <p className="font-mono text-xl font-semibold text-fg">{count}</p>
              <p className="mt-1 truncate text-[11px] font-medium text-muted">{STATUS_LABEL[s]}</p>
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative">
          <Search size={12} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search reports…"
            className="h-8 w-56 rounded-md border border-line bg-surface pr-8 pl-8 text-xs text-fg placeholder:text-muted/60 outline-none transition-colors focus:border-accent"
          />
          {(loading || isSearching) && (
            <Loader2 size={12} className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 animate-spin text-muted" />
          )}
        </div>

        {/* Platform Dropdown */}
        <Select
          label="Platform"
          value={platform}
          onChange={resetAnd(setPlatform)}
          options={PLATFORMS}
        />

        {/* Severity Dropdown */}
        <Select
          label="Severity"
          value={severity}
          onChange={resetAnd(setSeverity)}
          options={SEVERITIES}
        />

        {/* Active Filter Clear Tag */}
        {status && (
          <button
            onClick={() => resetAnd(setStatus)("")}
            className="inline-flex items-center gap-1 rounded-md border border-line bg-fg/[0.04] px-2.5 py-1 text-xs text-fg transition-colors hover:border-fg/20"
          >
            <span>Status: {STATUS_LABEL[status]}</span>
            <X size={12} />
          </button>
        )}
      </div>

      {/* Crash Reports Table */}
      <div className="mt-4 overflow-hidden rounded-xl border border-line bg-surface">
        {loading ? (
          <SkeletonRows rows={8} cols={5} />
        ) : error ? (
          <p className="p-6 text-sm text-rose-500">{error}</p>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <Bug size={24} className="mx-auto text-muted" />
            <p className="mt-2 text-sm text-muted">No crash reports match these filters.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-line bg-fg/[0.02] text-[11px] font-medium tracking-wider text-muted uppercase">
                <th className="px-5 py-3">Report Title</th>
                <th className="px-5 py-3">Platform</th>
                <th className="px-5 py-3">Severity</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Reported</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((report) => (
                <tr
                  key={report.id}
                  onClick={() => router.push(`/dashboard/crash-reports/${report.id}`)}
                  className="cursor-pointer transition-colors hover:bg-fg/[0.03]"
                >
                  <td className="max-w-md truncate px-5 py-3.5">
                    <span className="font-medium text-fg hover:underline">{report.title}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <PlatformBadge platform={report.platform} />
                  </td>
                  <td className="px-5 py-3.5">
                    <SeverityBadge severity={report.severity} />
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={report.status} />
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-muted text-[11px]">
                    {new Date(report.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="mt-4 flex items-center justify-between text-xs text-muted">
        <button
          onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
          disabled={offset === 0 || loading}
          className="inline-flex items-center gap-1 rounded-md border border-line bg-surface px-3 py-1.5 font-medium text-fg transition-colors hover:border-fg/20 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={13} />
          <span>Previous</span>
        </button>
        <span className="text-[11px] text-muted font-mono">
          Showing {total === 0 ? 0 : offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total}
        </span>
        <button
          onClick={() => setOffset(offset + PAGE_SIZE)}
          disabled={offset + PAGE_SIZE >= total || loading}
          className="inline-flex items-center gap-1 rounded-md border border-line bg-surface px-3 py-1.5 font-medium text-fg transition-colors hover:border-fg/20 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <span>Next</span>
          <ChevronRight size={13} />
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
      className="h-8 rounded-md border border-line bg-surface px-2.5 text-xs text-fg outline-none transition-colors focus:border-accent"
    >
      <option value="">All {label.toLowerCase()}</option>
      {options.map((opt) => (
        <option key={opt} value={opt} className="bg-surface text-fg capitalize">
          {opt.replace("_", " ")}
        </option>
      ))}
    </select>
  );
}
