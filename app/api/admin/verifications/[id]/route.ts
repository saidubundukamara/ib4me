import { NextRequest, NextResponse } from "next/server";
import { verificationService } from "@/services/VerificationService";
import { validateAdminAuth, AdminAuthError } from "@/lib/admin-auth";
import { IUser } from "@/models/User";
import { IMediaAsset } from "@/models/MediaAsset";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Helper to transform a document (MediaAsset) for frontend
function transformDocument(doc: unknown): { _id: string; url: string | null; type: string | null } | null {
  if (!doc) return null;

  // If it's just an ObjectId string, return minimal info
  if (typeof doc === "string") {
    return { _id: doc, url: null, type: null };
  }

  // If it's a populated MediaAsset document
  const asset = doc as IMediaAsset;
  if (asset._id) {
    return {
      _id: asset._id.toString(),
      url: asset.url || null,
      type: asset.type || null,
    };
  }

  return null;
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
  kycDocuments?: {
    idDocument?: unknown;
    addressProof?: unknown;
  } | null;
  kybDocuments?: {
    registrationCertificate?: unknown;
    representativeId?: unknown;
    addressProof?: unknown;
    taxCertificate?: unknown;
  } | null;
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
    kycDocuments: verification.kycDocuments ? {
      idDocument: transformDocument(verification.kycDocuments.idDocument),
      addressProof: transformDocument(verification.kycDocuments.addressProof),
    } : null,
    kybDocuments: verification.kybDocuments ? {
      registrationCertificate: transformDocument(verification.kybDocuments.registrationCertificate),
      representativeId: transformDocument(verification.kybDocuments.representativeId),
      addressProof: transformDocument(verification.kybDocuments.addressProof),
      taxCertificate: transformDocument(verification.kybDocuments.taxCertificate),
    } : null,
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
