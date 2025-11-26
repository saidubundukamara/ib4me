import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { authCodeService, userService } from "@/services";
import type { IAuthCode } from "@/models/AuthCode";

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

  await connectDB();

  const user = await userService.getByEmailOrPhone(identifier);

  // Always return success to prevent user enumeration
  if (!user) return NextResponse.json({ success: true }, { status: 200 });

  // Determine the channel to use
  const codeChannel: IAuthCode["channel"] =
    channel ?? (user.email ? "email" : "sms");

  // Create password reset code using the service
  const { code } = await authCodeService.createCode({
    userId: String(user._id),
    purpose: "reset_password",
    channel: codeChannel,
  });

  // TODO: send code via email/SMS provider
  // For now, log the code in development
  if (process.env.NODE_ENV === "development") {
    console.log(`[DEV] Password reset code for ${identifier}: ${code}`);
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
