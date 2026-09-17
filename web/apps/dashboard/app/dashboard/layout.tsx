"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Activity,
  BookOpen,
  Bug,
  CircleUser,
  LayoutGrid,
  LogOut,
  Package,
  Users,
} from "lucide-react";
import { ThemeToggle } from "@repo/ui/theme-toggle";
import { useAuth } from "../../lib/auth-context";
import { Skeleton } from "../components/skeleton";

const LINKS = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid },
  { href: "/dashboard/crash-reports", label: "Crash Reports", icon: Bug },
  { href: "/dashboard/products", label: "Products", icon: Package },
  { href: "/dashboard/users", label: "Users", icon: CircleUser },
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
      <main className="flex min-h-screen items-center justify-center bg-bg text-fg">
        <Skeleton className="h-8 w-8 rounded-full" />
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-bg text-fg">
      {/* Sidebar */}
      <aside className="flex w-60 shrink-0 flex-col border-r border-line bg-bg px-4 py-5">
        {/* Brand Header */}
        <Link href="/dashboard" className="flex items-center gap-2.5 px-2.5 py-1">
          <Image
            src="/brand/logo-light.png"
            alt="TrueLabel"
            width={24}
            height={24}
            className="h-6 w-6 rounded-md dark:hidden"
          />
          <Image
            src="/brand/logo-dark.png"
            alt="TrueLabel"
            width={24}
            height={24}
            className="hidden h-6 w-6 rounded-md dark:block"
          />
          <span className="font-mono text-sm font-semibold tracking-tight text-fg">
            True<span className="text-accent">Label</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="mt-6 flex flex-col gap-1">
          {LINKS.map((link) => {
            const active =
              link.href === "/dashboard"
                ? pathname === link.href
                : pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-all ${
                  active
                    ? "bg-fg/[0.08] text-fg font-semibold shadow-xs"
                    : "text-muted hover:bg-fg/[0.04] hover:text-fg"
                }`}
              >
                <Icon size={15} strokeWidth={active ? 2.2 : 1.8} className={active ? "text-fg" : "text-muted"} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-4">
          <div className="min-w-0 pl-1">
            <p className="truncate text-xs font-medium text-fg">{profile.name}</p>
            <p className="truncate text-[11px] text-muted capitalize">{profile.role}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <div className="scale-75">
              <ThemeToggle />
            </div>
            <button
              onClick={() => {
                logout();
                router.replace("/login");
              }}
              title="Sign out"
              aria-label="Sign out"
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-fg/[0.08] hover:text-fg"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="min-w-0 flex-1 overflow-auto bg-bg text-fg">{children}</div>
    </div>
  );
}
