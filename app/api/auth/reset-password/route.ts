import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import bcrypt from "bcrypt";
import { authCodeService, userService } from "@/services";
import type { IAuthCode } from "@/models/AuthCode";
import {
  authRateLimiter,
  getClientIp,
  checkRateLimit,
} from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body)
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const { identifier, code, newPassword } = body as {
    identifier?: string;
    code?: string;
    newPassword?: string;
  };
  if (!identifier || !code || !newPassword) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Rate limiting: 5 reset attempts per 15 minutes per IP + identifier
  const ip = getClientIp(req);
  const rateLimitResponse = await checkRateLimit(
    authRateLimiter,
    `reset-pwd:${ip}:${identifier.toLowerCase()}`
  );
  if (rateLimitResponse) return rateLimitResponse;

  await connectDB();

  const user = await userService.getByEmailOrPhone(identifier);
  if (!user)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  // Determine channel based on identifier match
  const id = identifier.toLowerCase();
  const channel: IAuthCode["channel"] =
    user.email && id === user.email ? "email" : "sms";

  // Validate and consume the reset code
  const isValid = await authCodeService.validateAndConsume({
    userId: String(user._id),
    code,
    purpose: "reset_password",
    channel,
  });

  if (!isValid) {
    return NextResponse.json(
      { error: "Invalid or expired code" },
      { status: 400 }
    );
  }

  // Hash the new password and update user
  const passwordHash = await bcrypt.hash(String(newPassword), 10);
  await userService.updatePassword(String(user._id), passwordHash);

  return NextResponse.json({ success: true }, { status: 200 });
}
