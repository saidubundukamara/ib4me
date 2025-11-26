import { NextRequest, NextResponse } from "next/server";
import { verificationService } from "@/services/VerificationService";
import { validateAdminAuth, extractAuditContext, AdminAuthError } from "@/lib/admin-auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/admin/verifications/[id]/approve - Approve verification
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const adminAuth = await validateAdminAuth();
    const auditContext = extractAuditContext(request);

    const { id } = await params;

    const verification = await verificationService.approveVerification(
      id,
      adminAuth.adminId.toString(),
      auditContext
    );

    if (!verification) {
      return NextResponse.json(
        { success: false, message: "Failed to approve verification" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verification approved successfully",
      status: verification.status,
    });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode }
      );
    }
    console.error("POST /api/admin/verifications/[id]/approve error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to approve verification",
      },
      { status: 400 }
    );
  }
}
