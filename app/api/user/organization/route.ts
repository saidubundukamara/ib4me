import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authConfig } from "@/app/api/auth/[...nextauth]/route";
import { userRepository } from "@/repositories";

// GET /api/user/organization - Get current user's organization profile
export async function GET() {
  try {
    const session: Session | null = await getServerSession(authConfig);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await userRepository.findById(userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.roles !== "Organization") {
      return NextResponse.json(
        { error: "User is not an organization" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      organization: user.organization || null,
    });
  } catch (error) {
    console.error("Failed to fetch organization profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch organization profile" },
      { status: 500 }
    );
  }
}

// PUT /api/user/organization - Update organization profile
export async function PUT(request: NextRequest) {
  try {
    const session: Session | null = await getServerSession(authConfig);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await userRepository.findById(userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.roles !== "Organization") {
      return NextResponse.json(
        { error: "User is not an organization" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, type, registrationNumber, taxId, description, website, address } = body;

    // Build update object
    const update: Record<string, unknown> = {};

    if (name !== undefined) update["organization.name"] = name;
    if (type !== undefined) {
      if (type && !["ngo", "charity"].includes(type)) {
        return NextResponse.json(
          { error: "Invalid organization type. Must be 'ngo' or 'charity'" },
          { status: 400 }
        );
      }
      update["organization.type"] = type;
    }
    if (registrationNumber !== undefined) update["organization.registrationNumber"] = registrationNumber;
    if (taxId !== undefined) update["organization.taxId"] = taxId;
    if (description !== undefined) update["organization.description"] = description;
    if (website !== undefined) update["organization.website"] = website;

    if (address) {
      if (address.street !== undefined) update["organization.address.street"] = address.street;
      if (address.city !== undefined) update["organization.address.city"] = address.city;
      if (address.country !== undefined) update["organization.address.country"] = address.country;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const updated = await userRepository.updateById(userId, { $set: update } as never);

    if (!updated) {
      return NextResponse.json(
        { error: "Failed to update organization profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Organization profile updated successfully",
      organization: updated.organization,
    });
  } catch (error) {
    console.error("Failed to update organization profile:", error);
    const message = error instanceof Error ? error.message : "Failed to update organization profile";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
