import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectDB } from "@/lib/db";
import { authCodeService, userService } from "@/services";
import type { IAuthCode } from "@/models/AuthCode";
import { otpRateLimiter, checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const token = await getToken({ req });
  if (!token?.userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limiting: 3 OTP requests per 10 minutes per user
  const rateLimitResponse = await checkRateLimit(
    otpRateLimiter,
    `otp:${token.userId}`
  );
  if (rateLimitResponse) return rateLimitResponse;

  const body = await req.json().catch(() => null);
  if (!body)
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const { type } = body as { type?: "email" | "phone" };
  if (!type)
    return NextResponse.json({ error: "Missing type" }, { status: 400 });

  await connectDB();

  const user = await userService.getUserById(String(token.userId));
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const purpose: IAuthCode["purpose"] = type === "email" ? "verify_email" : "verify_phone";
  const channel: IAuthCode["channel"] = type === "phone" ? "sms" : "email";

  // Create verification code using the service
  // The code is sent via email/SMS provider - we don't use it directly here
  await authCodeService.createCode({
    userId: String(user._id),
    purpose,
    channel,
  });

  // TODO: Integrate with email/SMS provider to send the code
  // SECURITY: Never log OTP codes, even in development

  return NextResponse.json({ success: true }, { status: 200 });
}
