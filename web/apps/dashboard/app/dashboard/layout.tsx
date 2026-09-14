"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Activity, BookOpen, Bug, LayoutGrid, LogOut, Users } from "lucide-react";
import { ThemeToggle } from "@repo/ui/theme-toggle";
import { useAuth } from "../../lib/auth-context";
import { Skeleton } from "../components/skeleton";

const LINKS = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid },
  { href: "/dashboard/crash-reports", label: "Crash Reports", icon: Bug },
  { href: "/dashboard/team", label: "Team", icon: Users },
  { href: "/dashboard/activity", label: "Activity", icon: Activity },
  { href: "/dashboard/resources", label: "Resources", icon: BookOpen },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !profile) router.replace("/login");
  }, [loading, profile, router]);

  if (loading || !profile) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-8 w-8 rounded-full" />
      </main>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col border-r border-line px-4 py-5">
        <div className="flex items-center gap-2 px-2">
          <Image src="/brand/logo-light.png" alt="" width={128} height={128} className="h-6 w-6 rounded-md dark:hidden" />
          <Image src="/brand/logo-dark.png" alt="" width={128} height={128} className="hidden h-6 w-6 rounded-md dark:block" />
          <span className="font-mono text-[13px] font-medium tracking-tight text-fg">
            True<span className="text-accent">Label</span>
          </span>
        </div>

        <nav className="mt-8 flex flex-col gap-0.5">
          {LINKS.map((link) => {
            const active =
              link.href === "/dashboard" ? pathname === link.href : pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors ${
                  active ? "bg-fg/[0.06] text-fg" : "text-muted hover:bg-fg/[0.04] hover:text-fg"
                }`}
              >
                <Icon size={16} strokeWidth={2} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-line px-2 pt-4">
          <div className="min-w-0">
            <p className="truncate text-sm text-fg">{profile.name}</p>
            <p className="truncate text-xs text-muted capitalize">{profile.role}</p>
          </div>
          <div className="flex shrink-0 items-center">
            <div className="scale-75">
              <ThemeToggle />
            </div>
            <button
              onClick={() => {
                logout();
                router.replace("/login");
              }}
              aria-label="Sign out"
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-fg/[0.06] hover:text-fg"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
