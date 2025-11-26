import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectDB } from "@/lib/db";
import { authCodeService, userService } from "@/services";
import type { IAuthCode } from "@/models/AuthCode";

export async function POST(req: NextRequest) {
  const token = await getToken({ req });
  if (!token?.userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
  const { code } = await authCodeService.createCode({
    userId: String(user._id),
    purpose,
    channel,
  });

  // TODO: send code via email/SMS provider
  // For now, log the code in development
  if (process.env.NODE_ENV === "development") {
    console.log(`[DEV] Verification code for ${type}: ${code}`);
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
