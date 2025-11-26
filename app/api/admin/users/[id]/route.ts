import { NextRequest, NextResponse } from "next/server";
import { userService } from "@/services";
import { validateAdminAuth, extractAuditContext, AdminAuthError } from "@/lib/admin-auth";
import mongoose from "mongoose";

// Helper to transform user data for frontend
function transformUser(user: { _id?: unknown; name?: string; email?: string | null; phone?: string | null; roles?: string; status?: string; createdAt?: Date; updatedAt?: Date }) {
  return {
    _id: user._id?.toString() || '',
    email: user.email || '',
    firstName: user.name?.split(' ')[0] || '',
    lastName: user.name?.split(' ').slice(1).join(' ') || '',
    role: user.roles || 'User',
    isActive: user.status === 'active',
    phone: user.phone || undefined,
    createdAt: user.createdAt?.toISOString() || '',
    updatedAt: user.updatedAt?.toISOString() || '',
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate admin authentication
    await validateAdminAuth();

    const { id: userId } = await params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, message: "Invalid user ID format" },
        { status: 400 }
      );
    }

    const user = await userService.getUserById(userId);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Transform user to match frontend expectations
    const transformedUser = transformUser(user);

    return NextResponse.json({
      success: true,
      user: transformedUser,
    });

  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode }
      );
    }
    console.error(`GET /api/admin/users/[id] error:`, error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate admin authentication
    const adminContext = await validateAdminAuth();
    const auditContext = extractAuditContext(request);

    const { id: userId } = await params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, message: "Invalid user ID format" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, email, phone, role, isActive } = body;

    // Validate name if provided
    if (name !== undefined && !name.trim()) {
      return NextResponse.json(
        { success: false, message: "Name cannot be empty" },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (email !== undefined) {
      if (!email.trim()) {
        return NextResponse.json(
          { success: false, message: "Email cannot be empty" },
          { status: 400 }
        );
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { success: false, message: "Invalid email format" },
          { status: 400 }
        );
      }
    }

    // Validate role if provided
    if (role !== undefined && !['User', 'Admin', 'SuperAdmin'].includes(role)) {
      return NextResponse.json(
        { success: false, message: "Invalid role specified" },
        { status: 400 }
      );
    }

    // Update user through service (includes audit logging and permission checks)
    const updatedUser = await userService.updateUserAsAdmin(
      userId,
      {
        name: name?.trim(),
        email: email?.trim(),
        phone: phone?.trim() || undefined,
        role: role as "User" | "Admin" | "SuperAdmin" | undefined,
        isActive,
      },
      adminContext,
      auditContext
    );

    // Transform response to match frontend expectations
    const transformedUser = transformUser(updatedUser);

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      user: transformedUser,
    });

  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode }
      );
    }
    console.error(`PUT /api/admin/users/[id] error:`, error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate admin authentication
    const adminContext = await validateAdminAuth();
    const auditContext = extractAuditContext(request);

    const { id: userId } = await params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, message: "Invalid user ID format" },
        { status: 400 }
      );
    }

    // Delete user through service (includes audit logging and permission checks)
    const result = await userService.deleteUserAsAdmin(userId, adminContext, auditContext);

    if (!result) {
      return NextResponse.json(
        { success: false, message: "Failed to delete user" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });

  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode }
      );
    }
    console.error(`DELETE /api/admin/users/[id] error:`, error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to delete user' },
      { status: 500 }
    );
  }
}