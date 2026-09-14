"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "../lib/auth-context";

export default function Home() {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(profile ? "/dashboard" : "/login");
  }, [loading, profile, router]);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="font-mono text-xs text-muted uppercase">Loading…</p>
    </main>
  );
}
