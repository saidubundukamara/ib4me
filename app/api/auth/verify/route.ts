import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectDB } from "@/lib/db";
import { authCodeService, userService } from "@/services";
import type { IAuthCode } from "@/models/AuthCode";
import { authRateLimiter, checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const token = await getToken({ req });
  if (!token?.userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limiting: 5 verification attempts per 15 minutes per user
  const rateLimitResponse = await checkRateLimit(
    authRateLimiter,
    `verify:${token.userId}`
  );
  if (rateLimitResponse) return rateLimitResponse;

  const body = await req.json().catch(() => null);
  if (!body)
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const { type, code } = body as { type?: "email" | "phone"; code?: string };
  if (!type || !code)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  await connectDB();

  const user = await userService.getUserById(String(token.userId));
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const purpose: IAuthCode["purpose"] = type === "email" ? "verify_email" : "verify_phone";
  const channel: IAuthCode["channel"] = type === "phone" ? "sms" : "email";

  // Validate and consume the code in one operation
  const isValid = await authCodeService.validateAndConsume({
    userId: String(user._id),
    code,
    purpose,
    channel,
  });

  if (!isValid) {
    return NextResponse.json(
      { error: "Invalid or expired code" },
      { status: 400 }
    );
  }

  // Mark the email or phone as verified
  if (type === "email") {
    await userService.markEmailVerified(String(user._id));
  } else {
    await userService.markPhoneVerified(String(user._id));
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
