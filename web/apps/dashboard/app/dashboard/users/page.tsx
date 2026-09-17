"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Globe2, Loader2, Search, Smartphone, Sparkles, User } from "lucide-react";
import { SkeletonRows } from "../../components/skeleton";
import { api, type AppUser } from "../../../lib/api";
import { useAuth } from "../../../lib/auth-context";

const PAGE_SIZE = 20;

export default function UsersPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<AppUser[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [plusActive, setPlusActive] = useState<"" | "true" | "false">("");
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
    setLoading(true);
    setError(null);
    api.users
      .list(token, {
        q: debouncedQ || undefined,
        plus_active: plusActive === "" ? undefined : plusActive === "true",
        limit: PAGE_SIZE,
        offset,
      })
      .then((page) => {
        setItems(page.items);
        setTotal(page.total);
      })
      .catch(() => setError("Couldn't load users."))
      .finally(() => setLoading(false));
  }, [token, plusActive, debouncedQ, offset]);

  return (
    <main className="mx-auto max-w-6xl px-8 py-8">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">Users</h1>
          <p className="mt-1 text-xs text-muted">
            {total} total · read-only
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {/* Plus Tier Pill Filters */}
        <div className="flex items-center gap-1 rounded-full border border-line bg-surface p-0.5">
          <button
            onClick={() => {
              setOffset(0);
              setPlusActive("");
            }}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
              plusActive === ""
                ? "bg-fg text-bg shadow-xs"
                : "text-muted hover:text-fg"
            }`}
          >
            All users
          </button>
          <button
            onClick={() => {
              setOffset(0);
              setPlusActive("true");
            }}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-all ${
              plusActive === "true"
                ? "bg-fg text-bg shadow-xs"
                : "text-muted hover:text-fg"
            }`}
          >
            <Sparkles size={11} className={plusActive === "true" ? "text-amber-300 dark:text-amber-400" : "text-amber-500"} />
            Plus active
          </button>
          <button
            onClick={() => {
              setOffset(0);
              setPlusActive("false");
            }}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
              plusActive === "false"
                ? "bg-fg text-bg shadow-xs"
                : "text-muted hover:text-fg"
            }`}
          >
            Plus inactive
          </button>
        </div>

        {/* Search */}
        <div className="relative ml-auto">
          <Search size={12} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search device ID, email, name…"
            className="h-8 w-64 rounded-full border border-line bg-surface pr-8 pl-8 text-xs text-fg placeholder:text-muted/60 outline-none transition-colors focus:border-accent"
          />
          {(loading || isSearching) && (
            <Loader2 size={12} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 animate-spin text-muted" />
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="mt-4 overflow-hidden rounded-xl border border-line bg-surface">
        {loading ? (
          <SkeletonRows rows={8} cols={5} />
        ) : error ? (
          <p className="p-6 text-sm text-rose-500">{error}</p>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <Smartphone size={24} className="mx-auto text-muted" />
            <p className="mt-2 text-sm text-muted">No users match these filters.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-line bg-fg/[0.02] text-[11px] font-medium tracking-wider text-muted uppercase">
                <th className="px-5 py-3">Device</th>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Country</th>
                <th className="px-5 py-3">Plus</th>
                <th className="px-5 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((user) => {
                const plusActiveRow =
                  user.plus_since !== null &&
                  (user.plus_expires_at === null || new Date(user.plus_expires_at) > new Date());
                return (
                  <tr
                    key={user.device_id}
                    onClick={() => router.push(`/dashboard/users/${user.device_id}`)}
                    className="cursor-pointer transition-colors hover:bg-fg/[0.03]"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Smartphone size={13} className="text-muted shrink-0" />
                        <span className="font-mono text-xs text-fg max-w-[200px] truncate" title={user.device_id}>
                          {user.device_id}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-muted">
                      {user.display_name ? (
                        <div className="flex items-center gap-1.5">
                          <User size={12} className="text-muted" />
                          <span className="font-medium text-fg">{user.display_name}</span>
                          {user.email && <span className="text-muted text-[11px]">({user.email})</span>}
                        </div>
                      ) : user.email ? (
                        <span className="font-mono text-[11px] text-fg">{user.email}</span>
                      ) : (
                        <span className="text-muted/60">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 rounded-md border border-line bg-fg/[0.03] px-2 py-0.5 text-[10px] uppercase tracking-wider text-fg">
                        <Globe2 size={10} className="text-muted" />
                        {user.country}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                          plusActiveRow
                            ? "border border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "border border-line bg-fg/[0.02] text-muted"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            plusActiveRow ? "bg-emerald-500 shadow-[0_0_8px_#00e599]" : "bg-zinc-500"
                          }`}
                        />
                        {plusActiveRow ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-muted text-[11px]">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
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
