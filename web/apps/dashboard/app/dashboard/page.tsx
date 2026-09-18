"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { MotionConfig, motion } from "motion/react";
import { ArrowUpRight, Bug, Plus } from "lucide-react";
import { PlatformBadge, STATUS_LABEL, SeverityBadge, StatusBadge } from "../components/badges";
import { Skeleton, SkeletonRows } from "../components/skeleton";
import { api, type CrashReport, type ReportStatus } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";

const STATUSES: ReportStatus[] = ["submitted", "pending", "in_review", "in_progress", "done", "wont_fix"];
const TREND_DAYS = 14;
const STROKE = 1.75;
const EASE = [0.16, 1, 0.3, 1] as const;

// Same walk as the status dots in badges.tsx: nothing yet, waiting, being
// looked at, moving, done. A bar chart where every bar is the same colour is
// a bar chart that only encodes length.
const STATUS_BAR: Record<ReportStatus, string> = {
  submitted: "bg-fg3",
  pending: "bg-warn",
  in_review: "bg-info",
  in_progress: "bg-fair",
  done: "bg-good",
  wont_fix: "bg-fg3/40",
};

/** Sections arrive in sequence rather than all at once — it reads as the page
 *  assembling itself, and it costs one prop. */
function Section({ delay = 0, className = "", children }: { delay?: number; className?: string; children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

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
    <MotionConfig reducedMotion="user">
      <div className="mx-auto max-w-[1180px] px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pb-20 lg:pt-10">
        {/* The headline is the state of the queue, not a greeting. The greeting
            is still there, just sized like the aside it actually is. */}
        <Section className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Welcome back{firstName ? `, ${firstName}` : ""}</p>
            {loading ? (
              <Skeleton className="mt-3 h-11 w-full max-w-[340px]" />
            ) : (
              <h1 className="display mt-2.5 text-[30px] text-fg sm:text-[36px] lg:text-[42px]">
                {open > 0 ? (
                  <>
                    <span className="tnum">{open}</span>{" "}
                    {open === 1 ? "report needs" : "reports need"} attention
                  </>
                ) : (
                  "Nothing needs attention"
                )}
              </h1>
            )}
            {loading ? (
              <Skeleton className="mt-3 h-3 w-full max-w-[220px]" />
            ) : (
              <p className="mt-2.5 text-[13px] text-fg2">
                <span className="tnum font-medium text-fg">{total}</span> logged all time ·{" "}
                <span className="tnum font-medium text-fg">{resolved}</span> resolved
              </p>
            )}
          </div>

          <Link
            href="/dashboard/crash-reports/new"
            className="pressable inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-accent px-4 text-[13px] font-medium text-on-accent hover:opacity-90"
          >
            <Plus size={14} strokeWidth={2} />
            <span>New report</span>
          </Link>
        </Section>

        <div className="mt-9 grid grid-cols-1 gap-4 lg:grid-cols-5">
          <Section delay={0.06} className="rounded-[20px] border border-line bg-surface p-6 lg:col-span-3">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[13px] font-medium text-fg">Intake volume</h2>
              <p className="eyebrow">Last {TREND_DAYS} days</p>
            </div>
            {loading ? (
              <Skeleton className="mt-5 h-48 w-full" />
            ) : (
              <div className="mt-5 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  {/* Headroom at the top, or a spike on the last day gets
                      clipped by the panel edge. */}
                  <AreaChart data={trend} margin={{ top: 14, right: 6, bottom: 0, left: -28 }}>
                    <defs>
                      <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.22} />
                        <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: "var(--fg3)" }}
                      axisLine={false}
                      tickLine={false}
                      interval={2}
                    />
                    <Tooltip
                      cursor={{ stroke: "var(--line-strong)" }}
                      contentStyle={{
                        background: "var(--elevated)",
                        border: "1px solid var(--line)",
                        borderRadius: 12,
                        fontSize: 12,
                        color: "var(--fg)",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
                      }}
                      labelStyle={{ color: "var(--fg3)" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="var(--accent)"
                      strokeWidth={1.75}
                      fill="url(#trendFill)"
                      name="Reports"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Section>

          <Section delay={0.12} className="rounded-[20px] border border-line bg-surface p-6 lg:col-span-2">
            <h2 className="text-[13px] font-medium text-fg">By status</h2>
            <div className="mt-5 flex flex-col gap-3.5">
              {loading
                ? STATUSES.map((s) => <Skeleton key={s} className="h-3 w-full" />)
                : STATUSES.map((s) => {
                    const count = counts[s] ?? 0;
                    return (
                      <div key={s} className="flex items-center gap-3 text-[12px]">
                        <span className="w-[86px] shrink-0 text-fg2">{STATUS_LABEL[s]}</span>
                        <div className="h-[5px] flex-1 overflow-hidden rounded-full bg-hover">
                          <motion.div
                            className={`h-full rounded-full ${STATUS_BAR[s]}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${(count / maxStatusCount) * 100}%` }}
                            transition={{ duration: 0.7, delay: 0.2, ease: EASE }}
                          />
                        </div>
                        <span className="tnum w-6 shrink-0 text-right font-mono text-[12px] text-fg">
                          {count}
                        </span>
                      </div>
                    );
                  })}
            </div>
          </Section>
        </div>

        <Section delay={0.18} className="mt-10">
          <div className="mb-3.5 flex items-baseline justify-between">
            <h2 className="display text-[22px] text-fg">Recent reports</h2>
            <Link
              href="/dashboard/crash-reports"
              className="pressable inline-flex items-center gap-1 text-[13px] text-fg2 hover:text-fg"
            >
              <span>View all</span>
              <ArrowUpRight size={13} strokeWidth={STROKE} />
            </Link>
          </div>

          <div className="overflow-hidden rounded-[20px] border border-line bg-surface">
            {loading ? (
              <SkeletonRows rows={5} cols={4} />
            ) : recent.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-16 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-[13px] border border-line bg-hover">
                  <Bug size={17} strokeWidth={STROKE} className="text-fg3" />
                </span>
                <p className="mt-4 text-[15px] text-fg">No reports yet</p>
                <p className="mt-1.5 max-w-[320px] text-[13px] leading-relaxed text-fg3">
                  Crashes submitted from the iOS and Android apps land here. You can also file one
                  by hand.
                </p>
                <Link
                  href="/dashboard/crash-reports/new"
                  className="pressable mt-5 inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-line px-4 text-[13px] font-medium text-fg hover:bg-hover"
                >
                  <Plus size={14} strokeWidth={2} />
                  <span>File a report</span>
                </Link>
              </div>
            ) : (
              // Below roughly 1200px the five columns stop fitting. Scrolling
              // the table beats truncating the date column into nothing.
              <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left">
                <thead>
                  <tr className="border-b border-line">
                    <th className="eyebrow px-5 py-3 font-normal">Report</th>
                    <th className="eyebrow px-5 py-3 font-normal">Platform</th>
                    <th className="eyebrow px-5 py-3 font-normal">Severity</th>
                    <th className="eyebrow px-5 py-3 font-normal">Status</th>
                    <th className="eyebrow px-5 py-3 text-right font-normal">Reported</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-subtle">
                  {recent.slice(0, 6).map((report) => (
                    <tr
                      key={report.id}
                      onClick={() => router.push(`/dashboard/crash-reports/${report.id}`)}
                      className="cursor-pointer transition-colors hover:bg-hover"
                    >
                      <td className="max-w-[260px] truncate px-5 py-4 text-[13px] font-medium text-fg xl:max-w-md">
                        {report.title}
                      </td>
                      <td className="px-5 py-4">
                        <PlatformBadge platform={report.platform} />
                      </td>
                      <td className="px-5 py-4">
                        <SeverityBadge severity={report.severity} />
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={report.status} />
                      </td>
                      <td className="tnum whitespace-nowrap px-5 py-4 text-right font-mono text-[12px] text-fg3">
                        {new Date(report.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>
        </Section>
      </div>
    </MotionConfig>
  );
}
