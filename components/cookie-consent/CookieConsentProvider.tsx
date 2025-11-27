"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import {
  CookieConsentContextType,
  CookieConsentConfig,
  CookieConsentPreferences,
  CookieCategory,
  CONSENT_STORAGE_KEY,
  CONSENT_VERSION,
} from "./types";

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined);

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);
  if (context === undefined) {
    throw new Error("useCookieConsent must be used within a CookieConsentProvider");
  }
  return context;
}

interface CookieConsentProviderProps {
  children: React.ReactNode;
}

export function CookieConsentProvider({ children }: CookieConsentProviderProps) {
  const [config, setConfig] = useState<CookieConsentConfig | null>(null);
  const [preferences, setPreferences] = useState<CookieConsentPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load config from API and preferences from localStorage
  useEffect(() => {
    setIsHydrated(true);

    async function initialize() {
      try {
        // Fetch cookie consent config from API
        const response = await fetch("/api/settings/cookie-consent");
        const data = await response.json();

        if (!data.enabled) {
          setIsLoading(false);
          return;
        }

        setConfig(data);

        // Check localStorage for existing consent
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
          if (stored) {
            try {
              const parsed = JSON.parse(stored) as CookieConsentPreferences;
              // Check if consent is still valid (same version)
              if (parsed.version === CONSENT_VERSION) {
                setPreferences(parsed);
                setShowBanner(false);
              } else {
                // Version mismatch, show banner again
                setShowBanner(true);
              }
            } catch {
              setShowBanner(true);
            }
          } else {
            // No consent stored, show banner
            setShowBanner(true);
          }
        }
      } catch (error) {
        console.error("Error initializing cookie consent:", error);
      } finally {
        setIsLoading(false);
      }
    }

    initialize();
  }, []);

  const saveToStorage = useCallback((prefs: CookieConsentPreferences) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(prefs));
      // Dispatch custom event for analytics scripts to react
      window.dispatchEvent(
        new CustomEvent("cookieConsentUpdated", { detail: prefs })
      );
    }
  }, []);

  const acceptAll = useCallback(() => {
    const newPrefs: CookieConsentPreferences = {
      essential: true,
      analytics: true,
      marketing: true,
      functional: true,
      timestamp: Date.now(),
      version: CONSENT_VERSION,
    };
    setPreferences(newPrefs);
    saveToStorage(newPrefs);
    setShowBanner(false);
    setShowSettings(false);
  }, [saveToStorage]);

  const rejectAll = useCallback(() => {
    const newPrefs: CookieConsentPreferences = {
      essential: true,
      analytics: false,
      marketing: false,
      functional: false,
      timestamp: Date.now(),
      version: CONSENT_VERSION,
    };
    setPreferences(newPrefs);
    saveToStorage(newPrefs);
    setShowBanner(false);
    setShowSettings(false);
  }, [saveToStorage]);

  const savePreferences = useCallback(
    (prefs: Partial<Omit<CookieConsentPreferences, "essential" | "timestamp" | "version">>) => {
      const newPrefs: CookieConsentPreferences = {
        essential: true,
        analytics: prefs.analytics ?? preferences?.analytics ?? false,
        marketing: prefs.marketing ?? preferences?.marketing ?? false,
        functional: prefs.functional ?? preferences?.functional ?? false,
        timestamp: Date.now(),
        version: CONSENT_VERSION,
      };
      setPreferences(newPrefs);
      saveToStorage(newPrefs);
      setShowBanner(false);
      setShowSettings(false);
    },
    [preferences, saveToStorage]
  );

  const openSettings = useCallback(() => {
    setShowSettings(true);
  }, []);

  const closeSettings = useCallback(() => {
    setShowSettings(false);
  }, []);

  const hasConsent = useCallback(
    (category: CookieCategory): boolean => {
      if (category === "essential") return true;
      if (!preferences) return false;
      return preferences[category] ?? false;
    },
    [preferences]
  );

  const value = useMemo<CookieConsentContextType>(
    () => ({
      config,
      preferences,
      isLoading,
      showBanner: isHydrated && showBanner,
      showSettings,
      acceptAll,
      rejectAll,
      savePreferences,
      openSettings,
      closeSettings,
      hasConsent,
    }),
    [
      config,
      preferences,
      isLoading,
      isHydrated,
      showBanner,
      showSettings,
      acceptAll,
      rejectAll,
      savePreferences,
      openSettings,
      closeSettings,
      hasConsent,
    ]
  );

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
}
