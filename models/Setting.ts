import mongoose from "mongoose";

export interface IWithdrawalSetting {
  minAmountMinor?: number;
  minPercent?: number;
  allowEmergencyOverride?: boolean;
  withdrawalsBlocked?: boolean;
  blockedReason?: string;
  blockedBy?: mongoose.Types.ObjectId;
  blockedAt?: Date;
}

export interface IFeeSetting {
  platformFeeBps?: number;
  mobileMoneyFeeBps?: number;
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
  updatedAt: Date;
}

const settingSchema = new mongoose.Schema<ISetting>(
  {
    _id: { type: String, required: true },
    withdrawal: {
      minAmountMinor: { type: Number },
      minPercent: { type: Number },
      allowEmergencyOverride: { type: Boolean },
      withdrawalsBlocked: { type: Boolean, default: false },
      blockedReason: { type: String },
      blockedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      blockedAt: { type: Date },
    },
    fees: {
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
  },
  { timestamps: { createdAt: false, updatedAt: true }, _id: false }
);

export default mongoose.models.Setting ||
  mongoose.model<ISetting>("Setting", settingSchema);
