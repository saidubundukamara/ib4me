import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'About Us',
  description: "Learn about ib4me's mission to help Sierra Leoneans raise funds for medical emergencies through secure crowdfunding.",
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
