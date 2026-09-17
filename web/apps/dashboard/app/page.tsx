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
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3">
      <p className="display text-[26px] text-fg">
        True<span className="text-fg3">Label</span>
      </p>
      <p className="eyebrow">Redirecting</p>
    </main>
  );
}
