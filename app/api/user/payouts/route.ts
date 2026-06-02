import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authConfig } from "@/lib/auth-config";
import { connectDB } from "@/lib/db";
import { campaignService } from "@/services/CampaignService";
import { payoutRepository } from "@/repositories/PayoutRepository";
import { userRepository } from "@/repositories/UserRepository";

export async function GET() {
  try {
    await connectDB();
    const session: Session | null = await getServerSession(authConfig);
    const userId = session?.user?.id
      ? new mongoose.Types.ObjectId(session.user.id)
      : null;
    
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const campaigns = await campaignService.listByOwner(userId);
    const campaignIds = campaigns.map((c) => c._id as mongoose.Types.ObjectId);
    
    // Limit is high enough that the dashboard's Total Withdrawn / Pending
    // Requests aggregates (derived from this list) stay accurate per user.
    const payouts = campaignIds.length
      ? await payoutRepository.listRecentByCampaignIds(campaignIds, 200)
      : [];

    return NextResponse.json(payouts);

  } catch (error) {
    console.error("Failed to fetch user payouts:", error);
    return NextResponse.json({
      error: "Failed to fetch payouts"
    }, { status: 500 });
  }
}

// PUT /api/user/payouts - Update user payout preferences
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const session: Session | null = await getServerSession(authConfig);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { mobileMoney, bank } = body;

    const updatedUser = await userRepository.updateById(userId, {
      $set: {
        "payoutPreferences.mobileMoney": mobileMoney || null,
        "payoutPreferences.bank": bank || null,
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
    console.error("Failed to update payout preferences:", error);
    return NextResponse.json(
      { error: "Failed to update payout details" },
      { status: 500 }
    );
  }
}