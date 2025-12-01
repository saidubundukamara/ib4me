import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectDB } from "@/lib/db";
import UserModel from "@/models/User";
import bcrypt from "bcrypt";
import { authRateLimiter, checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const token = await getToken({ req });
  if (!token?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limiting: 5 password change attempts per 15 minutes per user
  const rateLimitResponse = await checkRateLimit(
    authRateLimiter,
    `change-pwd:${token.userId}`
  );
  if (rateLimitResponse) return rateLimitResponse;

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { currentPassword, newPassword } = body as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  await connectDB();
  const user = await UserModel.findById(token.userId);

  if (!user) {
    console.error("[change-password] User not found for ID:", token.userId);
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (!user.passwordHash) {
    return NextResponse.json(
      { error: "No password set. This account uses social login." },
      { status: 400 }
    );
  }

  const ok = await bcrypt.compare(String(currentPassword), user.passwordHash);
  if (!ok) {
    return NextResponse.json(
      { error: "Current password is incorrect" },
      { status: 403 }
    );
  }

  user.passwordHash = await bcrypt.hash(String(newPassword), 10);
  user.passwordChangedAt = new Date();
  await user.save();

  return NextResponse.json({ success: true }, { status: 200 });
}
