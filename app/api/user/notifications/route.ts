import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { authConfig } from "@/lib/auth-config";
import { connectDB } from "@/lib/db";
import InAppNotificationModel from "@/models/InAppNotification";

export async function GET(request: NextRequest) {
  try {
    const session: Session | null = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await connectDB();
    const userId = new mongoose.Types.ObjectId(session.user.id);
    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get("limit") ?? "20"), 50);

    const notifications = await InAppNotificationModel.find({
      recipientType: "user",
      recipientId: userId,
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const unreadCount = await InAppNotificationModel.countDocuments({
      recipientType: "user",
      recipientId: userId,
      read: false,
    });

    return NextResponse.json({
      notifications: notifications.map((n) => ({
        id: String(n._id),
        type: n.type,
        title: n.title,
        message: n.message,
        read: n.read,
        link: n.link ?? null,
        date: n.createdAt.toISOString(),
      })),
      unreadCount,
    });
  } catch (error) {
    console.error("[GET /api/user/notifications]", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}
