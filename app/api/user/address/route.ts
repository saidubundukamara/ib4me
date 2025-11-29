import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authConfig } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { userRepository } from "@/repositories/UserRepository";

// PUT /api/user/address - Update user address
export async function PUT(request: NextRequest) {
  try {
    const session: Session | null = await getServerSession(authConfig);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { country, city } = body;

    await connectDB();

    const updatedUser = await userRepository.updateById(userId, {
      $set: {
        "address.country": country || null,
        "address.city": city || null,
      },
    } as never);

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
      whatsappOptIn: updatedUser.whatsappOptIn,
      address: updatedUser.address,
      payoutPreferences: updatedUser.payoutPreferences,
    });
  } catch (error) {
    console.error("Failed to update user address:", error);
    return NextResponse.json(
      { error: "Failed to update address" },
      { status: 500 }
    );
  }
}
