import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { validateAdminAuth, AdminAuthError } from "@/lib/admin-auth";
import InAppNotificationModel from "@/models/InAppNotification";

export async function PUT() {
  try {
    await validateAdminAuth();
    await connectDB();

    await InAppNotificationModel.updateMany(
      { recipientType: "admin", read: false },
      { $set: { read: true } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[PUT /api/admin/notifications/mark-all-read]", error);
    return NextResponse.json({ error: "Failed to mark notifications as read" }, { status: 500 });
  }
}
