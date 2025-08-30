import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authConfig } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { campaignService } from "@/services/CampaignService";
import { payoutService } from "@/services/PayoutService";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const session: Session | null = await getServerSession(authConfig);
    const userId = session?.user?.id
      ? new mongoose.Types.ObjectId(session.user.id)
      : null;
    
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const formData = await request.formData();
    const campaignIdStr = String(formData.get("campaignId") || "");
    const amountStr = String(formData.get("amount") || "0");
    const payoutType = String(formData.get("payoutType") || "mobile_money");
    const msisdn = String(formData.get("msisdn") || "");
    const accountNumber = String(formData.get("accountNumber") || "");
    const accountName = String(formData.get("accountName") || "");
    const providerId = String(formData.get("providerId") || "");

    if (!campaignIdStr) {
      return NextResponse.json({ error: "Please select a campaign" }, { status: 400 });
    }
    
    // Fetch the campaign data
    const userCampaigns = await campaignService.listByOwner(userId);
    const campaign = userCampaigns.find((c) => String(c._id) === campaignIdStr);
    if (!campaign) {
      return NextResponse.json({ error: "Invalid campaign selected" }, { status: 400 });
    }
    
    // Check if campaign has financial account
    if (!campaign.financial_account?.id) {
      return NextResponse.json({ 
        error: "Campaign setup is incomplete. Please contact support to enable withdrawals." 
      }, { status: 400 });
    }
    
    // const raised = campaign.totals?.raisedMinor ?? 0;
    // const paid = campaign.withdrawals?.totalPaidMinor ?? 0;
    // const availableMinor = Math.max(0, raised - paid);

    const amountMinor = Math.round(Number(amountStr) * 100);
    if (!Number.isFinite(amountMinor) || amountMinor <= 0) {
      return NextResponse.json({ error: "Please enter a valid amount" }, { status: 400 });
    }

    // Validate payout method based on type
    if (payoutType === "mobile_money") {
      if (!msisdn || !/^\d{7,15}$/.test(msisdn)) {
        return NextResponse.json({ 
          error: "Please enter a valid mobile number (7-15 digits)" 
        }, { status: 400 });
      }
    } else if (payoutType === "bank") {
      if (!accountNumber || accountNumber.length < 5) {
        return NextResponse.json({ 
          error: "Please enter a valid account number" 
        }, { status: 400 });
      }
      if (!accountName || accountName.trim().length < 2) {
        return NextResponse.json({ 
          error: "Please enter a valid account holder name" 
        }, { status: 400 });
      }
      if (!providerId) {
        return NextResponse.json({ error: "Please select a bank" }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: "Invalid payout method selected" }, { status: 400 });
    }

    // Build method object based on type
    const method = payoutType === "mobile_money" 
      ? {
          type: "mobile_money" as const,
          msisdn,
          accountName: accountName || undefined,
        }
      : {
          type: "bank" as const,
          providerId,
          accountNumber,
          accountName,
        };

    await payoutService.requestPayout({
      campaignId: new mongoose.Types.ObjectId(campaignIdStr),
      requestedBy: userId,
      amountMinor,
      method,
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("Payout request error:", error);
    
    // More specific error messages for common failures
    if (error instanceof Error) {
      if (error.message.includes("financial account")) {
        return NextResponse.json({ 
          error: "Campaign setup is incomplete. Please contact support to enable withdrawals." 
        }, { status: 400 });
      } else if (error.message.includes("Insufficient funds")) {
        return NextResponse.json({ 
          error: "Insufficient funds available for withdrawal" 
        }, { status: 400 });
      } else if (error.message.includes("Payout failed")) {
        return NextResponse.json({ 
          error: "Unable to process payout at this time. Please try again in a few minutes." 
        }, { status: 500 });
      } else if (error.message.includes("NETWORK_ERROR")) {
        return NextResponse.json({ 
          error: "Network error. Please check your connection and try again." 
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({ 
      error: "An unexpected error occurred. Please try again or contact support if the issue persists." 
    }, { status: 500 });
  }
}