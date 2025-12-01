import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth-config";
import { connectDB } from "@/lib/db";
import CampaignModel, { type ICampaignDocument } from "@/models/Campaign";
import MediaAssetModel from "@/models/MediaAsset";
import CloudinaryService, { deleteMediaAssetWithCloudinary } from "@/lib/cloudinary";

function ensureObjectId(id: string): mongoose.Types.ObjectId | null {
  return mongoose.Types.ObjectId.isValid(id)
    ? new mongoose.Types.ObjectId(id)
    : null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const oid = ensureObjectId(id);
  if (!oid) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  await connectDB();
  const ownerId = new mongoose.Types.ObjectId(session.user.id);
  const doc = await CampaignModel.findOne({ _id: oid, ownerId });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Collect ALL asset IDs to fetch (patient photo + all documents)
  const assetIds: mongoose.Types.ObjectId[] = [];
  if (doc.patient?.photoAssetId) {
    assetIds.push(doc.patient.photoAssetId as mongoose.Types.ObjectId);
  }
  for (const d of doc.documents || []) {
    if (d.assetId) {
      assetIds.push(d.assetId as mongoose.Types.ObjectId);
    }
  }

  // Batch fetch all assets
  const assets = assetIds.length > 0
    ? await MediaAssetModel.find({ _id: { $in: assetIds } }).lean()
    : [];
  const assetMap = new Map(assets.map((a) => [String(a._id), a]));

  // Resolve patient photo URL
  let patientPhotoUrl: string | null = null;
  if (doc.patient?.photoAssetId) {
    const photoAsset = assetMap.get(String(doc.patient.photoAssetId));
    if (photoAsset) {
      patientPhotoUrl = photoAsset.storage?.key
        ? CloudinaryService.generateTransformationUrl(photoAsset.storage.key, {
            width: 800,
            crop: "fill",
            gravity: "auto",
            aspect_ratio: "16:9",
            fetch_format: "auto",
            quality: "auto",
          })
        : photoAsset.url || null;
    }
  }

  // Resolve document URLs
  const documentsWithUrls = (doc.documents || []).map((d: ICampaignDocument) => {
    const asset = assetMap.get(String(d.assetId));
    let url: string | null = null;
    if (asset) {
      url = asset.storage?.key
        ? CloudinaryService.generateTransformationUrl(asset.storage.key, {
            width: 400,
            crop: "fit",
            fetch_format: "auto",
            quality: "auto",
          })
        : asset.url || null;
    }
    return {
      type: d.type,
      assetId: String(d.assetId),
      url,
    };
  });

  // Determine main imageUrl: patient photo > first document image > null
  let imageUrl: string | null = patientPhotoUrl;
  if (!imageUrl) {
    const firstImageDoc = documentsWithUrls.find(
      (d: { type: string; assetId: string; url: string | null }) => d.type?.startsWith("image/")
    );
    imageUrl = firstImageDoc?.url || null;
  }

  return NextResponse.json({
    id: String(doc._id),
    slug: doc.slug,
    diagnosis: doc.diagnosis,
    typeOfEmergency: doc.typeOfEmergency,
    urgency: doc.urgency,
    category: doc.category,
    patient: {
      ...doc.patient,
      photoUrl: patientPhotoUrl,
      photoAssetId: doc.patient?.photoAssetId ? String(doc.patient.photoAssetId) : null,
    },
    hospital: doc.hospital,
    goal: doc.goal,
    story: doc.story,
    status: doc.status,
    totals: doc.totals,
    verification: doc.verification,
    financial_account: doc.financial_account,
    documents: documentsWithUrls,
    imageUrl,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const oid = ensureObjectId(id);
  if (!oid) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  await connectDB();
  const ownerId = new mongoose.Types.ObjectId(session.user.id);

  // Verify campaign exists and belongs to user
  const campaign = await CampaignModel.findOne({ _id: oid, ownerId });
  if (!campaign) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Parse as FormData
  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  // Extract text fields
  const diagnosis = form.get("diagnosis") as string | null;
  const typeOfEmergency = form.get("typeOfEmergency") as string | null;
  const urgency = form.get("urgency") as string | null;
  const category = form.get("category") as string | null;
  const patientName = form.get("patient.name") as string | null;
  const patientAgeStr = form.get("patient.age") as string | null;
  const hospitalId = form.get("hospital.hospitalId") as string | null;
  const hospitalName = form.get("hospital.name") as string | null;
  const goalCurrency = form.get("goal.currency") as string | null;
  const goalAmountMinorStr = form.get("goal.amountMinor") as string | null;
  const story = form.get("story") as string | null;
  const status = form.get("status") as string | null;

  // File handling
  const patientPhoto = form.get("patientPhoto") as File | null;
  const removePatientPhoto = form.get("removePatientPhoto") === "true";
  const removedDocumentIdsStr = form.get("removedDocumentIds") as string | null;
  const removedDocumentIds: string[] = removedDocumentIdsStr
    ? JSON.parse(removedDocumentIdsStr)
    : [];

  // Extract new document files
  const newDocFiles: File[] = [];
  for (const [key, value] of form.entries()) {
    if (key.startsWith("documents[") && value instanceof File && value.size > 0) {
      newDocFiles.push(value);
    }
  }

  // Build update object
  const updatable: Record<string, unknown> = {};

  if (typeof diagnosis === "string") {
    updatable.diagnosis = diagnosis || undefined;
  }
  if (typeof typeOfEmergency === "string") {
    updatable.typeOfEmergency = typeOfEmergency || undefined;
  }
  if (urgency === "low" || urgency === "medium" || urgency === "high") {
    updatable.urgency = urgency;
  }
  if (typeof category === "string") {
    updatable.category = category || undefined;
  }
  if (typeof story === "string") {
    updatable.story = story;
  }
  if (status && ["draft", "active", "paused", "completed", "archived"].includes(status)) {
    updatable.status = status;
  }

  // Handle patient fields
  if (patientName !== null || patientAgeStr !== null) {
    const patientAge = patientAgeStr ? parseInt(patientAgeStr, 10) : undefined;
    updatable["patient.name"] = patientName || campaign.patient?.name;
    if (Number.isFinite(patientAge) && patientAge! >= 0) {
      updatable["patient.age"] = patientAge;
    }
  }

  // Handle hospital
  if (hospitalId !== null || hospitalName !== null) {
    if (hospitalId) {
      updatable["hospital.hospitalId"] = mongoose.Types.ObjectId.isValid(hospitalId)
        ? new mongoose.Types.ObjectId(hospitalId)
        : null;
    } else if (hospitalId === "") {
      // Clear hospitalId if empty string passed
      updatable["hospital.hospitalId"] = null;
    }
    if (hospitalName !== null) {
      updatable["hospital.name"] = hospitalName;
    }
  }

  // Handle goal
  if (goalCurrency !== null || goalAmountMinorStr !== null) {
    const amountMinor = goalAmountMinorStr ? parseInt(goalAmountMinorStr, 10) : campaign.goal?.amountMinor;
    updatable.goal = {
      currency: goalCurrency || campaign.goal?.currency || "SLE",
      amountMinor: Number.isFinite(amountMinor) ? amountMinor : 0,
    };
  }

  // Handle patient photo removal/replacement
  if (removePatientPhoto && campaign.patient?.photoAssetId) {
    // Delete old photo
    await deleteMediaAssetWithCloudinary(campaign.patient.photoAssetId, MediaAssetModel);
    updatable["patient.photoAssetId"] = null;
  }

  if (patientPhoto && patientPhoto.size > 0) {
    // Delete existing photo if any
    if (campaign.patient?.photoAssetId) {
      await deleteMediaAssetWithCloudinary(campaign.patient.photoAssetId, MediaAssetModel);
    }
    // Upload new photo
    const photoBuffer = Buffer.from(await patientPhoto.arrayBuffer());
    const photoResult = await CloudinaryService.uploadBuffer(photoBuffer, {
      folder: `campaigns/${session.user.id}/patient`,
      resource_type: "image",
    });
    const photoAsset = await MediaAssetModel.create({
      campaignId: campaign._id,
      ownerId,
      type: "image",
      mimeType: patientPhoto.type,
      url: photoResult.secure_url,
      storage: {
        provider: "cloudinary",
        key: photoResult.public_id,
      },
      metadata: {
        width: photoResult.width,
        height: photoResult.height,
        format: photoResult.format,
        bytes: photoResult.bytes,
      },
    });
    updatable["patient.photoAssetId"] = photoAsset._id;
  }

  // Handle document removals
  for (const assetId of removedDocumentIds) {
    const assetOid = ensureObjectId(assetId);
    if (assetOid) {
      await deleteMediaAssetWithCloudinary(assetOid, MediaAssetModel);
      // Remove from campaign documents array
      await CampaignModel.updateOne(
        { _id: campaign._id },
        { $pull: { documents: { assetId: assetOid } } }
      );
    }
  }

  // Handle new document uploads
  for (const file of newDocFiles) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const resourceType = file.type.startsWith("image/") ? "image" : "raw";
    const uploadResult = await CloudinaryService.uploadBuffer(buffer, {
      folder: `campaigns/${session.user.id}/documents`,
      resource_type: resourceType,
    });
    const newAsset = await MediaAssetModel.create({
      campaignId: campaign._id,
      ownerId,
      type: resourceType,
      mimeType: file.type,
      url: uploadResult.secure_url,
      storage: {
        provider: "cloudinary",
        key: uploadResult.public_id,
      },
      metadata: {
        width: uploadResult.width || 0,
        height: uploadResult.height || 0,
        format: uploadResult.format || "",
        bytes: uploadResult.bytes,
      },
    });
    // Add to campaign documents array
    await CampaignModel.updateOne(
      { _id: campaign._id },
      { $push: { documents: { type: file.type, assetId: newAsset._id } } }
    );
  }

  // Apply remaining updates
  const updated = await CampaignModel.findOneAndUpdate(
    { _id: oid, ownerId },
    { $set: updatable },
    { new: true }
  );

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ id: String(updated._id) }, { status: 200 });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const oid = ensureObjectId(id);
  if (!oid) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  await connectDB();
  const ownerId = new mongoose.Types.ObjectId(session.user.id);
  const res = await CampaignModel.deleteOne({ _id: oid, ownerId });
  if (res.deletedCount !== 1) {
    return NextResponse.json(
      { error: "Not found or forbidden" },
      { status: 404 }
    );
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}
