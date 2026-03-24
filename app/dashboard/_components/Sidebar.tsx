"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

  const name = session?.user?.name ?? "Your ib4me space";
  const email = session?.user?.email ?? "Manage your impact";
  const avatarUrl = session?.user?.image ?? undefined;
  const initial = name.trim().charAt(0).toUpperCase();

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
                  ? "bg-gradient-to-r from-primary to-primary/90 text-white shadow-[0_20px_38px_-24px_rgba(36,173,85,0.65)]"
                  : "text-muted-foreground hover:bg-primary/10 hover:text-primary",
                isMobileVariant && "rounded-xl px-3 py-2 text-sm",
              )}
              aria-current={active ? "page" : undefined}
            >
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
          <Avatar className={cn("h-10 w-10", isMobileVariant && "h-9 w-9")}>
            <AvatarImage
              src={avatarUrl}
              alt={name || "User avatar"}
              className="object-cover"
            />
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
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
        <p
          className={cn(
            "mt-3 text-xs text-muted-foreground/80",
            isMobileVariant && "mt-2 text-[11px]",
          )}
        >
          Track your campaigns, donations, and withdrawals all in one place.
        </p>
      </div>
    </div>
  );
}

export default Sidebar;
