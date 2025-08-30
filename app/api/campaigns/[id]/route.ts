import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authConfig } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import CampaignModel, { type ICampaignDocument } from "@/models/Campaign";

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
  return NextResponse.json({
    id: String(doc._id),
    slug: doc.slug,
    diagnosis: doc.diagnosis,
    typeOfEmergency: doc.typeOfEmergency,
    urgency: doc.urgency,
    patient: doc.patient,
    hospital: doc.hospital,
    goal: doc.goal,
    story: doc.story,
    status: doc.status,
    totals: doc.totals,
    verification: doc.verification,
    financial_account: doc.financial_account,
    documents:
      doc.documents?.map((d: ICampaignDocument) => ({
        type: d.type,
        assetId: String(d.assetId),
      })) ?? [],
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
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  await connectDB();
  const ownerId = new mongoose.Types.ObjectId(session.user.id);
  const updatable: Record<string, unknown> = {};
  if (typeof body.diagnosis === "string")
    updatable.diagnosis = body.diagnosis || undefined;
  if (typeof body.typeOfEmergency === "string")
    updatable.typeOfEmergency = body.typeOfEmergency || undefined;
  if (
    body.urgency === "low" ||
    body.urgency === "medium" ||
    body.urgency === "high"
  )
    updatable.urgency = body.urgency;
  if (body.patient && typeof body.patient === "object")
    updatable.patient = body.patient;
  if (body.hospital && typeof body.hospital === "object")
    updatable.hospital = body.hospital;
  if (body.goal && typeof body.goal === "object") updatable.goal = body.goal;
  if (typeof body.story === "string") updatable.story = body.story;
  if (
    body.status &&
    ["draft", "active", "paused", "completed", "archived"].includes(body.status)
  )
    updatable.status = body.status;

  const updated = await CampaignModel.findOneAndUpdate(
    { _id: oid, ownerId },
    { $set: updatable },
    { new: true }
  );
  if (!updated)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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
