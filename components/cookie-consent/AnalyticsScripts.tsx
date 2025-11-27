"use client";

import { useEffect, useState, useCallback } from "react";
import Script from "next/script";
import { useCookieConsent } from "./CookieConsentProvider";
import { CookieCategory } from "./types";

interface AnalyticsService {
  id: string;
  name: string;
  category: string;
  trackingId: string;
}

interface AnalyticsConfig {
  services: AnalyticsService[];
}

export function AnalyticsScripts() {
  const { preferences, hasConsent } = useCookieConsent();
  const [config, setConfig] = useState<AnalyticsConfig | null>(null);
  const [loadedServices, setLoadedServices] = useState<Set<string>>(new Set());

  // Fetch analytics config with tracking IDs
  const fetchConfig = useCallback(async () => {
    try {
      const response = await fetch("/api/settings/analytics-config");
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      console.error("Error fetching analytics config:", error);
    }
  }, []);

  // Listen for consent updates
  useEffect(() => {
    const handleConsentUpdate = () => {
      // When consent is updated, re-check which services can be loaded
      // The useEffect below will handle the actual loading
    };

    window.addEventListener("cookieConsentUpdated", handleConsentUpdate);

    return () => {
      window.removeEventListener("cookieConsentUpdated", handleConsentUpdate);
    };
  }, []);

  // Fetch config when preferences are available and user has given consent
  useEffect(() => {
    if (preferences && !config) {
      fetchConfig();
    }
  }, [preferences, config, fetchConfig]);

  // Mark service as loaded
  const handleScriptLoad = (serviceId: string) => {
    setLoadedServices((prev) => new Set([...prev, serviceId]));
  };

  // Don't render anything if no preferences or no config
  if (!preferences || !config) {
    return null;
  }

  return (
    <>
      {config.services.map((service) => {
        // Check if user has consented to this category
        if (!hasConsent(service.category as CookieCategory)) {
          return null;
        }

        // Check if already loaded
        if (loadedServices.has(service.id)) {
          return null;
        }

        // Render appropriate script based on service type
        switch (service.id) {
          case "google_analytics":
            return (
              <GoogleAnalyticsScript
                key={service.id}
                trackingId={service.trackingId}
                onLoad={() => handleScriptLoad(service.id)}
              />
            );

          case "google_tag_manager":
            return (
              <GoogleTagManagerScript
                key={service.id}
                containerId={service.trackingId}
                onLoad={() => handleScriptLoad(service.id)}
              />
            );

          case "facebook_pixel":
            return (
              <FacebookPixelScript
                key={service.id}
                pixelId={service.trackingId}
                onLoad={() => handleScriptLoad(service.id)}
              />
            );

          default:
            return null;
        }
      })}
    </>
  );
}

// Google Analytics (GA4)
function GoogleAnalyticsScript({
  trackingId,
  onLoad,
}: {
  trackingId: string;
  onLoad: () => void;
}) {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${trackingId}`}
        strategy="afterInteractive"
        onLoad={onLoad}
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${trackingId}');
        `}
      </Script>
    </>
  );
}

// Google Tag Manager
function GoogleTagManagerScript({
  containerId,
  onLoad,
}: {
  containerId: string;
  onLoad: () => void;
}) {
  return (
    <>
      <Script id="google-tag-manager" strategy="afterInteractive" onLoad={onLoad}>
        {`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${containerId}');
        `}
      </Script>
    </>
  );
}

// Facebook Pixel
function FacebookPixelScript({
  pixelId,
  onLoad,
}: {
  pixelId: string;
  onLoad: () => void;
}) {
  return (
    <Script id="facebook-pixel" strategy="afterInteractive" onLoad={onLoad}>
      {`
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${pixelId}');
        fbq('track', 'PageView');
      `}
    </Script>
  );
}
