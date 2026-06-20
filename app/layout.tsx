import type { Metadata } from "next";
import { Geist, Geist_Mono, Sora } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import HideOnRoutes from "./HideOnRoutes";
import { Navbar } from "./_components/Navbar";
import Footer from "./_components/Footer";
import { OfflineBanner } from "./_components/OfflineBanner";
import { headers } from "next/headers";

export const geistSans = Geist({
variable: "--font-geist-sans",
subsets: ["latin"],
});

export const geistMono = Geist_Mono({
variable: "--font-geist-mono",
subsets: ["latin"],
});

export const sora = Sora({
variable: "--font-sora",
subsets: ["latin"],
display: "swap",
weight: ["300","400","600","700"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://ib4me.org'),
  title: {
    default: 'ib4me - Crowdfunding Platform for Social Good',
    template: '%s | ib4me',
  },
  description: 'Raise and donate for causes that matter in Sierra Leone. Secure donations via mobile money and cards. Put fɔ wɛlbɔdi.',
  keywords: ['crowdfunding', 'fundraising', 'Sierra Leone', 'social good', 'donations', 'mobile money', 'Orange Money', 'AfriMoney'],
  authors: [{ name: 'ib4me Team' }],
  creator: 'ib4me',
  publisher: 'ib4me',
  icons: {
    icon: [
      { url: '/assets/ib4mefavicon.png', sizes: '48x48', type: 'image/png' },
    ],
    apple: [
      { url: '/assets/ib4mefavicon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://ib4me.org',
    siteName: 'ib4me',
    title: 'ib4me - Crowdfunding Platform for Social Good',
    description: 'Raise and donate for causes that matter in Sierra Leone. Secure donations via mobile money and cards.',
    images: [
      {
        url: '/assets/Hero.png',
        width: 1200,
        height: 630,
        alt: 'ib4me - Crowdfunding for Social Good',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ib4me - Crowdfunding Platform for Social Good',
    description: 'Raise and donate for causes that matter in Sierra Leone.',
    images: ['/assets/Hero.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Check if we're on admin subdomain - if so, provide minimal layout
  // and let admin layout handle everything
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const isAdminSubdomain = host.startsWith('admin.');

  // Maintenance mode is enforced in middleware.ts, which rewrites blocked
  // requests to /maintenance and flags them with this header. When present we
  // render the maintenance page without the public navbar/footer chrome.
  const isMaintenance = headersList.get('x-maintenance') === '1';

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${sora.variable} antialiased`}>
        <Providers>
          <OfflineBanner />
          {isAdminSubdomain || isMaintenance ? (
            // Admin subdomain / maintenance screen: minimal layout, no chrome.
            <main>{children}</main>
          ) : (
            // Main domain: full layout with navbar/footer
            <>
              <HideOnRoutes hidePrefixes={["/user", "/admin", "/dashboard", "/s", "/auth"]}>
                <Navbar/>
              </HideOnRoutes>
              <main>{children}</main>
              <HideOnRoutes hidePrefixes={["/user", "/admin", "/dashboard", "/s", "/auth"]}>
               <Footer/>
              </HideOnRoutes>
            </>
          )}
        </Providers>
      </body>
    </html>
  );
}
