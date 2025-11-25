"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import NotificationPopover from "./NotificationPopover";
import { logout } from "@/lib/authClient";
import { toast } from "sonner";
import ib4meLogo from "../../../public/assets/ib4melogo.png";

type Notification = {
  id: string;
  type: string;
  message: string;
  date: string;
  read: boolean;
};

type HeaderProps = {
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
};

export default function Header({
  sidebarOpen = false,
  onToggleSidebar,
}: HeaderProps) {
  const router = useRouter();
  const [notifications, setNotifications] = React.useState<Notification[]>([]);

  const handleLogout = async () => {
    await logout();
    toast("Logged out", {
      description: "You have been successfully logged out.",
    });
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src={ib4meLogo}
            alt="ib4me logo"
            className="h-10 w-auto"
            priority
          />
        </Link>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label={sidebarOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => onToggleSidebar?.()}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>

          <NotificationPopover
            notifications={notifications}
            onMarkAsRead={(id) =>
              setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
              )
            }
            onMarkAllAsRead={() =>
              setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
            }
            onDelete={(id) =>
              setNotifications((prev) => prev.filter((n) => n.id !== id))
            }
          />

          <Button
            variant="outline"
            className="rounded-full border-primary/40 text-primary hover:bg-primary hover:text-white"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
