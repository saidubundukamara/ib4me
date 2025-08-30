import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { campaignService } from "@/services/CampaignService";
import { payoutRepository } from "@/repositories/PayoutRepository";

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
    
    const payouts = campaignIds.length
      ? await payoutRepository.listRecentByCampaignIds(campaignIds, 20)
      : [];

    return NextResponse.json(payouts);
    
  } catch (error) {
    console.error("Failed to fetch user payouts:", error);
    return NextResponse.json({ 
      error: "Failed to fetch payouts" 
    }, { status: 500 });
  }
}