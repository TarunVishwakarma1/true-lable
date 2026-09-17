"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  BookOpen,
  Bug,
  CircleUser,
  KeyRound,
  LayoutGrid,
  Lock,
  LogOut,
  Package,
  Users,
} from "lucide-react";
import { ThemeToggle } from "@repo/ui/theme-toggle";
import { useAuth } from "../../lib/auth-context";
import { Skeleton } from "../components/skeleton";
import { RestrictedAccessView, RequestAccessModal } from "../components/request-access";
import { NotificationCenter } from "../components/notification-center";

const LINKS = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid, restrictedForNewUsers: true },
  { href: "/dashboard/crash-reports", label: "Crash Reports", icon: Bug, restrictedForNewUsers: false },
  { href: "/dashboard/products", label: "Products", icon: Package, restrictedForNewUsers: true },
  { href: "/dashboard/users", label: "Users", icon: CircleUser, restrictedForNewUsers: true },
  { href: "/dashboard/team", label: "Team", icon: Users, restrictedForNewUsers: true },
  { href: "/dashboard/activity", label: "Activity", icon: Activity, restrictedForNewUsers: true },
  { href: "/dashboard/resources", label: "Resources", icon: BookOpen, restrictedForNewUsers: true },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [accessModalOpen, setAccessModalOpen] = useState(false);

  useEffect(() => {
    if (!loading && !profile) router.replace("/login");
  }, [loading, profile, router]);

  if (loading || !profile) {
    return (
      <main className="flex h-screen items-center justify-center bg-bg text-fg">
        <Skeleton className="h-8 w-8 rounded-full" />
      </main>
    );
  }

  const isNewUser = profile.role === "new-user";
  const currentLink = LINKS.find((l) =>
    l.href === "/dashboard" ? pathname === l.href : pathname.startsWith(l.href)
  );
  const isRestrictedPath = isNewUser && currentLink?.restrictedForNewUsers;

  return (
    <div className="flex h-screen overflow-hidden bg-bg text-fg">
      {/* Fixed Sidebar with independent scroll */}
      <aside className="flex h-full w-60 shrink-0 flex-col border-r border-line bg-bg px-4 py-5 overflow-y-auto">
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
            const locked = isNewUser && link.restrictedForNewUsers;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-all ${
                  active
                    ? "bg-fg/[0.08] text-fg font-semibold shadow-xs"
                    : "text-muted hover:bg-fg/[0.04] hover:text-fg"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={15} strokeWidth={active ? 2.2 : 1.8} className={active ? "text-fg" : "text-muted"} />
                  <span>{link.label}</span>
                </div>
                {locked && (
                  <Lock size={12} className="text-muted/60" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* New-User Elevation Banner in Sidebar */}
        {isNewUser && (
          <div className="mt-6 rounded-xl border border-line bg-surface/60 p-3 text-xs">
            <p className="font-medium text-fg">Limited Access</p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">
              You have view access to Crash Reports. Need more permissions?
            </p>
            <button
              onClick={() => setAccessModalOpen(true)}
              className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-fg px-2.5 py-1.5 text-[11px] font-medium text-bg hover:opacity-90 shadow-xs"
            >
              <KeyRound size={12} />
              <span>Request Upgrade</span>
            </button>
          </div>
        )}

        {/* User Footer */}
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-4">
          <div className="min-w-0 pl-1">
            <p className="truncate text-xs font-medium text-fg">{profile.name}</p>
            <span className={`inline-block rounded-md px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
              profile.role === "admin"
                ? "bg-accent/15 text-accent"
                : profile.role === "member"
                ? "bg-fg/[0.08] text-fg"
                : "bg-amber-500/15 text-amber-500"
            }`}>
              {profile.role}
            </span>
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

      {/* Main Area with Top Header and independent vertical scroll */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-bg text-fg">
        {/* Top Header Bar */}
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-line px-6 bg-bg/80 backdrop-blur-md z-30">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted">Dashboard</span>
            <span className="text-muted/40">/</span>
            <span className="text-xs font-semibold text-fg">{currentLink?.label ?? "Overview"}</span>
          </div>

          <div className="flex items-center gap-3">
            <NotificationCenter />
          </div>
        </header>

        {/* Main Content Pane */}
        <div className="flex-1 h-full min-w-0 overflow-y-auto bg-bg text-fg">
          {isRestrictedPath ? (
            <RestrictedAccessView resourceName={currentLink?.label} />
          ) : (
            children
          )}
        </div>
      </div>

      <RequestAccessModal
        isOpen={accessModalOpen}
        onClose={() => setAccessModalOpen(false)}
      />
    </div>
  );
}


