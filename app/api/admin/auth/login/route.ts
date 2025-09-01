import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { userRepository } from "../../../../../repositories";
import { IUser } from "../../../../../models/User";
import { cookies } from "next/headers";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user: IUser | null = await userRepository.findByEmail(email);

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Invalid credentials" },
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

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Generate a simple token (for now, using a random string + user ID)
    const token = crypto.randomBytes(32).toString('hex') + ':' + String(user._id);
    
    // Set cookie with token
    const cookieStore = await cookies();
    cookieStore.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    // Update last login information
    await userRepository.updateById(String(user._id), {
      lastLoginAt: new Date(),
      lastLoginIp: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      lastLoginUserAgent: request.headers.get('user-agent') || 'unknown',
      loginAttempts: 0
    } as Partial<IUser>);

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
      user: userData,
      token: token
    });

  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}