"use client";

import { Fragment, useEffect, useState } from "react";
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
      <main className="mx-auto max-w-4xl px-8 py-10">
        <h1 className="text-xl font-medium text-fg">Activity</h1>
        <p className="mt-3 text-sm text-muted">Only admins can view the activity log.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-8 py-10">
      <h1 className="text-xl font-medium text-fg">Activity</h1>
      <p className="mt-1 text-sm text-muted">{total} recorded changes</p>

      <div className="mt-6 overflow-hidden rounded-xl border border-line">
        {loading ? (
          <SkeletonRows rows={8} cols={4} />
        ) : error ? (
          <p className="p-6 text-sm text-red-400">{error}</p>
        ) : items.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted">Nothing recorded yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th className="px-4 py-2.5 font-medium">Actor</th>
                <th className="px-4 py-2.5 font-medium">Action</th>
                <th className="px-4 py-2.5 font-medium">Target</th>
                <th className="px-4 py-2.5 font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {items.map((entry) => (
                <Fragment key={entry.id}>
                  <tr
                    onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                    className="cursor-pointer border-b border-line last:border-0 hover:bg-fg/[0.03]"
                  >
                    <td className="px-4 py-3 text-fg">{entry.actor_name}</td>
                    <td className="px-4 py-3 text-muted">{ACTION_LABEL[entry.action] ?? entry.action}</td>
                    <td className="px-4 py-3 text-muted">
                      <span className="font-mono text-xs">{entry.target_type}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted">
                      {new Date(entry.created_at).toLocaleString()}
                    </td>
                  </tr>
                  {expandedId === entry.id && (
                    <tr className="border-b border-line bg-fg/[0.02] last:border-0">
                      <td colSpan={4} className="px-4 py-3">
                        <p className="mb-1.5 text-xs text-muted">
                          Target id: <span className="font-mono">{entry.target_id}</span>
                        </p>
                        {Object.keys(entry.metadata).length > 0 && (
                          <pre className="overflow-x-auto rounded-lg border border-line bg-surface p-3 font-mono text-xs text-fg">
                            {JSON.stringify(entry.metadata, null, 2)}
                          </pre>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {total > PAGE_SIZE && (
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
      )}
    </main>
  );
}
