export type CookieCategory = "essential" | "analytics" | "marketing" | "functional";

export interface CookieConsentPreferences {
  essential: true; // Always true, cannot be changed
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
  timestamp: number;
  version: string;
}

export interface CookieConsentConfig {
  enabled: boolean;
  banner: {
    title: string;
    message: string;
    acceptAllText: string;
    rejectAllText: string;
    customizeText: string;
  };
  categories: {
    essential: { name: string; description: string };
    analytics: { name: string; description: string };
    marketing: { name: string; description: string };
    functional: { name: string; description: string };
  };
  services: Array<{ id: string; name: string; category: string }>;
  consentExpiryDays: number;
}

export interface CookieConsentContextType {
  config: CookieConsentConfig | null;
  preferences: CookieConsentPreferences | null;
  isLoading: boolean;
  showBanner: boolean;
  showSettings: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  savePreferences: (prefs: Partial<Omit<CookieConsentPreferences, "essential" | "timestamp" | "version">>) => void;
  openSettings: () => void;
  closeSettings: () => void;
  hasConsent: (category: CookieCategory) => boolean;
}

export const CONSENT_STORAGE_KEY = "ib4me_cookie_consent";
export const CONSENT_VERSION = "1.0";

export const DEFAULT_PREFERENCES: CookieConsentPreferences = {
  essential: true,
  analytics: false,
  marketing: false,
  functional: false,
  timestamp: 0,
  version: CONSENT_VERSION,
};
