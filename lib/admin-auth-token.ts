import { cookies } from "next/headers";
import { userRepository } from "@/repositories";
import { IUser } from "@/models/User";
import mongoose from "mongoose";
import { NextRequest } from "next/server";

export interface AdminUser {
  _id: mongoose.Types.ObjectId;
  name?: string;
  email: string;
  role: string;
  isActive: boolean;
}

export interface AdminAuditContext {
  adminUser: AdminUser;
  ip?: string;
  userAgent?: string;
}

/**
 * Get admin user from admin_token cookie
 * Used for server-side API routes that need admin authentication
 */
export async function getAdminFromToken(): Promise<AdminUser | null> {
  try {
    // Get token from cookie
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('admin_token')?.value;

    if (!adminToken) {
      return null;
    }

    // Parse token to get user ID (format: randomString:userId)
    const tokenParts = adminToken.split(':');
    if (tokenParts.length !== 2) {
      return null;
    }

    const userId = tokenParts[1];

    // Find user by ID
    const user: IUser | null = await userRepository.findById(userId);

    if (!user) {
      return null;
    }

    // Check if user is admin or superadmin
    if (!user.roles || (user.roles !== "Admin" && user.roles !== "SuperAdmin")) {
      return null;
    }

    // Check if user is active
    if (user.status !== "active") {
      return null;
    }

    return {
      _id: new mongoose.Types.ObjectId(user._id),
      name: user.name,
      email: user.email,
      role: user.roles,
      isActive: user.status === 'active'
    };

  } catch (error) {
    console.error("Error getting admin from token:", error);
    return null;
  }
}

/**
 * Create audit context from admin user and request
 */
export function createAdminAuditContext(adminUser: AdminUser, request: NextRequest): AdminAuditContext {
  return {
    adminUser,
    ip: request.ip || 
        request.headers.get("x-forwarded-for") || 
        request.headers.get("x-real-ip") || 
        "unknown",
    userAgent: request.headers.get("user-agent") || "unknown"
  };
}

/**
 * Simple audit logging that works with admin_token authentication
 */
export async function createAdminAuditLog(
  action: string,
  targetType: string,
  targetId: string | mongoose.Types.ObjectId,
  diff: Record<string, unknown>,
  auditContext: AdminAuditContext
): Promise<void> {
  try {
    const { createSimpleAuditLog } = await import("@/lib/simple-admin-audit");
    
    await createSimpleAuditLog(
      action,
      targetType,
      targetId,
      {
        ...diff,
        adminId: auditContext.adminUser._id.toString(),
        adminEmail: auditContext.adminUser.email,
        adminRole: auditContext.adminUser.role,
        timestamp: new Date().toISOString()
      },
      // Create a mock NextRequest for compatibility
      {
        ip: auditContext.ip,
        headers: {
          get: (name: string) => {
            if (name === "x-forwarded-for") return auditContext.ip;
            if (name === "user-agent") return auditContext.userAgent;
            return null;
          }
        }
      } as unknown as NextRequest
    );


  } catch (error) {
    console.error("Failed to create admin audit log:", error);
    // Don't throw - audit logging should not break the main functionality
  }
}