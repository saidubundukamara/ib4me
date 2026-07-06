import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { authConfig } from "@/lib/auth-config";
import { connectDB } from "@/lib/db";
import InAppNotificationModel from "@/models/InAppNotification";

export async function PUT() {
  try {
    const session: Session | null = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await connectDB();
    const userId = new mongoose.Types.ObjectId(session.user.id);

    await InAppNotificationModel.updateMany(
      { recipientType: "user", recipientId: userId, read: false },
      { $set: { read: true } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PUT /api/user/notifications/mark-all-read]", error);
    return NextResponse.json({ error: "Failed to mark notifications as read" }, { status: 500 });
  }
}
