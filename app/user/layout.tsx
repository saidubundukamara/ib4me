import React from "react";

export const metadata = {
  title: "User | IB4ME",
};

export default function UserLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen grid grid-cols-[240px_1fr]">
      <aside className="border-r p-4">
        <h1 className="font-semibold text-lg">My Account</h1>
        <nav className="mt-4 space-y-2">
          <a href="/user" className="block">Dashboard</a>
          <a href="/user/campaigns" className="block">My Campaigns</a>
          <a href="/user/donations" className="block">Donations</a>
          <a href="/user/withdrawals" className="block">Withdrawals</a>
          <a href="/user/notifications" className="block">Notifications</a>
          <a href="/user/settings" className="block">Settings</a>
        </nav>
      </aside>
      <main className="p-6">{children}</main>
    </div>
  );
}


