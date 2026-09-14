"use client";

import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { STATUS_LABEL } from "../components/badges";
import { api, type CrashReport, type ReportStatus } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";

const STATUSES: ReportStatus[] = ["submitted", "pending", "in_review", "in_progress", "done", "wont_fix"];
const TREND_DAYS = 14;

export default function DashboardHome() {
  const { profile, token } = useAuth();
  const [counts, setCounts] = useState<Partial<Record<ReportStatus, number>>>({});
  const [recent, setRecent] = useState<CrashReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      Promise.all(STATUSES.map((s) => api.crashReports.list(token, { status: s, limit: 1 }))),
      api.crashReports.list(token, { limit: 200 }),
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
    <main className="mx-auto max-w-5xl px-8 py-10">
      <h1 className="text-xl font-medium text-fg">Welcome back{firstName ? `, ${firstName}` : ""}</h1>
      <p className="mt-1 text-sm text-muted">{profile?.email}</p>

      <div className="mt-8 grid grid-cols-3 gap-3">
        <StatTile label="Total reports" value={loading ? "–" : total} />
        <StatTile label="Open work" value={loading ? "–" : open} />
        <StatTile label="Done" value={loading ? "–" : (counts.done ?? 0)} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="rounded-xl border border-line p-5 lg:col-span-3">
          <p className="text-sm font-medium text-fg">Reports, last {TREND_DAYS} days</p>
          <div className="mt-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
                <defs>
                  <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "var(--muted)" }}
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
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "var(--fg)" }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  fill="url(#trendFill)"
                  name="Reports"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-line p-5 lg:col-span-2">
          <p className="text-sm font-medium text-fg">By status</p>
          <div className="mt-4 flex flex-col gap-3">
            {STATUSES.map((s) => {
              const count = counts[s] ?? 0;
              return (
                <div key={s} className="flex items-center gap-3 text-xs">
                  <span className="w-20 shrink-0 text-muted">{STATUS_LABEL[s]}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-fg/[0.06]">
                    <div
                      className="h-full rounded-full bg-fg/70"
                      style={{ width: `${(count / maxStatusCount) * 100}%` }}
                    />
                  </div>
                  <span className="w-6 shrink-0 text-right tabular-nums text-fg">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-line p-4">
      <p className="text-2xl font-medium tabular-nums text-fg">{value}</p>
      <p className="mt-1 text-xs text-muted">{label}</p>
    </div>
  );
}
