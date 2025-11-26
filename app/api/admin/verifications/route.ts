import { NextRequest, NextResponse } from "next/server";
import { verificationService } from "@/services/VerificationService";
import { validateAdminAuth, AdminAuthError } from "@/lib/admin-auth";
import { IUser } from "@/models/User";

// Helper to transform verification data for frontend
function transformVerification(verification: {
  _id?: unknown;
  userId?: unknown;
  type?: string;
  status?: string;
  submittedAt?: Date | null;
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
    type: verification.type || "",
    status: verification.status || "",
    submittedAt: verification.submittedAt?.toISOString() || null,
    reviewedAt: verification.reviewedAt?.toISOString() || null,
    rejectionReason: verification.rejectionReason || null,
    kycDocuments: verification.kycDocuments || null,
    kybDocuments: verification.kybDocuments || null,
    createdAt: verification.createdAt?.toISOString() || "",
    updatedAt: verification.updatedAt?.toISOString() || "",
  };
}

// GET /api/admin/verifications - List verifications with filters
export async function GET(request: NextRequest) {
  try {
    await validateAdminAuth();

    const { searchParams } = new URL(request.url);

    const filters = {
      status: (searchParams.get("status") as "pending" | "under_review" | "approved" | "rejected" | "all") || undefined,
      type: (searchParams.get("type") as "kyc" | "kyb" | "all") || undefined,
      search: searchParams.get("search") || undefined,
    };

    const options = {
      page: parseInt(searchParams.get("page") || "1", 10),
      limit: Math.min(parseInt(searchParams.get("limit") || "20", 10), 100),
      sortBy: searchParams.get("sortBy") || "submittedAt",
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
    };

    const result = await verificationService.listForAdmin(filters, options);

    const transformedVerifications = result.verifications.map(transformVerification);

    return NextResponse.json({
      success: true,
      verifications: transformedVerifications,
      page: result.page,
      totalPages: result.totalPages,
      total: result.total,
    });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode }
      );
    }
    console.error("GET /api/admin/verifications error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch verifications",
      },
      { status: 500 }
    );
  }
}
