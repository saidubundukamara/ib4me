import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authConfig } from "@/lib/auth-config";
import { connectDB } from "@/lib/db";
import UserModel from "@/models/User";

// GET /api/user/profile - Get current user's profile
export async function GET() {
  try {
    const session: Session | null = await getServerSession(authConfig);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await connectDB();
    const user = (await UserModel.findById(userId).lean().exec()) as unknown as Record<string, unknown> | null;

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return safe user fields (exclude passwordHash, 2FA secrets, etc.)
    return NextResponse.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      photoUrl: user.photoUrl,
      bio: user.bio ?? null,
      whatsappOptIn: user.whatsappOptIn,
      address: user.address,
      payoutPreferences: user.payoutPreferences,
    });
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}

// PUT /api/user/profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const session: Session | null = await getServerSession(authConfig);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, phone, photoUrl, bio, whatsappOptIn } = body;

    await connectDB();

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (typeof email === "string" && email.trim() !== "") {
      updateData.email = email.trim().toLowerCase();
    }
    if (phone !== undefined) updateData.phone = phone || null;
    if (photoUrl !== undefined) updateData.photoUrl = photoUrl || null;
    if (bio !== undefined) updateData.bio = typeof bio === "string" && bio.trim() ? bio.trim() : null;
    if (whatsappOptIn !== undefined) updateData.whatsappOptIn = Boolean(whatsappOptIn);

    // Use strict: false so fields like `bio` are persisted even when the
    // cached Mongoose model schema predates this field being added.
    const updatedUser = (await UserModel.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, strict: false }
    ).lean()) as unknown as Record<string, unknown> | null;

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return updated user with safe fields
    return NextResponse.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      photoUrl: updatedUser.photoUrl,
      bio: updatedUser.bio ?? null,
      whatsappOptIn: updatedUser.whatsappOptIn,
      address: updatedUser.address,
      payoutPreferences: updatedUser.payoutPreferences,
    });
  } catch (error) {
    console.error("Failed to update user profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
