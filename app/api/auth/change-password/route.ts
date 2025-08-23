import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectDB } from "@/lib/db";
import UserModel from "@/models/User";
import bcrypt from "bcrypt";

export async function POST(req: NextRequest) {
  const token = await getToken({ req });
  if (!token?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { currentPassword, newPassword } = body as {
    currentPassword?: string;
    newPassword?: string;
  };
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  await connectDB();
  const user = await UserModel.findById(String(token.userId));
  if (!user || !user.passwordHash) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const ok = await bcrypt.compare(String(currentPassword), user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 403 });
  }
  user.passwordHash = await bcrypt.hash(String(newPassword), 10);
  user.passwordChangedAt = new Date();
  await user.save();
  return NextResponse.json({ success: true }, { status: 200 });
}
