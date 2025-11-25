import { NextRequest, NextResponse } from "next/server";
import { userService } from "@/services";
import { validateAdminAuth, extractAuditContext, AdminAuthError } from "@/lib/admin-auth";

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

export async function GET(request: NextRequest) {
  try {
    // Validate admin authentication
    await validateAdminAuth();

    const { searchParams } = new URL(request.url);

    // Extract query parameters
    const filters = {
      search: searchParams.get('search') || undefined,
      role: searchParams.get('role') || 'User', // Default to regular users
      isActive: searchParams.get('isActive') || undefined,
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: Math.min(parseInt(searchParams.get('limit') || '20', 10), 100), // Cap at 100
    };

    const result = await userService.getUsersForAdmin(filters);

    // Transform users to match frontend expectations
    const transformedUsers = result.users.map(transformUser);

    return NextResponse.json({
      success: true,
      users: transformedUsers,
      page: result.page,
      totalPages: result.totalPages,
      total: result.total,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
    });

  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode }
      );
    }
    console.error('GET /api/admin/users error:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate admin authentication
    const adminContext = await validateAdminAuth();
    const auditContext = extractAuditContext(request);

    const body = await request.json();
    const { name, email, phone, role = 'User', status = 'active' } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { success: false, message: "Name and email are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const emailExists = await userService.checkEmailExists(email);
    if (emailExists) {
      return NextResponse.json(
        { success: false, message: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Create user through service (includes audit logging)
    const user = await userService.createUserAsAdmin(
      {
        name,
        email,
        phone,
        role: role as "User" | "Admin" | "SuperAdmin",
        status: status as "active" | "inactive",
      },
      adminContext,
      auditContext
    );

    // Transform response to match frontend expectations
    const transformedUser = transformUser(user);

    return NextResponse.json({
      success: true,
      message: "User created successfully",
      user: transformedUser,
    }, { status: 201 });

  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode }
      );
    }
    console.error('POST /api/admin/users error:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to create user' },
      { status: 500 }
    );
  }
}