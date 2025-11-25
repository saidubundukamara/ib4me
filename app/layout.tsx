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
  title: "ib4me",
  description: "Raise and donate for medical emergencies. Put fɔ wɛlbɔdi.",
  icons: {
    icon: [
      { url: "/assets/ib4mefavicon.png", sizes: "180x180", type: "image/png" }
    ],
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
