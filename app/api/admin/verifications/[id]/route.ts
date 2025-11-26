import { NextRequest, NextResponse } from "next/server";
import { verificationService } from "@/services/VerificationService";
import { validateAdminAuth, AdminAuthError } from "@/lib/admin-auth";
import { IUser } from "@/models/User";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Helper to transform verification data for frontend
function transformVerification(verification: {
  _id?: unknown;
  userId?: unknown;
  type?: string;
  status?: string;
  submittedAt?: Date | null;
  reviewedBy?: unknown;
  reviewedAt?: Date | null;
  rejectionReason?: string | null;
  kycDocuments?: unknown;
  kybDocuments?: unknown;
  createdAt?: Date;
  updatedAt?: Date;
}) {
  const user = verification.userId as unknown as IUser | null;

  return {
    _id: verification._id?.toString() || "",
    userId: user?._id?.toString() || "",
    userName: user?.name || "",
    userEmail: user?.email || "",
    userPhone: user?.phone || "",
    userOrganization: user?.organization || null,
    type: verification.type || "",
    status: verification.status || "",
    submittedAt: verification.submittedAt?.toISOString() || null,
    reviewedBy: verification.reviewedBy?.toString() || null,
    reviewedAt: verification.reviewedAt?.toISOString() || null,
    rejectionReason: verification.rejectionReason || null,
    kycDocuments: verification.kycDocuments || null,
    kybDocuments: verification.kybDocuments || null,
    createdAt: verification.createdAt?.toISOString() || "",
    updatedAt: verification.updatedAt?.toISOString() || "",
  };
}

// GET /api/admin/verifications/[id] - Get verification details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await validateAdminAuth();

    const { id } = await params;
    const verification = await verificationService.getById(id);

    if (!verification) {
      return NextResponse.json(
        { success: false, message: "Verification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      verification: transformVerification(verification),
    });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode }
      );
    }
    console.error("GET /api/admin/verifications/[id] error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch verification",
      },
      { status: 500 }
    );
  }
}
