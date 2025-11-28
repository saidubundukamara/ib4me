import mongoose from "mongoose";
import { BaseRepository } from "./BaseRepository";
import User, { IUser } from "../models/User";
import { FilterQuery } from "mongoose";

export interface AdminUserFilters {
  search?: string;
  role?: string;
  isActive?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedUsers {
  users: IUser[];
  total: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(User);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return this.findOne({ email } as never);
  }

  async findByPhone(phone: string): Promise<IUser | null> {
    return this.findOne({ phone } as never);
  }

  async softDeleteById(id: string): Promise<boolean> {
    const updated = await this.updateById(id, {
      $set: { deletedAt: new Date() },
    } as never);
    return Boolean(updated);
  }

  async findUsersWithPagination(filters: AdminUserFilters): Promise<PaginatedUsers> {
    await this.ensureConnection();
    
    const {
      search = "",
      role = "User",
      isActive,
      page = 1,
      limit = 20,
    } = filters;

    // Build query
    const query: FilterQuery<IUser> = {
      deletedAt: null, // Exclude soft deleted users
    };

    // Filter by role - exclude Admin and SuperAdmin users
    if (role === "User") {
      // Find users that are NOT admin/superadmin (handle both string and array formats)
      query.$and = [
        { roles: { $not: /^admin$/i } },
        { roles: { $not: /^superadmin$/i } },
        { roles: { $ne: "Admin" } },
        { roles: { $ne: "SuperAdmin" } },
      ];
    } else if (role) {
      // For other specific role searches, use case-insensitive match
      query.$or = [
        { roles: new RegExp(`^${role}$`, 'i') }, // String format, case insensitive
        { roles: { $in: [new RegExp(`^${role}$`, 'i')] } }, // Array format, case insensitive
      ];
    }

    // Filter by active status
    if (isActive !== undefined && isActive !== "all") {
      query.status = isActive === "true" ? "active" : { $ne: "active" };
    }

    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.model
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.model.countDocuments(query).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      users,
      total,
      page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  async updateUserStatus(userId: string, isActive: boolean): Promise<IUser | null> {
    const status = isActive ? "active" : "inactive";
    return this.updateById(userId, {
      $set: { status },
    } as never);
  }

  async updateUserRole(userId: string, role: string): Promise<IUser | null> {
    return this.updateById(userId, {
      $set: { roles: role },
    } as never);
  }

  async findActiveUsersByRole(role: string): Promise<IUser[]> {
    return this.findMany({
      roles: role,
      status: "active",
      deletedAt: null,
    } as never);
  }

  /**
   * Find a user by ID with only public-safe fields projected.
   * Excludes sensitive data like email, phone, passwordHash, 2FA secrets, etc.
   * Only returns active, non-deleted users.
   */
  async findPublicProfileById(userId: string): Promise<Partial<IUser> | null> {
    await this.ensureConnection();

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return null;
    }

    return this.model.findOne(
      {
        _id: new mongoose.Types.ObjectId(userId),
        status: "active",
        deletedAt: null,
      },
      {
        _id: 1,
        name: 1,
        photoUrl: 1,
        roles: 1,
        "organization.name": 1,
        "organization.type": 1,
        "organization.description": 1,
        "organization.website": 1,
        "address.city": 1,
        "address.country": 1,
        createdAt: 1,
      }
    ).exec();
  }

  async findAdminsWithPagination(filters: AdminUserFilters): Promise<PaginatedUsers> {
    await this.ensureConnection();
    
    const {
      search = "",
      role = "Admin", // Default to Admin, can be "Admin", "SuperAdmin", or "all"
      isActive,
      page = 1,
      limit = 20,
    } = filters;

    // Build query
    const query: FilterQuery<IUser> = {
      deletedAt: null, // Exclude soft deleted users
    };

    // Filter by admin roles only - find users that ARE admin/superadmin
    if (role === "Admin") {
      query.$or = [
        { roles: /^admin$/i }, // Case-insensitive "admin"
        { roles: "Admin" }, // Exact match "Admin"
      ];
    } else if (role === "SuperAdmin") {
      query.$or = [
        { roles: /^superadmin$/i }, // Case-insensitive "superadmin"
        { roles: "SuperAdmin" }, // Exact match "SuperAdmin"
      ];
    } else if (role === "all") {
      // Find all admin-level users (both Admin and SuperAdmin)
      query.$or = [
        { roles: /^admin$/i },
        { roles: "Admin" },
        { roles: /^superadmin$/i },
        { roles: "SuperAdmin" },
      ];
    }

    // Filter by active status
    if (isActive !== undefined && isActive !== "all") {
      query.status = isActive === "true" ? "active" : { $ne: "active" };
    }

    // Search by name or email
    if (search) {
      const searchConditions = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
      
      if (query.$or) {
        // Combine role filter with search - both conditions must be met
        query.$and = [
          { $or: query.$or },
          { $or: searchConditions }
        ];
        delete query.$or;
      } else {
        query.$or = searchConditions;
      }
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.model
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.model.countDocuments(query).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      users,
      total,
      page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }
}

export const userRepository = new UserRepository();
