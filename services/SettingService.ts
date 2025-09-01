import { settingRepository } from "../repositories";
import { ISetting, IWithdrawalSetting, IFeeSetting, IFeatureFlags, IWebsiteSettings, IContactSettings, ISocialSettings, ISeoSettings } from "../models/Setting";
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
          platformFeeBps: 500,
          mobileMoneyFeeBps: 200
        },
        features: {
          whatsAppAutoPost: true,
          paypalEnabled: false,
          emergencyPoolFund: false
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
      whatsAppAutoPost: features.whatsAppAutoPost || false,
      paypalEnabled: features.paypalEnabled || false,
      emergencyPoolFund: features.emergencyPoolFund || false
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

    await this.updatePlatformSettings({
      features: { ...currentFeatures, ...featureUpdates },
      withdrawal: { ...currentWithdrawal, ...withdrawalUpdates }
    }, adminUserId);

    return this.getFeatureSettings();
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
}

export const settingService = new SettingService();
