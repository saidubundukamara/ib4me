import React from "react";
import Link from "next/link";

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
          <Link href="/admin" className="block">Dashboard</Link>
          <Link href="/admin/campaigns" className="block">Campaigns</Link>
          <Link href="/admin/donations" className="block">Donations</Link>
          <Link href="/admin/payouts" className="block">Payouts</Link>
          <Link href="/admin/hospitals" className="block">Hospitals</Link>
          <Link href="/admin/users" className="block">Users</Link>
          <Link href="/admin/notifications" className="block">Notifications</Link>
          <Link href="/admin/audit-logs" className="block">Audit Logs</Link>
          <Link href="/admin/analytics" className="block">Analytics</Link>
        </nav>
      </aside>
      <main className="p-6">{children}</main>
    </div>
  );
}


