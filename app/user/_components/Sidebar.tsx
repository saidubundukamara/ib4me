"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FolderOpen, Heart, CreditCard, Bell, Settings, HelpCircle } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { icon: Home, label: "Dashboard", path: "/user" },
    { icon: FolderOpen, label: "My Campaigns", path: "/user/campaigns" },
    { icon: Heart, label: "My Donations", path: "/user/donations" },
    { icon: CreditCard, label: "Withdrawals", path: "/user/withdrawals" },
    { icon: Bell, label: "Notifications", path: "/user/notifications" },
    { icon: Settings, label: "Settings", path: "/user/settings" },
    { icon: HelpCircle, label: "Help", path: "/user/help" }
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="space-y-1" aria-label="Profile navigation">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.path);
        
        return (
          <Link
            key={item.path}
            href={item.path}
            className={`flex items-center gap-3 px-4 py-3 my-2 rounded-xl transition-all ${
              active
                ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            <span className="font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default Sidebar;


