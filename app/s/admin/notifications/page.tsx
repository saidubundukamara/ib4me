import { Bell } from "lucide-react";

export default function AdminNotificationsPage() {
  return (
    <div className="font-Sora space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Notifications</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage system alerts and message templates.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-border bg-muted/30">
        <div
          className="flex items-center justify-center w-20 h-20 rounded-full mb-6"
          style={{ backgroundColor: "#FF600020" }}
        >
          <Bell className="w-10 h-10" style={{ color: "#FF6000" }} />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Notifications Coming Soon
        </h3>
        <p className="text-muted-foreground text-center max-w-sm">
          System notification management and message template configuration features are being developed. Check back soon.
        </p>
      </div>
    </div>
  );
}
