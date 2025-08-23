import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import UserModel from "@/models/User";
import bcrypt from "bcrypt";
import { authCodeRepository } from "@/repositories/AuthCodeRepository";

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
  await connectDB();
  const id = String(identifier).toLowerCase();
  const user = await UserModel.findOne({ $or: [{ email: id }, { phone: id }] });
  if (!user)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const authCode = await authCodeRepository.findValid(
    user._id,
    "reset_password",
    user.email && id === user.email ? "email" : "sms"
  );
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
  user.passwordHash = await bcrypt.hash(String(newPassword), 10);
  user.passwordChangedAt = new Date();
  await user.save();
  return NextResponse.json({ success: true }, { status: 200 });
}
