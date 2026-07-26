"use client";

import { Bell, Check, CheckCheck, Trash2, Info, Heart, Banknote, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/app/dashboard/_components/NotificationsContext";
import { toast } from "sonner";

function timeAgo(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const secs = Math.floor(diff / 1000);
    if (secs < 60) return "just now";
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    return `${Math.floor(months / 12)}y ago`;
  } catch {
    return dateStr;
  }
}

const typeIcon: Record<string, React.ReactNode> = {
  donation: <Banknote className="w-4 h-4" style={{ color: "#FF6000" }} />,
  campaign: <Heart className="w-4 h-4" style={{ color: "#00712D" }} />,
  verification: <ShieldCheck className="w-4 h-4" style={{ color: "#80E10A" }} />,
  system: <Info className="w-4 h-4" style={{ color: "#FBB03B" }} />,
};

const typeBg: Record<string, string> = {
  donation: "#FF600012",
  campaign: "#00712D12",
  verification: "#80E10A12",
  system: "#FBB03B12",
};

export default function UserNotificationsPage() {
  const { notifications, markAsRead, markAllAsRead, deleteNotification, unreadCount } =
    useNotifications();

  const unread = notifications.filter((n) => !n.read);
  const read = notifications.filter((n) => n.read);

  return (
    <div className="flex w-full flex-col gap-6 font-Sora">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Notifications</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 rounded-xl border-border text-sm"
            onClick={markAllAsRead}
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: "#00712D12" }}
          >
            <Bell className="h-8 w-8" style={{ color: "#00712D" }} />
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">No notifications yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              We&apos;ll notify you about campaign updates, donations, and more.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Unread */}
          {unread.length > 0 && (
            <section className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">
                New
              </p>
              {unread.map((n) => (
                <NotificationRow
                  key={n.id}
                  notification={n}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                />
              ))}
            </section>
          )}

          {/* Read */}
          {read.length > 0 && (
            <section className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">
                Earlier
              </p>
              {read.map((n) => (
                <NotificationRow
                  key={n.id}
                  notification={n}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                />
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function NotificationRow({
  notification,
  onMarkAsRead,
  onDelete,
}: {
  notification: { id: string; type: string; message: string; date: string; read: boolean };
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const relativeTime = timeAgo(notification.date);

  const handleDelete = () => {
    onDelete(notification.id);
    toast("Notification deleted", {
      action: {
        label: "Undo",
        onClick: () => {
          // Undo is best-effort: re-fetch will restore if the API delete hasn't fired yet.
          // The context's deleteNotification is optimistic, so we just reload notifications.
          window.location.reload();
        },
      },
      duration: 4000,
    });
  };

  return (
    <div
      className={`flex items-start gap-4 rounded-2xl border border-border p-4 transition-all hover:shadow-sm ${
        !notification.read ? "bg-[#00712D06] border-[#00712D20]" : "bg-background"
      }`}
    >
      {/* Icon */}
      <div
        className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: typeBg[notification.type] ?? "#00712D12" }}
      >
        {typeIcon[notification.type] ?? <Bell className="w-4 h-4" style={{ color: "#00712D" }} />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${!notification.read ? "font-semibold text-foreground" : "text-foreground/80"}`}>
          {notification.message}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{relativeTime}</p>
      </div>

      {/* Actions — always visible */}
      <div className="flex flex-shrink-0 items-center gap-1">
        {!notification.read && (
          <button
            onClick={() => onMarkAsRead(notification.id)}
            className="rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Mark as read"
            aria-label="Mark as read"
          >
            <Check className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={handleDelete}
          className="rounded-lg p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          title="Delete"
          aria-label="Delete notification"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Unread dot */}
      {!notification.read && (
        <div className="mt-2 flex-shrink-0 h-2 w-2 rounded-full" style={{ backgroundColor: "#00712D" }} />
      )}
    </div>
  );
}

