import mongoose from "mongoose";
import { settingRepository } from "../repositories";
import { ISetting, IWithdrawalSetting, IFeeSetting, IFeatureFlags, IWebsiteSettings, IContactSettings, ISocialSettings, ISeoSettings, ICampaignLimitsSettings } from "../models/Setting";
import { createSimpleAuditLog } from "../lib/simple-admin-audit";

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

interface WithdrawalSettings {
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
  baseFeeMinor: number;
  processingFee: {
    individualBps: number;
    organizationBps: number;
  };
}

export interface CalculatedFees {
  baseFeeMinor: number;
  processingFeeMinor: number;
  processingFeeBps: number;
  campaignType: CampaignType;
  totalFeeMinor: number;
  totalChargedMinor: number;
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
          baseFeeMinor: 50,  // Le 0.50
          processingFee: {
            individualBps: 260,    // 2.6%
            organizationBps: 200,  // 2.0%
          },
          // Legacy
          platformFeeBps: 500,
          mobileMoneyFeeBps: 200
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
      platformFeeRate: (fees.platformFeeBps || 500) / 100,
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
    
    const feeUpdates: Partial<IFeeSetting> = {};
    if (updates.platformFeeRate !== undefined) {
      feeUpdates.platformFeeBps = Math.round(updates.platformFeeRate * 100);
    }

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
      maintenanceMode: false,
      allowRegistration: true,
      requireEmailVerification: true,
      enableWhatsAppSharing: true,
      enableSMSNotifications: true,
      enableEmailNotifications: true,
      minimumWithdrawalAmount: withdrawal.minAmountMinor || 50000,
      minimumWithdrawalPercent: withdrawal.minPercent || 10,
      allowEmergencyOverride: withdrawal.allowEmergencyOverride ?? true,
      withdrawalsBlocked: withdrawal.withdrawalsBlocked || false,
      blockedReason: withdrawal.blockedReason,
      blockedBy: withdrawal.blockedBy?.toString(),
      blockedAt: withdrawal.blockedAt?.toISOString(),
      whatsAppAutoPost: features.whatsAppAutoPost || false,
      paypalEnabled: features.paypalEnabled || false,
      emergencyPoolFund: features.emergencyPoolFund || false
    };
  }

  async getWithdrawalSettings(): Promise<WithdrawalSettings> {
    const settings = await this.getOrCreatePlatform();
    const withdrawal = settings.withdrawal || {};

    return {
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
    if (updates.whatsAppAutoPost !== undefined) featureUpdates.whatsAppAutoPost = updates.whatsAppAutoPost;
    if (updates.paypalEnabled !== undefined) featureUpdates.paypalEnabled = updates.paypalEnabled;
    if (updates.emergencyPoolFund !== undefined) featureUpdates.emergencyPoolFund = updates.emergencyPoolFund;

    const withdrawalUpdates: Partial<IWithdrawalSetting> = {};
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
      baseFeeMinor: fees.baseFeeMinor ?? 50,  // Default Le 0.50
      processingFee: {
        individualBps: fees.processingFee?.individualBps ?? 260,    // Default 2.6%
        organizationBps: fees.processingFee?.organizationBps ?? 200, // Default 2.0%
      }
    };
  }

  async updateFeeSettings(
    updates: Partial<FeeSettings>,
    adminUserId?: string
  ): Promise<FeeSettings> {
    const settings = await this.getOrCreatePlatform();
    const currentFees = settings.fees || {};

    const feeUpdates: Partial<IFeeSetting> = { ...currentFees };

    if (updates.baseFeeMinor !== undefined) {
      feeUpdates.baseFeeMinor = updates.baseFeeMinor;
    }

    if (updates.processingFee) {
      feeUpdates.processingFee = {
        individualBps: updates.processingFee.individualBps ?? currentFees.processingFee?.individualBps ?? 260,
        organizationBps: updates.processingFee.organizationBps ?? currentFees.processingFee?.organizationBps ?? 200,
      };
    }

    await this.updatePlatformSettings({ fees: feeUpdates }, adminUserId);

    return this.getFeeSettings();
  }

  /**
   * Calculate fees for a donation based on campaign type
   * Fees are added ON TOP of the donation amount
   */
  calculateDonationFees(
    donationAmountMinor: number,
    campaignType: CampaignType,
    feeSettings: FeeSettings
  ): CalculatedFees {
    const baseFeeMinor = feeSettings.baseFeeMinor;
    const processingFeeBps = campaignType === "organization"
      ? feeSettings.processingFee.organizationBps
      : feeSettings.processingFee.individualBps;

    // Calculate processing fee: amount * (bps / 10000)
    const processingFeeMinor = Math.round(donationAmountMinor * processingFeeBps / 10000);
    const totalFeeMinor = baseFeeMinor + processingFeeMinor;
    const totalChargedMinor = donationAmountMinor + totalFeeMinor;

    return {
      baseFeeMinor,
      processingFeeMinor,
      processingFeeBps,
      campaignType,
      totalFeeMinor,
      totalChargedMinor
    };
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
}

export const settingService = new SettingService();
