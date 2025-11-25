import React from "react";
import AuthGuard from "@/components/AuthGuard";
import UserLayoutShell from "../dashboard/_components/UserLayoutShell";

export const metadata = {
  title: "Dashboard | ib4me",
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGuard>
      <UserLayoutShell>
        {children}
      </UserLayoutShell>
    </AuthGuard>
  );
}


