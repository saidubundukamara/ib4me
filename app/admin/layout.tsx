import React from "react";

export const metadata = {
  title: "Admin | IB4ME",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen grid grid-cols-[240px_1fr]">
      <aside className="border-r p-4">
        <h1 className="font-semibold text-lg">Admin</h1>
        <nav className="mt-4 space-y-2">
          <a href="/admin" className="block">Dashboard</a>
          <a href="/admin/campaigns" className="block">Campaigns</a>
          <a href="/admin/donations" className="block">Donations</a>
          <a href="/admin/payouts" className="block">Payouts</a>
          <a href="/admin/hospitals" className="block">Hospitals</a>
          <a href="/admin/users" className="block">Users</a>
          <a href="/admin/notifications" className="block">Notifications</a>
          <a href="/admin/audit-logs" className="block">Audit Logs</a>
          <a href="/admin/analytics" className="block">Analytics</a>
        </nav>
      </aside>
      <main className="p-6">{children}</main>
    </div>
  );
}


