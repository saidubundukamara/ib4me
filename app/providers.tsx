"use client";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth-provider";
import {
  CookieConsentProvider,
  CookieConsentBanner,
  AnalyticsScripts,
} from "@/components/cookie-consent";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <CookieConsentProvider>
          {children}
          <CookieConsentBanner />
          <AnalyticsScripts />
          <Toaster richColors position="top-center" />
        </CookieConsentProvider>
      </AuthProvider>
    </SessionProvider>
  );
}

