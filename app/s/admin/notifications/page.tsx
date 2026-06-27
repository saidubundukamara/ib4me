"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, Check, RefreshCw } from "lucide-react";

interface AdminNotification {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link?: string | null;
  createdAt: string;
}

const TYPE_ICONS: Record<string, string> = {
  donation: "💰",
  payout: "💸",
  campaign: "📢",
  verification: "✅",
  system: "🔔",
};

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  donation: { bg: "#FF600010", text: "#FF6000" },
  payout: { bg: "#00712D10", text: "#00712D" },
  campaign: { bg: "#3B82F610", text: "#3B82F6" },
  verification: { bg: "#80E10A10", text: "#6B9E00" },
  system: { bg: "#FBB03B10", text: "#C07800" },
};

type FilterType = "all" | "unread" | "donation" | "payout" | "campaign" | "verification" | "system";

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications?limit=100");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await fetch("/api/admin/notifications/mark-all-read", { method: "PUT" }).catch(() => {});
  };

  const filtered = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.read;
    return n.type === filter;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filterOptions: { value: FilterType; label: string }[] = [
    { value: "all", label: "All" },
    { value: "unread", label: `Unread (${unreadCount})` },
    { value: "donation", label: "Donations" },
    { value: "payout", label: "Payouts" },
    { value: "campaign", label: "Campaigns" },
    { value: "verification", label: "Verification" },
    { value: "system", label: "System" },
  ];

  return (
    <div className="font-Sora space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Notifications</h2>
          <p className="text-sm text-muted-foreground mt-1">
            System alerts, new donations, payout requests, and verifications.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => { setLoading(true); fetchNotifications(); }}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filter === opt.value
                ? "text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
            style={filter === opt.value ? { backgroundColor: "#00712D" } : undefined}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-border bg-muted/30">
          <div
            className="flex items-center justify-center w-20 h-20 rounded-full mb-6"
            style={{ backgroundColor: "#FF600020" }}
          >
            <Bell className="w-10 h-10" style={{ color: "#FF6000" }} />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {filter === "all" ? "No notifications yet" : `No ${filter} notifications`}
          </h3>
          <p className="text-muted-foreground text-center max-w-sm">
            {filter === "all"
              ? "System alerts, new donations, and payout requests will appear here."
              : "Try switching to a different filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => {
            const color = TYPE_COLORS[n.type] ?? { bg: "#00712D10", text: "#00712D" };
            return (
              <div
                key={n._id}
                className={`group flex items-start gap-4 p-4 rounded-xl border transition-all ${
                  !n.read ? "bg-[#00712D04] border-[#00712D20]" : "bg-background border-border"
                }`}
              >
                {/* Icon */}
                <div
                  className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-xl"
                  style={{ backgroundColor: color.bg }}
                >
                  {TYPE_ICONS[n.type] ?? "🔔"}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold text-foreground ${!n.read ? "" : "font-medium"}`}>
                    {n.title}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {new Date(n.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>

                {/* Unread dot */}
                {!n.read && (
                  <div
                    className="mt-2 flex-shrink-0 h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: "#00712D" }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
