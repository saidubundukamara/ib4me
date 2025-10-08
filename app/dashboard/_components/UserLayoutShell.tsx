"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Header from "./Header";
import Sidebar from "./Sidebar";
import PageTransition from "./PageTransition";
import ProfileHeader from "./ProfileHeader";

type UserLayoutShellProps = {
  children: React.ReactNode;
};

export default function UserLayoutShell({ children }: UserLayoutShellProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex flex-col">
      <Header
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
      />
      <div className="flex-1">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-8">
          <ProfileHeader />
          <div className="grid lg:grid-cols-4 gap-6 lg:gap-8">
            <aside
              className={`lg:col-span-1 ${
                sidebarOpen ? "block" : "hidden"
              } lg:block`}
            >
              <div className="p-4 rounded-3xl border-0 shadow-[var(--shadow-soft)] lg:sticky lg:top-24 bg-background/80 backdrop-blur-sm">
                <Sidebar />
              </div>
            </aside>
            <div
              className={`${
                sidebarOpen
                  ? "hidden lg:block lg:col-span-3"
                  : "col-span-full lg:col-span-3"
              }`}
            >
              <PageTransition>{children}</PageTransition>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
