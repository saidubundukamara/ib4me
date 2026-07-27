import mongoose from "mongoose";
import { settingRepository } from "../repositories";
import { ISetting, IWithdrawalSetting, IFeeSetting, IFeatureFlags, IWebsiteSettings, IContactSettings, ISocialSettings, ISeoSettings, ICampaignLimitsSettings, ICookieConsentSettings, IAnalyticsService } from "../models/Setting";
import { createSimpleAuditLog } from "../lib/simple-admin-audit";
import {
  MONIME_COLLECTION_FEE_BPS_FALLBACK,
  MONIME_PAYOUT_FEE_BPS_FALLBACK,
} from "../lib/fees";

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
  thresholdEnabled?: boolean;
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

interface WithdrawalSettings {
  thresholdEnabled: boolean;
  minAmountMinor: number;
  minPercent: number;
  allowEmergencyOverride: boolean;
  withdrawalsBlocked: boolean;
  blockedReason?: string;
  blockedBy?: string;
  blockedAt?: string;
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

interface CampaignLimitsSettings {
  maxActiveCampaignsIndividual: number;
  maxActiveCampaignsOrganization: number;
}

// Fee calculation types
export type CampaignType = "individual" | "organization";

export interface FeeSettings {
  /** The platform's own rate, charged on what arrives after Monime's cut. */
  processingFee: {
    individualBps: number;
    organizationBps: number;
  };
  /**
   * Monime's rates. ESTIMATES — used to quote a donation or a withdrawal before Monime
   * has reported what it actually took, and as a fallback when a settlement arrives with
   * no fee attached. The reported figure always wins (MONIME-FEE-MODEL.md R13).
   */
  monimeCollectionFeeBpsEstimate: number;
  payoutFeeBpsEstimate: number;
}

export interface PlatformAccountSettings {
  id?: string;
  uvan?: string;
}

export interface TipFinancialAccountSettings {
  id?: string;
  uvan?: string;
}

export interface TippingSettings {
  enabled: boolean;
  suggestedAmounts: number[];
  minAmountMinor: number;
  maxAmountMinor: number;
}

export interface CookieConsentSettings {
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
  services: IAnalyticsService[];
  consentExpiryDays: number;
}

const DEFAULT_COOKIE_CONSENT_SETTINGS: CookieConsentSettings = {
  enabled: false,
  banner: {
    title: "Cookie Preferences",
    message: "We use cookies to enhance your browsing experience and analyze our traffic. By clicking 'Accept All', you consent to our use of cookies.",
    acceptAllText: "Accept All",
    rejectAllText: "Reject Non-Essential",
    customizeText: "Customize",
  },
  categories: {
    essential: {
      name: "Essential Cookies",
      description: "Required for the website to function properly. Cannot be disabled.",
    },
    analytics: {
      name: "Analytics Cookies",
      description: "Help us understand how visitors interact with our website.",
    },
    marketing: {
      name: "Marketing Cookies",
      description: "Used to track visitors across websites for advertising purposes.",
    },
    functional: {
      name: "Functional Cookies",
      description: "Enable enhanced functionality and personalization.",
    },
  },
  services: [],
  consentExpiryDays: 365,
};

export class SettingService {
  async getPlatform(): Promise<ISetting | null> {
    return settingRepository.getPlatformSettings();
  }

  async getOrCreatePlatform(): Promise<ISetting> {
    let settings = await this.getPlatform();
    if (!settings) {
      settings = await settingRepository.create({
        _id: "platform",
        withdrawal: {
          minAmountMinor: 50000,
          minPercent: 10,
          allowEmergencyOverride: true
        },
        fees: {
          processingFee: {
            individualBps: 260,    // 2.6%
            organizationBps: 200,  // 2.0%
          },
          monimeCollectionFeeBpsEstimate: 100,  // 1% — quoting fallback only
          payoutFeeBpsEstimate: 100,            // 1% — quoting fallback only
        },
        features: {
          whatsAppAutoPost: true,
          paypalEnabled: false,
          emergencyPoolFund: false
        },
        tipping: {
          enabled: false,
          suggestedAmounts: [5000, 10000, 25000, 50000],
          minAmountMinor: 100,
          maxAmountMinor: 10000000
        }
      } as Partial<ISetting>);
    }
    return settings;
  }

  async updatePlatformSettings(updates: Partial<ISetting>, adminUserId?: string): Promise<ISetting> {
    const settings = await this.getOrCreatePlatform();
    
    const updatedSettings = await settingRepository.updateById(settings._id, {
      ...updates,
      updatedAt: new Date()
    });

    if (adminUserId) {
      await createSimpleAuditLog('settings_update', 'Setting', settings._id, {
        changes: Object.keys(updates)
      });
    }

    return updatedSettings!;
  }

  async getWebsiteSettings(): Promise<WebsiteSettings> {
    const settings = await this.getOrCreatePlatform();
    const extendedSettings = settings as ISetting & { website?: IWebsiteSettings };
    return {
      siteName: extendedSettings.website?.siteName || "IB4ME",
      siteDescription: extendedSettings.website?.siteDescription || "Medical Emergency Crowdfunding Platform for Sierra Leone",
      logo: extendedSettings.website?.logo,
      favicon: extendedSettings.website?.favicon,
      primaryColor: extendedSettings.website?.primaryColor || "#007bff",
      secondaryColor: extendedSettings.website?.secondaryColor || "#6c757d"
    };
  }

  async updateWebsiteSettings(updates: Partial<WebsiteSettings>, adminUserId?: string): Promise<WebsiteSettings> {
    const settings = await this.getOrCreatePlatform();
    const extendedSettings = settings as ISetting & { website?: IWebsiteSettings };
    const currentWebsite = extendedSettings.website || {};
    
    await this.updatePlatformSettings({
      website: { ...currentWebsite, ...updates }
    } as Partial<ISetting>, adminUserId);

    return this.getWebsiteSettings();
  }

  async getPaymentSettings(): Promise<PaymentSettings> {
    const settings = await this.getOrCreatePlatform();
    const fees = settings.fees || {};
    
    return {
      currency: "SLE",
      currencySymbol: "Le",
      // The platform rate is tiered by campaign type and lives under `fees.processingFee`.
      // This screen used to edit a separate `platformFeeBps` that no charge path read —
      // an admin could change it and nothing happened. Surface the individual rate so the
      // number shown here is at least the real one.
      platformFeeRate: (fees.processingFee?.individualBps ?? 260) / 100,
      enableOrangeMoney: true,
      enableAfriMoney: true,
      enableStripe: true,
      enablePaypal: settings.features?.paypalEnabled || false,
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      paypalClientId: process.env.PAYPAL_CLIENT_ID,
      monimeApiKey: process.env.MONIME_API_KEY ? "****" + process.env.MONIME_API_KEY.slice(-4) : undefined
    };
  }

  async updatePaymentSettings(updates: Partial<PaymentSettings>, adminUserId?: string): Promise<PaymentSettings> {
    const settings = await this.getOrCreatePlatform();
    const currentFees = settings.fees || {};
    const currentFeatures = settings.features || {};
    
    // Fee rates are edited on the Fees screen, which writes `fees.processingFee`.
    // This screen is payment-provider configuration only; it must not write a second,
    // conflicting fee model.
    const feeUpdates: Partial<IFeeSetting> = {};

    const featureUpdates: Partial<IFeatureFlags> = {};
    if (updates.enablePaypal !== undefined) {
      featureUpdates.paypalEnabled = updates.enablePaypal;
    }

    await this.updatePlatformSettings({
      fees: { ...currentFees, ...feeUpdates },
      features: { ...currentFeatures, ...featureUpdates }
    }, adminUserId);

    return this.getPaymentSettings();
  }

  async getFeatureSettings(): Promise<FeatureSettings> {
    const settings = await this.getOrCreatePlatform();
    const features = settings.features || {};
    const withdrawal = settings.withdrawal || {};

    return {
      maintenanceMode: features.maintenanceMode || false,
      allowRegistration: true,
      requireEmailVerification: true,
      enableWhatsAppSharing: true,
      enableSMSNotifications: true,
      enableEmailNotifications: true,
      thresholdEnabled: withdrawal.thresholdEnabled ?? true,
      minimumWithdrawalAmount: withdrawal.minAmountMinor || 50000,
      minimumWithdrawalPercent: withdrawal.minPercent || 10,
      allowEmergencyOverride: withdrawal.allowEmergencyOverride ?? true,
      withdrawalsBlocked: withdrawal.withdrawalsBlocked || false,
      blockedReason: withdrawal.blockedReason,
      blockedBy: withdrawal.blockedBy?.toString(),
      blockedAt: withdrawal.blockedAt?.toISOString(),
      whatsAppAutoPost: features.whatsAppAutoPost || false,
      paypalEnabled: features.paypalEnabled || false,
      emergencyPoolFund: features.emergencyPoolFund || false,
    };
  }

  async getWithdrawalSettings(): Promise<WithdrawalSettings> {
    const settings = await this.getOrCreatePlatform();
    const withdrawal = settings.withdrawal || {};

    return {
      thresholdEnabled: withdrawal.thresholdEnabled ?? true,
      minAmountMinor: withdrawal.minAmountMinor || 50000,
      minPercent: withdrawal.minPercent || 10,
      allowEmergencyOverride: withdrawal.allowEmergencyOverride ?? true,
      withdrawalsBlocked: withdrawal.withdrawalsBlocked || false,
      blockedReason: withdrawal.blockedReason,
      blockedBy: withdrawal.blockedBy?.toString(),
      blockedAt: withdrawal.blockedAt?.toISOString()
    };
  }

  async updateFeatureSettings(updates: Partial<FeatureSettings>, adminUserId?: string): Promise<FeatureSettings> {
    const settings = await this.getOrCreatePlatform();
    const currentFeatures = settings.features || {};
    const currentWithdrawal = settings.withdrawal || {};

    const featureUpdates: Partial<IFeatureFlags> = {};
    if (updates.maintenanceMode !== undefined) featureUpdates.maintenanceMode = updates.maintenanceMode;
    if (updates.whatsAppAutoPost !== undefined) featureUpdates.whatsAppAutoPost = updates.whatsAppAutoPost;
    if (updates.paypalEnabled !== undefined) featureUpdates.paypalEnabled = updates.paypalEnabled;
    if (updates.emergencyPoolFund !== undefined) featureUpdates.emergencyPoolFund = updates.emergencyPoolFund;

    const withdrawalUpdates: Partial<IWithdrawalSetting> = {};
    if (updates.thresholdEnabled !== undefined) withdrawalUpdates.thresholdEnabled = updates.thresholdEnabled;
    if (updates.minimumWithdrawalAmount !== undefined) withdrawalUpdates.minAmountMinor = updates.minimumWithdrawalAmount;
    if (updates.minimumWithdrawalPercent !== undefined) withdrawalUpdates.minPercent = updates.minimumWithdrawalPercent;
    if (updates.allowEmergencyOverride !== undefined) withdrawalUpdates.allowEmergencyOverride = updates.allowEmergencyOverride;

    await this.updatePlatformSettings({
      features: { ...currentFeatures, ...featureUpdates },
      withdrawal: { ...currentWithdrawal, ...withdrawalUpdates }
    }, adminUserId);

    return this.getFeatureSettings();
  }

  async toggleWithdrawalsBlocked(
    blocked: boolean,
    reason: string | undefined,
    adminUserId: string
  ): Promise<WithdrawalSettings> {
    const settings = await this.getOrCreatePlatform();
    const currentWithdrawal = settings.withdrawal || {};

    const withdrawalUpdates: Partial<IWithdrawalSetting> = {
      withdrawalsBlocked: blocked,
      blockedReason: blocked ? reason : undefined,
      blockedBy: blocked ? new mongoose.Types.ObjectId(adminUserId) : undefined,
      blockedAt: blocked ? new Date() : undefined
    };

    await this.updatePlatformSettings({
      withdrawal: { ...currentWithdrawal, ...withdrawalUpdates }
    }, adminUserId);

    await createSimpleAuditLog(
      blocked ? 'withdrawals_blocked' : 'withdrawals_unblocked',
      'Setting',
      'platform',
      {
        blocked,
        reason: reason || null,
        adminUserId
      }
    );

    return this.getWithdrawalSettings();
  }

  async getContactSettings(): Promise<ContactSettings | null> {
    const settings = await this.getOrCreatePlatform();
    const extendedSettings = settings as ISetting & { contact?: IContactSettings };
    return extendedSettings.contact || null;
  }

  async updateContactSettings(updates: Partial<ContactSettings>, adminUserId?: string): Promise<ContactSettings> {
    const settings = await this.getOrCreatePlatform();
    const extendedSettings = settings as ISetting & { contact?: IContactSettings };
    const currentContact = extendedSettings.contact || {};
    
    await this.updatePlatformSettings({
      contact: { ...currentContact, ...updates }
    } as Partial<ISetting>, adminUserId);

    return { ...currentContact, ...updates } as ContactSettings;
  }

  async getSocialSettings(): Promise<SocialSettings> {
    const settings = await this.getOrCreatePlatform();
    const extendedSettings = settings as ISetting & { social?: ISocialSettings };
    return extendedSettings.social || {};
  }

  async updateSocialSettings(updates: Partial<SocialSettings>, adminUserId?: string): Promise<SocialSettings> {
    const settings = await this.getOrCreatePlatform();
    const extendedSettings = settings as ISetting & { social?: ISocialSettings };
    const currentSocial = extendedSettings.social || {};
    
    await this.updatePlatformSettings({
      social: { ...currentSocial, ...updates }
    } as Partial<ISetting>, adminUserId);

    return { ...currentSocial, ...updates };
  }

  async getSeoSettings(): Promise<SeoSettings> {
    const settings = await this.getOrCreatePlatform();
    const extendedSettings = settings as ISetting & { seo?: ISeoSettings };
    return extendedSettings.seo || {};
  }

  async updateSeoSettings(updates: Partial<SeoSettings>, adminUserId?: string): Promise<SeoSettings> {
    const settings = await this.getOrCreatePlatform();
    const extendedSettings = settings as ISetting & { seo?: ISeoSettings };
    const currentSeo = extendedSettings.seo || {};

    await this.updatePlatformSettings({
      seo: { ...currentSeo, ...updates }
    } as Partial<ISetting>, adminUserId);

    return { ...currentSeo, ...updates };
  }

  async getCampaignLimitsSettings(): Promise<CampaignLimitsSettings> {
    const settings = await this.getOrCreatePlatform();
    const extendedSettings = settings as ISetting & { campaignLimits?: ICampaignLimitsSettings };
    return {
      maxActiveCampaignsIndividual: extendedSettings.campaignLimits?.maxActiveCampaignsIndividual ?? 2,
      maxActiveCampaignsOrganization: extendedSettings.campaignLimits?.maxActiveCampaignsOrganization ?? 8,
    };
  }

  async updateCampaignLimitsSettings(
    updates: Partial<CampaignLimitsSettings>,
    adminUserId?: string
  ): Promise<CampaignLimitsSettings> {
    const settings = await this.getOrCreatePlatform();
    const extendedSettings = settings as ISetting & { campaignLimits?: ICampaignLimitsSettings };
    const currentLimits = extendedSettings.campaignLimits || {};

    await this.updatePlatformSettings({
      campaignLimits: { ...currentLimits, ...updates }
    } as Partial<ISetting>, adminUserId);

    return this.getCampaignLimitsSettings();
  }

  // ==================== Fee Settings ====================

  async getFeeSettings(): Promise<FeeSettings> {
    const settings = await this.getOrCreatePlatform();
    const fees = settings.fees || {};

    return {
      processingFee: {
        individualBps: fees.processingFee?.individualBps ?? 260,    // 2.6%
        organizationBps: fees.processingFee?.organizationBps ?? 200, // 2.0%
      },
      monimeCollectionFeeBpsEstimate:
        fees.monimeCollectionFeeBpsEstimate ?? MONIME_COLLECTION_FEE_BPS_FALLBACK,
      payoutFeeBpsEstimate:
        fees.payoutFeeBpsEstimate ?? MONIME_PAYOUT_FEE_BPS_FALLBACK,
    };
  }

  async updateFeeSettings(
    updates: Partial<FeeSettings>,
    adminUserId?: string
  ): Promise<FeeSettings> {
    const settings = await this.getOrCreatePlatform();
    const currentFees = settings.fees || {};

    const feeUpdates: Partial<IFeeSetting> = { ...currentFees };

    if (updates.processingFee) {
      feeUpdates.processingFee = {
        individualBps: updates.processingFee.individualBps ?? currentFees.processingFee?.individualBps ?? 260,
        organizationBps: updates.processingFee.organizationBps ?? currentFees.processingFee?.organizationBps ?? 200,
      };
    }

    if (updates.monimeCollectionFeeBpsEstimate !== undefined) {
      feeUpdates.monimeCollectionFeeBpsEstimate = updates.monimeCollectionFeeBpsEstimate;
    }

    if (updates.payoutFeeBpsEstimate !== undefined) {
      feeUpdates.payoutFeeBpsEstimate = updates.payoutFeeBpsEstimate;
    }

    await this.updatePlatformSettings({ fees: feeUpdates }, adminUserId);

    return this.getFeeSettings();
  }

  /**
   * The platform rate to apply to a campaign of this type.
   *
   * Resolve this ONCE, at donation creation, and persist it on the donation
   * (`quote.platformFeeBps`). Settlement reuses the persisted rate rather than calling
   * back here, so an admin changing the fee between a donor paying and Monime settling
   * cannot move the goalposts on a donation already in flight (R4/R10).
   */
  async getPlatformFeeBps(campaignType: CampaignType): Promise<number> {
    const fees = await this.getFeeSettings();
    return campaignType === "organization"
      ? fees.processingFee.organizationBps
      : fees.processingFee.individualBps;
  }

  /** Monime's collection rate — for quoting only. The reported fee always wins (R13). */
  async getMonimeFeeEstimateBps(): Promise<number> {
    return (await this.getFeeSettings()).monimeCollectionFeeBpsEstimate;
  }

  /** Monime's payout rate — for quoting only. The reported fee always wins (R13). */
  async getPayoutFeeEstimateBps(): Promise<number> {
    return (await this.getFeeSettings()).payoutFeeBpsEstimate;
  }

  // ==================== Platform Account Settings ====================

  async getPlatformAccountSettings(): Promise<PlatformAccountSettings> {
    const settings = await this.getOrCreatePlatform();
    return {
      id: settings.platformFinancialAccount?.id,
      uvan: settings.platformFinancialAccount?.uvan
    };
  }

  async updatePlatformAccountSettings(
    updates: Partial<PlatformAccountSettings>,
    adminUserId?: string
  ): Promise<PlatformAccountSettings> {
    const settings = await this.getOrCreatePlatform();
    const currentAccount = settings.platformFinancialAccount || {};

    await this.updatePlatformSettings({
      platformFinancialAccount: { ...currentAccount, ...updates }
    } as Partial<ISetting>, adminUserId);

    return this.getPlatformAccountSettings();
  }

  // ==================== Tip Financial Account Settings ====================

  async getTipFinancialAccountSettings(): Promise<TipFinancialAccountSettings> {
    const settings = await this.getOrCreatePlatform();
    return {
      id: settings.tipFinancialAccount?.id,
      uvan: settings.tipFinancialAccount?.uvan
    };
  }

  async updateTipFinancialAccountSettings(
    updates: Partial<TipFinancialAccountSettings>,
    adminUserId?: string
  ): Promise<TipFinancialAccountSettings> {
    const settings = await this.getOrCreatePlatform();
    const currentAccount = settings.tipFinancialAccount || {};

    await this.updatePlatformSettings({
      tipFinancialAccount: { ...currentAccount, ...updates }
    } as Partial<ISetting>, adminUserId);

    return this.getTipFinancialAccountSettings();
  }

  // ==================== Tipping Settings ====================

  async getTippingSettings(): Promise<TippingSettings> {
    const settings = await this.getOrCreatePlatform();
    const tipping = settings.tipping || {};

    return {
      enabled: tipping.enabled ?? false,
      suggestedAmounts: tipping.suggestedAmounts ?? [5000, 10000, 25000, 50000],
      minAmountMinor: tipping.minAmountMinor ?? 100,
      maxAmountMinor: tipping.maxAmountMinor ?? 10000000
    };
  }

  async updateTippingSettings(
    updates: Partial<TippingSettings>,
    adminUserId?: string
  ): Promise<TippingSettings> {
    const settings = await this.getOrCreatePlatform();
    const currentTipping = settings.tipping || {};

    await this.updatePlatformSettings({
      tipping: { ...currentTipping, ...updates }
    } as Partial<ISetting>, adminUserId);

    return this.getTippingSettings();
  }

  // ==================== Cookie Consent Settings ====================

  async getCookieConsentSettings(): Promise<CookieConsentSettings> {
    const settings = await this.getOrCreatePlatform();
    const cookieConsent = settings.cookieConsent || {};

    return {
      enabled: cookieConsent.enabled ?? DEFAULT_COOKIE_CONSENT_SETTINGS.enabled,
      banner: {
        title: cookieConsent.banner?.title ?? DEFAULT_COOKIE_CONSENT_SETTINGS.banner.title,
        message: cookieConsent.banner?.message ?? DEFAULT_COOKIE_CONSENT_SETTINGS.banner.message,
        acceptAllText: cookieConsent.banner?.acceptAllText ?? DEFAULT_COOKIE_CONSENT_SETTINGS.banner.acceptAllText,
        rejectAllText: cookieConsent.banner?.rejectAllText ?? DEFAULT_COOKIE_CONSENT_SETTINGS.banner.rejectAllText,
        customizeText: cookieConsent.banner?.customizeText ?? DEFAULT_COOKIE_CONSENT_SETTINGS.banner.customizeText,
      },
      categories: {
        essential: {
          name: cookieConsent.categories?.essential?.name ?? DEFAULT_COOKIE_CONSENT_SETTINGS.categories.essential.name,
          description: cookieConsent.categories?.essential?.description ?? DEFAULT_COOKIE_CONSENT_SETTINGS.categories.essential.description,
        },
        analytics: {
          name: cookieConsent.categories?.analytics?.name ?? DEFAULT_COOKIE_CONSENT_SETTINGS.categories.analytics.name,
          description: cookieConsent.categories?.analytics?.description ?? DEFAULT_COOKIE_CONSENT_SETTINGS.categories.analytics.description,
        },
        marketing: {
          name: cookieConsent.categories?.marketing?.name ?? DEFAULT_COOKIE_CONSENT_SETTINGS.categories.marketing.name,
          description: cookieConsent.categories?.marketing?.description ?? DEFAULT_COOKIE_CONSENT_SETTINGS.categories.marketing.description,
        },
        functional: {
          name: cookieConsent.categories?.functional?.name ?? DEFAULT_COOKIE_CONSENT_SETTINGS.categories.functional.name,
          description: cookieConsent.categories?.functional?.description ?? DEFAULT_COOKIE_CONSENT_SETTINGS.categories.functional.description,
        },
      },
      services: cookieConsent.services || [],
      consentExpiryDays: cookieConsent.consentExpiryDays ?? DEFAULT_COOKIE_CONSENT_SETTINGS.consentExpiryDays,
    };
  }

  async updateCookieConsentSettings(
    updates: Partial<CookieConsentSettings>,
    adminUserId?: string
  ): Promise<CookieConsentSettings> {
    const settings = await this.getOrCreatePlatform();
    const currentCookieConsent = settings.cookieConsent || {};

    // Deep merge the updates
    const updatedCookieConsent: Partial<ICookieConsentSettings> = {
      ...currentCookieConsent,
    };

    if (updates.enabled !== undefined) {
      updatedCookieConsent.enabled = updates.enabled;
    }

    if (updates.banner) {
      updatedCookieConsent.banner = {
        ...currentCookieConsent.banner,
        ...updates.banner,
      };
    }

    if (updates.categories) {
      updatedCookieConsent.categories = {
        essential: { ...currentCookieConsent.categories?.essential, ...updates.categories.essential },
        analytics: { ...currentCookieConsent.categories?.analytics, ...updates.categories.analytics },
        marketing: { ...currentCookieConsent.categories?.marketing, ...updates.categories.marketing },
        functional: { ...currentCookieConsent.categories?.functional, ...updates.categories.functional },
      };
    }

    if (updates.services !== undefined) {
      updatedCookieConsent.services = updates.services;
    }

    if (updates.consentExpiryDays !== undefined) {
      updatedCookieConsent.consentExpiryDays = updates.consentExpiryDays;
    }

    await this.updatePlatformSettings({
      cookieConsent: updatedCookieConsent
    } as Partial<ISetting>, adminUserId);

    return this.getCookieConsentSettings();
  }

  /**
   * Get public cookie consent config (without tracking IDs)
   * Used by the frontend to display the consent banner
   */
  async getPublicCookieConsentConfig(): Promise<{
    enabled: boolean;
    banner: CookieConsentSettings['banner'];
    categories: CookieConsentSettings['categories'];
    services: Array<{ id: string; name: string; category: string }>;
    consentExpiryDays: number;
  }> {
    const settings = await this.getCookieConsentSettings();

    return {
      enabled: settings.enabled,
      banner: settings.banner,
      categories: settings.categories,
      services: settings.services
        .filter((s) => s.enabled)
        .map((s) => ({
          id: s.id,
          name: s.name,
          category: s.category,
        })),
      consentExpiryDays: settings.consentExpiryDays,
    };
  }

  /**
   * Get analytics config with tracking IDs (for loading scripts after consent)
   */
  async getAnalyticsConfig(): Promise<{
    services: Array<{ id: string; name: string; category: string; trackingId: string }>;
  }> {
    const settings = await this.getCookieConsentSettings();

    return {
      services: settings.services
        .filter((s) => s.enabled && s.trackingId)
        .map((s) => ({
          id: s.id,
          name: s.name,
          category: s.category,
          trackingId: s.trackingId!,
        })),
    };
  }
}

export const settingService = new SettingService();
