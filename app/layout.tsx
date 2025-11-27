import type { Metadata } from "next";
import { Geist, Geist_Mono, Sora } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import HideOnRoutes from "./HideOnRoutes";
import { Navbar } from "./_components/Navbar";
import Footer from "./_components/Footer";
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
weight: ["100","200","300","400","500","600","700","800"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://ib4me.org'),
  title: {
    default: 'ib4me - Medical Emergency Fundraising Platform',
    template: '%s | ib4me',
  },
  description: 'Raise and donate for medical emergencies in Sierra Leone. Secure donations via mobile money and cards. Put fɔ wɛlbɔdi.',
  keywords: ['medical fundraising', 'healthcare crowdfunding', 'Sierra Leone', 'emergency funds', 'donations', 'mobile money', 'Orange Money', 'AfriMoney'],
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
    title: 'ib4me - Medical Emergency Fundraising Platform',
    description: 'Raise and donate for medical emergencies in Sierra Leone. Secure donations via mobile money and cards.',
    images: [
      {
        url: '/assets/Hero.png',
        width: 1200,
        height: 630,
        alt: 'ib4me - Medical Emergency Fundraising',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ib4me - Medical Emergency Fundraising Platform',
    description: 'Raise and donate for medical emergencies in Sierra Leone.',
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

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${sora.variable} antialiased`}>
        <Providers>
          {isAdminSubdomain ? (
            // Admin subdomain: minimal layout, let admin layout handle everything
            <main>{children}</main>
          ) : (
            // Main domain: full layout with navbar/footer
            <>
              <HideOnRoutes hidePrefixes={["/user", "/admin", "/dashboard", "/s"]}>
                <Navbar/>
              </HideOnRoutes>
              <main>{children}</main>
              <HideOnRoutes hidePrefixes={["/user", "/admin", "/dashboard", "/s"]}>
               <Footer/>
              </HideOnRoutes>
            </>
          )}
        </Providers>
      </body>
    </html>
  );
}
