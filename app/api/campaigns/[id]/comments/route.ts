import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { campaignCommentRepository } from "@/repositories/CampaignCommentRepository";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid campaign id" }, { status: 400 });
  }

  try {
    await connectDB();
    const comments = await campaignCommentRepository.listByCampaign(
      new mongoose.Types.ObjectId(id)
    );

    return NextResponse.json(
      comments.map((c) => ({
        id: String(c._id),
        authorName: c.authorName || null,
        content: c.content,
        createdAt: c.createdAt.toISOString(),
      })),
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid campaign id" }, { status: 400 });
  }

  let body: { authorName?: string; content?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const content = (body.content ?? "").trim();
  const authorName = (body.authorName ?? "").trim().slice(0, 80) || null;

  if (!content) {
    return NextResponse.json({ error: "Message is required" }, { status: 422 });
  }
  if (content.length > 500) {
    return NextResponse.json({ error: "Message must be 500 characters or less" }, { status: 422 });
  }

  try {
    await connectDB();
    const comment = await campaignCommentRepository.create({
      campaignId: new mongoose.Types.ObjectId(id),
      authorName,
      content,
      isApproved: true,
    } as never);

    return NextResponse.json(
      {
        id: String(comment._id),
        authorName: comment.authorName || null,
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Failed to post comment" }, { status: 500 });
  }
}
