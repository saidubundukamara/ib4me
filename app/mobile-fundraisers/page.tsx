import type { Metadata } from "next";
import MobileFundraisersContent from "./MobileFundraisersContent";

export const metadata: Metadata = {
  title: "Mobile (USSD) Fundraisers — ib4me",
  description:
    "Create and manage mobile fundraisers via USSD — perfect for individuals without regular internet access in Sierra Leone.",
};

export default function MobileFundraisersPage() {
  return <MobileFundraisersContent />;
}
