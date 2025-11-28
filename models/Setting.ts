import mongoose from "mongoose";

export interface IWithdrawalSetting {
  thresholdEnabled?: boolean;
  minAmountMinor?: number;
  minPercent?: number;
  allowEmergencyOverride?: boolean;
  withdrawalsBlocked?: boolean;
  blockedReason?: string;
  blockedBy?: mongoose.Types.ObjectId;
  blockedAt?: Date;
}

export interface ITieredFeeRate {
  individualBps: number;      // Rate for individual campaigns (e.g., 260 = 2.6%)
  organizationBps: number;    // Rate for organization campaigns (e.g., 200 = 2.0%)
}

export interface IFeeSetting {
  // Base fee - fixed amount per transaction (in minor units)
  // Set to 0 by default - Monime's 1% fee is handled separately
  baseFeeMinor?: number;           // e.g., 0 (not used, Monime deducts 1% automatically)

  // Processing fee - percentage-based, tiered by campaign type
  // This is the platform's fee, charged on top of the donation amount
  processingFee?: ITieredFeeRate;

  // Legacy fields (kept for backward compatibility)
  platformFeeBps?: number;
  mobileMoneyFeeBps?: number;
}

export interface IPlatformFinancialAccount {
  id?: string;    // Monime financial account ID
  uvan?: string;  // Universal Virtual Account Number
}

export interface ITipFinancialAccount {
  id?: string;    // Monime financial account ID for receiving tips
  uvan?: string;  // Universal Virtual Account Number
}

export interface ITippingSettings {
  enabled?: boolean;
  suggestedAmounts?: number[];  // In minor units, e.g., [5000, 10000, 25000]
  minAmountMinor?: number;
  maxAmountMinor?: number;
}

export interface IFeatureFlags {
  whatsAppAutoPost?: boolean;
  paypalEnabled?: boolean;
  emergencyPoolFund?: boolean;
}

export interface IWebsiteSettings {
  siteName?: string;
  siteDescription?: string;
  logo?: string;
  favicon?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface IContactSettings {
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface ISocialSettings {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  whatsapp?: string;
}

export interface ISeoSettings {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard?: string;
  twitterSite?: string;
}

export interface ICampaignLimitsSettings {
  maxActiveCampaignsIndividual?: number;  // Default: 2
  maxActiveCampaignsOrganization?: number; // Default: 8
}

export interface IAnalyticsService {
  id: string;           // e.g., 'google_analytics'
  name: string;         // e.g., 'Google Analytics'
  enabled: boolean;
  trackingId?: string;  // e.g., 'G-XXXXXXXXXX'
  category: 'analytics' | 'marketing' | 'functional';
}

export interface ICookieConsentBanner {
  title?: string;
  message?: string;
  acceptAllText?: string;
  rejectAllText?: string;
  customizeText?: string;
}

export interface ICookieCategory {
  name?: string;
  description?: string;
}

export interface ICookieConsentSettings {
  enabled?: boolean;
  banner?: ICookieConsentBanner;
  categories?: {
    essential?: ICookieCategory;
    analytics?: ICookieCategory;
    marketing?: ICookieCategory;
    functional?: ICookieCategory;
  };
  services?: IAnalyticsService[];
  consentExpiryDays?: number;
}

export interface ISetting extends mongoose.Document {
  _id: string; // "platform"
  withdrawal?: IWithdrawalSetting;
  fees?: IFeeSetting;
  features?: IFeatureFlags;
  website?: IWebsiteSettings;
  contact?: IContactSettings;
  social?: ISocialSettings;
  seo?: ISeoSettings;
  campaignLimits?: ICampaignLimitsSettings;
  platformFinancialAccount?: IPlatformFinancialAccount;  // For receiving platform fees
  tipFinancialAccount?: ITipFinancialAccount;            // For receiving tips
  tipping?: ITippingSettings;
  cookieConsent?: ICookieConsentSettings;
  updatedAt: Date;
}

const settingSchema = new mongoose.Schema<ISetting>(
  {
    _id: { type: String, required: true },
    withdrawal: {
      thresholdEnabled: { type: Boolean, default: true },
      minAmountMinor: { type: Number },
      minPercent: { type: Number },
      allowEmergencyOverride: { type: Boolean },
      withdrawalsBlocked: { type: Boolean, default: false },
      blockedReason: { type: String },
      blockedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      blockedAt: { type: Date },
    },
    fees: {
      baseFeeMinor: { type: Number, default: 0 },  // Set to 0 - Monime deducts 1% automatically
      processingFee: {
        individualBps: { type: Number, default: 260 },     // 2.6%
        organizationBps: { type: Number, default: 200 },   // 2.0%
      },
      // Legacy fields
      platformFeeBps: { type: Number },
      mobileMoneyFeeBps: { type: Number },
    },
    features: {
      whatsAppAutoPost: { type: Boolean },
      paypalEnabled: { type: Boolean },
      emergencyPoolFund: { type: Boolean },
    },
    website: {
      siteName: { type: String },
      siteDescription: { type: String },
      logo: { type: String },
      favicon: { type: String },
      primaryColor: { type: String },
      secondaryColor: { type: String },
    },
    contact: {
      email: { type: String },
      phone: { type: String },
      address: { type: String },
      city: { type: String },
      state: { type: String },
      zipCode: { type: String },
      country: { type: String },
    },
    social: {
      facebook: { type: String },
      twitter: { type: String },
      instagram: { type: String },
      linkedin: { type: String },
      whatsapp: { type: String },
    },
    seo: {
      metaTitle: { type: String },
      metaDescription: { type: String },
      metaKeywords: { type: String },
      ogTitle: { type: String },
      ogDescription: { type: String },
      ogImage: { type: String },
      twitterCard: { type: String },
      twitterSite: { type: String },
    },
    campaignLimits: {
      maxActiveCampaignsIndividual: { type: Number, default: 2 },
      maxActiveCampaignsOrganization: { type: Number, default: 8 },
    },
    platformFinancialAccount: {
      id: { type: String },
      uvan: { type: String },
    },
    tipFinancialAccount: {
      id: { type: String },
      uvan: { type: String },
    },
    tipping: {
      enabled: { type: Boolean, default: false },
      suggestedAmounts: [{ type: Number }],
      minAmountMinor: { type: Number, default: 100 },
      maxAmountMinor: { type: Number, default: 10000000 },
    },
    cookieConsent: {
      enabled: { type: Boolean, default: false },
      banner: {
        title: { type: String },
        message: { type: String },
        acceptAllText: { type: String },
        rejectAllText: { type: String },
        customizeText: { type: String },
      },
      categories: {
        essential: {
          name: { type: String },
          description: { type: String },
        },
        analytics: {
          name: { type: String },
          description: { type: String },
        },
        marketing: {
          name: { type: String },
          description: { type: String },
        },
        functional: {
          name: { type: String },
          description: { type: String },
        },
      },
      services: [
        {
          id: { type: String, required: true },
          name: { type: String, required: true },
          enabled: { type: Boolean, default: false },
          trackingId: { type: String },
          category: {
            type: String,
            enum: ["analytics", "marketing", "functional"],
          },
        },
      ],
      consentExpiryDays: { type: Number, default: 365 },
    },
  },
  { timestamps: { createdAt: false, updatedAt: true }, _id: false }
);

export default mongoose.models.Setting ||
  mongoose.model<ISetting>("Setting", settingSchema);
