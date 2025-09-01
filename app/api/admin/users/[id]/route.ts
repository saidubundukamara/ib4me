import { NextRequest, NextResponse } from "next/server";
import { userRepository } from "@/repositories/UserRepository";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, message: "Invalid user ID format" },
        { status: 400 }
      );
    }

    const user = await userRepository.findById(userId);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Transform user to match frontend expectations
    const transformedUser = {
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

    return NextResponse.json({
      success: true,
      user: transformedUser,
    });

  } catch (error) {
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

    // Build update data
    const updateData: Record<string, string | boolean> = {};
    
    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json(
          { success: false, message: "Name cannot be empty" },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (email !== undefined) {
      if (!email.trim()) {
        return NextResponse.json(
          { success: false, message: "Email cannot be empty" },
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

      // Check if email is already taken by another user
      const existingUser = await userRepository.findByEmail(email);
      if (existingUser && existingUser._id?.toString() !== userId) {
        return NextResponse.json(
          { success: false, message: "Email is already taken by another user" },
          { status: 409 }
        );
      }
      
      updateData.email = email.trim();
    }

    if (phone !== undefined) {
      updateData.phone = phone?.trim() || null;
    }

    if (role !== undefined) {
      if (!['User', 'Admin', 'SuperAdmin'].includes(role)) {
        return NextResponse.json(
          { success: false, message: "Invalid role specified" },
          { status: 400 }
        );
      }
      updateData.role = role;
    }

    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }

    // Check if there are any changes to make
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, message: "No valid fields to update" },
        { status: 400 }
      );
    }

    const updatedUser = await userRepository.updateById(userId, {
      $set: updateData,
    } as never);

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Transform response to match frontend expectations
    const transformedUser = {
      _id: updatedUser._id?.toString() || '',
      email: updatedUser.email || '',
      firstName: updatedUser.name?.split(' ')[0] || '',
      lastName: updatedUser.name?.split(' ').slice(1).join(' ') || '',
      role: updatedUser.roles || 'User',
      isActive: updatedUser.status === 'active',
      phone: updatedUser.phone || undefined,
      createdAt: updatedUser.createdAt?.toISOString() || '',
      updatedAt: updatedUser.updatedAt?.toISOString() || '',
    };

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      user: transformedUser,
    });

  } catch (error) {
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
    const { id: userId } = await params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, message: "Invalid user ID format" },
        { status: 400 }
      );
    }

    const result = await userRepository.deleteById(userId);

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
    console.error(`DELETE /api/admin/users/[id] error:`, error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to delete user' },
      { status: 500 }
    );
  }
}