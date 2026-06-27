import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { validateAdminAuth, AdminAuthError } from "@/lib/admin-auth";
import InAppNotificationModel from "@/models/InAppNotification";

export async function GET(request: NextRequest) {
  try {
    await validateAdminAuth();
    await connectDB();

    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get("limit") ?? "20"), 100);

    const notifications = await InAppNotificationModel.find({
      recipientType: "admin",
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const unreadCount = await InAppNotificationModel.countDocuments({
      recipientType: "admin",
      read: false,
    });

    return NextResponse.json({
      notifications: notifications.map((n) => ({
        _id: String(n._id),
        type: n.type,
        title: n.title,
        message: n.message,
        read: n.read,
        link: n.link ?? null,
        createdAt: n.createdAt.toISOString(),
      })),
      unreadCount,
    });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[GET /api/admin/notifications]", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}
