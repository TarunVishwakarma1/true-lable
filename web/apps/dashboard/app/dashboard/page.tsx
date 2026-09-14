"use client";

import Link from "next/link";
import { ArrowRight, Bug } from "lucide-react";
import { useAuth } from "../../lib/auth-context";

export default function DashboardHome() {
  const { profile } = useAuth();
  const firstName = profile?.name.split(" ")[0];

  return (
    <main className="mx-auto max-w-5xl px-8 py-10">
      <h1 className="text-xl font-medium text-fg">Welcome back{firstName ? `, ${firstName}` : ""}</h1>
      <p className="mt-1 text-sm text-muted">{profile?.email}</p>

      <Link
        href="/dashboard/crash-reports"
        className="group mt-8 flex max-w-sm items-center gap-4 rounded-xl border border-line bg-surface p-5 transition-colors hover:border-fg/20"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-fg/5 text-fg">
          <Bug size={17} strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-fg">Crash Reports</p>
          <p className="mt-0.5 text-xs text-muted">Triage, resolve, and publish to GitHub</p>
        </div>
        <ArrowRight
          size={15}
          className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-fg"
        />
      </Link>
    </main>
  );
}
