import { BarChart2 } from "lucide-react";

export default function AdminAnalyticsPage() {
  return (
    <div className="font-Sora space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Analytics Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of key metrics and platform performance.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-border bg-muted/30">
        <div
          className="flex items-center justify-center w-20 h-20 rounded-full mb-6"
          style={{ backgroundColor: "#00712D20" }}
        >
          <BarChart2 className="w-10 h-10" style={{ color: "#00712D" }} />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Analytics Coming Soon
        </h3>
        <p className="text-muted-foreground text-center max-w-sm">
          Detailed analytics and reporting features are currently being built. Check back soon for real-time insights on donations, campaigns, and user activity.
        </p>
        <div className="mt-8 flex gap-6 text-center">
          <div className="space-y-1">
            <div className="text-2xl font-bold" style={{ color: "#00712D" }}>—</div>
            <div className="text-xs text-muted-foreground">Total Donations</div>
          </div>
          <div className="w-px bg-border" />
          <div className="space-y-1">
            <div className="text-2xl font-bold" style={{ color: "#FF6000" }}>—</div>
            <div className="text-xs text-muted-foreground">Active Campaigns</div>
          </div>
          <div className="w-px bg-border" />
          <div className="space-y-1">
            <div className="text-2xl font-bold" style={{ color: "#80E10A" }}>—</div>
            <div className="text-xs text-muted-foreground">Platform Users</div>
          </div>
        </div>
      </div>
    </div>
  );
}
