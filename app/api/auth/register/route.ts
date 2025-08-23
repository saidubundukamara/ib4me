import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import UserModel from "@/models/User";
import bcrypt from "bcrypt";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body)
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const { name, email, phone, password } = body as {
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
  };
  if (!name || !(email || phone) || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  await connectDB();
  const identifier = (email ?? phone ?? "").toLowerCase();
  const exists = await UserModel.findOne({
    $or: [{ email: email?.toLowerCase() ?? null }, { phone: phone ?? null }],
  });
  if (exists) {
    return NextResponse.json({ error: "User already exists" }, { status: 409 });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await UserModel.create({
    name,
    email: email?.toLowerCase() ?? null,
    phone: phone ?? null,
    passwordHash,
    roles: ["user"],
    status: "active",
  });
  return NextResponse.json({ id: String(user._id) }, { status: 201 });
}
