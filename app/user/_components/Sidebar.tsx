"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

function Icon({ name }: { name: "home" | "campaigns" | "donations" | "withdrawals" | "notifications" | "settings" }) {
  const common = "w-5 h-5";
  switch (name) {
    case "home":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M3 11.5 12 4l9 7.5"/>
          <path d="M5 10.75V20h14v-9.25"/>
        </svg>
      );
    case "campaigns":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 5h16v4H4z"/>
          <path d="M4 11h10v8H4z"/>
          <path d="M16 15h4v4h-4z"/>
        </svg>
      );
    case "donations":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 21s-7-4.35-7-10a7 7 0 0 1 14 0c0 5.65-7 10-7 10z"/>
        </svg>
      );
    case "withdrawals":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 7h16"/>
          <path d="M7 11h10v8H7z"/>
          <path d="M10 11V7h4v4"/>
        </svg>
      );
    case "notifications":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 6-3 8h18c0-2-3  -1-3-8z"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
      );
    case "settings":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 .6 1.65 1.65 0 0 0-.33 1.82l.02.08a2 2 0 1 1-3.38 0l.02-.08A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1-.6 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-.6-1 1.65 1.65 0 0 0-1.82-.33l-.08.02a2 2 0 1 1 0-3.38l.08.02A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0 .6-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6c.31-.04.62-.02.9.06.32.09.67.03.94-.18l.06-.05a2 2 0 1 1 2.2 3.26l-.06.05c-.27.21-.39.55-.3.88.08.28.1.59.06.9a1.65 1.65 0 0 0 .6 1c.27.2.45.5.51.82.06.33.22.64.48.86.26.22.58.35.92.36.32.01.62.13.85.35.23.22.38.52.43.84.05.33.2.63.44.86.24.24.54.39.87.44.32.05.62.2.84.43.22.23.34.53.35.85z"/>
        </svg>
      );
  }
}

export function Sidebar() {
  const pathname = usePathname();

  const items: NavItem[] = [
    { href: "/user", label: "Dashboard", icon: <Icon name="home" /> },
    { href: "/user/campaigns", label: "My Campaigns", icon: <Icon name="campaigns" /> },
    { href: "/user/donations", label: "Donations", icon: <Icon name="donations" /> },
    { href: "/user/withdrawals", label: "Withdrawals", icon: <Icon name="withdrawals" /> },
    { href: "/user/notifications", label: "Notifications", icon: <Icon name="notifications" /> },
    { href: "/user/settings", label: "Settings", icon: <Icon name="settings" /> }
  ];

  return (
    <aside className="sticky top-0 h-screen p-4 border-r bg-white">
      <div className="flex items-center gap-2 px-2">
        <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500" />
        <span className="font-semibold">IB4ME</span>
      </div>
      <nav className="mt-6 space-y-1">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== "/user" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} className={`group flex items-center gap-3 px-3 py-2 rounded-xl transition-colors hover:bg-indigo-50 ${active ? "bg-indigo-100 text-indigo-700" : "text-slate-700"}`}>
              <span className={`transition-transform group-hover:scale-110 ${active ? "text-indigo-700" : "text-slate-600"}`}>{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-6 rounded-xl p-3 bg-gradient-to-br from-indigo-600 to-sky-500 text-white shadow-lg">
        <p className="text-xs opacity-90">Tip</p>
        <p className="text-sm mt-1 leading-5">Create a campaign and share to start receiving donations.</p>
      </div>
    </aside>
  );
}

export default Sidebar;


