"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Header from "./Header";
import Sidebar from "./Sidebar";
import PageTransition from "./PageTransition";

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
    <div className="min-h-dvh bg-[radial-gradient(circle_at_top_left,_rgba(36,173,85,0.08),_transparent_55%),_linear-gradient(180deg,_#f7fbff_0%,_#f4f6f8_100%)] text-foreground">
      <Header
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
      />
      <main className="flex-1 pb-12 pt-6 sm:pt-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 sm:px-6 lg:flex-row lg:items-start lg:gap-8 lg:px-8 xl:gap-10">
          <aside className="hidden w-full lg:block lg:w-72 xl:w-80">
            <div className="sticky top-28">
              <Sidebar />
            </div>
          </aside>
          <section className="flex-1">
            <div className="rounded-2xl border border-border/30 bg-white/95 p-4 shadow-none backdrop-blur-sm sm:rounded-3xl sm:p-6 sm:shadow-[0_18px_40px_-30px_rgba(15,23,42,0.35)] lg:p-8 lg:shadow-[0_22px_48px_-32px_rgba(15,23,42,0.35)]">
              <PageTransition className="mx-auto flex w-full max-w-6xl flex-col gap-8">
                {children}
              </PageTransition>
            </div>
          </section>
        </div>
      </main>
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation menu"
          />
          <div className="relative ml-auto flex h-full w-full max-w-[320px] translate-x-0 bg-transparent p-4">
            <Sidebar
              className="h-full overflow-y-auto"
              variant="mobile"
              onNavigate={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
