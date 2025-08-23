import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
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
  const user = await UserModel.findById(String(token.userId));
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const code = generateNumericCode(6);
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await authCodeRepository.create({
    userId: user._id,
    channel: type,
    purpose: type === "email" ? "verify_email" : "verify_phone",
    codeHash,
    expiresAt,
  } as never);
  // TODO: send code via email/SMS provider
  return NextResponse.json({ success: true }, { status: 200 });
}
