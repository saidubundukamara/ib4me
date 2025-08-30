import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { campaignService } from "@/services/CampaignService";

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
    return NextResponse.json(campaigns);
    
  } catch (error) {
    console.error("Failed to fetch user campaigns:", error);
    return NextResponse.json({ 
      error: "Failed to fetch campaigns" 
    }, { status: 500 });
  }
}