import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authConfig } from "@/app/api/auth/[...nextauth]/route";
import { verificationService } from "@/services/VerificationService";

// GET /api/user/verification - Get current user's verification status
export async function GET() {
  try {
    const session: Session | null = await getServerSession(authConfig);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const verificationStatus = await verificationService.getVerificationStatus(userId);

    if (!verificationStatus) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(verificationStatus);
  } catch (error) {
    console.error("Failed to fetch verification status:", error);
    return NextResponse.json(
      { error: "Failed to fetch verification status" },
      { status: 500 }
    );
  }
}

// POST /api/user/verification - Submit verification documents
export async function POST(request: NextRequest) {
  try {
    const session: Session | null = await getServerSession(authConfig);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { type, documents } = body;

    if (!type || !["kyc", "kyb"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid verification type. Must be 'kyc' or 'kyb'" },
        { status: 400 }
      );
    }

    let updated;
    if (type === "kyc") {
      updated = await verificationService.submitKycDocuments(userId, documents || {});
    } else {
      updated = await verificationService.submitKybDocuments(userId, documents || {});
    }

    if (!updated) {
      return NextResponse.json(
        { error: "Failed to submit verification" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Verification submitted successfully",
      status: updated.status,
    });
  } catch (error) {
    console.error("Failed to submit verification:", error);
    const message = error instanceof Error ? error.message : "Failed to submit verification";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// PUT /api/user/verification - Upload individual verification document
export async function PUT(request: NextRequest) {
  try {
    const session: Session | null = await getServerSession(authConfig);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { type, documentType, assetId } = body;

    if (!type || !["kyc", "kyb"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid verification type. Must be 'kyc' or 'kyb'" },
        { status: 400 }
      );
    }

    if (!documentType || !assetId) {
      return NextResponse.json(
        { error: "documentType and assetId are required" },
        { status: 400 }
      );
    }

    let updated;
    if (type === "kyc") {
      const validKycDocs = ["idDocument", "addressProof"];
      if (!validKycDocs.includes(documentType)) {
        return NextResponse.json(
          { error: `Invalid KYC document type. Must be one of: ${validKycDocs.join(", ")}` },
          { status: 400 }
        );
      }
      updated = await verificationService.uploadKycDocument(userId, documentType, assetId);
    } else {
      const validKybDocs = ["registrationCertificate", "representativeId", "addressProof", "taxCertificate"];
      if (!validKybDocs.includes(documentType)) {
        return NextResponse.json(
          { error: `Invalid KYB document type. Must be one of: ${validKybDocs.join(", ")}` },
          { status: 400 }
        );
      }
      updated = await verificationService.uploadKybDocument(userId, documentType, assetId);
    }

    if (!updated) {
      return NextResponse.json(
        { error: "Failed to upload document" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Document uploaded successfully",
      status: updated.status,
    });
  } catch (error) {
    console.error("Failed to upload verification document:", error);
    const message = error instanceof Error ? error.message : "Failed to upload document";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
