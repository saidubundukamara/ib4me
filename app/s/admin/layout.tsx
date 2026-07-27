import type { Metadata } from "next";
import AdminLayoutClient from "./_layout-client";

export const metadata: Metadata = {
  title: {
    default: "Admin Panel | ib4me",
    template: "%s | ib4me Admin",
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
