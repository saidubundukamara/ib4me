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
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-6">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}


