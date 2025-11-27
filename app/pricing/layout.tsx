import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Transparent pricing for ib4me fundraising platform. See our fees for mobile money, card payments, and platform services.',
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
