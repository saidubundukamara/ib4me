import { NextRequest, NextResponse } from "next/server";
import { validateAdminAuth, AdminAuthError } from "@/lib/admin-auth";
import { donationService } from "@/services";

/**
 * POST /api/admin/donations/reconcile-transfers
 *
 * Sweep donations whose payment settled but whose platform→campaign transfer
 * never completed (funds still sitting in the platform account), and settle
 * each one. Use this to recover money that got stuck because the donor never
 * returned to the success URL and the webhook didn't finish the transfer.
 *
 * Body (optional JSON): { limit?: number }
 */
export async function POST(req: NextRequest) {
  try {
    try {
      await validateAdminAuth();
    } catch (authError) {
      if (authError instanceof AdminAuthError) {
        return NextResponse.json(
          { error: authError.message },
          { status: authError.statusCode }
        );
      }
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let limit = 100;
    try {
      const body = await req.json();
      if (typeof body?.limit === "number" && body.limit > 0) {
        limit = Math.min(body.limit, 500);
      }
    } catch {
      // No/invalid body — use the default limit.
    }

    const stuck = await donationService.getDonationsWithUnsettledTransfer(limit);

    const results = [];
    for (const donation of stuck) {
      const donationId = String(donation._id);
      try {
        const result = await donationService.settleTransfer(donationId, {
          source: "reconciliation",
        });
        results.push({ donationId, ...result });
      } catch (err) {
        results.push({
          donationId,
          status: "failed" as const,
          reason: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    const summary = {
      scanned: stuck.length,
      completed: results.filter((r) => r.status === "completed").length,
      pending: results.filter((r) => r.status === "pending").length,
      failed: results.filter((r) => r.status === "failed").length,
    };

    return NextResponse.json({ success: true, summary, results });
  } catch (error) {
    console.error("Error reconciling transfers:", error);
    return NextResponse.json(
      {
        error: "Failed to reconcile transfers",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
