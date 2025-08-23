import mongoose from "mongoose";

export interface IWithdrawalSetting {
  minAmountMinor?: number;
  minPercent?: number;
  allowEmergencyOverride?: boolean;
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

export interface ISetting extends mongoose.Document {
  _id: string; // "platform"
  withdrawal?: IWithdrawalSetting;
  fees?: IFeeSetting;
  features?: IFeatureFlags;
  updatedAt: Date;
}

const settingSchema = new mongoose.Schema<ISetting>(
  {
    _id: { type: String, required: true },
    withdrawal: {
      minAmountMinor: { type: Number },
      minPercent: { type: Number },
      allowEmergencyOverride: { type: Boolean },
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
  },
  { timestamps: { createdAt: false, updatedAt: true }, _id: false }
);

export default mongoose.models.Setting ||
  mongoose.model<ISetting>("Setting", settingSchema);
