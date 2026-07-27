import mongoose from "mongoose";

export interface IInAppNotification extends mongoose.Document {
  recipientId?: mongoose.Types.ObjectId | null;
  recipientType: "user" | "admin";
  type: "donation" | "payout" | "campaign" | "verification" | "system";
  title: string;
  message: string;
  read: boolean;
  link?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const inAppNotificationSchema = new mongoose.Schema<IInAppNotification>(
  {
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    recipientType: { type: String, enum: ["user", "admin"], required: true, index: true },
    type: { type: String, enum: ["donation", "payout", "campaign", "verification", "system"], required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false, index: true },
    link: { type: String, default: null },
  },
  { timestamps: true }
);

inAppNotificationSchema.index({ recipientType: 1, recipientId: 1, createdAt: -1 });

const InAppNotificationModel =
  (mongoose.models.InAppNotification as mongoose.Model<IInAppNotification>) ||
  mongoose.model<IInAppNotification>("InAppNotification", inAppNotificationSchema);

export default InAppNotificationModel;
