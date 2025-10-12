import type { Metadata } from "next";
import { Geist, Geist_Mono, Sora } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import HideOnRoutes from "./HideOnRoutes";
import { Navbar } from "./_components/Navbar";
import Footer from "./_components/Footer";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${sora.variable} antialiased`}>
        <Providers>
          <HideOnRoutes hidePrefixes={["/user", "/admin", "/dashboard", "/auth"]}>
            <Navbar/>
          </HideOnRoutes>
          <main>{children}</main>
          <HideOnRoutes hidePrefixes={["/user", "/admin", "/dashboard", "/auth"]}>
           <Footer/>
          </HideOnRoutes>
        </Providers>
      </body>
    </html>
  );
}
