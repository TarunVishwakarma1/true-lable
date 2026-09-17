"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { ArrowUpRight, Bug, CheckCircle2, Clock, Plus, TrendingUp } from "lucide-react";
import { PlatformBadge, STATUS_LABEL, SeverityBadge, StatusBadge } from "../components/badges";
import { Skeleton, SkeletonRows } from "../components/skeleton";
import { api, type CrashReport, type ReportStatus } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";

const STATUSES: ReportStatus[] = ["submitted", "pending", "in_review", "in_progress", "done", "wont_fix"];
const TREND_DAYS = 14;

export default function DashboardHome() {
  const { profile, token } = useAuth();
  const router = useRouter();
  const [counts, setCounts] = useState<Partial<Record<ReportStatus, number>>>({});
  const [recent, setRecent] = useState<CrashReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      Promise.all(STATUSES.map((s) => api.crashReports.list(token, { status: s, limit: 1 }))),
      api.crashReports.list(token, { limit: 20 }),
    ])
      .then(([pages, page]) => {
        const next: Partial<Record<ReportStatus, number>> = {};
        STATUSES.forEach((s, i) => (next[s] = pages[i]?.total ?? 0));
        setCounts(next);
        setRecent(page.items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const total = Object.values(counts).reduce((a, b) => a + (b ?? 0), 0);
  const open = (counts.submitted ?? 0) + (counts.pending ?? 0) + (counts.in_review ?? 0) + (counts.in_progress ?? 0);
  const resolved = counts.done ?? 0;

  const trend = useMemo(() => {
    const days: { date: string; label: string; count: number }[] = [];
    for (let i = TREND_DAYS - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const date = d.toISOString().slice(0, 10);
      days.push({ date, label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }), count: 0 });
    }
    const byDate = new Map(days.map((d) => [d.date, d]));
    for (const report of recent) {
      const date = report.created_at.slice(0, 10);
      const bucket = byDate.get(date);
      if (bucket) bucket.count += 1;
    }
    return days;
  }, [recent]);

  const maxStatusCount = Math.max(1, ...STATUSES.map((s) => counts[s] ?? 0));
  const firstName = profile?.name.split(" ")[0];

  return (
    <main className="mx-auto max-w-6xl px-8 py-8">
      {/* Welcome Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">
            Welcome back{firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="mt-1 text-xs text-muted">
            {profile?.email} · {profile?.role} access
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/crash-reports/new"
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-fg px-3.5 text-xs font-medium text-bg transition-all hover:opacity-90 shadow-xs"
          >
            <Plus size={13} strokeWidth={2.5} />
            <span>New report</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile
          label="Total Crash Reports"
          value={total}
          description="All time logged reports"
          loading={loading}
          icon={Bug}
        />
        <StatTile
          label="Active / In Progress"
          value={open}
          description="Submitted, pending, or in review"
          loading={loading}
          icon={Clock}
          highlight={open > 0}
        />
        <StatTile
          label="Resolved Reports"
          value={resolved}
          description="Marked done by team"
          loading={loading}
          icon={CheckCircle2}
        />
      </div>

      {/* Chart & Status Breakdown */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Trend Area Chart */}
        <div className="rounded-xl border border-line bg-surface p-5 lg:col-span-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-fg">Activity volume, last {TREND_DAYS} days</p>
            <span className="flex items-center gap-1 text-[11px] text-accent font-mono">
              <TrendingUp size={12} />
              <span>Crash reports volume</span>
            </span>
          </div>
          {loading ? (
            <Skeleton className="mt-4 h-44 w-full" />
          ) : (
            <div className="mt-4 h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
                  <defs>
                    <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0070f3" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#0070f3" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: "var(--muted)" }}
                    axisLine={false}
                    tickLine={false}
                    interval={2}
                  />
                  <Tooltip
                    cursor={{ stroke: "var(--line)" }}
                    contentStyle={{
                      background: "var(--surface)",
                      border: "1px solid var(--line)",
                      borderRadius: 8,
                      fontSize: 11,
                      color: "var(--fg)",
                    }}
                    labelStyle={{ color: "var(--muted)" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#0070f3"
                    strokeWidth={2}
                    fill="url(#trendFill)"
                    name="Reports"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Status Distribution */}
        <div className="rounded-xl border border-line bg-surface p-5 lg:col-span-2">
          <p className="text-xs font-medium text-fg">Distribution by status</p>
          <div className="mt-4 flex flex-col gap-3">
            {loading
              ? STATUSES.map((s) => <Skeleton key={s} className="h-4 w-full" />)
              : STATUSES.map((s) => {
                  const count = counts[s] ?? 0;
                  return (
                    <div key={s} className="flex items-center gap-3 text-xs">
                      <span className="w-24 shrink-0 text-muted">{STATUS_LABEL[s]}</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-fg/[0.08]">
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{ width: `${(count / maxStatusCount) * 100}%` }}
                        />
                      </div>
                      <span className="w-6 shrink-0 text-right tabular-nums text-fg font-mono">{count}</span>
                    </div>
                  );
                })}
          </div>
        </div>
      </div>

      {/* Recent Reports List */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-fg">Recent Crash Reports</h2>
          <Link
            href="/dashboard/crash-reports"
            className="flex items-center gap-1 text-xs text-muted hover:text-fg transition-colors"
          >
            <span>View all</span>
            <ArrowUpRight size={12} />
          </Link>
        </div>

        <div className="rounded-xl border border-line bg-surface overflow-hidden">
          {loading ? (
            <div className="p-4">
              <SkeletonRows rows={5} cols={4} />
            </div>
          ) : recent.length === 0 ? (
            <p className="p-8 text-center text-xs text-muted">No crash reports recorded yet.</p>
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
                {recent.slice(0, 6).map((report) => (
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
      </div>
    </main>
  );
}

function StatTile({
  label,
  value,
  description,
  loading,
  icon: Icon,
  highlight,
}: {
  label: string;
  value: number;
  description: string;
  loading: boolean;
  icon: any;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-5 transition-all ${
        highlight
          ? "border-amber-500/30 bg-amber-500/5"
          : "border-line bg-surface"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted">{label}</span>
        <Icon size={14} className={highlight ? "text-amber-500 dark:text-amber-400" : "text-muted"} />
      </div>
      {loading ? (
        <Skeleton className="mt-2 h-7 w-20" />
      ) : (
        <p className="mt-2 font-mono text-2xl font-semibold text-fg">{value}</p>
      )}
      <p className="mt-1 text-[11px] text-muted">{description}</p>
    </div>
  );
}
