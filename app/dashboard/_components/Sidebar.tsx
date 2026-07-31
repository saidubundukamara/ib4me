"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useNotifications } from "./NotificationsContext";
import {
  Home,
  FolderOpen,
  Heart,
  CreditCard,
  Bell,
  Settings,
  HelpCircle,
  ShieldCheck,
  Building,
  MessageSquareQuote,
} from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import Ib4meLogo from "@/public/assets/ib4melogo.png";
import { cn } from "@/lib/utils";

type SidebarProps = {
  className?: string;
  onNavigate?: () => void;
  variant?: "desktop" | "mobile";
};

const menuItems = [
  { icon: Home, label: "Dashboard", path: "/dashboard" },
  { icon: FolderOpen, label: "My Campaigns", path: "/dashboard/campaigns" },
  { icon: ShieldCheck, label: "Verification", path: "/dashboard/verification" },
  { icon: Building, label: "Organization", path: "/dashboard/organization" },
  { icon: MessageSquareQuote, label: "Testimonials", path: "/dashboard/testimonials" },
  { icon: Heart, label: "My Donations", path: "/dashboard/donations" },
  { icon: CreditCard, label: "Withdrawals", path: "/dashboard/withdrawals" },
  { icon: Bell, label: "Notifications", path: "/dashboard/notifications" },
  { icon: Settings, label: "Settings", path: "/dashboard/settings" },
  { icon: HelpCircle, label: "Help", path: "/dashboard/help" },
];

export function Sidebar({ className, onNavigate, variant = "desktop" }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isMobileVariant = variant === "mobile";
  const { unreadCount } = useNotifications();

  const name = session?.user?.name ?? "Your ib4me space";
  const email = session?.user?.email ?? "Manage your impact";
  const avatarUrl = session?.user?.image ?? null;
  const avatarSeed = session?.user?.id ?? name;

  const filteredMenuItems = menuItems.filter((item) => {
    if (item.path === "/dashboard/organization") {
      return session?.user?.roles === "Organization";
    }
    return true;
  });

  return (
    <div
      className={cn(
        "flex h-full flex-col border border-border/40 bg-white/90 backdrop-blur",
        isMobileVariant
          ? "rounded-2xl p-4 shadow-[0_18px_38px_-30px_rgba(15,23,42,0.55)]"
          : "rounded-3xl p-6 shadow-[0_35px_65px_-45px_rgba(15,23,42,0.55)]",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center gap-3 rounded-2xl bg-primary/5 px-4 py-3",
          isMobileVariant && "gap-2 rounded-xl px-3 py-2",
        )}
      >
        <Image
          src={Ib4meLogo}
          alt="ib4me logo"
          className={cn("h-10 w-auto", isMobileVariant && "h-8")}
          priority
        />
        <div>
          <p
            className={cn(
              "leading-tight text-sm font-semibold text-primary",
              isMobileVariant && "text-xs",
            )}
          >
            ib4me Dashboard
          </p>
          <p
            className={cn(
              "text-xs text-muted-foreground leading-tight",
              isMobileVariant && "text-[11px]",
            )}
          >
            <span className="italic font-Sora">Help Start Ya</span>
          </p>
        </div>
      </div>

      <nav
        className={cn(
          "mt-8 flex flex-col gap-2",
          isMobileVariant && "mt-6 gap-1.5",
        )}
        aria-label="Dashboard navigation"
      >
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.path;

          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-primary text-white shadow-[0_8px_20px_-8px_rgba(36,173,85,0.45)]"
                  : "text-muted-foreground hover:bg-primary/10 hover:text-primary",
                isMobileVariant && "rounded-xl px-3 py-2 text-sm",
              )}
              aria-current={active ? "page" : undefined}
            >
              <span className="relative inline-flex shrink-0">
                <Icon
                  className={cn(
                    "h-5 w-5 transition-colors",
                    active
                      ? "text-white"
                      : "text-muted-foreground/70 group-hover:text-primary",
                    isMobileVariant && "h-[18px] w-[18px]",
                  )}
                  aria-hidden="true"
                />
                {item.path === "/dashboard/notifications" && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground leading-none">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div
        className={cn(
          "mt-auto sm:mt-10 rounded-2xl border border-border/40 bg-muted/40 p-4",
          isMobileVariant && "rounded-xl p-3",
        )}
      >
        <div className="flex items-center gap-3">
          <UserAvatar
            photoUrl={avatarUrl}
            seed={avatarSeed}
            name={name}
            className={cn("h-10 w-10", isMobileVariant && "h-9 w-9")}
            imgClassName="object-cover"
          />
          <div className="min-w-0">
            <p
              className={cn(
                "truncate text-sm font-semibold text-foreground",
                isMobileVariant && "text-sm",
              )}
            >
              {name}
            </p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
