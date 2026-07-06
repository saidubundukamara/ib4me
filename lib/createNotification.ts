import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import InAppNotificationModel from "@/models/InAppNotification";

interface CreateUserNotificationInput {
  recipientId: mongoose.Types.ObjectId | string;
  type: "donation" | "payout" | "campaign" | "verification" | "system";
  title: string;
  message: string;
  link?: string;
}

interface CreateAdminNotificationInput {
  type: "donation" | "payout" | "campaign" | "verification" | "system";
  title: string;
  message: string;
  link?: string;
}

export async function createUserNotification(input: CreateUserNotificationInput) {
  try {
    await connectDB();
    await InAppNotificationModel.create({
      recipientId: input.recipientId,
      recipientType: "user",
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link ?? null,
    });
  } catch (err) {
    console.error("[createUserNotification] failed:", err);
  }
}

export async function createAdminNotification(input: CreateAdminNotificationInput) {
  try {
    await connectDB();
    await InAppNotificationModel.create({
      recipientId: null,
      recipientType: "admin",
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link ?? null,
    });
  } catch (err) {
    console.error("[createAdminNotification] failed:", err);
  }
}
