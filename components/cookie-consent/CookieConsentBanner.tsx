"use client";

import { useCookieConsent } from "./CookieConsentProvider";
import { CookieSettingsDialog } from "./CookieSettingsDialog";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";
import Link from "next/link";

export function CookieConsentBanner() {
  const {
    config,
    showBanner,
    showSettings,
    acceptAll,
    rejectAll,
    openSettings,
    closeSettings,
    isLoading,
  } = useCookieConsent();

  // Don't render anything if loading, no config, or banner not needed
  if (isLoading || !config || !showBanner) {
    return null;
  }

  return (
    <>
      {/* Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-sm border-t shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Content */}
            <div className="flex items-start gap-3 flex-1">
              <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                <Cookie className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-sm">
                  {config.banner.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {config.banner.message}{" "}
                  <Link
                    href="/cookies"
                    className="text-primary hover:underline"
                  >
                    Learn more
                  </Link>
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={openSettings}
              >
                {config.banner.customizeText}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={rejectAll}
              >
                {config.banner.rejectAllText}
              </Button>
              <Button
                size="sm"
                onClick={acceptAll}
              >
                {config.banner.acceptAllText}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Dialog */}
      <CookieSettingsDialog
        open={showSettings}
        onOpenChange={(open) => {
          if (!open) closeSettings();
        }}
      />
    </>
  );
}
