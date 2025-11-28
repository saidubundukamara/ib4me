"use client";

import { useAuth } from "@/lib/auth-provider";
import { SettingsProvider } from "@/lib/settings-provider";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

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

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, setUser, setAccessToken } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [siteName, setSiteName] = useState("IB4ME Admin");

  // Check if current route is a public admin route (login, forgot-password)
  const isPublicAdminRoute = pathname === "/login" || 
                            pathname === "/forgot-password";

  // Fetch website settings for site name
  useEffect(() => {
    const fetchSiteName = async () => {
      try {
        const response = await fetch("/api/admin/settings?category=website");
        if (response.ok) {
          const data = await response.json();
          setSiteName(data.settings?.siteName || "IB4ME Admin");
        } else {
          setSiteName("IB4ME Admin");
        }
      } catch (error) {
        console.error("Error fetching site name:", error);
        setSiteName("IB4ME Admin");
      }
    };

    if (!isPublicAdminRoute) {
      fetchSiteName();
    }
  }, [isPublicAdminRoute]);

  useEffect(() => {
    console.log('=== ADMIN LAYOUT ===');
    console.log('User:', user ? { id: user._id, role: user.role, email: user.email } : null);
    console.log('Is Loading:', isLoading);
    console.log('Is Public Route:', isPublicAdminRoute);
    
    // Only enforce authentication for protected admin routes
    if (!isPublicAdminRoute && !isLoading && (!user || (user.role !== "Admin" && user.role !== "SuperAdmin"))) {
      console.log('Admin layout: No valid user, redirecting to login');
      router.push("/login");
    } else if (!isLoading && user) {
      console.log('Admin layout: Valid admin user found');
    }
  }, [user, isLoading, router, isPublicAdminRoute]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (userDropdownOpen) {
        setUserDropdownOpen(false);
      }
    };

    if (userDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [userDropdownOpen]);

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      setUser(null);
      setAccessToken(null);
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const navigation = [
    {
      name: "MAIN",
      items: [
        { name: "Dashboard", href: "/", icon: "dashboard", current: pathname === "/" },
        { name: "Campaigns", href: "/campaigns", icon: "campaigns", current: pathname.startsWith("/campaigns") },
        { name: "Verifications", href: "/verifications", icon: "verifications", current: pathname.startsWith("/verifications") },
        { name: "Testimonials", href: "/testimonials", icon: "testimonials", current: pathname.startsWith("/testimonials") },
        { name: "Donations", href: "/donations", icon: "donations", current: pathname.startsWith("/donations") },
        { name: "Tips", href: "/tips", icon: "tips", current: pathname.startsWith("/tips") },
        { name: "Payouts", href: "/payouts", icon: "payouts", current: pathname.startsWith("/payouts") },
        { name: "Hospitals", href: "/hospitals", icon: "hospitals", current: pathname.startsWith("/hospitals") },
        { name: "Categories", href: "/categories", icon: "categories", current: pathname.startsWith("/categories") },
        { name: "Users", href: "/users", icon: "users", current: pathname.startsWith("/users") },
      ]
    },
    {
      name: "REPORTS",
      items: [
        { name: "Analytics", href: "/analytics", icon: "analytics", current: pathname.startsWith("/analytics") },
        { name: "Audit Logs", href: "/audit-logs", icon: "audit", current: pathname.startsWith("/audit-logs") },
      ]
    },
    {
      name: "MANAGEMENT",
      items: [
        { name: "Admin Users", href: "/admins", icon: "admins", current: pathname.startsWith("/admins") },
        { name: "Notifications", href: "/notifications", icon: "notifications", current: pathname.startsWith("/notifications") },
        { name: "Settings", href: "/settings", icon: "settings", current: pathname.startsWith("/settings") },
      ]
    }
  ];

  const getIcon = (iconName: string) => {
    const icons = {
      dashboard: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v4H8V5z" />
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
    };
    return icons[iconName as keyof typeof icons] || icons.dashboard;
  };

  // Show loading spinner for protected routes
  if (isLoading && !isPublicAdminRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // For public admin routes (login, forgot-password), just render children
  if (isPublicAdminRoute) {
    return <>{children}</>;
  }

  // For protected routes, check authentication
  if (!user || (user.role !== "Admin" && user.role !== "SuperAdmin")) {
    return null;
  }

  return (
    <SettingsProvider>
      <div className="h-screen flex bg-gray-50 overflow-hidden">
      {/* Fixed Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:relative lg:flex lg:flex-col`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 bg-gray-900 flex-shrink-0">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded transform rotate-45 flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-sm transform -rotate-45"></div>
              </div>
              <h1 className="ml-3 text-xl font-bold text-white">{siteName}</h1>
            </div>
          </div>

          {/* User Profile */}
          <div className="p-4 border-b border-gray-700 flex-shrink-0">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-medium">
                  {user.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </span>
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium text-white">
                  {user.name}
                </div>
                <div className="text-xs text-gray-300">{user.role}</div>
              </div>
              <div className="ml-auto">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Scrollable Navigation */}
          <nav className="flex-1 overflow-y-auto px-4 py-4">
            {navigation.map((section) => (
              <div key={section.name} className="mb-6">
                <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {section.name}
                </h3>
                <div className="mt-2 space-y-1">
                  {section.items.map((item) => (
                    <div key={item.name}>
                      <Link
                        href={(item as NavigationItem).href || '#'}
                        className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          item.current
                            ? 'bg-gray-900 text-white'
                            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }`}
                      >
                        {getIcon(item.icon)}
                        <span className="ml-3">{item.name}</span>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        {/* Fixed Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0 z-10">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Mobile menu button */}
              <button
                type="button"
                className="lg:hidden -ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <div className="flex-1"></div>

              {/* Right side */}
              <div className="flex items-center space-x-4">
                {/* Notifications */}
                <button className="text-gray-400 hover:text-gray-500">
                  <div className="relative">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-3.5-3.5a8.97 8.97 0 01-1.5-5 8.5 8.5 0 00-17 0 8.97 8.97 0 01-1.5 5L0 17h5m10 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-400 rounded-full flex items-center justify-center text-xs text-white">
                      3
                    </span>
                  </div>
                </button>

                {/* User Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setUserDropdownOpen(!userDropdownOpen);
                    }}
                    className="flex items-center space-x-3 text-sm text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg p-2 transition-colors"
                  >
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {user.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                    <div className="hidden md:block text-left">
                      <div className="font-medium text-gray-900">
                        {user.name}
                      </div>
                      <div className="text-xs text-gray-500">{user.role}</div>
                    </div>
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* User Dropdown */}
                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                      <div className="py-1">
                        {/* User Info */}
                        <div className="px-4 py-3 border-b border-gray-100">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-medium">
                                {user.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {user.name}
                              </div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                              <div className="text-xs text-blue-600 font-medium">{user.role}</div>
                            </div>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <Link
                          href="/profile"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          My Profile
                        </Link>

                        <Link
                          href="/settings"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Account Settings
                        </Link>

                        <div className="border-t border-gray-100">
                          <button
                            onClick={() => {
                              setUserDropdownOpen(false);
                              handleLogout();
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                          >
                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Logout
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="h-full p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}
      </div>
    </SettingsProvider>
  );
}


