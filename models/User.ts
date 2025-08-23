import mongoose from "mongoose";

export interface IUser extends mongoose.Document {
  name: string;
  email?: string | null;
  phone?: string | null;
  photoUrl?: string | null;
  passwordHash?: string | null;
  emailVerified?: Date | null;
  roles?: string[];
  status?: "active" | "inactive" | "blocked";
  whatsappOptIn?: boolean;
  payoutPreferences?: {
    mobileMoney?: {
      provider?: string | null;
      msisdn?: string | null;
      accountName?: string | null;
    } | null;
    bank?: {
      bankName?: string | null;
      accountNumber?: string | null;
      accountName?: string | null;
    } | null;
  } | null;
  address?: {
    country?: string | null;
    city?: string | null;
  } | null;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      default: null,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: { type: String, default: null, index: true },
    photoUrl: { type: String, default: null },
    passwordHash: { type: String, default: null },
    emailVerified: { type: Date, default: null },
    roles: { type: [String], default: ["user"] },
    status: {
      type: String,
      enum: ["active", "inactive", "blocked"],
      default: "active",
      index: true,
    },
    whatsappOptIn: { type: Boolean, default: false },
    payoutPreferences: {
      mobileMoney: {
        provider: { type: String, default: null },
        msisdn: { type: String, default: null },
        accountName: { type: String, default: null },
      },
      bank: {
        bankName: { type: String, default: null },
        accountNumber: { type: String, default: null },
        accountName: { type: String, default: null },
      },
    },
    address: {
      country: { type: String, default: null },
      city: { type: String, default: null },
    },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ phone: 1 }, { unique: true, sparse: true });

export default mongoose.models.User ||
  mongoose.model<IUser>("User", userSchema);
