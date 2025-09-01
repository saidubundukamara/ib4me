import mongoose from "mongoose";
import { BaseRepository } from "./BaseRepository";
import AuditLog, { IAuditLog } from "../models/AuditLog";

export interface AuditLogFilters {
  action?: string;
  targetType?: string;
  targetId?: mongoose.Types.ObjectId;
  adminId?: mongoose.Types.ObjectId;
  dateFrom?: Date;
  dateTo?: Date;
  ip?: string;
  search?: string;
}

export interface AuditLogListOptions {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface AuditLogListResult {
  logs: IAuditLog[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface AuditLogStats {
  totalLogs: number;
  uniqueAdmins: number;
  mostActiveAdmin: {
    userId: mongoose.Types.ObjectId;
    name?: string;
    email?: string;
    actionCount: number;
  } | null;
  mostCommonAction: {
    action: string;
    count: number;
  } | null;
  recentActivityCount: number;
}

export class AuditLogRepository extends BaseRepository<IAuditLog> {
  constructor() {
    super(AuditLog);
  }

  async listByTarget(
    type: string,
    id?: mongoose.Types.ObjectId | null
  ): Promise<IAuditLog[]> {
    return this.findMany({ target: { type, id: id ?? null } } as never, {
      query: { sort: { at: -1 } },
    });
  }

  async listForAdmin(
    filters: AuditLogFilters = {},
    options: AuditLogListOptions
  ): Promise<AuditLogListResult> {
    const { page, limit, sortBy, sortOrder } = options;
    const skip = (page - 1) * limit;

    // Build MongoDB filter query
    const query: Record<string, unknown> = {};

    if (filters.action) {
      if (filters.action.includes('*')) {
        // Support wildcard patterns like "campaign.*"
        const pattern = filters.action.replace(/\*/g, '.*');
        query.action = { $regex: new RegExp(`^${pattern}$`, 'i') };
      } else {
        query.action = filters.action;
      }
    }

    if (filters.targetType) {
      query['target.type'] = filters.targetType;
    }

    if (filters.targetId) {
      query['target.id'] = filters.targetId;
    }

    if (filters.adminId) {
      query['actor.userId'] = filters.adminId;
    }

    if (filters.dateFrom || filters.dateTo) {
      query.at = {} as any;
      if (filters.dateFrom) {
        (query.at as any).$gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        (query.at as any).$lte = filters.dateTo;
      }
    }

    if (filters.ip) {
      query.ip = { $regex: new RegExp(filters.ip, 'i') };
    }

    if (filters.search) {
      // Search across multiple fields
      query.$or = [
        { action: { $regex: new RegExp(filters.search, 'i') } },
        { 'target.type': { $regex: new RegExp(filters.search, 'i') } },
        { ip: { $regex: new RegExp(filters.search, 'i') } },
        { 'diff.reason': { $regex: new RegExp(filters.search, 'i') } },
      ];
    }

    // Execute queries in parallel
    const [logs, totalCount] = await Promise.all([
      AuditLog.find(query)
        .populate('actor.userId', 'name email')
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      logs: logs as unknown as IAuditLog[],
      totalCount,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };
  }

  async getStats(filters: AuditLogFilters = {}): Promise<AuditLogStats> {
    // Build base query from filters
    const baseQuery: Record<string, unknown> = {};

    if (filters.dateFrom || filters.dateTo) {
      baseQuery.at = {} as any;
      if (filters.dateFrom) {
        (baseQuery.at as any).$gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        (baseQuery.at as any).$lte = filters.dateTo;
      }
    }

    if (filters.targetType) {
      baseQuery['target.type'] = filters.targetType;
    }

    // Get total logs count
    const totalLogs = await AuditLog.countDocuments(baseQuery);

    // Get unique admins count
    const uniqueAdmins = await AuditLog.distinct('actor.userId', baseQuery).then(ids => 
      ids.filter(id => id != null).length
    );

    // Get most active admin
    const mostActiveAdminResult = await AuditLog.aggregate([
      { $match: { ...baseQuery, 'actor.userId': { $ne: null } } },
      { $group: { _id: '$actor.userId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } }
    ]);

    const mostActiveAdmin = mostActiveAdminResult.length > 0 ? {
      userId: mostActiveAdminResult[0]._id,
      name: mostActiveAdminResult[0].user?.name,
      email: mostActiveAdminResult[0].user?.email,
      actionCount: mostActiveAdminResult[0].count
    } : null;

    // Get most common action
    const mostCommonActionResult = await AuditLog.aggregate([
      { $match: baseQuery },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);

    const mostCommonAction = mostCommonActionResult.length > 0 ? {
      action: mostCommonActionResult[0]._id,
      count: mostCommonActionResult[0].count
    } : null;

    // Get recent activity count (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentActivityCount = await AuditLog.countDocuments({
      ...baseQuery,
      at: { $gte: oneDayAgo }
    });

    return {
      totalLogs,
      uniqueAdmins,
      mostActiveAdmin,
      mostCommonAction,
      recentActivityCount
    };
  }

  async getActionTypes(): Promise<string[]> {
    return AuditLog.distinct('action').then(actions => 
      actions.filter(action => action != null).sort()
    );
  }

  async getTargetTypes(): Promise<string[]> {
    return AuditLog.distinct('target.type').then(types => 
      types.filter(type => type != null).sort()
    );
  }

  async getAdminUsers(): Promise<Array<{ _id: mongoose.Types.ObjectId; name?: string; email: string; }>> {
    const adminIds = await AuditLog.distinct('actor.userId').then(ids => 
      ids.filter(id => id != null)
    );
    
    if (adminIds.length === 0) return [];

    // Get user details for admin IDs
    const { userRepository } = await import('./index');
    const users = await userRepository.findMany(
      { _id: { $in: adminIds } },
      { query: { select: '_id name email' } }
    );

    return users.map(user => ({
      _id: user._id as mongoose.Types.ObjectId,
      name: user.name,
      email: user.email as string
    }));
  }
}

export const auditLogRepository = new AuditLogRepository();
