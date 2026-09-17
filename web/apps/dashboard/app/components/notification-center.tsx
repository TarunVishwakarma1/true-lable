"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  KeyRound,
  ShieldCheck,
  SlidersHorizontal,
  UserPlus,
  Bug,
  Info,
  ExternalLink,
} from "lucide-react";
import { api, type DashboardNotification } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";

function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSecs < 60) return "just now";
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

function getCategoryIcon(category: string) {
  switch (category) {
    case "user_registration":
      return <UserPlus size={14} className="text-accent" />;
    case "access_request":
      return <KeyRound size={14} className="text-amber-500" />;
    case "role_change":
      return <ShieldCheck size={14} className="text-blue-500" />;
    case "permission_change":
      return <SlidersHorizontal size={14} className="text-purple-500" />;
    case "crash_report":
      return <Bug size={14} className="text-red-500" />;
    default:
      return <Info size={14} className="text-muted" />;
  }
}

export function NotificationCenter() {
  const { token } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef<number>(0);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.notifications.list(token);
      setNotifications(res.items);
      setUnreadCount(res.unread_count);
      prevCountRef.current = res.unread_count;
    } catch {
      // Background poll failure is handled gracefully without disrupting the user
    }
  }, [token]);

  // Initial fetch and 12-second polling
  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications();
    }, 12000);

    const onFocus = () => fetchNotifications();
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    if (!token || unreadCount === 0 || loading) return;
    setLoading(true);
    try {
      await api.notifications.markAllRead(token);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notif: DashboardNotification) => {
    if (!token) return;

    if (!notif.is_read) {
      try {
        await api.notifications.markRead(token, notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // Continue navigation
      }
    }

    if (notif.link) {
      setIsOpen(false);
      router.push(notif.link);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        title="Notifications"
        aria-label="Notifications"
        className={`relative flex h-8 w-8 items-center justify-center rounded-lg border transition-all ${
          isOpen
            ? "border-accent/40 bg-accent/10 text-accent"
            : "border-line bg-surface/50 text-muted hover:border-fg/20 hover:bg-surface hover:text-fg"
        }`}
      >
        <Bell size={15} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-white shadow-xs animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-line bg-bg p-3 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-line px-2 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-fg">Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-accent/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-accent">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={loading}
                className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-muted transition-colors hover:bg-fg/[0.06] hover:text-fg"
              >
                <CheckCheck size={12} />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="mt-2 max-h-80 overflow-y-auto divide-y divide-line/40">
            {notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell size={24} className="mx-auto text-muted/40" />
                <p className="mt-2 text-xs font-medium text-fg">No notifications yet</p>
                <p className="mt-0.5 text-[11px] text-muted">
                  You&apos;re all caught up with recent activity.
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`group relative flex cursor-pointer gap-3 rounded-xl p-2.5 transition-all ${
                    notif.is_read
                      ? "hover:bg-surface/60 opacity-75 hover:opacity-100"
                      : "bg-surface/80 hover:bg-surface"
                  }`}
                >
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-bg border border-line">
                    {getCategoryIcon(notif.category)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p
                        className={`truncate text-xs ${
                          notif.is_read ? "font-medium text-fg" : "font-semibold text-fg"
                        }`}
                      >
                        {notif.title}
                      </p>
                      <span className="shrink-0 font-mono text-[10px] text-muted">
                        {formatRelativeTime(notif.created_at)}
                      </span>
                    </div>

                    <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-muted">
                      {notif.message}
                    </p>

                    {notif.link && (
                      <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-accent">
                        <span>View details</span>
                        <ExternalLink size={10} />
                      </div>
                    )}
                  </div>

                  {!notif.is_read && (
                    <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
