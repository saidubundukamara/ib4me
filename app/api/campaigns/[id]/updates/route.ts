import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth-config";
import { connectDB } from "@/lib/db";
import CampaignUpdateModel from "@/models/CampaignUpdate";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid campaign id" }, { status: 400 });
  }
  await connectDB();
  const updates = await CampaignUpdateModel.find({ campaignId: id })
    .sort({ createdAt: -1 })
    .lean();
  return NextResponse.json(
    updates.map((u) => ({
      id: String(u._id),
      content: u.content,
      createdAt: u.createdAt,
    })),
    { status: 200 }
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid campaign id" }, { status: 400 });
  }
  const body = await req.json().catch(() => null);
  if (!body || typeof body.content !== "string" || !body.content.trim()) {
    return NextResponse.json({ error: "Content required" }, { status: 400 });
  }
  await connectDB();
  const created = await CampaignUpdateModel.create({
    campaignId: new mongoose.Types.ObjectId(id),
    authorId: new mongoose.Types.ObjectId(session.user.id),
    content: body.content.trim(),
    isPublic: true,
  });
  return NextResponse.json(
    {
      id: String(created._id),
      content: created.content,
      createdAt: created.createdAt,
    },
    { status: 201 }
  );
}
