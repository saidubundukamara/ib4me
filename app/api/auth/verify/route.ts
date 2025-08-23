import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectDB } from "@/lib/db";
import UserModel from "@/models/User";
import bcrypt from "bcrypt";
import { authCodeRepository } from "@/repositories/AuthCodeRepository";

export async function POST(req: NextRequest) {
  const token = await getToken({ req });
  if (!token?.userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body)
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const { type, code } = body as { type?: "email" | "phone"; code?: string };
  if (!type || !code)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  await connectDB();
  const user = await UserModel.findById(String(token.userId));
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const purpose = type === "email" ? "verify_email" : "verify_phone";
  const authCode = await authCodeRepository.findValid(user._id, purpose, type);
  if (!authCode)
    return NextResponse.json(
      { error: "Invalid or expired code" },
      { status: 400 }
    );
  const ok = await bcrypt.compare(String(code), authCode.codeHash);
  if (!ok)
    return NextResponse.json(
      { error: "Invalid or expired code" },
      { status: 400 }
    );
  await authCodeRepository.consume(String(authCode._id));
  if (type === "email") user.emailVerified = new Date();
  if (type === "phone") user.phoneVerified = new Date();
  await user.save();
  return NextResponse.json({ success: true }, { status: 200 });
}
