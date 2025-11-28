import { userRepository, AdminUserFilters, PaginatedUsers } from "../repositories/UserRepository";
import { auditLogService } from "./AuditLogService";
import { IUser } from "../models/User";
import mongoose from "mongoose";
import bcrypt from "bcrypt";

export interface PublicUserProfile {
  id: string;
  name: string;
  photoUrl: string | null;
  isOrganization: boolean;
  organization?: {
    name: string | null;
    type: "ngo" | "charity" | null;
    description: string | null;
    website: string | null;
  };
  location: string | null;
  memberSince: Date;
}

export interface AdminUserCreateData {
  name: string;
  email: string;
  phone?: string;
  role?: "User" | "Admin" | "SuperAdmin";
  status?: "active" | "inactive";
}

export interface AdminUserUpdateData {
  name?: string;
  email?: string;
  phone?: string;
  role?: "User" | "Admin" | "SuperAdmin";
  isActive?: boolean;
}

export interface AdminCreateData {
  name: string;
  email: string;
  phone?: string;
  role: "Admin" | "SuperAdmin";
  status?: "active" | "inactive";
  password?: string;
}

export interface AdminContext {
  adminId: mongoose.Types.ObjectId;
  email: string;
  role: "Admin" | "SuperAdmin";
  name?: string;
}

export class UserService {
  async createUser(
    params: Pick<IUser, "name"> &
      Partial<Pick<IUser, "email" | "phone" | "photoUrl">>
  ): Promise<IUser> {
    return userRepository.create({
      name: params.name,
      email: params.email ?? null,
      phone: params.phone ?? null,
      photoUrl: params.photoUrl ?? null,
    } as unknown as Partial<IUser>);
  }

  async getByEmail(email: string): Promise<IUser | null> {
    return userRepository.findByEmail(email);
  }

  async getByPhone(phone: string): Promise<IUser | null> {
    return userRepository.findByPhone(phone);
  }

  async softDelete(userId: string): Promise<boolean> {
    return userRepository.softDeleteById(userId);
  }

  // Admin-specific methods

  async getUsersForAdmin(filters: AdminUserFilters): Promise<PaginatedUsers> {
    return userRepository.findUsersWithPagination(filters);
  }

  async getAdminsForAdmin(filters: AdminUserFilters): Promise<PaginatedUsers> {
    return userRepository.findAdminsWithPagination(filters);
  }

  async checkEmailExists(email: string): Promise<boolean> {
    const user = await userRepository.findByEmail(email);
    return Boolean(user);
  }

  async createUserAsAdmin(
    data: AdminUserCreateData,
    adminContext: AdminContext,
    auditContext?: { ip?: string; userAgent?: string }
  ): Promise<IUser> {
    // Validate permissions - only SuperAdmin can create Admin/SuperAdmin users
    if (data.role && ["Admin", "SuperAdmin"].includes(data.role) && adminContext.role !== "SuperAdmin") {
      throw new Error("Only SuperAdmin can create Admin or SuperAdmin users");
    }

    const userData = {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      roles: data.role || "User",
      status: data.status || "active",
    };

    const user = await userRepository.create(userData as unknown as Partial<IUser>);

    // Log the action
    await auditLogService.record({
      actor: {
        userId: adminContext.adminId,
        role: adminContext.role,
      },
      action: "user.created",
      target: {
        type: "user",
        id: user._id as mongoose.Types.ObjectId,
      },
      diff: userData,
      ip: auditContext?.ip,
      userAgent: auditContext?.userAgent,
    });

    return user;
  }

  async createAdminUser(
    data: AdminCreateData,
    adminContext: AdminContext,
    auditContext?: { ip?: string; userAgent?: string }
  ): Promise<IUser> {
    // Only SuperAdmin can create admin users
    if (adminContext.role !== "SuperAdmin") {
      throw new Error("Only SuperAdmin can create admin users");
    }

    // Hash the password (use default if not provided)
    const passwordHash = await bcrypt.hash(data.password || "password", 10);

    const userData = {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      roles: data.role,
      status: data.status || "active",
      passwordHash,
    };

    const user = await userRepository.create(userData as unknown as Partial<IUser>);

    // Log the action
    await auditLogService.record({
      actor: {
        userId: adminContext.adminId,
        role: adminContext.role,
      },
      action: "admin.created",
      target: {
        type: "user",
        id: user._id as mongoose.Types.ObjectId,
      },
      diff: { ...userData, passwordHash: "[REDACTED]" },
      ip: auditContext?.ip,
      userAgent: auditContext?.userAgent,
    });

    return user;
  }

  async updateUserAsAdmin(
    userId: string,
    data: AdminUserUpdateData,
    adminContext: AdminContext,
    auditContext?: { ip?: string; userAgent?: string }
  ): Promise<IUser> {
    const existingUser = await userRepository.findById(userId);
    if (!existingUser) {
      throw new Error("User not found");
    }

    // Validate permissions - only SuperAdmin can change roles to Admin/SuperAdmin
    if (data.role && ["Admin", "SuperAdmin"].includes(data.role) && adminContext.role !== "SuperAdmin") {
      throw new Error("Only SuperAdmin can assign Admin or SuperAdmin roles");
    }

    // Build update data
    const updateData: Partial<IUser> = {};
    const changes: Record<string, { from: any; to: any }> = {};

    if (data.name !== undefined && data.name !== existingUser.name) {
      updateData.name = data.name;
      changes.name = { from: existingUser.name, to: data.name };
    }

    if (data.email !== undefined && data.email !== existingUser.email) {
      updateData.email = data.email;
      changes.email = { from: existingUser.email, to: data.email };
    }

    if (data.phone !== undefined && data.phone !== existingUser.phone) {
      updateData.phone = data.phone;
      changes.phone = { from: existingUser.phone, to: data.phone };
    }

    if (data.role !== undefined && data.role !== existingUser.roles) {
      (updateData as Record<string, unknown>).roles = data.role;
      changes.role = { from: existingUser.roles, to: data.role };
    }

    if (data.isActive !== undefined) {
      const newStatus = data.isActive ? "active" : "inactive";
      if (newStatus !== existingUser.status) {
        updateData.status = newStatus;
        changes.status = { from: existingUser.status, to: newStatus };
      }
    }

    if (Object.keys(updateData).length === 0) {
      return existingUser; // No changes to make
    }

    const updatedUser = await userRepository.updateById(userId, {
      $set: updateData,
    } as never);

    if (!updatedUser) {
      throw new Error("Failed to update user");
    }

    // Log the action
    await auditLogService.record({
      actor: {
        userId: adminContext.adminId,
        role: adminContext.role,
      },
      action: "user.updated",
      target: {
        type: "user",
        id: updatedUser._id as mongoose.Types.ObjectId,
      },
      diff: changes,
      ip: auditContext?.ip,
      userAgent: auditContext?.userAgent,
    });

    return updatedUser;
  }

  async updateUserStatus(
    userId: string,
    isActive: boolean,
    adminContext: AdminContext,
    auditContext?: { ip?: string; userAgent?: string }
  ): Promise<IUser> {
    const existingUser = await userRepository.findById(userId);
    if (!existingUser) {
      throw new Error("User not found");
    }

    const newStatus = isActive ? "active" : "inactive";
    if (existingUser.status === newStatus) {
      return existingUser; // No change needed
    }

    const updatedUser = await userRepository.updateUserStatus(userId, isActive);
    if (!updatedUser) {
      throw new Error("Failed to update user status");
    }

    // Log the action
    await auditLogService.record({
      actor: {
        userId: adminContext.adminId,
        role: adminContext.role,
      },
      action: "user.status_changed",
      target: {
        type: "user",
        id: updatedUser._id as mongoose.Types.ObjectId,
      },
      diff: {
        status: { from: existingUser.status, to: newStatus }
      },
      ip: auditContext?.ip,
      userAgent: auditContext?.userAgent,
    });

    return updatedUser;
  }

  async deleteUserAsAdmin(
    userId: string,
    adminContext: AdminContext,
    auditContext?: { ip?: string; userAgent?: string }
  ): Promise<boolean> {
    const existingUser = await userRepository.findById(userId);
    if (!existingUser) {
      throw new Error("User not found");
    }

    // Prevent deletion of admin users by regular admins
    if (existingUser.roles && ["Admin", "SuperAdmin"].includes(existingUser.roles) && adminContext.role !== "SuperAdmin") {
      throw new Error("Only SuperAdmin can delete Admin or SuperAdmin users");
    }

    const result = await userRepository.deleteById(userId);

    if (result) {
      // Log the action
      await auditLogService.record({
        actor: {
          userId: adminContext.adminId,
          role: adminContext.role,
        },
        action: "user.deleted",
        target: {
          type: "user",
          id: new mongoose.Types.ObjectId(userId),
        },
        diff: {
          deleted: { from: false, to: true },
          deletedAt: { from: null, to: new Date() }
        },
        ip: auditContext?.ip,
        userAgent: auditContext?.userAgent,
      });
    }

    return result;
  }

  async getUserById(userId: string): Promise<IUser | null> {
    return userRepository.findById(userId);
  }

  async getAdminById(userId: string): Promise<IUser | null> {
    const user = await userRepository.findById(userId);
    if (!user) return null;

    // Verify this is actually an admin user
    if (!user.roles || !["Admin", "SuperAdmin", "admin", "superadmin"].includes(user.roles)) {
      return null;
    }

    return user;
  }

  async updateAdminAsAdmin(
    userId: string,
    data: AdminUserUpdateData,
    adminContext: AdminContext,
    auditContext?: { ip?: string; userAgent?: string }
  ): Promise<IUser> {
    // Only SuperAdmin can manage admin users
    if (adminContext.role !== "SuperAdmin") {
      throw new Error("Only SuperAdmin can update admin users");
    }

    const existingUser = await userRepository.findById(userId);
    if (!existingUser) {
      throw new Error("Admin user not found");
    }

    // Verify this is actually an admin user
    if (!existingUser.roles || !["Admin", "SuperAdmin", "admin", "superadmin"].includes(existingUser.roles)) {
      throw new Error("User is not an admin");
    }

    // Build update data
    const updateData: Partial<IUser> = {};
    const changes: Record<string, { from: unknown; to: unknown }> = {};

    if (data.name !== undefined && data.name !== existingUser.name) {
      updateData.name = data.name;
      changes.name = { from: existingUser.name, to: data.name };
    }

    if (data.email !== undefined && data.email !== existingUser.email) {
      // Check if email is already taken by another user
      const emailExists = await userRepository.findByEmail(data.email);
      if (emailExists && emailExists._id?.toString() !== userId) {
        throw new Error("Email is already taken by another user");
      }
      updateData.email = data.email;
      changes.email = { from: existingUser.email, to: data.email };
    }

    if (data.phone !== undefined && data.phone !== existingUser.phone) {
      updateData.phone = data.phone || null;
      changes.phone = { from: existingUser.phone, to: data.phone };
    }

    if (data.role !== undefined && data.role !== existingUser.roles) {
      // Validate role is admin-level
      if (!["Admin", "SuperAdmin"].includes(data.role)) {
        throw new Error("Role must be Admin or SuperAdmin");
      }
      (updateData as Record<string, unknown>).roles = data.role;
      changes.role = { from: existingUser.roles, to: data.role };
    }

    if (data.isActive !== undefined) {
      const newStatus = data.isActive ? "active" : "inactive";
      if (newStatus !== existingUser.status) {
        updateData.status = newStatus;
        changes.status = { from: existingUser.status, to: newStatus };
      }
    }

    if (Object.keys(updateData).length === 0) {
      return existingUser; // No changes to make
    }

    const updatedUser = await userRepository.updateById(userId, {
      $set: updateData,
    } as never);

    if (!updatedUser) {
      throw new Error("Failed to update admin user");
    }

    // Log the action
    await auditLogService.record({
      actor: {
        userId: adminContext.adminId,
        role: adminContext.role,
      },
      action: "admin.updated",
      target: {
        type: "user",
        id: updatedUser._id as mongoose.Types.ObjectId,
      },
      diff: changes,
      ip: auditContext?.ip,
      userAgent: auditContext?.userAgent,
    });

    return updatedUser;
  }

  async deleteAdminAsAdmin(
    userId: string,
    adminContext: AdminContext,
    auditContext?: { ip?: string; userAgent?: string }
  ): Promise<boolean> {
    // Only SuperAdmin can delete admin users
    if (adminContext.role !== "SuperAdmin") {
      throw new Error("Only SuperAdmin can delete admin users");
    }

    const existingUser = await userRepository.findById(userId);
    if (!existingUser) {
      throw new Error("Admin user not found");
    }

    // Verify this is actually an admin user
    if (!existingUser.roles || !["Admin", "SuperAdmin", "admin", "superadmin"].includes(existingUser.roles)) {
      throw new Error("User is not an admin");
    }

    // Prevent deleting yourself
    if (adminContext.adminId.toString() === userId) {
      throw new Error("Cannot delete your own account");
    }

    const result = await userRepository.deleteById(userId);

    if (result) {
      // Log the action
      await auditLogService.record({
        actor: {
          userId: adminContext.adminId,
          role: adminContext.role,
        },
        action: "admin.deleted",
        target: {
          type: "user",
          id: new mongoose.Types.ObjectId(userId),
        },
        diff: {
          deleted: { from: false, to: true },
          deletedAt: { from: null, to: new Date() }
        },
        ip: auditContext?.ip,
        userAgent: auditContext?.userAgent,
      });
    }

    return result;
  }

  async getByEmailOrPhone(identifier: string): Promise<IUser | null> {
    const id = identifier.toLowerCase();
    return userRepository.findOne({
      $or: [{ email: id }, { phone: id }],
    } as never);
  }

  async markEmailVerified(userId: string): Promise<IUser | null> {
    return userRepository.updateById(userId, {
      $set: { emailVerified: new Date() },
    } as never);
  }

  async markPhoneVerified(userId: string): Promise<IUser | null> {
    return userRepository.updateById(userId, {
      $set: { phoneVerified: new Date() },
    } as never);
  }

  async updatePassword(userId: string, passwordHash: string): Promise<IUser | null> {
    return userRepository.updateById(userId, {
      $set: {
        passwordHash,
        passwordChangedAt: new Date(),
      },
    } as never);
  }

  /**
   * Get public profile data for a user.
   * Returns only public-safe fields, excluding sensitive information.
   */
  async getPublicProfile(userId: string): Promise<PublicUserProfile | null> {
    const user = await userRepository.findPublicProfileById(userId);

    if (!user) {
      return null;
    }

    const isOrganization = user.roles === "Organization";

    // Build location string from city and country
    const buildLocation = (city?: string | null, country?: string | null): string | null => {
      const parts = [city, country].filter(Boolean);
      return parts.length > 0 ? parts.join(", ") : null;
    };

    return {
      id: String(user._id),
      name: user.name || "Anonymous",
      photoUrl: user.photoUrl || null,
      isOrganization,
      organization: isOrganization && user.organization ? {
        name: user.organization.name || null,
        type: user.organization.type || null,
        description: user.organization.description || null,
        website: user.organization.website || null,
      } : undefined,
      location: buildLocation(user.address?.city, user.address?.country),
      memberSince: user.createdAt || new Date(),
    };
  }

  async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byRole: Record<string, number>;
  }> {
    const [
      total,
      active,
      inactive,
      users,
    ] = await Promise.all([
      userRepository.count({ deletedAt: null } as never),
      userRepository.count({ deletedAt: null, status: "active" } as never),
      userRepository.count({ deletedAt: null, status: { $ne: "active" } } as never),
      userRepository.findMany({ deletedAt: null } as never, { projection: { roles: 1 } }),
    ]);

    const byRole: Record<string, number> = {};
    users.forEach(user => {
      const role = user.roles || "User";
      byRole[role] = (byRole[role] || 0) + 1;
    });

    return {
      total,
      active,
      inactive,
      byRole,
    };
  }
}

export const userService = new UserService();
