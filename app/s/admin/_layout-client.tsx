"use client";

import { useAuth } from "@/lib/auth-provider";
import { SettingsProvider } from "@/lib/settings-provider";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Logo from "@/public/assets/ib4melogowhite.png";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

interface DropdownItem {
  name: string;
  href: string;
  current: boolean;
}

interface NavigationItem {
  name: string;
  href?: string;
  icon: string;
  current: boolean;
  isDropdown?: boolean;
  dropdownItems?: DropdownItem[];
}

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, setUser, setAccessToken } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifCount, setNotifCount] = useState(0);

  // Check if current route is a public admin route (login, forgot-password)
  const isPublicAdminRoute =
    pathname === "/s/admin/login" || pathname === "/s/admin/forgot-password";

  useEffect(() => {
    if (
      !isPublicAdminRoute &&
      !isLoading &&
      (!user || (user.role !== "Admin" && user.role !== "SuperAdmin"))
    ) {
      router.push("/s/admin/login");
    }
  }, [user, isLoading, router, isPublicAdminRoute]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (userDropdownOpen) setUserDropdownOpen(false);
      if (notifOpen) setNotifOpen(false);
    };
    if (userDropdownOpen || notifOpen) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => document.removeEventListener("click", handleClickOutside);
  }, [userDropdownOpen, notifOpen]);

  // Fetch recent notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/admin/notifications?limit=5");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
          setNotifCount(data.unreadCount ?? (data.notifications?.filter((n: Notification) => !n.read).length ?? 0));
        }
      } catch {
        // silent fail — notifications are non-critical
      }
    };
    if (!isPublicAdminRoute && user) fetchNotifications();
  }, [user, isPublicAdminRoute]);

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      setUser(null);
      setAccessToken(null);
      router.push("/s/admin/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const navigation = [
    {
      name: "MAIN",
      items: [
        { name: "Dashboard", href: "/s/admin", icon: "dashboard", current: pathname === "/s/admin" },
        { name: "Campaigns", href: "/s/admin/campaigns", icon: "campaigns", current: pathname.startsWith("/s/admin/campaigns") },
        { name: "Verifications", href: "/s/admin/verifications", icon: "verifications", current: pathname.startsWith("/s/admin/verifications") },
        { name: "Testimonials", href: "/s/admin/testimonials", icon: "testimonials", current: pathname.startsWith("/s/admin/testimonials") },
        { name: "Donations", href: "/s/admin/donations", icon: "donations", current: pathname.startsWith("/s/admin/donations") },
        { name: "Tips", href: "/s/admin/tips", icon: "tips", current: pathname.startsWith("/s/admin/tips") },
        { name: "Payouts", href: "/s/admin/payouts", icon: "payouts", current: pathname.startsWith("/s/admin/payouts") },
        { name: "Hospitals", href: "/s/admin/hospitals", icon: "hospitals", current: pathname.startsWith("/s/admin/hospitals") },
        { name: "Partners", href: "/s/admin/partners", icon: "partners", current: pathname.startsWith("/s/admin/partners") },
        { name: "Categories", href: "/s/admin/categories", icon: "categories", current: pathname.startsWith("/s/admin/categories") },
        { name: "Users", href: "/s/admin/users", icon: "users", current: pathname.startsWith("/s/admin/users") },
      ],
    },
    {
      name: "REPORTS",
      items: [
        { name: "Analytics", href: "/s/admin/analytics", icon: "analytics", current: pathname.startsWith("/s/admin/analytics") },
        { name: "Audit Logs", href: "/s/admin/audit-logs", icon: "audit", current: pathname.startsWith("/s/admin/audit-logs") },
      ],
    },
    {
      name: "MANAGEMENT",
      items: [
        { name: "Admin Users", href: "/s/admin/admins", icon: "admins", current: pathname.startsWith("/s/admin/admins") },
        { name: "Notifications", href: "/s/admin/notifications", icon: "notifications", current: pathname.startsWith("/s/admin/notifications") },
        { name: "Settings", href: "/s/admin/settings", icon: "settings", current: pathname.startsWith("/s/admin/settings") },
      ],
    },
  ];

  const getIcon = (iconName: string) => {
    const icons: Record<string, React.ReactNode> = {
      dashboard: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM14 5a1 1 0 011-1h4a1 1 0 011 1v10a1 1 0 01-1 1h-4a1 1 0 01-1-1V5z" />
        </svg>
      ),
      campaigns: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      verifications: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      donations: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      payouts: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      tips: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
        </svg>
      ),
      hospitals: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      categories: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
      users: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      analytics: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      audit: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      notifications: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-3.5-3.5a8.97 8.97 0 01-1.5-5 8.5 8.5 0 00-17 0 8.97 8.97 0 01-1.5 5L0 17h5m10 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
      admins: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      settings: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      testimonials: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      partners: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    };
    return icons[iconName] ?? icons.dashboard;
  };

  // Loading state for protected routes
  if (isLoading && !isPublicAdminRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center font-Sora" style={{ backgroundColor: "#f8faf8" }}>
        <div className="text-center space-y-4">
          <div className="mx-auto h-14 w-14 rounded-full flex items-center justify-center" style={{ backgroundColor: "#00712D15" }}>
            <svg className="h-7 w-7 animate-spin" style={{ color: "#00712D" }} fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <p className="text-sm font-medium" style={{ color: "#00712D" }}>Loading admin panel…</p>
        </div>
      </div>
    );
  }

  // Public admin routes (login, forgot-password) — no layout
  if (isPublicAdminRoute) {
    return <>{children}</>;
  }

  // Not authenticated
  if (!user || (user.role !== "Admin" && user.role !== "SuperAdmin")) {
    return null;
  }

  const initials = user.name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2);

  return (
    <SettingsProvider>
      <div className="h-screen flex overflow-hidden font-Sora bg-muted/30">
        {/* ── Sidebar ── */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col transform ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0`}
          style={{ backgroundColor: "#004d1f" }}
        >
          {/* Logo bar */}
          <div
            className="flex h-16 flex-shrink-0 items-center justify-center px-4"
            style={{ backgroundColor: "#003918" }}
          >
            <Link href="/" className="flex items-center gap-3">
              <Image src={Logo} alt="ib4me" className="h-9 w-auto" />
              <span className="text-sm font-semibold text-white/60 tracking-wider uppercase">Admin</span>
            </Link>
          </div>

          {/* User profile strip */}
          <div className="flex-shrink-0 px-4 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white flex-shrink-0"
                style={{ backgroundColor: "#FF6000" }}
              >
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                <p className="text-xs text-white/50">{user.role}</p>
              </div>
              <div className="ml-auto h-2 w-2 flex-shrink-0 rounded-full bg-[#80E10A]" />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
            {navigation.map((section) => (
              <div key={section.name}>
                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/30">
                  {section.name}
                </p>
                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <Link
                      key={item.name}
                      href={(item as NavigationItem).href ?? "#"}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                        item.current
                          ? "text-white shadow-sm"
                          : "text-white/60 hover:bg-white/8 hover:text-white"
                      }`}
                      style={item.current ? { backgroundColor: "#FF6000" } : undefined}
                    >
                      {getIcon(item.icon)}
                      <span>{item.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* Logout at bottom */}
          <div className="flex-shrink-0 p-3 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/60 hover:bg-white/8 hover:text-white transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* ── Main content ── */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Header */}
          <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-border bg-background px-4 sm:px-6 lg:px-8">
            {/* Mobile menu toggle */}
            <button
              type="button"
              className="lg:hidden rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex-1" />

            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setNotifOpen(!notifOpen);
                    setUserDropdownOpen(false);
                  }}
                  className="relative rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-3.5-3.5a8.97 8.97 0 01-1.5-5 8.5 8.5 0 00-17 0 8.97 8.97 0 01-1.5 5L0 17h5m10 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {notifCount > 0 && (
                    <span
                      className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ backgroundColor: "#FF6000" }}
                    >
                      {notifCount > 9 ? "9+" : notifCount}
                    </span>
                  )}
                </button>

                {/* Notification dropdown */}
                {notifOpen && (
                  <div
                    className="absolute right-0 mt-2 w-80 rounded-xl border border-border bg-background shadow-lg z-50 overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                      <p className="text-sm font-semibold text-foreground">Notifications</p>
                      {notifCount > 0 && (
                        <button
                          className="text-xs font-medium hover:underline"
                          style={{ color: "#00712D" }}
                          onClick={async () => {
                            try {
                              await fetch("/api/admin/notifications/mark-all-read", { method: "PUT" });
                              setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                              setNotifCount(0);
                            } catch { /* silent */ }
                          }}
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    {/* List */}
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                          <svg className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-3.5-3.5a8.97 8.97 0 01-1.5-5 8.5 8.5 0 00-17 0 8.97 8.97 0 01-1.5 5L0 17h5m10 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                          <p className="text-sm text-muted-foreground">No new notifications</p>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif._id}
                            className={`px-4 py-3 border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer ${
                              !notif.read ? "bg-[#00712D06]" : ""
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              {!notif.read && (
                                <span
                                  className="mt-1.5 flex-shrink-0 h-2 w-2 rounded-full"
                                  style={{ backgroundColor: "#00712D" }}
                                />
                              )}
                              <div className={!notif.read ? "" : "pl-4"}>
                                <p className="text-sm font-medium text-foreground">{notif.title}</p>
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(notif.createdAt).toLocaleDateString("en-GB", {
                                    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-border px-4 py-2.5">
                      <Link
                        href="/s/admin/notifications"
                        className="block text-center text-xs font-semibold hover:underline"
                        style={{ color: "#00712D" }}
                        onClick={() => setNotifOpen(false)}
                      >
                        View all notifications →
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* User dropdown */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setUserDropdownOpen(!userDropdownOpen);
                    setNotifOpen(false);
                  }}
                  className="flex items-center gap-2.5 rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors focus:outline-none"
                >
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: "#FF6000" }}
                  >
                    {initials}
                  </div>
                  <span className="hidden md:block">{user.name}</span>
                  <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-background shadow-lg z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-sm font-semibold text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      <p className="mt-1 text-xs font-semibold" style={{ color: "#00712D" }}>{user.role}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/profile"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        My Profile
                      </Link>
                      <Link
                        href="/s/admin/settings"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Account Settings
                      </Link>
                    </div>
                    <div className="border-t border-border py-1">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          handleLogout();
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto">
            <div className="p-6">{children}</div>
          </main>
        </div>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
          </div>
        )}
      </div>
    </SettingsProvider>
  );
}
