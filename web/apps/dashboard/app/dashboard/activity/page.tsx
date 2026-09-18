"use client";

import { Fragment, useEffect, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, History, ShieldAlert } from "lucide-react";
import { api, type AuditLogEntry } from "../../../lib/api";
import { useAuth } from "../../../lib/auth-context";
import { SkeletonRows } from "../../components/skeleton";

const PAGE_SIZE = 25;

const ACTION_LABEL: Record<string, string> = {
  "team.member_invited": "Invited teammate",
  "team.role_changed": "Changed role",
  "team.password_reset": "Reset password",
  "team.member_removed": "Removed teammate",
  "crash_report.status_changed": "Changed crash report status",
  "crash_report.github_issue_published": "Published crash report to GitHub",
  "product.updated": "Edited product",
  "product.verified": "Verified product",
};

export default function ActivityPage() {
  const { token, profile: me } = useAuth();
  const [items, setItems] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!token || me?.role !== "admin") return;
    setLoading(true);
    setError(null);
    api.activity
      .list(token, { limit: PAGE_SIZE, offset })
      .then((page) => {
        setItems(page.items);
        setTotal(page.total);
      })
      .catch(() => setError("Couldn't load the activity log."))
      .finally(() => setLoading(false));
  }, [token, me?.role, offset]);

  if (me && me.role !== "admin") {
    return (
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="flex items-center gap-3 rounded-xl border border-line bg-surface p-8 text-center">
          <ShieldAlert size={20} className="text-amber-500 shrink-0" />
          <div className="text-left">
            <h1 className="text-sm font-semibold text-fg">Restricted Access</h1>
            <p className="mt-1 text-xs text-muted">
              Only admins can view the activity log.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* Title Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">Activity</h1>
          <p className="mt-1 text-xs text-muted">
            {total} recorded changes
          </p>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="mt-6 overflow-hidden rounded-xl border border-line bg-surface">
        {loading ? (
          <SkeletonRows rows={8} cols={4} />
        ) : error ? (
          <p className="p-6 text-sm text-rose-500">{error}</p>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <History size={24} className="mx-auto text-muted" />
            <p className="mt-2 text-sm text-muted">Nothing recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead>
              <tr className="border-b border-line bg-fg/[0.02] text-[11px] font-medium tracking-wider text-muted uppercase">
                <th className="px-5 py-3">Actor</th>
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3">Target</th>
                <th className="px-5 py-3">When</th>
                <th className="w-10 px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((entry) => {
                const isExpanded = expandedId === entry.id;
                return (
                  <Fragment key={entry.id}>
                    <tr
                      onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                      className="cursor-pointer transition-colors hover:bg-fg/[0.02]"
                    >
                      <td className="px-5 py-3.5">
                        <span className="font-medium text-fg">{entry.actor_name}</span>
                      </td>
                      <td className="px-5 py-3.5 text-muted">
                        {ACTION_LABEL[entry.action] ?? entry.action}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="rounded-md border border-line bg-fg/[0.03] px-2 py-0.5 font-mono text-[11px] text-muted">
                          {entry.target_type}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-muted font-mono text-[11px]">
                        {new Date(entry.created_at).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-right text-muted">
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="border-b border-line bg-bg">
                        <td colSpan={5} className="px-5 py-4">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-muted">Target ID:</span>
                              <span className="rounded bg-fg/[0.05] px-2 py-0.5 font-mono text-[11px] text-fg">
                                {entry.target_id}
                              </span>
                            </div>
                            {Object.keys(entry.metadata).length > 0 && (
                              <div>
                                <div className="mb-1 text-[11px] font-medium text-muted">
                                  Audit Payload
                                </div>
                                <pre className="max-h-60 overflow-x-auto rounded-lg border border-line bg-surface p-3 font-mono text-xs leading-relaxed text-fg">
                                  {JSON.stringify(entry.metadata, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {total > PAGE_SIZE && (
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
      )}
    </main>
  );
}
