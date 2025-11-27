import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authConfig } from "@/app/api/auth/[...nextauth]/route";
import { verificationService } from "@/services/VerificationService";
import { CloudinaryService } from "@/lib/cloudinary";
import MediaAssetModel from "@/models/MediaAsset";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import type { IKycDocuments, IKybDocuments } from "@/models/Verification";

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

    return NextResponse.json({ data: verificationStatus });
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

    // Get user's verification type from their profile (same as PUT handler)
    const verificationStatus = await verificationService.getVerificationStatus(userId);
    if (!verificationStatus) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const type = verificationStatus.type;

    // Optionally parse body for any additional documents
    let documents = {};
    try {
      const body = await request.json();
      documents = body.documents || {};
    } catch {
      // Empty body is OK - type is inferred from profile
    }

    let updated;
    if (type === "kyc") {
      updated = await verificationService.submitKycDocuments(userId, documents);
    } else {
      updated = await verificationService.submitKybDocuments(userId, documents);
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

    // Parse FormData (file upload)
    const form = await request.formData();
    const documentType = form.get("documentType") as string;
    const file = form.get("file") as File | null;

    if (!documentType) {
      return NextResponse.json(
        { error: "documentType is required" },
        { status: 400 }
      );
    }

    if (!file || file.size === 0) {
      return NextResponse.json(
        { error: "File is required" },
        { status: 400 }
      );
    }

    // Get user's verification type from their profile
    const verificationStatus = await verificationService.getVerificationStatus(userId);
    const type = verificationStatus?.type || "kyc";

    // Validate document type based on verification type
    const validKycDocs = ["idDocument", "addressProof"];
    const validKybDocs = ["registrationCertificate", "representativeId", "addressProof", "taxCertificate"];
    const validDocs = type === "kyc" ? validKycDocs : validKybDocs;

    if (!validDocs.includes(documentType)) {
      return NextResponse.json(
        { error: `Invalid document type for ${type.toUpperCase()}. Must be one of: ${validDocs.join(", ")}` },
        { status: 400 }
      );
    }

    // Upload to Cloudinary
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadResult = await CloudinaryService.uploadBuffer(buffer, {
      folder: `verification/${userId}/${type}`,
      resource_type: file.type.startsWith("image/") ? "image" : "raw",
    });

    // Ensure database connection before creating MediaAsset
    await connectDB();

    // Create MediaAsset record
    const asset = await MediaAssetModel.create({
      ownerId: new Types.ObjectId(userId),
      type: file.type || "file",
      storage: {
        provider: "cloudinary",
        key: uploadResult.public_id,
      },
      url: uploadResult.secure_url,
      size: file.size ?? uploadResult.bytes,
    });

    // Update verification with the new document
    let updated;
    if (type === "kyc") {
      updated = await verificationService.uploadKycDocument(
        userId,
        documentType as keyof IKycDocuments,
        asset._id.toString()
      );
    } else {
      updated = await verificationService.uploadKybDocument(
        userId,
        documentType as keyof IKybDocuments,
        asset._id.toString()
      );
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
