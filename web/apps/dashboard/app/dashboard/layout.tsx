"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Bug, LayoutGrid, LogOut } from "lucide-react";
import { useAuth } from "../../lib/auth-context";

const LINKS = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid },
  { href: "/dashboard/crash-reports", label: "Crash Reports", icon: Bug },
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
        <p className="font-mono text-xs text-muted uppercase">Loading…</p>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col border-r border-line px-4 py-5">
        <div className="px-2">
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
          <button
            onClick={() => {
              logout();
              router.replace("/login");
            }}
            aria-label="Sign out"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-fg/[0.06] hover:text-fg"
          >
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
