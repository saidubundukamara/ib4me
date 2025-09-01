import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "../app/api/auth/[...nextauth]/route";
import mongoose from "mongoose";

export interface AdminContext {
  adminId: mongoose.Types.ObjectId;
  email: string;
  role: "Admin" | "SuperAdmin";
  name?: string;
}

export interface AuditContext {
  ip?: string;
  userAgent?: string;
}

export class AdminAuthError extends Error {
  constructor(message: string, public statusCode: number = 401) {
    super(message);
    this.name = "AdminAuthError";
  }
}

/**
 * Validates admin authentication and returns admin context
 * Throws AdminAuthError if authentication fails
 */
export async function validateAdminAuth(request?: NextRequest): Promise<AdminContext> {
  try {
    const session = await getServerSession(authConfig);

    // Add debug logging
    console.log("Session debug:", {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userRoles: session?.user?.roles,
      userEmail: session?.user?.email
    });

    if (!session?.user?.id) {
      throw new AdminAuthError("Unauthorized - No session found", 401);
    }

    if (!session.user.email) {
      throw new AdminAuthError("Unauthorized - No email in session", 401);
    }

    // Check if user has admin role 
    const userRoles = session.user.roles || [];
    
    const hasAdminRole = userRoles.some(role => 
      ["Admin", "SuperAdmin"].includes(role)
    );

    if (!hasAdminRole) {
      throw new AdminAuthError(`Forbidden - Admin access required. User roles: ${userRoles.join(", ")}`, 403);
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(session.user.id)) {
      throw new AdminAuthError("Invalid user ID format", 400);
    }

    // Determine highest role for admin context
    const role = userRoles.includes("SuperAdmin") ? "SuperAdmin" : "Admin";

    return {
      adminId: new mongoose.Types.ObjectId(session.user.id),
      email: session.user.email,
      role: role as "Admin" | "SuperAdmin",
      name: session.user.name || undefined,
    };
  } catch (error) {
    if (error instanceof AdminAuthError) {
      throw error;
    }
    console.error("Admin authentication error:", error);
    throw new AdminAuthError("Authentication failed", 500);
  }
}

/**
 * Validates super admin authentication specifically
 * Throws AdminAuthError if not super admin
 */
export async function validateSuperAdminAuth(request?: NextRequest): Promise<AdminContext> {
  const adminContext = await validateAdminAuth(request);
  
  if (adminContext.role !== "SuperAdmin") {
    throw new AdminAuthError("Forbidden - Super admin access required", 403);
  }
  
  return adminContext;
}

/**
 * Extracts audit context from Next.js request
 */
export function extractAuditContext(request: NextRequest): AuditContext {
  return {
    ip: request.headers.get("x-forwarded-for") || 
        request.headers.get("x-real-ip") || 
        "unknown",
    userAgent: request.headers.get("user-agent") || "unknown"
  };
}

/**
 * Type-safe wrapper for admin API routes
 * Automatically handles authentication and provides typed admin context
 */
export async function withAdminAuth<T>(
  handler: (adminContext: AdminContext, auditContext?: AuditContext) => Promise<T>,
  request?: NextRequest
): Promise<T> {
  const adminContext = await validateAdminAuth(request);
  const auditContext = request ? extractAuditContext(request) : undefined;
  
  return handler(adminContext, auditContext);
}

/**
 * Type-safe wrapper for super admin API routes
 */
export async function withSuperAdminAuth<T>(
  handler: (adminContext: AdminContext, auditContext?: AuditContext) => Promise<T>,
  request?: NextRequest
): Promise<T> {
  const adminContext = await validateSuperAdminAuth(request);
  const auditContext = request ? extractAuditContext(request) : undefined;
  
  return handler(adminContext, auditContext);
}

/**
 * Creates standardized error responses for admin auth failures
 */
export function createAuthErrorResponse(error: unknown) {
  if (error instanceof AdminAuthError) {
    return {
      error: error.message,
      statusCode: error.statusCode
    };
  }
  
  console.error("Unexpected admin auth error:", error);
  return {
    error: "Internal server error",
    statusCode: 500
  };
}