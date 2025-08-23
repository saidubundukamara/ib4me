import React from "react";

import Link from "next/link";

import Sidebar from "./_components/Sidebar";
import Header from "./_components/Header";
import PageTransition from "./_components/PageTransition";


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
          <Link href="/user" className="block">Dashboard</Link>
          <Link href="/user/campaigns" className="block">My Campaigns</Link>
          <Link href="/user/donations" className="block">Donations</Link>
          <Link href="/user/withdrawals" className="block">Withdrawals</Link>
          <Link href="/user/notifications" className="block">Notifications</Link>
          <Link href="/user/settings" className="block">Settings</Link>
        </nav>
      </aside>
      <main className="p-6">{children}</main>
    </div>
  );
}


