"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface WebsiteSettings {
  siteName?: string;
  siteDescription?: string;
  logo?: string;
  favicon?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

interface PaymentSettings {
  currency: string;
  currencySymbol: string;
  platformFeeRate: number;
  enableOrangeMoney: boolean;
  enableAfriMoney: boolean;
  enableStripe: boolean;
  enablePaypal: boolean;
  stripePublishableKey?: string;
  paypalClientId?: string;
  monimeApiKey?: string;
}

interface FeatureSettings {
  maintenanceMode?: boolean;
  allowRegistration?: boolean;
  requireEmailVerification?: boolean;
  enableWhatsAppSharing?: boolean;
  enableSMSNotifications?: boolean;
  enableEmailNotifications?: boolean;
  minimumWithdrawalAmount?: number;
  minimumWithdrawalPercent?: number;
  allowEmergencyOverride?: boolean;
  withdrawalsBlocked?: boolean;
  blockedReason?: string;
  blockedBy?: string;
  blockedAt?: string;
  whatsAppAutoPost?: boolean;
  paypalEnabled?: boolean;
  emergencyPoolFund?: boolean;
}

interface ContactSettings {
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

interface SocialSettings {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  whatsapp?: string;
}

interface SeoSettings {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard?: string;
  twitterSite?: string;
}

interface FeeSettings {
  baseFeeMinor: number;
  processingFee: {
    individualBps: number;
    organizationBps: number;
  };
}

interface PlatformAccountSettings {
  id?: string;
  uvan?: string;
}

interface TipFinancialAccountSettings {
  id?: string;
  uvan?: string;
}

interface TippingSettings {
  enabled: boolean;
  suggestedAmounts: number[];
  minAmountMinor: number;
  maxAmountMinor: number;
}

interface SettingsContextType {
  // Settings data
  website: WebsiteSettings;
  payment: PaymentSettings | null;
  features: FeatureSettings;
  contact: ContactSettings | null;
  social: SocialSettings;
  seo: SeoSettings;
  fees: FeeSettings | null;
  platformAccount: PlatformAccountSettings | null;
  tipFinancialAccount: TipFinancialAccountSettings | null;
  tipping: TippingSettings | null;

  // Loading states
  loading: boolean;
  updating: boolean;

  // Actions
  refreshSettings: () => Promise<void>;
  updateWebsiteSettings: (data: Partial<WebsiteSettings>) => Promise<boolean>;
  updatePaymentSettings: (data: Partial<PaymentSettings>) => Promise<boolean>;
  updateFeatureSettings: (data: Partial<FeatureSettings>) => Promise<boolean>;
  updateContactSettings: (data: Partial<ContactSettings>) => Promise<boolean>;
  updateSocialSettings: (data: Partial<SocialSettings>) => Promise<boolean>;
  updateSeoSettings: (data: Partial<SeoSettings>) => Promise<boolean>;
  updateWithdrawalBlock: (blocked: boolean, reason?: string) => Promise<boolean>;
  updateFeeSettings: (data: Partial<FeeSettings>) => Promise<boolean>;
  updatePlatformAccountSettings: (data: Partial<PlatformAccountSettings>) => Promise<boolean>;
  updateTipFinancialAccountSettings: (data: Partial<TipFinancialAccountSettings>) => Promise<boolean>;
  updateTippingSettings: (data: Partial<TippingSettings>) => Promise<boolean>;

  // Error handling
  error: string | null;
  clearError: () => void;
}

const defaultWebsiteSettings: WebsiteSettings = {
  siteName: "IB4ME",
  siteDescription: "Medical Emergency Crowdfunding Platform for Sierra Leone",
  primaryColor: "#007bff",
  secondaryColor: "#6c757d",
};

const defaultFeatureSettings: FeatureSettings = {
  maintenanceMode: false,
  allowRegistration: true,
  requireEmailVerification: true,
  enableWhatsAppSharing: true,
  enableSMSNotifications: true,
  enableEmailNotifications: true,
  minimumWithdrawalAmount: 50000, // 50,000 SLE
  minimumWithdrawalPercent: 10,
  allowEmergencyOverride: true,
  withdrawalsBlocked: false,
};

const defaultSocialSettings: SocialSettings = {
  facebook: "https://www.facebook.com/share/19jahv3dqp/?mibextid=wwXIfr",
  instagram: "https://www.instagram.com/ib4me.fundraising?igsh=cDF4ZnV5bTJzbXVr&utm_source=qr",
  twitter: "https://x.com/ib4mesl?s=11",
  linkedin: "https://www.linkedin.com/company/ib4me/",
};
const defaultSeoSettings: SeoSettings = {};
const defaultFeeSettings: FeeSettings = {
  baseFeeMinor: 50,
  processingFee: {
    individualBps: 260,
    organizationBps: 200,
  },
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [website, setWebsite] = useState<WebsiteSettings>(defaultWebsiteSettings);
  const [payment, setPayment] = useState<PaymentSettings | null>(null);
  const [features, setFeatures] = useState<FeatureSettings>(defaultFeatureSettings);
  const [contact, setContact] = useState<ContactSettings | null>(null);
  const [social, setSocial] = useState<SocialSettings>(defaultSocialSettings);
  const [seo, setSeo] = useState<SeoSettings>(defaultSeoSettings);
  const [fees, setFees] = useState<FeeSettings | null>(defaultFeeSettings);
  const [platformAccount, setPlatformAccount] = useState<PlatformAccountSettings | null>(null);
  const [tipFinancialAccount, setTipFinancialAccount] = useState<TipFinancialAccountSettings | null>(null);
  const [tipping, setTipping] = useState<TippingSettings | null>(null);

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const refreshSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all settings categories in parallel
      const [
        websiteRes,
        paymentRes,
        featuresRes,
        contactRes,
        socialRes,
        seoRes,
        feesRes,
        platformAccountRes,
        tipFinancialAccountRes,
        tippingRes,
      ] = await Promise.all([
        fetch("/api/admin/settings?category=website"),
        fetch("/api/admin/settings?category=payment"),
        fetch("/api/admin/settings?category=features"),
        fetch("/api/admin/settings?category=contact"),
        fetch("/api/admin/settings?category=social"),
        fetch("/api/admin/settings?category=seo"),
        fetch("/api/admin/settings?category=fees"),
        fetch("/api/admin/settings?category=platformAccount"),
        fetch("/api/admin/settings?category=tipFinancialAccount"),
        fetch("/api/admin/settings?category=tipping"),
      ]);

      if (websiteRes.ok) {
        const websiteData = await websiteRes.json();
        setWebsite(websiteData.settings || defaultWebsiteSettings);
      }

      if (paymentRes.ok) {
        const paymentData = await paymentRes.json();
        setPayment(paymentData.settings);
      }

      if (featuresRes.ok) {
        const featuresData = await featuresRes.json();
        setFeatures(featuresData.settings || defaultFeatureSettings);
      }

      if (contactRes.ok) {
        const contactData = await contactRes.json();
        setContact(contactData.settings);
      }

      if (socialRes.ok) {
        const socialData = await socialRes.json();
        setSocial(socialData.settings || defaultSocialSettings);
      }

      if (seoRes.ok) {
        const seoData = await seoRes.json();
        setSeo(seoData.settings || defaultSeoSettings);
      }

      if (feesRes.ok) {
        const feesData = await feesRes.json();
        setFees(feesData.settings || defaultFeeSettings);
      }

      if (platformAccountRes.ok) {
        const platformAccountData = await platformAccountRes.json();
        setPlatformAccount(platformAccountData.settings || null);
      }

      if (tipFinancialAccountRes.ok) {
        const tipFinancialAccountData = await tipFinancialAccountRes.json();
        setTipFinancialAccount(tipFinancialAccountData.settings || null);
      }

      if (tippingRes.ok) {
        const tippingData = await tippingRes.json();
        setTipping(tippingData.settings || null);
      }
    } catch (err) {
      console.error("Error refreshing settings:", err);
      setError("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (
    category: string,
    data: unknown,
    updateState: (newData: unknown) => void
  ): Promise<boolean> => {
    try {
      setUpdating(true);
      setError(null);

      const response = await fetch(`/api/admin/settings?category=${category}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update settings");
      }

      // Update local state
      updateState(result.settings || data);
      return true;
    } catch (err: unknown) {
      console.error(`Error updating ${category} settings:`, err);
      setError(err instanceof Error ? err.message : `Failed to update ${category} settings`);
      return false;
    } finally {
      setUpdating(false);
    }
  };

  const updateWebsiteSettings = async (data: Partial<WebsiteSettings>): Promise<boolean> => {
    return updateSettings("website", data, (newData) => {
      setWebsite(prev => ({ ...prev, ...(newData as WebsiteSettings) }));
    });
  };

  const updatePaymentSettings = async (data: Partial<PaymentSettings>): Promise<boolean> => {
    return updateSettings("payment", data, (newData) => {
      setPayment(prev => ({ ...prev, ...(newData as PaymentSettings) }));
    });
  };

  const updateFeatureSettings = async (data: Partial<FeatureSettings>): Promise<boolean> => {
    return updateSettings("features", data, (newData) => {
      setFeatures(prev => ({ ...prev, ...(newData as FeatureSettings) }));
    });
  };

  const updateContactSettings = async (data: Partial<ContactSettings>): Promise<boolean> => {
    return updateSettings("contact", data, (newData) => {
      setContact(prev => ({ ...prev, ...(newData as ContactSettings) }));
    });
  };

  const updateSocialSettings = async (data: Partial<SocialSettings>): Promise<boolean> => {
    return updateSettings("social", data, (newData) => {
      setSocial(prev => ({ ...prev, ...(newData as SocialSettings) }));
    });
  };

  const updateSeoSettings = async (data: Partial<SeoSettings>): Promise<boolean> => {
    return updateSettings("seo", data, (newData) => {
      setSeo(prev => ({ ...prev, ...(newData as SeoSettings) }));
    });
  };

  const updateFeeSettings = async (data: Partial<FeeSettings>): Promise<boolean> => {
    return updateSettings("fees", data, (newData) => {
      setFees(prev => ({ ...prev, ...(newData as FeeSettings) }));
    });
  };

  const updatePlatformAccountSettings = async (data: Partial<PlatformAccountSettings>): Promise<boolean> => {
    return updateSettings("platformAccount", data, (newData) => {
      setPlatformAccount(prev => ({ ...prev, ...(newData as PlatformAccountSettings) }));
    });
  };

  const updateTipFinancialAccountSettings = async (data: Partial<TipFinancialAccountSettings>): Promise<boolean> => {
    return updateSettings("tipFinancialAccount", data, (newData) => {
      setTipFinancialAccount(prev => ({ ...prev, ...(newData as TipFinancialAccountSettings) }));
    });
  };

  const updateTippingSettings = async (data: Partial<TippingSettings>): Promise<boolean> => {
    return updateSettings("tipping", data, (newData) => {
      setTipping(prev => ({ ...prev, ...(newData as TippingSettings) }));
    });
  };

  const updateWithdrawalBlock = async (blocked: boolean, reason?: string): Promise<boolean> => {
    return updateSettings("withdrawal", { withdrawalsBlocked: blocked, blockedReason: reason }, (newData) => {
      const withdrawalData = newData as { withdrawalsBlocked: boolean; blockedReason?: string; blockedBy?: string; blockedAt?: string };
      setFeatures(prev => ({
        ...prev,
        withdrawalsBlocked: withdrawalData.withdrawalsBlocked,
        blockedReason: withdrawalData.blockedReason,
        blockedBy: withdrawalData.blockedBy,
        blockedAt: withdrawalData.blockedAt,
      }));
    });
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  const value: SettingsContextType = {
    // Settings data
    website,
    payment,
    features,
    contact,
    social,
    seo,
    fees,
    platformAccount,
    tipFinancialAccount,
    tipping,

    // Loading states
    loading,
    updating,

    // Actions
    refreshSettings,
    updateWebsiteSettings,
    updatePaymentSettings,
    updateFeatureSettings,
    updateContactSettings,
    updateSocialSettings,
    updateSeoSettings,
    updateWithdrawalBlock,
    updateFeeSettings,
    updatePlatformAccountSettings,
    updateTipFinancialAccountSettings,
    updateTippingSettings,

    // Error handling
    error,
    clearError,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}

export type {
  WebsiteSettings,
  PaymentSettings,
  FeatureSettings,
  ContactSettings,
  SocialSettings,
  SeoSettings,
  FeeSettings,
  PlatformAccountSettings,
  TipFinancialAccountSettings,
  TippingSettings,
};