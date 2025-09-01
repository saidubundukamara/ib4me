import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { userRepository } from "../../../../../repositories";
import { IUser } from "../../../../../models/User";

export async function POST(request: NextRequest) {
  try {
    // Get token from cookie
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('admin_token')?.value;

    if (!adminToken) {
      return NextResponse.json(
        { error: "No admin token found" },
        { status: 401 }
      );
    }

    // Parse token to get user ID (format: randomString:userId)
    const tokenParts = adminToken.split(':');
    if (tokenParts.length !== 2) {
      return NextResponse.json(
        { error: "Invalid token format" },
        { status: 401 }
      );
    }

    const userId = tokenParts[1];

    // Find user by ID
    const user: IUser | null = await userRepository.findById(userId);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 401 }
      );
    }

    // Check if user is admin or superadmin
    const userRoles = user.roles ? (Array.isArray(user.roles) ? user.roles : [user.roles]) : [];
    if (!user.roles || !userRoles.some(role => role && ["Admin", "SuperAdmin"].includes(role))) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is active
    if (user.status !== "active") {
      return NextResponse.json(
        { error: "Account is not active" },
        { status: 401 }
      );
    }

    // Return user data (without sensitive information)
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: Array.isArray(user.roles) ? user.roles.find(role => ["Admin", "SuperAdmin"].includes(role)) : user.roles,
      isActive: user.status === 'active'
    };

    return NextResponse.json({
      success: true,
      user: userData
    });

  } catch (error) {
    console.error("Admin token verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}