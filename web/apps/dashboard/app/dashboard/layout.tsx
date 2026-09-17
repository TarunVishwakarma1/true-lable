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

// One stroke weight for every icon in the console. The old shell mixed 1.8,
// 2.2 and 2.5, which is why the sidebar never looked like one set.
const STROKE = 1.75;

const LINKS = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid, restrictedForNewUsers: true },
  { href: "/dashboard/crash-reports", label: "Crash reports", icon: Bug, restrictedForNewUsers: false },
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
      <main className="flex h-dvh items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-9 w-9 rounded-[10px]" />
          <Skeleton className="h-2.5 w-24" />
        </div>
      </main>
    );
  }

  const isNewUser = profile.role === "new-user";
  const currentLink = LINKS.find((l) =>
    l.href === "/dashboard" ? pathname === l.href : pathname.startsWith(l.href)
  );
  const isRestrictedPath = isNewUser && currentLink?.restrictedForNewUsers;

  return (
    <div className="flex h-dvh overflow-hidden bg-bg text-fg">
      <aside className="flex h-full w-[248px] shrink-0 flex-col border-r border-line px-3 py-5">
        <Link
          href="/dashboard"
          className="pressable flex items-center gap-2.5 rounded-[10px] px-3 py-1.5 hover:bg-hover"
        >
          <Image
            src="/brand/logo-light.png"
            alt=""
            width={26}
            height={26}
            className="h-[26px] w-[26px] rounded-[7px] dark:hidden"
          />
          <Image
            src="/brand/logo-dark.png"
            alt=""
            width={26}
            height={26}
            className="hidden h-[26px] w-[26px] rounded-[7px] dark:block"
          />
          <span className="display text-[19px] text-fg">
            True<span className="text-fg3">Label</span>
          </span>
        </Link>

        <p className="eyebrow mt-7 px-3">Operations</p>

        <nav className="mt-2.5 flex flex-col gap-0.5">
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
                aria-current={active ? "page" : undefined}
                className={`pressable group relative flex items-center justify-between rounded-[10px] py-2 pl-3 pr-2.5 text-[13px] ${
                  active
                    ? "bg-accent-soft font-medium text-fg"
                    : "text-fg2 hover:bg-hover hover:text-fg"
                }`}
              >
                {/* The marker, not another background wash — it reads at a
                    glance even when the tint is this quiet. */}
                {active && (
                  <span
                    className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-accent"
                    aria-hidden
                  />
                )}
                <span className="flex items-center gap-2.5">
                  <Icon
                    size={15}
                    strokeWidth={STROKE}
                    className={active ? "text-fg" : "text-fg3 group-hover:text-fg2"}
                  />
                  <span>{link.label}</span>
                </span>
                {locked && <Lock size={11} strokeWidth={STROKE} className="text-fg3" />}
              </Link>
            );
          })}
        </nav>

        {isNewUser && (
          <div className="mt-7 rounded-[14px] border border-line bg-surface p-3.5">
            <p className="text-[13px] font-medium text-fg">Limited access</p>
            <p className="mt-1 text-[12px] leading-relaxed text-fg3">
              You can read crash reports. Everything else needs an upgrade.
            </p>
            <button
              onClick={() => setAccessModalOpen(true)}
              className="pressable mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-[9px] bg-accent px-2.5 py-1.5 text-[12px] font-medium text-on-accent hover:opacity-90"
            >
              <KeyRound size={12} strokeWidth={STROKE} />
              <span>Request upgrade</span>
            </button>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-4">
          <div className="min-w-0 pl-1.5">
            <p className="truncate text-[13px] font-medium text-fg">{profile.name}</p>
            <p className="eyebrow mt-1">{profile.role}</p>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
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
              className="pressable flex h-7 w-7 items-center justify-center rounded-[9px] text-fg3 hover:bg-hover hover:text-fg"
            >
              <LogOut size={14} strokeWidth={STROKE} />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex h-full min-w-0 flex-1 flex-col">
        <header className="z-30 flex h-14 shrink-0 items-center justify-between border-b border-line bg-bg/85 px-8 backdrop-blur-md">
          <div className="flex items-baseline gap-2.5">
            <span className="eyebrow">Dashboard</span>
            <span className="text-fg3">/</span>
            <span className="display text-[17px] text-fg">{currentLink?.label ?? "Overview"}</span>
          </div>

          <NotificationCenter />
        </header>

        <main id="main" className="h-full min-w-0 flex-1 overflow-y-auto">
          {isRestrictedPath ? (
            <RestrictedAccessView resourceName={currentLink?.label} />
          ) : (
            children
          )}
        </main>
      </div>

      <RequestAccessModal isOpen={accessModalOpen} onClose={() => setAccessModalOpen(false)} />
    </div>
  );
}
