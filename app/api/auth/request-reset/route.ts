import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import UserModel from "@/models/User";
import bcrypt from "bcrypt";
import { authCodeRepository } from "@/repositories/AuthCodeRepository";

function generateNumericCode(length: number): string {
  const digits = "0123456789";
  let code = "";
  for (let i = 0; i < length; i++)
    code += digits[Math.floor(Math.random() * 10)];
  return code;
}

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
  const id = String(identifier).toLowerCase();
  const user = await UserModel.findOne({ $or: [{ email: id }, { phone: id }] });
  if (!user) return NextResponse.json({ success: true }, { status: 200 });
  const code = generateNumericCode(6);
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await authCodeRepository.create({
    userId: user._id,
    channel: (channel ?? (user.email ? "email" : "sms")) as "email" | "sms",
    purpose: "reset_password",
    codeHash,
    expiresAt,
  });
  // TODO: send code via email/SMS provider
  return NextResponse.json({ success: true }, { status: 200 });
}
