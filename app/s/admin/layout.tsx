import type { Metadata } from "next";
import AdminLayoutClient from "./_layout-client";

export const metadata: Metadata = {
  title: {
    default: "Admin Panel | ib4me",
    template: "%s | ib4me Admin",
  },
  icons: {
    icon: [
      { url: "/assets/ib4mefavicon.png", sizes: "48x48", type: "image/png" },
    ],
    apple: [
      { url: "/assets/ib4mefavicon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
