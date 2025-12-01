import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import UserModel from "@/models/User";
import bcrypt from "bcrypt";
import {
  registrationRateLimiter,
  getClientIp,
  checkRateLimit,
} from "@/lib/rate-limit";

interface OrganizationData {
  name?: string;
  type?: "ngo" | "charity";
  description?: string;
  website?: string;
}

interface RegisterBody {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  accountType?: "individual" | "organization";
  organization?: OrganizationData;
}

export async function POST(req: NextRequest) {
  // Rate limiting: 5 registrations per hour per IP
  const ip = getClientIp(req);
  const rateLimitResponse = await checkRateLimit(registrationRateLimiter, ip);
  if (rateLimitResponse) return rateLimitResponse;

  const body = await req.json().catch(() => null);
  if (!body)
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const { name, email, phone, password, accountType, organization } = body as RegisterBody;

  if (!name || !(email || phone) || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Validate organization data if registering as organization
  if (accountType === "organization") {
    if (!organization?.name) {
      return NextResponse.json(
        { error: "Organization name is required" },
        { status: 400 }
      );
    }
    if (!organization?.type || !["ngo", "charity"].includes(organization.type)) {
      return NextResponse.json(
        { error: "Organization type must be 'ngo' or 'charity'" },
        { status: 400 }
      );
    }
  }

  await connectDB();

  const exists = await UserModel.findOne({
    $or: [{ email: email?.toLowerCase() ?? null }, { phone: phone ?? null }],
  });
  if (exists) {
    return NextResponse.json({ error: "User already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // Determine role based on account type
  const role = accountType === "organization" ? "Organization" : "User";

  // Build user data
  const userData: Record<string, unknown> = {
    name,
    email: email?.toLowerCase() ?? null,
    phone: phone ?? null,
    passwordHash,
    roles: role,
    status: "active",
  };

  // Add organization data if registering as organization
  if (accountType === "organization" && organization) {
    userData.organization = {
      name: organization.name,
      type: organization.type,
      description: organization.description || null,
      website: organization.website || null,
    };
  }

  const user = await UserModel.create(userData);
  return NextResponse.json({ id: String(user._id) }, { status: 201 });
}
