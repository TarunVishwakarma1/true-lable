"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "../../../components/skeleton";
import { api, type AdminUserDetail } from "../../../../lib/api";
import { useAuth } from "../../../../lib/auth-context";

export default function UserDetailPage() {
  const { deviceId } = useParams<{ deviceId: string }>();
  const { token } = useAuth();
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api.users
      .get(token, deviceId)
      .then(setUser)
      .catch(() => setError("Couldn't load this user."))
      .finally(() => setLoading(false));
  }, [token, deviceId]);

  if (loading) {
    return (
      <main className="mx-auto max-w-2xl px-8 py-10">
        <Skeleton className="h-4 w-24" />
        <div className="mt-4 rounded-xl border border-line p-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-3 border-b border-line py-2.5 last:border-0">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-28" />
            </div>
          ))}
        </div>
      </main>
    );
  }

  if (error || !user) {
    return (
      <main className="mx-auto max-w-2xl px-8 py-10">
        <p className="text-sm text-red-400">{error ?? "Not found."}</p>
        <BackLink />
      </main>
    );
  }

  const plusActive =
    user.plus_since !== null && (user.plus_expires_at === null || new Date(user.plus_expires_at) > new Date());

  return (
    <main className="mx-auto max-w-2xl px-8 py-10">
      <BackLink />

      <h1 className="mt-4 font-mono text-lg font-medium text-fg">{user.device_id}</h1>
      <p className="mt-1 text-sm text-muted">
        {user.display_name ?? "No name set"}
        {user.email ? ` · ${user.email}` : ""}
      </p>

      <div className="mt-6 rounded-xl border border-line p-4">
        <Property label="Country">{user.country.toUpperCase()}</Property>
        <Property label="Plus">
          <span className="inline-flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${plusActive ? "bg-emerald-400" : "bg-zinc-500"}`} aria-hidden />
            {plusActive ? "Active" : "Inactive"}
            {user.plus_source && <span className="text-muted"> ({user.plus_source})</span>}
          </span>
        </Property>
        {user.plus_since && <Property label="Plus since">{new Date(user.plus_since).toLocaleDateString()}</Property>}
        {user.plus_expires_at && (
          <Property label="Plus expires">{new Date(user.plus_expires_at).toLocaleDateString()}</Property>
        )}
        <Property label="Signed in">{user.apple_user_id ? "Apple account linked" : "Not signed in"}</Property>
        {user.linked_at && <Property label="Linked">{new Date(user.linked_at).toLocaleDateString()}</Property>}
        <Property label="Dietary preferences">
          {user.dietary_preferences.length > 0 ? user.dietary_preferences.join(", ") : "—"}
        </Property>
        <Property label="Joined">{new Date(user.created_at).toLocaleDateString()}</Property>
      </div>

      <p className="mt-6 mb-2 text-xs font-medium text-muted">Contribution</p>
      <div className="rounded-xl border border-line p-4">
        <Property label="Confirmations">{user.stats.confirmations}</Property>
        <Property label="Label contributions">{user.stats.contributions}</Property>
        <Property label="Helped verify">{user.stats.helped_verify}</Property>
      </div>
    </main>
  );
}

function BackLink() {
  return (
    <Link
      href="/dashboard/users"
      className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg"
    >
      <ArrowLeft size={14} />
      Users
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
