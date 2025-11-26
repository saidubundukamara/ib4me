import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/app/api/auth/[...nextauth]/route";
import { verificationService } from "@/services/VerificationService";

// POST /api/user/verification/resubmit - Resubmit rejected verification
export async function POST() {
  try {
    const session: Session | null = await getServerSession(authConfig);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const updated = await verificationService.resubmitVerification(userId);

    if (!updated) {
      return NextResponse.json(
        { error: "Failed to resubmit verification" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Verification resubmitted successfully",
      status: updated.status,
    });
  } catch (error) {
    console.error("Failed to resubmit verification:", error);
    const message = error instanceof Error ? error.message : "Failed to resubmit verification";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
