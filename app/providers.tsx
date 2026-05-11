"use client";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth-provider";
import { SettingsProvider } from "@/lib/settings-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  CookieConsentProvider,
  CookieConsentBanner,
  AnalyticsScripts,
} from "@/components/cookie-consent";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <SettingsProvider>
          <CookieConsentProvider>
            <TooltipProvider>
              {children}
              <CookieConsentBanner />
              <AnalyticsScripts />
              <Toaster richColors position="top-center" />
            </TooltipProvider>
          </CookieConsentProvider>
        </SettingsProvider>
      </AuthProvider>
    </SessionProvider>
  );
}

