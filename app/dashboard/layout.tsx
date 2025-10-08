import React from "react";
import Sidebar from "./_components/Sidebar";
import Header from "./_components/Header";
import PageTransition from "./_components/PageTransition";
import AuthGuard from "@/components/AuthGuard";


export const metadata = {
  title: "Dashboard | IB4ME",
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGuard>
      <div className="min-h-screen grid grid-cols-[260px_1fr]">
        <Sidebar />
        <div className="flex flex-col">
          <Header />
          <main className="p-6">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}


