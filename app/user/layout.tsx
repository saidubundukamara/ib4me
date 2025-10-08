import React from "react";
import UserLayoutShell from "./_components/UserLayoutShell";

export const metadata = {
  title: "User | ib4me",
};

export default function UserLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <UserLayoutShell>{children}</UserLayoutShell>;
}
