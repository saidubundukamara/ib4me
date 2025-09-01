import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authConfig } from "../app/api/auth/[...nextauth]/route";
import { auditLogService } from "../services/AuditLogService";
import { NextRequest } from "next/server";

export interface SimpleAuditContext {
  adminId?: mongoose.Types.ObjectId;
  adminEmail?: string;
  adminRole?: string;
  ip?: string;
  userAgent?: string;
}

/**
 * Simple audit logging without throwing authentication errors
 * Uses existing session if available, gracefully handles missing sessions
 */
export async function createSimpleAuditLog(
  action: string,
  targetType: string,
  targetId: string | mongoose.Types.ObjectId,
  diff: Record<string, unknown>,
  request?: NextRequest
): Promise<void> {
  try {
    // Get session without throwing errors
    const session = await getServerSession(authConfig);
    
    const auditContext: SimpleAuditContext = {
      ip: request?.ip || 
          request?.headers.get("x-forwarded-for") || 
          request?.headers.get("x-real-ip") || 
          "unknown",
      userAgent: request?.headers.get("user-agent") || "unknown"
    };

    if (session?.user?.id) {
      auditContext.adminId = new mongoose.Types.ObjectId(session.user.id);
      auditContext.adminEmail = session.user.email || "unknown";
      auditContext.adminRole = Array.isArray(session.user.roles) 
        ? session.user.roles.find(role => ["Admin", "SuperAdmin"].includes(role)) || "unknown"
        : session.user.roles || "unknown";
    }

    // Always create audit log, even if session is missing
    await auditLogService.record({
      actor: {
        userId: auditContext.adminId || null,
        role: auditContext.adminRole || "unknown"
      },
      action,
      target: {
        type: targetType,
        id: mongoose.Types.ObjectId.isValid(targetId) 
          ? new mongoose.Types.ObjectId(targetId) 
          : null
      },
      diff: {
        ...diff,
        sessionAvailable: !!session,
        adminEmail: auditContext.adminEmail,
        timestamp: new Date().toISOString()
      },
      ip: auditContext.ip,
      userAgent: auditContext.userAgent
    });

    console.log("Audit log created:", {
      action,
      targetType,
      targetId,
      hasSession: !!session,
      adminId: auditContext.adminId?.toString()
    });

  } catch (error) {
    console.error("Failed to create audit log:", error);
    // Don't throw - audit logging should not break the main functionality
  }
}

/**
 * Extract admin info from session for existing API routes
 */
export async function getAdminFromSession(): Promise<{
  adminId: mongoose.Types.ObjectId | null;
  adminEmail: string | null;
  adminRole: string | null;
  hasAdminRole: boolean;
}> {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.id) {
      return {
        adminId: null,
        adminEmail: null,
        adminRole: null,
        hasAdminRole: false
      };
    }

    const userRoles = session.user.roles || [];
    const hasAdminRole = userRoles.some(role => 
      ["Admin", "SuperAdmin"].includes(role)
    );

    const adminRole = userRoles.find(role => 
      ["Admin", "SuperAdmin"].includes(role)
    ) || null;

    return {
      adminId: new mongoose.Types.ObjectId(session.user.id),
      adminEmail: session.user.email || null,
      adminRole,
      hasAdminRole
    };
  } catch (error) {
    console.error("Error getting admin from session:", error);
    return {
      adminId: null,
      adminEmail: null,
      adminRole: null,
      hasAdminRole: false
    };
  }
}