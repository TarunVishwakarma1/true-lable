"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Copy, Globe2, ShieldCheck, Smartphone, User } from "lucide-react";
import { Skeleton } from "../../../components/skeleton";
import { api, type AdminUserDetail } from "../../../../lib/api";
import { useAuth } from "../../../../lib/auth-context";

export default function UserDetailPage() {
  const { deviceId } = useParams<{ deviceId: string }>();
  const { token } = useAuth();
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    if (!token) return;
    api.users
      .get(token, deviceId)
      .then(setUser)
      .catch(() => setError("Couldn't load this user."))
      .finally(() => setLoading(false));
  }, [token, deviceId]);

  function copyDeviceId() {
    if (!user?.device_id) return;
    navigator.clipboard.writeText(user.device_id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-8 py-8">
        <Skeleton className="h-4 w-28" />
        <div className="mt-6 space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </main>
    );
  }

  if (error || !user) {
    return (
      <main className="mx-auto max-w-4xl px-8 py-8">
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-6 text-sm text-rose-500">
          {error ?? "User not found."}
        </div>
        <div className="mt-4">
          <BackLink />
        </div>
      </main>
    );
  }

  const plusActive =
    user.plus_since !== null && (user.plus_expires_at === null || new Date(user.plus_expires_at) > new Date());

  return (
    <main className="mx-auto max-w-4xl px-8 py-8">
      <BackLink />

      {/* Header Info */}
      <div className="mt-6 rounded-xl border border-line bg-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Smartphone size={16} className="text-muted" />
              <h1 className="font-mono text-base font-semibold text-fg">{user.device_id}</h1>
              <button
                onClick={copyDeviceId}
                className="inline-flex items-center gap-1 rounded-md border border-line bg-fg/[0.03] px-2 py-0.5 text-[10px] text-muted transition-colors hover:border-fg/20 hover:text-fg"
              >
                {copiedId ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                <span>{copiedId ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <p className="mt-2 text-xs text-muted">
              {user.display_name ? (
                <span className="font-medium text-fg">{user.display_name}</span>
              ) : (
                "No name set"
              )}
              {user.email && <span className="font-mono text-muted"> · {user.email}</span>}
            </p>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
              plusActive
                ? "border border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "border border-line bg-fg/[0.03] text-muted"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                plusActive ? "bg-emerald-500 shadow-[0_0_8px_#00e599]" : "bg-zinc-500"
              }`}
            />
            {plusActive ? "Plus Active" : "Plus Inactive"}
          </span>
        </div>
      </div>

      {/* Profile Details & Metadata */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Device & Account Information */}
        <div className="rounded-xl border border-line bg-surface p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Device & Account</h2>
          <div className="divide-y divide-line">
            <Property label="Country">
              <span className="inline-flex items-center gap-1 uppercase font-mono text-fg">
                <Globe2 size={11} className="text-muted" />
                {user.country}
              </span>
            </Property>
            <Property label="Signed in">
              {user.apple_user_id ? (
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck size={12} />
                  Apple account linked
                </span>
              ) : (
                <span className="text-muted">Not signed in</span>
              )}
            </Property>
            {user.linked_at && (
              <Property label="Linked">
                <span className="text-muted">{new Date(user.linked_at).toLocaleDateString()}</span>
              </Property>
            )}
            <Property label="Joined">
              <span className="text-muted">{new Date(user.created_at).toLocaleDateString()}</span>
            </Property>
          </div>
        </div>

        {/* Subscription & Entitlements */}
        <div className="rounded-xl border border-line bg-surface p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Subscription</h2>
          <div className="divide-y divide-line">
            <Property label="Plus Status">
              <span className={plusActive ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-muted"}>
                {plusActive ? "Active" : "Inactive"}
              </span>
            </Property>
            {user.plus_source && (
              <Property label="Plus Source">
                <span className="rounded-md border border-line bg-fg/[0.03] px-2 py-0.5 text-[10px] text-fg">
                  {user.plus_source}
                </span>
              </Property>
            )}
            {user.plus_since && (
              <Property label="Plus Since">
                <span className="text-muted">{new Date(user.plus_since).toLocaleDateString()}</span>
              </Property>
            )}
            {user.plus_expires_at && (
              <Property label="Plus Expires">
                <span className="text-muted">{new Date(user.plus_expires_at).toLocaleDateString()}</span>
              </Property>
            )}
          </div>
        </div>
      </div>

      {/* Dietary & Preferences */}
      <div className="mt-6 rounded-xl border border-line bg-surface p-5">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Dietary Preferences</h2>
        {user.dietary_preferences.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {user.dietary_preferences.map((pref) => (
              <span
                key={pref}
                className="rounded-md border border-line bg-fg/[0.03] px-2.5 py-1 text-xs text-fg"
              >
                {pref}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted">No dietary preferences configured.</p>
        )}
      </div>

      {/* Crowd Activity & Contributions */}
      <div className="mt-6 rounded-xl border border-line bg-surface p-5">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted">Contribution</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg border border-line bg-bg p-4">
            <span className="text-xs text-muted">Confirmations</span>
            <p className="mt-1 font-mono text-xl font-semibold text-fg">{user.stats.confirmations}</p>
          </div>
          <div className="rounded-lg border border-line bg-bg p-4">
            <span className="text-xs text-muted">Label Contributions</span>
            <p className="mt-1 font-mono text-xl font-semibold text-fg">{user.stats.contributions}</p>
          </div>
          <div className="rounded-lg border border-line bg-bg p-4">
            <span className="text-xs text-muted">Helped Verify</span>
            <p className="mt-1 font-mono text-xl font-semibold text-fg">{user.stats.helped_verify}</p>
          </div>
        </div>
      </div>
    </main>
  );
}

function BackLink() {
  return (
    <Link
      href="/dashboard/users"
      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-muted transition-colors hover:border-fg/20 hover:text-fg"
    >
      <ArrowLeft size={12} />
      <span>Back to Users</span>
    </Link>
  );
}

function Property({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 text-xs">
      <span className="shrink-0 text-muted">{label}</span>
      <div className="min-w-0 text-right">{children}</div>
    </div>
  );
}
