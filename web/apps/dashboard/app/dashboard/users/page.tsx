"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
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
    <main className="mx-auto max-w-5xl px-8 py-10">
      <div>
        <h1 className="text-xl font-medium text-fg">Users</h1>
        <p className="mt-1 text-sm text-muted">{total} total · read-only</p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search size={13} className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search device id, email, name…"
            className="h-8 w-64 rounded-md border border-line bg-surface pr-7 pl-7 text-xs text-fg outline-none placeholder:text-muted/60 focus:border-accent"
          />
          {(loading || isSearching) && (
            <Loader2 size={13} className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 animate-spin text-muted" />
          )}
        </div>
        <select
          value={plusActive}
          onChange={(e) => {
            setOffset(0);
            setPlusActive(e.target.value as "" | "true" | "false");
          }}
          aria-label="Plus status"
          className="h-8 rounded-md border border-line bg-surface px-2.5 text-xs text-fg outline-none focus:border-accent"
        >
          <option value="">All users</option>
          <option value="true">Plus active</option>
          <option value="false">Plus inactive</option>
        </select>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-line">
        {loading ? (
          <SkeletonRows rows={8} cols={5} />
        ) : error ? (
          <p className="p-6 text-sm text-red-400">{error}</p>
        ) : items.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted">No users match these filters.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th className="px-4 py-2.5 font-medium">Device</th>
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Country</th>
                <th className="px-4 py-2.5 font-medium">Plus</th>
                <th className="px-4 py-2.5 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {items.map((user) => {
                const plusActiveRow =
                  user.plus_since !== null &&
                  (user.plus_expires_at === null || new Date(user.plus_expires_at) > new Date());
                return (
                  <tr
                    key={user.device_id}
                    onClick={() => router.push(`/dashboard/users/${user.device_id}`)}
                    className="cursor-pointer border-b border-line last:border-0 hover:bg-fg/[0.03]"
                  >
                    <td className="max-w-[220px] truncate px-4 py-3">
                      <span className="font-mono text-xs text-fg">{user.device_id}</span>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {user.display_name ?? user.email ?? <span className="text-muted/50">—</span>}
                    </td>
                    <td className="px-4 py-3 text-muted uppercase">{user.country}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium ${plusActiveRow ? "text-fg" : "text-muted"}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${plusActiveRow ? "bg-emerald-400" : "bg-zinc-500"}`}
                          aria-hidden
                        />
                        {plusActiveRow ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <button
          onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
          disabled={offset === 0 || loading}
          className="text-muted transition-colors hover:text-fg disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>
        <span className="text-xs text-muted">
          {total === 0 ? 0 : offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total}
        </span>
        <button
          onClick={() => setOffset(offset + PAGE_SIZE)}
          disabled={offset + PAGE_SIZE >= total || loading}
          className="text-muted transition-colors hover:text-fg disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    </main>
  );
}
