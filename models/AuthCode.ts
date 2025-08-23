import mongoose from "mongoose";

export interface IAuthCode extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  channel: "sms" | "email" | "whatsapp";
  purpose: "login" | "verify_email" | "verify_phone" | "reset_password";
  codeHash: string;
  expiresAt: Date;
  consumedAt?: Date | null;
  ip?: string | null;
  userAgent?: string | null;
  createdAt: Date;
}

const authCodeSchema = new mongoose.Schema<IAuthCode>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    channel: {
      type: String,
      enum: ["sms", "email", "whatsapp"],
      required: true,
    },
    purpose: {
      type: String,
      enum: ["login", "verify_email", "verify_phone", "reset_password"],
      required: true,
    },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    consumedAt: { type: Date, default: null },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

authCodeSchema.index({ userId: 1, purpose: 1, channel: 1, expiresAt: 1 });

export default mongoose.models.AuthCode ||
  mongoose.model<IAuthCode>("AuthCode", authCodeSchema);
