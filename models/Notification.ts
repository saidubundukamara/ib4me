import mongoose from "mongoose";

export interface INotificationRecipient {
  userId?: mongoose.Types.ObjectId | null;
  phone?: string | null;
  email?: string | null;
}

export interface INotification extends mongoose.Document {
  recipient: INotificationRecipient;
  channel: "sms" | "email" | "whatsapp" | "push";
  template: string;
  payload?: Record<string, unknown> | null;
  status: "queued" | "sent" | "failed";
  providerMessageId?: string | null;
  createdAt: Date;
}

const notificationSchema = new mongoose.Schema<INotification>(
  {
    recipient: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      phone: { type: String, default: null },
      email: { type: String, default: null },
    },
    channel: {
      type: String,
      enum: ["sms", "email", "whatsapp", "push"],
      required: true,
      index: true,
    },
    template: { type: String, required: true },
    payload: { type: Object, default: null },
    status: {
      type: String,
      enum: ["queued", "sent", "failed"],
      default: "queued",
      index: true,
    },
    providerMessageId: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

notificationSchema.index({ "recipient.userId": 1, createdAt: -1 });

export default mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", notificationSchema);
