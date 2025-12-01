import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { authCodeService, userService } from "@/services";
import type { IAuthCode } from "@/models/AuthCode";
import {
  otpRateLimiter,
  getClientIp,
  checkRateLimit,
} from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body)
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const { identifier, channel } = body as {
    identifier?: string;
    channel?: "email" | "sms";
  };
  if (!identifier)
    return NextResponse.json({ error: "Missing identifier" }, { status: 400 });

  // Rate limiting: 3 reset requests per 10 minutes per IP + identifier
  const ip = getClientIp(req);
  const rateLimitResponse = await checkRateLimit(
    otpRateLimiter,
    `reset:${ip}:${identifier.toLowerCase()}`
  );
  if (rateLimitResponse) return rateLimitResponse;

  await connectDB();

  const user = await userService.getByEmailOrPhone(identifier);

  // Always return success to prevent user enumeration
  if (!user) return NextResponse.json({ success: true }, { status: 200 });

  // Determine the channel to use
  const codeChannel: IAuthCode["channel"] =
    channel ?? (user.email ? "email" : "sms");

  // Create password reset code using the service
  // The code is sent via email/SMS provider - we don't use it directly here
  await authCodeService.createCode({
    userId: String(user._id),
    purpose: "reset_password",
    channel: codeChannel,
  });

  // TODO: Integrate with email/SMS provider to send the code
  // SECURITY: Never log OTP codes, even in development

  return NextResponse.json({ success: true }, { status: 200 });
}
