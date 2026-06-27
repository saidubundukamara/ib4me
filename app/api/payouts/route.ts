import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authConfig } from "@/lib/auth-config";
import { connectDB } from "@/lib/db";
import { campaignService } from "@/services/CampaignService";
import { payoutService } from "@/services/PayoutService";
import { settingService } from "@/services/SettingService";
import PayoutModel from "@/models/Payout";
import { createAdminNotification } from "@/lib/createNotification";
import {
  lookupMobileMoneyHolder,
  InvalidMobileNumberError,
  UnregisteredMobileMoneyError,
} from "@/lib/mobileMoney";

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

    // Bank withdrawals are disabled until a separate bank-KYC mechanism exists.
    if (payoutType === "bank") {
      return NextResponse.json({
        error: "Bank withdrawals are temporarily unavailable. Please withdraw to a mobile money wallet.",
      }, { status: 400 });
    }
    if (payoutType !== "mobile_money") {
      return NextResponse.json({ error: "Invalid payout method selected" }, { status: 400 });
    }

    if (!msisdn || !/^\d{7,15}$/.test(msisdn)) {
      return NextResponse.json({
        error: "Please enter a valid mobile number (7-15 digits)",
      }, { status: 400 });
    }

    // Authoritative KYC: re-run the holder-name lookup server-side so it cannot be
    // bypassed by the client. Resolves the operator (Orange/Africell) and the
    // registered holder name, which we persist on the payout for audit.
    let holder;
    try {
      holder = await lookupMobileMoneyHolder(msisdn);
    } catch (kycError) {
      if (
        kycError instanceof InvalidMobileNumberError ||
        kycError instanceof UnregisteredMobileMoneyError
      ) {
        return NextResponse.json({ error: kycError.message }, { status: 400 });
      }
      return NextResponse.json({
        error: "Unable to verify this number. Please check it and try again.",
      }, { status: 502 });
    }

    // Build method object — store the resolved provider and verified holder name.
    const method = {
      type: "mobile_money" as const,
      provider: holder.providerId,
      msisdn: holder.msisdn,
      accountName: holder.holderName,
    };

    // Get withdrawal settings for threshold checks
    const withdrawalSettings = await settingService.getWithdrawalSettings();

    // Enforce daily and monthly withdrawal limits per user
    const now = new Date();
    const countableStatuses = { $nin: ["failed", "cancelled", "rejected"] };

    if (withdrawalSettings.dailyLimitMinor && withdrawalSettings.dailyLimitMinor > 0) {
      const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const dailyAgg = await PayoutModel.aggregate([
        { $match: { requestedBy: userId, status: countableStatuses, createdAt: { $gte: past24h } } },
        { $group: { _id: null, total: { $sum: "$amountMinor" } } },
      ]);
      const dailyTotal = dailyAgg[0]?.total ?? 0;
      if (dailyTotal + amountMinor > withdrawalSettings.dailyLimitMinor) {
        const remaining = Math.max(0, withdrawalSettings.dailyLimitMinor - dailyTotal);
        return NextResponse.json({
          error: `Daily withdrawal limit reached. You have ${(remaining / 100).toFixed(2)} SLE remaining today.`,
        }, { status: 429 });
      }
    }

    if (withdrawalSettings.monthlyLimitMinor && withdrawalSettings.monthlyLimitMinor > 0) {
      const past30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const monthlyAgg = await PayoutModel.aggregate([
        { $match: { requestedBy: userId, status: countableStatuses, createdAt: { $gte: past30d } } },
        { $group: { _id: null, total: { $sum: "$amountMinor" } } },
      ]);
      const monthlyTotal = monthlyAgg[0]?.total ?? 0;
      if (monthlyTotal + amountMinor > withdrawalSettings.monthlyLimitMinor) {
        const remaining = Math.max(0, withdrawalSettings.monthlyLimitMinor - monthlyTotal);
        return NextResponse.json({
          error: `Monthly withdrawal limit reached. You have ${(remaining / 100).toFixed(2)} SLE remaining this month.`,
        }, { status: 429 });
      }
    }

    const payout = await payoutService.requestPayout(
      {
        campaignId: new mongoose.Types.ObjectId(campaignIdStr),
        requestedBy: userId,
        amountMinor,
        method,
      },
      {
        minimumWithdrawalAmount: withdrawalSettings.minAmountMinor,
        minimumWithdrawalPercent: withdrawalSettings.minPercent,
      }
    );

    console.log("[payout] route responding", {
      payoutId: payout.id,
      status: payout.status,
    });

    // Notify admins when a withdrawal needs manual review
    if (payout.status === "threshold_review" || payout.status === "in_review") {
      const amountSLE = (amountMinor / 100).toFixed(2);
      createAdminNotification({
        type: "payout",
        title: "Withdrawal requires review",
        message: `A withdrawal request for SLE ${amountSLE} is pending ${payout.status === "threshold_review" ? "threshold" : "manual"} review.`,
        link: "/s/admin/payouts",
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      status: payout.status,
      payoutId: payout.id,
    });
    
  } catch (error) {
    console.error("Payout request error:", error);
    
    // More specific error messages for common failures
    if (error instanceof Error) {
      if (error.message.includes("Withdrawals are temporarily disabled")) {
        return NextResponse.json({
          error: error.message
        }, { status: 403 });
      } else if (error.message.includes("financial account")) {
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