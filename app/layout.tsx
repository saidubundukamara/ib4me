import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IB4ME — Medical Emergency Crowdfunding",
  description: "Raise and donate for medical emergencies. Put fɔ wɛlbɔdi.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-100">
            <div className="mx-auto max-w-screen-xl px-4">
              <nav className="flex h-16 items-center justify-between">
                <div className="flex items-center gap-6">
                  <Link href="/" className="flex items-center gap-2">
                    <img src="/assets/ib4me_logo.png" alt="Ib4me Logo" className="h-10 w-28 object-contain" />
                  </Link>
                  <ul className="hidden md:flex items-center gap-2 text-sm text-gray-700">
                    <li className="relative group">
                      <span className="inline-flex h-10 items-center px-3 cursor-default">Donate</span>
                      <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition pointer-events-none group-hover:pointer-events-auto absolute left-0 top-full mt-1 w-[320px] rounded-md border bg-white shadow-md p-3">
                        <div className="grid gap-2">
                          <Link href="/more-campaigns" className="rounded-md px-3 py-2 hover:bg-gray-50">Categories</Link>
                          <Link href="/supporter-space" className="rounded-md px-3 py-2 hover:bg-gray-50">Supporter Space</Link>
                        </div>
                      </div>
                    </li>
                    <li className="relative group">
                      <span className="inline-flex h-10 items-center px-3 cursor-default">Fundraise</span>
                      <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition pointer-events-none group-hover:pointer-events-auto absolute left-0 top-full mt-1 w-[360px] rounded-md border bg-white shadow-md p-3">
                        <div className="grid gap-2">
                          <Link href="/how-to-start-an-ib4me" className="rounded-md px-3 py-2 hover:bg-gray-50">How to start Ib4me</Link>
                          <Link href="#" className="rounded-md px-3 py-2 hover:bg-gray-50">Fundraising categories</Link>
                          <Link href="#" className="rounded-md px-3 py-2 hover:bg-gray-50">Fundraising tips</Link>
                          <Link href="#" className="rounded-md px-3 py-2 hover:bg-gray-50">Fundraising Ideas</Link>
                        </div>
                      </div>
                    </li>
                    <li className="relative group">
                      <span className="inline-flex h-10 items-center px-3 cursor-default">About</span>
                      <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition pointer-events-none group-hover:pointer-events-auto absolute left-0 top-full mt-1 w-[360px] rounded-md border bg-white shadow-md p-3">
                        <div className="grid gap-2">
                          <Link href="/how-ib4me-works" className="rounded-md px-3 py-2 hover:bg-gray-50">How Ib4me Works</Link>
                          <Link href="/guarantee" className="rounded-md px-3 py-2 hover:bg-gray-50">Ib4me Giving Guarantee</Link>
                          <Link href="#" className="rounded-md px-3 py-2 hover:bg-gray-50">Pricing</Link>
                          <Link href="#" className="rounded-md px-3 py-2 hover:bg-gray-50">Help Center</Link>
                          <Link href="#" className="rounded-md px-3 py-2 hover:bg-gray-50">Ib4me.org</Link>
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href="/create-campaign"
                    className="inline-flex items-center rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
                  >
                    Start a Campaign
                  </Link>
                  <Link
                    href="/auth/signin"
                    className="inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Log in
                  </Link>
                </div>
              </nav>
            </div>
          </header>
          <main>{children}</main>
          <footer className="mt-16 bg-neutral-100">
            <div className="mx-auto max-w-screen-xl px-6 py-12">
              <div className="grid grid-cols-2 gap-8 lg:grid-cols-6">
                <div className="col-span-2">
                  <div className="mb-2 font-bold text-2xl">IB4ME</div>
                  <p className="text-gray-600">Put fɔ wɛlbɔdi</p>
                </div>
                <div>
                  <h3 className="mb-3 font-semibold">Donate</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li><Link href="#" className="hover:text-gray-900">Categories</Link></li>
                    <li><Link href="#" className="hover:text-gray-900">Social Impact</Link></li>
                    <li><Link href="#" className="hover:text-gray-900">Supporter Space</Link></li>
                  </ul>
                </div>
                <div>
                  <h3 className="mb-3 font-semibold">Fundraise</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li><Link href="#" className="hover:text-gray-900">How to start Ib4me</Link></li>
                    <li><Link href="#" className="hover:text-gray-900">Team fundraising</Link></li>
                    <li><Link href="#" className="hover:text-gray-900">Fundraising Blog</Link></li>
                  </ul>
                </div>
                <div>
                  <h3 className="mb-3 font-semibold">About</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li><Link href="#" className="hover:text-gray-900">How Ib4me works</Link></li>
                    <li><Link href="#" className="hover:text-gray-900">Ib4me Giving Guarantee</Link></li>
                    <li><Link href="#" className="hover:text-gray-900">Help Center</Link></li>
                    <li><Link href="#" className="hover:text-gray-900">Supported countries</Link></li>
                    <li><Link href="#" className="hover:text-gray-900">Ib4me.org</Link></li>
                  </ul>
                </div>
                <div>
                  <h3 className="mb-3 font-semibold">Socials</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li><Link href="#" className="hover:text-gray-900">Twitter</Link></li>
                    <li><Link href="#" className="hover:text-gray-900">Instagram</Link></li>
                    <li><Link href="#" className="hover:text-gray-900">LinkedIn</Link></li>
                  </ul>
                </div>
              </div>
              <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t pt-6 text-sm text-gray-600 md:flex-row md:items-center">
                <p>© {new Date().getFullYear()} Copyright. All rights reserved.</p>
                <div className="flex gap-4">
                  <Link href="#" className="underline hover:text-gray-900">Terms and Conditions</Link>
                  <Link href="#" className="underline hover:text-gray-900">Privacy Policy</Link>
                </div>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
