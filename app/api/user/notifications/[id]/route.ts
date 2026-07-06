import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { authConfig } from "@/lib/auth-config";
import { connectDB } from "@/lib/db";
import InAppNotificationModel from "@/models/InAppNotification";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session: Session | null = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid notification ID" }, { status: 400 });
    }

    await connectDB();
    const userId = new mongoose.Types.ObjectId(session.user.id);

    await InAppNotificationModel.deleteOne({
      _id: id,
      recipientType: "user",
      recipientId: userId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/user/notifications/[id]]", error);
    return NextResponse.json({ error: "Failed to delete notification" }, { status: 500 });
  }
}

export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session: Session | null = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid notification ID" }, { status: 400 });
    }

    await connectDB();
    const userId = new mongoose.Types.ObjectId(session.user.id);

    await InAppNotificationModel.updateOne(
      { _id: id, recipientType: "user", recipientId: userId },
      { $set: { read: true } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PUT /api/user/notifications/[id]]", error);
    return NextResponse.json({ error: "Failed to mark notification as read" }, { status: 500 });
  }
}
