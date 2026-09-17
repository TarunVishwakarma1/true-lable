"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "../lib/auth-context";
import { Skeleton } from "./components/skeleton";

export default function Home() {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(profile ? "/dashboard" : "/login");
  }, [loading, profile, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg">
      <p className="font-mono text-sm font-medium tracking-tight text-fg">
        True<span className="text-accent">Label</span>
      </p>
      <div className="flex items-center gap-2 text-xs text-muted">
        <Skeleton className="h-3 w-3 rounded-full" />
        <span>Redirecting…</span>
      </div>
    </main>
  );
}
